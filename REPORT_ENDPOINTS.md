# Report API Endpoints Documentation

## 📋 สรุป

สร้าง 7 Report/Summary endpoints เพื่อให้ Frontend เรียกข้อมูลสรุปได้โดยตรง โดยไม่ต้องดึงข้อมูล orders ทั้งหมดมาคำนวณ

**วันที่สร้าง**: 13 มกราคม 2026  
**Staging URL**: https://staging-finance-backoffice-report-api.vercel.app  
**สถานะ**: ✅ ทดสอบแล้วทำงานได้ดีทั้งหมด

---

## 🔐 Authentication

ทุก endpoint ต้องส่ง API key ผ่าน header:
```
x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e
```
หรือ
```
Authorization: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e
```

---

## 📊 Query Parameters (ใช้ได้กับทุก endpoint ยกเว้น /countries)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `travel_date_from` | string | วันเดินทางเริ่มต้น (YYYY-MM-DD) | 2025-01-01 |
| `travel_date_to` | string | วันเดินทางสิ้นสุด (YYYY-MM-DD) | 2025-12-31 |
| `booking_date_from` | string | วันจองเริ่มต้น (YYYY-MM-DD) | 2025-01-01 |
| `booking_date_to` | string | วันจองสิ้นสุด (YYYY-MM-DD) | 2025-12-31 |
| `country_id` | number | Filter ตามประเทศ | 7 |
| `supplier_id` | number | Filter ตาม Supplier | 46 |

---

## 1. GET /api/reports/summary

สรุปภาพรวม Orders ทั้งหมด

### Request Example:
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/summary" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### Response Example:
```json
{
  "success": true,
  "data": {
    "total_orders": 872,
    "total_customers": 128,
    "total_net_amount": 90360314,
    "avg_net_amount": 103624.213302752
  }
}
```

### Response Fields:
- `total_orders` - จำนวน orders ทั้งหมด (ไม่นับ Canceled)
- `total_customers` - จำนวนลูกค้า unique
- `total_net_amount` - ยอดรวมสุทธิ
- `avg_net_amount` - ยอดเฉลี่ยต่อ order

---

## 2. GET /api/reports/by-country

รายงาน Orders แยกตามประเทศ

### Request Example:
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-country" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### Response Example:
```json
{
  "success": true,
  "data": [
    {
      "country_id": 7,
      "country_name": "ญี่ปุ่น",
      "total_orders": 459,
      "total_customers": 102,
      "total_net_amount": 56800237,
      "avg_net_amount": 123747.793028322
    },
    {
      "country_id": 24,
      "country_name": "เวียดนาม",
      "total_orders": 240,
      "total_customers": 11,
      "total_net_amount": 9478258,
      "avg_net_amount": 39492.741666666
    }
  ]
}
```

### Response Fields:
- `country_id` - ID ประเทศ
- `country_name` - ชื่อประเทศ (ภาษาไทย)
- `total_orders` - จำนวน orders
- `total_customers` - จำนวนลูกค้า unique
- `total_net_amount` - ยอดรวมสุทธิ
- `avg_net_amount` - ยอดเฉลี่ยต่อ order

**หมายเหตุ**: เรียงลำดับตาม `total_orders` มากไปน้อย

---

## 3. GET /api/reports/by-supplier

รายงาน Orders แยกตาม Supplier

### Request Example:
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-supplier" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### Response Example:
```json
{
  "success": true,
  "data": [
    {
      "supplier_id": 46,
      "supplier_name": "บริษัท โปร บุ๊คกิ้ง เซนเตอร์ จำกัด",
      "total_orders": 231,
      "total_customers": 76,
      "total_net_amount": 13709510,
      "avg_net_amount": 59348.528138528
    }
  ]
}
```

### Response Fields:
- `supplier_id` - ID Supplier
- `supplier_name` - ชื่อ Supplier (ภาษาไทย)
- `total_orders` - จำนวน orders
- `total_customers` - จำนวนลูกค้า unique
- `total_net_amount` - ยอดรวมสุทธิ
- `avg_net_amount` - ยอดเฉลี่ยต่อ order

**หมายเหตุ**: เรียงลำดับตาม `total_orders` มากไปน้อย

---

## 4. GET /api/reports/by-travel-date

รายงาน Orders แยกตามเดือนเดินทาง

