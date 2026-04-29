import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { withApiGuard } from '@/lib/api-guard'
import { getAgencyDb } from '@/lib/agency-db-helper'
import { RowDataPacket } from 'mysql2'

// GET /api/reports/repeated-customer-report — Repeated Customer Report (Commission Co'Auay)
// Returns per-customer aggregates at two levels:
//   L1: orders where first installment is paid AND order is not canceled
//   L2: L1 ∩ supplier_commission > 0
//
// Each level reports: total_orders, total_travelers, sum(net_amount),
// sum(discount), sum(supplier_commission) [raw], sum(supplier_commission - discount) [net].
//
// Extra per-customer fields returned:
//   latest_seller_nick_name    — handler of the customer's newest non-canceled order
//   latest_seller_job_position — 'ts' / 'crm' / 'admin' / '' (used for ranking split)
//
// Response also carries `available_repeats` — distinct repeat counts (l1_orders-1)
// present in the result set with current filters, descending. The frontend
// uses this to build the "จำนวนซื้อซ้ำ" dropdown dynamically so only counts
// that actually exist are offered.
//
// Query params:
//   customer_name     : string LIKE match on customer name
//   repeat_bucket     : 'N' — exact repeat count (= l1_orders of N+1)
//   booking_date_from : YYYY-MM-DD — filters o.created_at (Asia/Bangkok)
//   booking_date_to   : YYYY-MM-DD — same
//   travel_date_from  : YYYY-MM-DD — filters product_period_snapshot.start_at
//   travel_date_to    : YYYY-MM-DD — same
export const GET = withApiGuard('/api/reports/repeated-customer-report', async (request) => {
    const { searchParams } = new URL(request.url)
    const customerName    = (searchParams.get('customer_name') || '').trim()
    const repeatBucket    = searchParams.get('repeat_bucket') || ''
    const bookingDateFrom = searchParams.get('booking_date_from') || ''
    const bookingDateTo   = searchParams.get('booking_date_to')   || ''
    const travelDateFrom  = searchParams.get('travel_date_from')  || ''
    const travelDateTo    = searchParams.get('travel_date_to')    || ''
    // Optional seller filter — keeps only customers whose latest non-canceled
    // order's seller matches this agency-member id. Comma-separated for future
    // multi-select; current UI sends one id at a time.
    const sellerIdParam = (searchParams.get('seller_id') || '').trim()
    const sellerIds = sellerIdParam
      ? sellerIdParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n))
      : []

    const whereClauses: string[] = [
      `o.order_status != 'Canceled'`,
      `o.deleted_at IS NULL`,
      `o.customer_id IS NOT NULL`,
      // Paid first installment — shared business rule with by-country report
      `EXISTS (
        SELECT 1 FROM v_Xqc7k7_customer_order_installments ci
        WHERE ci.order_id = o.id AND ci.ordinal = 1 AND LOWER(ci.status) = 'paid'
      )`
    ]
    const params: any[] = []

    if (customerName) {
      whereClauses.push(`c.name LIKE ?`)
      params.push(`%${customerName}%`)
    }

    if (bookingDateFrom) {
      whereClauses.push(`DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) >= ?`)
      params.push(bookingDateFrom)
    }
    if (bookingDateTo) {
      whereClauses.push(`DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) <= ?`)
      params.push(bookingDateTo)
    }
    if (travelDateFrom) {
      whereClauses.push(`JSON_EXTRACT(o.product_period_snapshot, '$.start_at') >= ?`)
      params.push(travelDateFrom)
    }
    if (travelDateTo) {
      whereClauses.push(`JSON_EXTRACT(o.product_period_snapshot, '$.start_at') <= ?`)
      params.push(travelDateTo)
    }

    // seller_id filter is applied to the joined latest-order subquery so we
    // only keep customers whose newest order is owned by one of the chosen
    // sellers. Empty list → no filter.
    if (sellerIds.length > 0) {
      const placeholders = sellerIds.map(() => '?').join(',')
      whereClauses.push(`latest_o.seller_agency_member_id IN (${placeholders})`)
      params.push(...sellerIds)
    }

    const whereClause = 'WHERE ' + whereClauses.join(' AND ')

    // "ซื้อซ้ำ" semantics: the FIRST purchase does not count as a repeat,
    // so "ซื้อซ้ำ N ครั้ง" means "N purchases AFTER the first" = l1_orders
    // of N + 1. The report by definition only lists customers who have
    // actually repeated, so when no specific bucket is picked we still
    // enforce l1_orders >= 2 (at least one real repeat).
    //   repeat_bucket = 'all' or missing → l1_orders >= 2
    //   repeat_bucket = 'N' (1–100)      → l1_orders = N + 1 (exact)
    let havingClause = ' HAVING l1_orders >= 2'
    if (/^\d+$/.test(repeatBucket)) {
      const n = parseInt(repeatBucket, 10)
      if (n >= 1 && n <= 100) {
        havingClause = ` HAVING l1_orders = ${n + 1}`
      }
    }

    // Latest-order lookup: resolves the "handler" shown in the first column
    // and used to aggregate the ranking section. The subquery ranks every
    // qualifying order per customer by created_at DESC and keeps rn=1 (the
    // newest). Matches the same base predicates as the main query so the
    // "latest" is always one of the report's counted orders.
    const agencyDb = await getAgencyDb()
    const amTable = agencyDb ? `\`${agencyDb}\`.v_6kMWFc_agcy_agency_members` : null
    const sellerName = amTable
      ? `COALESCE(seller_am.nick_name, CAST(latest_o.seller_agency_member_id AS CHAR), '')`
      : `COALESCE(CAST(latest_o.seller_agency_member_id AS CHAR), '')`
    const sellerJobPosition = amTable
      ? `LOWER(COALESCE(seller_am.job_position, ''))`
      : `''`
    const agencyJoins = amTable
      ? `LEFT JOIN ${amTable} seller_am ON seller_am.id = latest_o.seller_agency_member_id`
      : ''

    // Per-customer windowed order counts ("ซื้อซ้ำใน N เดือน" columns).
    // Computed over the customer's FULL non-canceled, paid-first-installment
    // order history — deliberately independent of the booking_date_from/to
    // filter so the 3m/12m/24m windows always reflect the absolute interval
    // measured from "now" (Asia/Bangkok). `first_order_at_bkk` is the
    // customer's earliest order date used by the frontend to subtract one
    // when the very first purchase falls inside the window (the first
    // purchase isn't a "repeat" by definition).
    const repeatWindowsJoin = `
      LEFT JOIN (
        SELECT
          rwo.customer_id,
          COUNT(CASE
            WHEN DATE(CONVERT_TZ(rwo.created_at, '+00:00', '+07:00'))
              >= DATE_SUB(DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00')), INTERVAL 3 MONTH)
            THEN rwo.id
          END) AS orders_3m,
          COUNT(CASE
            WHEN DATE(CONVERT_TZ(rwo.created_at, '+00:00', '+07:00'))
              >= DATE_SUB(DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00')), INTERVAL 12 MONTH)
            THEN rwo.id
          END) AS orders_12m,
          COUNT(CASE
            WHEN DATE(CONVERT_TZ(rwo.created_at, '+00:00', '+07:00'))
              >= DATE_SUB(DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00')), INTERVAL 24 MONTH)
            THEN rwo.id
          END) AS orders_24m,
          DATE(CONVERT_TZ(MIN(rwo.created_at), '+00:00', '+07:00')) AS first_order_at_bkk
        FROM v_Xqc7k7_orders rwo
        WHERE rwo.order_status != 'Canceled'
          AND rwo.deleted_at IS NULL
          AND rwo.customer_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM v_Xqc7k7_customer_order_installments ci2
            WHERE ci2.order_id = rwo.id AND ci2.ordinal = 1 AND LOWER(ci2.status) = 'paid'
          )
        GROUP BY rwo.customer_id
      ) rw ON rw.customer_id = c.id
    `

    const query = `
      SELECT
        c.id            AS customer_id,
        c.customer_code AS customer_code,
        c.name          AS customer_name,
        c.phone_number  AS phone_number,

        ${sellerName}         AS latest_seller_nick_name,
        ${sellerJobPosition}  AS latest_seller_job_position,

        COUNT(o.id)                                                                    AS l1_orders,
        COALESCE(SUM(oi.travelers), 0)                                                 AS l1_travelers,
        COALESCE(SUM(o.net_amount), 0)                                                 AS l1_net_amount,
        COALESCE(SUM(o.discount), 0)                                                   AS l1_discount,
        COALESCE(SUM(o.supplier_commission), 0)                                        AS l1_supplier_commission,
        COALESCE(SUM(COALESCE(o.supplier_commission, 0) - COALESCE(o.discount, 0)), 0) AS l1_net_commission,

        COUNT(CASE WHEN o.supplier_commission > 0 THEN o.id END)                                   AS l2_orders,
        COALESCE(SUM(CASE WHEN o.supplier_commission > 0 THEN oi.travelers ELSE 0 END), 0)         AS l2_travelers,
        COALESCE(SUM(CASE WHEN o.supplier_commission > 0 THEN o.net_amount ELSE 0 END), 0)         AS l2_net_amount,
        COALESCE(SUM(CASE WHEN o.supplier_commission > 0 THEN o.discount ELSE 0 END), 0)           AS l2_discount,
        COALESCE(SUM(CASE WHEN o.supplier_commission > 0 THEN o.supplier_commission ELSE 0 END), 0) AS l2_supplier_commission,
        COALESCE(SUM(CASE WHEN o.supplier_commission > 0 THEN (COALESCE(o.supplier_commission, 0) - COALESCE(o.discount, 0)) ELSE 0 END), 0) AS l2_net_commission,

        COALESCE(rw.orders_3m, 0)             AS l1_orders_3m,
        COALESCE(rw.orders_12m, 0)            AS l1_orders_12m,
        COALESCE(rw.orders_24m, 0)            AS l1_orders_24m,
        DATE_FORMAT(rw.first_order_at_bkk, '%Y-%m-%d') AS first_order_at
      FROM v_Xqc7k7_orders o
      INNER JOIN v_Xqc7k7_customers c ON o.customer_id = c.id
      LEFT JOIN (
        SELECT order_id, SUM(quantity) AS travelers
        FROM v_Xqc7k7_order_items
        WHERE product_room_type_id IS NOT NULL
        GROUP BY order_id
      ) oi ON oi.order_id = o.id
      LEFT JOIN (
        SELECT customer_id, seller_agency_member_id
        FROM (
          SELECT
            lo.customer_id,
            lo.seller_agency_member_id,
            ROW_NUMBER() OVER (PARTITION BY lo.customer_id ORDER BY lo.created_at DESC) AS rn
          FROM v_Xqc7k7_orders lo
          WHERE lo.order_status != 'Canceled'
            AND lo.deleted_at IS NULL
            AND lo.customer_id IS NOT NULL
        ) ranked
        WHERE rn = 1
      ) latest_o ON latest_o.customer_id = c.id
      ${agencyJoins}
      ${repeatWindowsJoin}
      ${whereClause}
      GROUP BY c.id, c.customer_code, c.name, c.phone_number,
               latest_o.seller_agency_member_id${amTable ? ', seller_am.nick_name, seller_am.job_position' : ''},
               rw.orders_3m, rw.orders_12m, rw.orders_24m, rw.first_order_at_bkk
      ${havingClause}
      ORDER BY l1_orders DESC, l1_net_amount DESC
    `

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    const customers = rows.map(row => ({
      customer_id:   parseInt(row.customer_id)   || 0,
      customer_code: row.customer_code || '',
      customer_name: row.customer_name || '',
      phone_number:  row.phone_number  || '',
      latest_seller_nick_name:    row.latest_seller_nick_name    || '',
      latest_seller_job_position: row.latest_seller_job_position || '',
      // Earliest non-canceled, paid-first-installment order date (Asia/Bangkok,
      // YYYY-MM-DD). Used by the frontend to subtract one when the customer's
      // very first purchase falls inside the 3m / 12m / 24m windows below —
      // the first purchase doesn't count as a "ซื้อซ้ำ".
      first_order_at: row.first_order_at || '',
      l1: {
        orders:              parseInt(row.l1_orders)               || 0,
        travelers:           parseInt(row.l1_travelers)            || 0,
        net_amount:          parseFloat(row.l1_net_amount)         || 0,
        discount:            parseFloat(row.l1_discount)           || 0,
        supplier_commission: parseFloat(row.l1_supplier_commission) || 0,
        net_commission:      parseFloat(row.l1_net_commission)     || 0,
        // Order counts within rolling 3 / 12 / 24 month windows from "today"
        // in Asia/Bangkok. Independent of the booking_date filter so the
        // columns always reflect absolute time windows.
        orders_3m:           parseInt(row.l1_orders_3m)             || 0,
        orders_12m:          parseInt(row.l1_orders_12m)            || 0,
        orders_24m:          parseInt(row.l1_orders_24m)            || 0
      },
      l2: {
        orders:              parseInt(row.l2_orders)               || 0,
        travelers:           parseInt(row.l2_travelers)            || 0,
        net_amount:          parseFloat(row.l2_net_amount)         || 0,
        discount:            parseFloat(row.l2_discount)           || 0,
        supplier_commission: parseFloat(row.l2_supplier_commission) || 0,
        net_commission:      parseFloat(row.l2_net_commission)     || 0
      }
    }))

    // Distinct list of repeat counts (l1_orders - 1) that actually exist in
    // the result set — same base filters but WITHOUT the repeat_bucket
    // HAVING clause, so the dropdown shows every reachable count regardless
    // of the current bucket selection. We mirror the main query's latest-
    // order LEFT JOIN here so the optional seller_id WHERE predicate (which
    // references latest_o) resolves against the same data.
    const availableQuery = `
      SELECT DISTINCT (l1_orders - 1) AS repeat_count FROM (
        SELECT COUNT(o.id) AS l1_orders
        FROM v_Xqc7k7_orders o
        INNER JOIN v_Xqc7k7_customers c ON o.customer_id = c.id
        LEFT JOIN (
          SELECT customer_id, seller_agency_member_id
          FROM (
            SELECT
              lo.customer_id,
              lo.seller_agency_member_id,
              ROW_NUMBER() OVER (PARTITION BY lo.customer_id ORDER BY lo.created_at DESC) AS rn
            FROM v_Xqc7k7_orders lo
            WHERE lo.order_status != 'Canceled'
              AND lo.deleted_at IS NULL
              AND lo.customer_id IS NOT NULL
          ) ranked
          WHERE rn = 1
        ) latest_o ON latest_o.customer_id = c.id
        ${whereClause}
        GROUP BY c.id
        HAVING COUNT(o.id) >= 2
      ) grouped
      ORDER BY repeat_count DESC
    `
    const [availRows] = await mysqlPool.execute<RowDataPacket[]>(availableQuery, params)
    const availableRepeats: number[] = availRows
      .map(r => parseInt(r.repeat_count, 10))
      .filter(n => Number.isFinite(n) && n >= 1)

    // Aggregate roll-up so the frontend can render summary cards without
    // re-walking the list. Customer counts = rows where that level has ≥1
    // order (L2 may be zero even when L1 is non-zero).
    const summary = customers.reduce((acc, c) => {
      acc.l1.total_customers          += c.l1.orders > 0 ? 1 : 0
      acc.l1.total_orders             += c.l1.orders
      acc.l1.total_travelers          += c.l1.travelers
      acc.l1.total_net_amount         += c.l1.net_amount
      acc.l1.total_discount           += c.l1.discount
      acc.l1.total_supplier_commission += c.l1.supplier_commission
      acc.l1.total_net_commission     += c.l1.net_commission

      acc.l2.total_customers          += c.l2.orders > 0 ? 1 : 0
      acc.l2.total_orders             += c.l2.orders
      acc.l2.total_travelers          += c.l2.travelers
      acc.l2.total_net_amount         += c.l2.net_amount
      acc.l2.total_discount           += c.l2.discount
      acc.l2.total_supplier_commission += c.l2.supplier_commission
      acc.l2.total_net_commission     += c.l2.net_commission
      return acc
    }, {
      l1: { total_customers: 0, total_orders: 0, total_travelers: 0, total_net_amount: 0, total_discount: 0, total_supplier_commission: 0, total_net_commission: 0 },
      l2: { total_customers: 0, total_orders: 0, total_travelers: 0, total_net_amount: 0, total_discount: 0, total_supplier_commission: 0, total_net_commission: 0 }
    })

    return NextResponse.json({
      success: true,
      data: { customers, summary, available_repeats: availableRepeats }
    })
}, { roles: ['admin'] })
