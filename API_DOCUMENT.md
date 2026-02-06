# API Document - Finance Backoffice Report

> อัปเดตล่าสุด: 3 กุมภาพันธ์ 2569 (2026)

---

## สารบัญ

1. [Frontend Pages & API Mapping](#frontend-pages--api-mapping)
2. [เงื่อนไข Query ปัจจุบัน](#เงื่อนไข-query-ปัจจุบัน)
3. [API Endpoints รายละเอียด](#api-endpoints-รายละเอียด)
4. [Authentication](#authentication)

---

## Frontend Pages & API Mapping

### 1. `/sales-by-country.html` - รายงานยอดขายตามประเทศ

| API Endpoint | ใช้ทำอะไร |
|---|---|
| `GET /api/reports/summary` | KPI Cards (จำนวน orders, ลูกค้า, ยอดรวม, เฉลี่ย) |
| `GET /api/reports/by-country` | ตารางแยกตามประเทศ |
| `GET /api/reports/by-supplier` | ตารางแยกตาม Supplier |
| `GET /api/reports/available-periods` | Dropdown เลือกปี/ไตรมาส/เดือน |
| `GET /api/reports/countries` | Dropdown เลือกประเทศ |

**Filters ที่ส่ง:** `booking_date_from`, `booking_date_to`, `country_id`, `supplier_id`

---

### 2. `/wholesale-destinations.html` - รายงาน Wholesale แยกตามประเทศปลายทาง

| API Endpoint | ใช้ทำอะไร |
|---|---|
| `GET /api/reports/wholesale-by-country` | ตาราง Pivot (Wholesale x Country) |
| `GET /api/reports/available-periods` | Dropdown เลือกปี/ไตรมาส/เดือน |
| `GET /api/reports/countries` | Dropdown เลือกประเทศ |
| `GET /api/suppliers` | Dropdown เลือก Wholesale |

**Filters ที่ส่ง:** `booking_date_from`, `booking_date_to`, `country_id`, `supplier_id`, `view_mode` (sales/travelers)

---

### 3. `/order-report.html` - รายงาน Order Report

| API Endpoint | ใช้ทำอะไร |
|---|---|
| `GET /api/reports/summary` | KPI Cards |
| `GET /api/reports/by-country` | Tab: แยกตามประเทศ |
| `GET /api/reports/by-supplier` | Tab: แยกตาม Supplier |
| `GET /api/reports/by-travel-start-date` | Tab: แยกตามวันเดินทาง |
| `GET /api/reports/by-created-date` | Tab: แยกตามวันจอง |
| `GET /api/reports/lead-time-analysis` | Tab: Lead Time Analysis |
| `GET /api/reports/countries` | Dropdown เลือกประเทศ |
| `GET /api/suppliers` | Dropdown เลือก Supplier |

**Filters ที่ส่ง:** `booking_date_from`, `booking_date_to`, `travel_date_from`, `travel_date_to`, `country_id`, `supplier_id`

---

### 4. `/tour-image-manager.html` - จัดการรูปภาพทัวร์

| API Endpoint | ใช้ทำอะไร |
|---|---|
| Custom Image API | ค้นหาและจัดการรูปภาพทัวร์ |

**Filters ที่ส่ง:** `wholesale`, `country`, `tourCode`, `imageName`, `dateRange`

---

### 5. `/index.html` - หน้าแรก

ไม่เรียก API (หน้า Landing Page)

---

### 6. `/auth.html` - หน้า Login

รับ token จาก URL parameter แล้วเก็บใน sessionStorage/localStorage

---

## เงื่อนไข Query ปัจจุบัน

### Endpoints หลัก (summary, by-country, by-supplier, wholesale-by-country)

```sql
WHERE o.order_status != 'Canceled'          -- ไม่นับ order ที่ยกเลิก
  AND o.deleted_at IS NULL                   -- ไม่นับ order ที่ถูกลบ
  AND o.supplier_commission > 0              -- เฉพาะ order ที่มีค่าคอมฯ (ยกเว้น view_mode=net_commission)
  AND EXISTS (                               -- งวดแรกต้องจ่ายแล้ว
    SELECT 1 FROM v_Xqc7k7_customer_order_installments ci
    WHERE ci.order_id = o.id
      AND ci.ordinal = 1
      AND LOWER(ci.status) = 'paid'          -- case-insensitive
  )
```

> **หมายเหตุ:** เมื่อ `view_mode=net_commission` จะ **ไม่ใช้** เงื่อนไข `supplier_commission > 0`
> เพราะต้องนับทุก order ที่จ่ายงวดแรกแล้ว ไม่ว่า commission จะเป็นเท่าไร

### การนับจำนวนนักท่องเที่ยว (travelers)

```sql
LEFT JOIN (
  SELECT order_id, SUM(quantity) as traveler_count
  FROM v_Xqc7k7_order_items
  WHERE product_room_type_id IS NOT NULL     -- นับเฉพาะ item ที่มีประเภทห้องพัก
  GROUP BY order_id
) oi_sum ON oi_sum.order_id = o.id
```

### การ Filter วันจอง (Booking Date)

```sql
AND DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) >= ?  -- booking_date_from
AND DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) <= ?  -- booking_date_to
```

### การ Filter ประเทศ

```sql
AND CAST(JSON_EXTRACT(o.product_snapshot, '$.countries[0].id') AS UNSIGNED) IN (?)
```

### การ Filter Supplier

```sql
AND o.product_owner_supplier_id IN (?)
```

---

## API Endpoints รายละเอียด

### `GET /api/reports/summary`

สรุปภาพรวม Orders

| Parameter | Type | Description |
|---|---|---|
| `country_id` | string | ID ประเทศ (comma-separated) |
| `supplier_id` | string | ID Supplier (comma-separated) |
| `travel_date_from` | string | วันเดินทางเริ่มต้น (YYYY-MM-DD) |
| `travel_date_to` | string | วันเดินทางสิ้นสุด (YYYY-MM-DD) |
| `booking_date_from` | string | วันจองเริ่มต้น (YYYY-MM-DD) |
| `booking_date_to` | string | วันจองสิ้นสุด (YYYY-MM-DD) |

**เงื่อนไข:** `!= Canceled` + `deleted_at IS NULL` + `supplier_commission > 0` + งวดแรก paid

**Response:**
```json
{
  "success": true,
  "data": {
    "total_orders": 1696,
    "total_customers": 5741,
    "total_net_amount": 130220963,
    "avg_net_amount": 76780
  }
}
```

---

### `GET /api/reports/by-country`

Orders แยกตามประเทศ

| Parameter | Type | Description |
|---|---|---|
| `country_id` | string | ID ประเทศ (comma-separated) |
| `supplier_id` | string | ID Supplier (comma-separated) |
| `travel_date_from` | string | วันเดินทางเริ่มต้น |
| `travel_date_to` | string | วันเดินทางสิ้นสุด |
| `booking_date_from` | string | วันจองเริ่มต้น |
| `booking_date_to` | string | วันจองสิ้นสุด |

**เงื่อนไข:** `!= Canceled` + `deleted_at IS NULL` + `supplier_commission > 0` + งวดแรก paid + `country IS NOT NULL`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "country_id": 109,
      "country_name": "จีน",
      "total_orders": 562,
      "total_customers": 1781,
      "total_net_amount": 32118109,
      "avg_net_amount": 57150
    }
  ]
}
```

---

### `GET /api/reports/by-supplier`

Orders แยกตาม Supplier

| Parameter | Type | Description |
|---|---|---|
| `country_id` | string | ID ประเทศ (comma-separated) |
| `supplier_id` | string | ID Supplier (comma-separated) |
| `travel_date_from` | string | วันเดินทางเริ่มต้น |
| `travel_date_to` | string | วันเดินทางสิ้นสุด |
| `booking_date_from` | string | วันจองเริ่มต้น |
| `booking_date_to` | string | วันจองสิ้นสุด |

**เงื่อนไข:** `!= Canceled` + `deleted_at IS NULL` + `supplier_commission > 0` + งวดแรก paid

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "supplier_id": 1,
      "supplier_name": "ZEGO TRAVEL CO., LTD.",
      "total_orders": 533,
      "total_customers": 1800,
      "total_net_amount": 45000000,
      "avg_net_amount": 84400
    }
  ]
}
```

---

### `GET /api/reports/wholesale-by-country`

Wholesale แยกตามประเทศปลายทาง (Pivot Table)

| Parameter | Type | Description |
|---|---|---|
| `country_id` | string | ID ประเทศ (comma-separated) |
| `supplier_id` | string | ID Supplier (comma-separated) |
| `travel_date_from` | string | วันเดินทางเริ่มต้น |
| `travel_date_to` | string | วันเดินทางสิ้นสุด |
| `booking_date_from` | string | วันจองเริ่มต้น |
| `booking_date_to` | string | วันจองสิ้นสุด |
| `view_mode` | string | โหมดการแสดงผล: `sales` / `travelers` / `orders` / `net_commission` (default: sales) |

**เงื่อนไข:**
- ทุก view_mode: `!= Canceled` + งวดแรก paid (`LOWER(status) = 'paid'`) + `country IS NOT NULL`
- `sales` / `travelers` / `orders`: เพิ่ม `supplier_commission > 0`
- `net_commission`: **ไม่ใช้** `supplier_commission > 0` (นับทุก order ที่จ่ายงวดแรกแล้ว)

**การคำนวณตาม view_mode:**

| view_mode | สูตร |
|---|---|
| `sales` | `SUM(net_amount)` |
| `travelers` | `SUM(traveler_count)` จาก order_items |
| `orders` | `COUNT(DISTINCT order_id)` |
| `net_commission` | `SUM(COALESCE(supplier_commission, 0) - COALESCE(discount, 0))` |

**Response:**
```json
{
  "success": true,
  "data": {
    "wholesales": [
      {
        "id": 1,
        "name": "ZEGO TRAVEL CO., LTD.",
        "countries": { "ญี่ปุ่น": 280, "เวียดนาม": 120 },
        "total": 400,
        "order_count": 150
      }
    ],
    "summary": {
      "total_value": 5000000,
      "total_orders": 1696,
      "top_wholesale": { "name": "ZEGO TRAVEL", "count": 400 },
      "top_country": { "name": "ญี่ปุ่น", "count": 1500 },
      "total_partners": 15,
      "view_mode": "sales"
    },
    "country_totals": { "ญี่ปุ่น": 1500, "จีน": 1200 },
    "view_mode": "sales"
  }
}
```

---

### `GET /api/reports/available-periods`

ดึงช่วงเวลาที่มีข้อมูล (สำหรับ Dropdown เลือกปี)

| Parameter | Type | Description |
|---|---|---|
| ไม่มี | - | - |

**เงื่อนไข:** `!= Canceled` + `deleted_at IS NULL`

**Response:**
```json
{
  "success": true,
  "data": {
    "years": [
      {
        "year_ce": 2025,
        "year_be": 2568,
        "label": "2568",
        "total_orders": 1845,
        "quarters": [
          { "quarter": 1, "label": "Q1", "start_month": 1, "end_month": 3 }
        ],
        "months": [
          { "month": 1, "label": "มกราคม", "label_short": "ม.ค." }
        ]
      }
    ]
  }
}
```

---

### `GET /api/reports/countries`

รายชื่อประเทศที่มีใน Orders

| Parameter | Type | Description |
|---|---|---|
| ไม่มี | - | - |

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 109, "name_th": "จีน", "name_en": "China" }
  ]
}
```

---

### `GET /api/reports/by-created-date`

Orders แยกตามวันที่จอง (รายวัน)

| Parameter | Type | Description |
|---|---|---|
| `country_id` | string | ID ประเทศ (comma-separated) |
| `supplier_id` | string | ID Supplier (comma-separated) |
| `travel_date_from` | string | วันเดินทางเริ่มต้น |
| `travel_date_to` | string | วันเดินทางสิ้นสุด |
| `booking_date_from` | string | วันจองเริ่มต้น |
| `booking_date_to` | string | วันจองสิ้นสุด |
| `date_format` | string | รูปแบบวันที่ default: `numeric_full` |

**เงื่อนไข:** `!= Canceled` + `deleted_at IS NULL`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "created_date": "2025-01-15",
      "created_date_label": "15/01/2568",
      "total_orders": 12,
      "total_customers": 40,
      "total_net_amount": 960000,
      "avg_net_amount": 80000
    }
  ]
}
```