### Request Example:
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-date" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### Response Example:
```json
{
  "success": true,
  "data": [
    {
      "travel_month": "2025-01",
      "travel_month_label": "มกราคม 2025",
      "total_orders": 15,
      "total_customers": 10,
      "total_net_amount": 970973
    },
    {
      "travel_month": "2025-02",
      "travel_month_label": "กุมภาพันธ์ 2025",
      "total_orders": 9,
      "total_customers": 8,
      "total_net_amount": 3980874
    }
  ]
}
```

### Response Fields:
- `travel_month` - เดือน-ปี (YYYY-MM)
- `travel_month_label` - ชื่อเดือนภาษาไทย + ปี
- `total_orders` - จำนวน orders
- `total_customers` - จำนวนลูกค้า unique
- `total_net_amount` - ยอดรวมสุทธิ

**หมายเหตุ**: เรียงลำดับตามเดือน (เก่าไปใหม่)

---

## 5. GET /api/reports/by-booking-date

รายงาน Orders แยกตามเดือนที่จอง

### Request Example:
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-booking-date" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### Response Example:
```json
{
  "success": true,
  "data": [
    {
      "booking_month": "2024-12",
      "booking_month_label": "ธันวาคม 2024",
      "total_orders": 26,
      "total_customers": 14,
      "total_net_amount": 1589499
    },
    {
      "booking_month": "2025-01",
      "booking_month_label": "มกราคม 2025",
      "total_orders": 5,
      "total_customers": 5,
      "total_net_amount": 432882
    }
  ]
}
```

### Response Fields:
- `booking_month` - เดือน-ปี (YYYY-MM)
- `booking_month_label` - ชื่อเดือนภาษาไทย + ปี
- `total_orders` - จำนวน orders
- `total_customers` - จำนวนลูกค้า unique
- `total_net_amount` - ยอดรวมสุทธิ

**หมายเหตุ**: เรียงลำดับตามเดือน (เก่าไปใหม่), ใช้ `created_at` ใน timezone UTC+7

---

## 6. GET /api/reports/repeat-customers

รายงานลูกค้าที่ซื้อซ้ำ (มี order มากกว่า 1 ครั้ง)

### Request Example:
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/repeat-customers" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### Response Example:
```json
{
  "success": true,
  "data": [
    {
      "customer_id": 6,
      "customer_code": "CUS240200004",
      "customer_name": "supasit",
      "phone_number": "0844665515",
      "total_orders": 18,
      "countries": "ญี่ปุ่น, ฝรั่งเศส, เกาหลีใต้, เยอรมัน",
      "total_spent": 2471292
    },
    {
      "customer_id": 34,
      "customer_code": "CUS240400006",
      "customer_name": "GAP1",
      "phone_number": "0267415000",
      "total_orders": 11,
      "countries": "ญี่ปุ่น, ฝรั่งเศส",
      "total_spent": 1178776
    }
  ]
}
```

### Response Fields:
- `customer_id` - ID ลูกค้า
- `customer_code` - รหัสลูกค้า
- `customer_name` - ชื่อลูกค้า
- `phone_number` - เบอร์โทรศัพท์
- `total_orders` - จำนวน orders ทั้งหมด
- `countries` - รายชื่อประเทศที่เคยไป (unique, คั่นด้วย comma)
- `total_spent` - ยอดรวมที่ใช้จ่าย

**หมายเหตุ**: 
- แสดงเฉพาะลูกค้าที่มี orders > 1
- เรียงลำดับตาม `total_orders` มากไปน้อย

---

## 7. GET /api/reports/countries

รายการประเทศทั้งหมดที่มีใน orders (สำหรับ dropdown filter)

### Request Example:
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/countries" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### Response Example:
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "name_th": "ญี่ปุ่น",
      "name_en": "Japan"
    },
    {
      "id": 24,
      "name_th": "เวียดนาม",
      "name_en": "Vietnam"
    },
    {
      "id": 3,
      "name_th": "เกาหลีใต้",
      "name_en": "South Korea"
    }
  ]
}
```

### Response Fields:
- `id` - ID ประเทศ
- `name_th` - ชื่อประเทศภาษาไทย
- `name_en` - ชื่อประเทศภาษาอังกฤษ

**หมายเหตุ**:
- ดึง unique countries จาก orders ที่ไม่ถูก cancel
- เรียงลำดับตาม `name_th` (ก-ฮ)
- ไม่รับ query parameters

---

## 8. GET /api/reports/wholesale-by-country

รายงาน Wholesale (Supplier) แยกตามประเทศปลายทาง - สำหรับหน้า Wholesale Destinations

### Query Parameters:
| Parameter | Type | Description |
|---|---|---|
| `country_id` | string | ID ประเทศ (comma-separated) |
| `supplier_id` | string | ID Supplier (comma-separated) |
| `travel_date_from` | string | วันเดินทางเริ่มต้น (YYYY-MM-DD) |
| `travel_date_to` | string | วันเดินทางสิ้นสุด (YYYY-MM-DD) |
| `booking_date_from` | string | วันจองเริ่มต้น (YYYY-MM-DD) |
| `booking_date_to` | string | วันจองสิ้นสุด (YYYY-MM-DD) |
| `view_mode` | string | โหมดการแสดงผล: `sales` / `travelers` / `orders` / `net_commission` (default: sales) |

### การคำนวณตาม view_mode:

| view_mode | ค่าที่คำนวณ | สูตร |
|---|---|---|
| `sales` | ยอดจองรวม | `SUM(net_amount)` |
| `travelers` | จำนวนผู้เดินทาง | `SUM(traveler_count)` จาก order_items |
| `orders` | จำนวนออเดอร์ | `COUNT(DISTINCT order_id)` |
| `net_commission` | ค่าคอมสุทธิ | `SUM(COALESCE(supplier_commission, 0) - COALESCE(discount, 0))` |

### เงื่อนไขพิเศษสำหรับ `net_commission`:
- **ไม่ใช้** เงื่อนไข `supplier_commission > 0` (mode อื่นใช้)
- ใช้ `LOWER(ci.status) = 'paid'` (case-insensitive)
- สูตร: `COALESCE(supplier_commission, 0) - COALESCE(discount, 0)` เพื่อจัดการค่า NULL

### Request Example:
```bash
# ดูค่าคอมสุทธิ
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/wholesale-by-country?view_mode=net_commission" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# ดูยอดจอง (default)
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/wholesale-by-country?view_mode=sales" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### Response Example:
```json
{
  "success": true,
  "data": {
    "wholesales": [
      {
        "id": 46,
        "name": "บริษัท โปร บุ๊คกิ้ง เซนเตอร์ จำกัด",
        "countries": {
          "ญี่ปุ่น": 150,
          "เวียดนาม": 80,
          "จีน": 45
        },
        "total": 275,
        "order_count": 50
      }
    ],
    "summary": {
      "total_value": 425,
      "total_orders": 1696,
      "top_wholesale": {
        "name": "บริษัท โปร บุ๊คกิ้ง เซนเตอร์ จำกัด",
        "count": 275
      },
      "top_country": {
        "name": "ญี่ปุ่น",
        "count": 250
      },
      "total_partners": 15,
      "view_mode": "net_commission"
    },
    "country_totals": {
      "ญี่ปุ่น": 250,
      "เวียดนาม": 80,
      "จีน": 45
    },
    "view_mode": "net_commission"
  }
}
```

### Response Fields:

**wholesales** (array):
- `id` - ID Supplier/Wholesale
- `name` - ชื่อ Supplier (ภาษาไทย)
- `countries` - Object แสดงค่าแยกตามประเทศ `{ "ชื่อประเทศ": ค่า }` (ค่าเปลี่ยนตาม view_mode)
- `total` - ค่ารวมทั้งหมดของ Wholesale นี้ (เปลี่ยนตาม view_mode)
- `order_count` - จำนวน orders

**summary**:
- `total_value` - ค่ารวมทั้งหมด (เปลี่ยนตาม view_mode)
- `total_orders` - จำนวน orders ทั้งหมด
- `top_wholesale` - Wholesale ที่มียอดสูงสุด
- `top_country` - ประเทศที่มียอดสูงสุด
- `total_partners` - จำนวน Wholesale ทั้งหมด
- `view_mode` - โหมดที่ใช้แสดงผล

**country_totals**:
- Object แสดงยอดรวมของแต่ละประเทศ `{ "ชื่อประเทศ": ยอดรวม }` (เปลี่ยนตาม view_mode)

**หมายเหตุ**:
- เรียงลำดับ wholesales ตาม `total` มากไปน้อย
- รองรับ filters: `country_id`, `supplier_id`, `travel_date_from/to`, `booking_date_from/to`