---

### `GET /api/reports/by-travel-start-date`

Orders แยกตามวันเดินทาง (รายวัน)

| Parameter | Type | Description |
|---|---|---|
| `country_id` | string | ID ประเทศ (comma-separated) |
| `supplier_id` | string | ID Supplier (comma-separated) |
| `travel_date_from` | string | วันเดินทางเริ่มต้น |
| `travel_date_to` | string | วันเดินทางสิ้นสุด |
| `booking_date_from` | string | วันจองเริ่มต้น |
| `booking_date_to` | string | วันจองสิ้นสุด |
| `date_format` | string | รูปแบบวันที่ default: `numeric_full` |

**เงื่อนไข:** `!= Canceled` + `deleted_at IS NULL` + `start_at IS NOT NULL`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "travel_start_date": "2025-03-01",
      "travel_start_date_label": "01/03/2568",
      "total_orders": 8,
      "total_customers": 25,
      "total_net_amount": 640000,
      "avg_net_amount": 80000
    }
  ]
}
```

---

### `GET /api/reports/lead-time-analysis`

วิเคราะห์ Lead Time (ระยะห่างจองถึงเดินทาง)

| Parameter | Type | Description |
|---|---|---|
| `country_id` | string | ID ประเทศ (comma-separated) |
| `supplier_id` | string | ID Supplier (comma-separated) |
| `travel_date_from` | string | วันเดินทางเริ่มต้น |
| `travel_date_to` | string | วันเดินทางสิ้นสุด |
| `booking_date_from` | string | วันจองเริ่มต้น |
| `booking_date_to` | string | วันจองสิ้นสุด |
| `limit` | number | จำนวนต่อหน้า default: 1000 |
| `offset` | number | เริ่มจากลำดับที่ default: 0 |

**เงื่อนไข:** `!= Canceled` + `deleted_at IS NULL` + `start_at IS NOT NULL`

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "summary": {
      "total_orders": 1500,
      "avg_lead_time": 45,
      "min_lead_time": 1,
      "max_lead_time": 365,
      "median_lead_time": 30,
      "total_net_amount": 120000000
    },
    "distribution": [
      {
        "range": "0-7",
        "range_label": "0-7 วัน",
        "count": 150,
        "percentage": 10,
        "total_net_amount": 12000000
      }
    ]
  }
}
```