---

## 📝 Business Logic

### Valid Order Conditions
ทุก endpoint นับเฉพาะ orders ที่:
- `order_status != 'Canceled'`
- `deleted_at IS NULL`

### Timezone
- วันที่จอง (booking date) ใช้ timezone **UTC+7 (Asia/Bangkok)**
- วันเดินทาง (travel date) ใช้วันที่จาก `product_period_snapshot.start_at`

### Data Source
- **Orders**: `Xqc7k7_orders`
- **Customers**: `Xqc7k7_customers`
- **Suppliers**: `tw_suppliers_db.GsF2WeS_suppliers`

---

## 🧪 ตัวอย่างการใช้งาน

### 1. ดูสรุปภาพรวมทั้งหมด
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/summary" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### 2. ดูรายงานตามประเทศ (filter ตามวันเดินทาง)
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-country?travel_date_from=2025-01-01&travel_date_to=2025-12-31" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### 3. ดูรายงานตาม Supplier (filter ตามประเทศญี่ปุ่น)
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-supplier?country_id=7" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### 4. ดูลูกค้าซื้อซ้ำ (filter ตามวันจอง)
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/repeat-customers?booking_date_from=2024-01-01&booking_date_to=2024-12-31" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### 5. ดูรายการประเทศสำหรับ dropdown
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/countries" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

---

## ⚡ Performance

- Response time: < 2 วินาที
- รองรับ concurrent requests
- ใช้ MySQL aggregate functions (COUNT, SUM, AVG) สำหรับประสิทธิภาพ
- Rate limiting: 100 requests per 60 seconds

---

## 🌐 CORS Configuration

Endpoints รองรับ origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `https://staging-finance-backoffice-report.vercel.app`
- `https://finance-backoffice-report.vercel.app`

**สำคัญ**: ส่ง `Access-Control-Allow-Origin` แค่ origin เดียวที่ตรงกับ request (ไม่ใช่ส่งทั้งหมดมา)

---

## ✅ สรุป Endpoints

| Endpoint | Method | Description | Filters |
|----------|--------|-------------|---------|
| `/api/reports/summary` | GET | สรุปภาพรวม | ✅ All |
| `/api/reports/by-country` | GET | รายงานตามประเทศ | ✅ All |
| `/api/reports/by-supplier` | GET | รายงานตาม Supplier | ✅ All |
| `/api/reports/by-travel-date` | GET | รายงานตามเดือนเดินทาง | ✅ All |
| `/api/reports/by-booking-date` | GET | รายงานตามเดือนจอง | ✅ All |
| `/api/reports/repeat-customers` | GET | ลูกค้าซื้อซ้ำ | ✅ All |
| `/api/reports/countries` | GET | รายการประเทศ | ❌ None |
| `/api/reports/wholesale-by-country` | GET | Wholesale แยกตามประเทศ | ✅ All |

---

## 🎯 สถานะการทดสอบ

- [x] ทดสอบบน localhost:3001 - ✅ ผ่าน
- [x] Push ขึ้น staging branch - ✅ สำเร็จ
- [x] Vercel auto-deploy - ✅ สำเร็จ
- [x] ทดสอบบน staging URL - ✅ ผ่านทั้งหมด

### ผลการทดสอบบน Staging:
- ✅ `/api/reports/summary` - ทำงานได้ดี (872 orders, 128 customers)
- ✅ `/api/reports/by-country` - ทำงานได้ดี (23 ประเทศ)
- ✅ `/api/reports/by-supplier` - ทำงานได้ดี
- ✅ `/api/reports/by-travel-date` - ทำงานได้ดี (38 เดือน)
- ✅ `/api/reports/by-booking-date` - ทำงานได้ดี
- ✅ `/api/reports/repeat-customers` - ทำงานได้ดี (41 ลูกค้า)
- ✅ `/api/reports/countries` - ทำงานได้ดี (23 ประเทศ)
- ✅ Query filters ทำงานได้ดี (travel_date, booking_date, country_id, supplier_id)

---

**หมายเหตุสำหรับ Frontend Team**: 
หลังจาก Vercel deploy เสร็จ สามารถเริ่มใช้งาน endpoints เหล่านี้ได้เลย โดยเปลี่ยนจากการเรียก `/api/orders` แล้วคำนวณเองเป็นเรียก report endpoints โดยตรง