---

### `GET /api/suppliers`

รายชื่อ Supplier/Wholesale ทั้งหมด

| Parameter | Type | Description |
|---|---|---|
| `name_th` | string | ค้นหาชื่อภาษาไทย |
| `name_en` | string | ค้นหาชื่อภาษาอังกฤษ |
| `limit` | number | default: 100 |
| `offset` | number | default: 0 |

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name_th": "ซีโก้ ทราเวล", "name_en": "ZEGO TRAVEL CO., LTD." }
  ]
}
```

---

## Authentication

ทุก API ต้องส่ง Header:

```
Authorization: Bearer <token>
```

Token เก็บใน `sessionStorage.authToken` หรือ `localStorage.authToken`

### Base URL

| Environment | URL |
|---|---|
| Production | `https://finance-backoffice-report-api.vercel.app` |
| Staging | `https://staging-finance-backoffice-report-api.vercel.app` |

### Rate Limit

- 100 requests / 60 วินาที ต่อ API Key/IP

---

## Database Tables ที่ใช้

| Table | Description |
|---|---|
| `v_Xqc7k7_orders` | Orders หลัก |
| `v_Xqc7k7_order_items` | รายการสินค้าใน Order |
| `v_Xqc7k7_customer_order_installments` | งวดชำระเงิน |
| `tw_suppliers_db_views.v_GsF2WeS_suppliers` | ข้อมูล Supplier |

### Installment Status Flow

```
ordinal = 1 (งวดแรก) → status = 'paid' → นับเป็น order ที่ชำระแล้ว
```
