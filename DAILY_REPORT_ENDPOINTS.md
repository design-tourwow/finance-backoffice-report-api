# Daily Report Endpoints - สำหรับรายงานรายวัน

## ✅ สถานะ: พร้อมใช้งานแล้ว

Backend ได้สร้าง API endpoints ใหม่สำหรับรายงานแบบรายวัน (daily aggregation) เรียบร้อยแล้ว

---

## 📍 Endpoints ใหม่

### 1. รายงานตามวันเริ่มเดินทาง (รายวัน)

**Endpoint:** `GET /api/reports/by-travel-start-date`

**คำอธิบาย:** รวมข้อมูล orders ตามวันเริ่มเดินทาง (จาก `product_period_snapshot.start_at`)

**Query Parameters:**
- `travel_date_from` (optional): กรองวันที่เริ่มต้น (YYYY-MM-DD)
- `travel_date_to` (optional): กรองวันที่สิ้นสุด (YYYY-MM-DD)
- `booking_date_from` (optional): กรองวันที่จองเริ่มต้น (YYYY-MM-DD)
- `booking_date_to` (optional): กรองวันที่จองสิ้นสุด (YYYY-MM-DD)
- `country_id` (optional): กรองตามประเทศ (รองรับหลาย ID คั่นด้วย comma เช่น `1,2,3`)
- `supplier_id` (optional): กรองตาม Supplier (รองรับหลาย ID คั่นด้วย comma เช่น `10,20,30`)
- `date_format` (optional): รูปแบบวันที่ในผลลัพธ์ (default: `numeric_full` = DD/MM/YYYY พ.ศ.)

**ตัวอย่าง Request:**
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-start-date?travel_date_from=2026-03-01&travel_date_to=2026-03-31&date_format=numeric_full" \
  -H "x-api-key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "travel_start_date": "2026-03-01",
      "travel_start_date_label": "01/03/2569",
      "total_orders": 15,
      "total_customers": 12,
      "total_net_amount": 750000.00,
      "avg_net_amount": 50000.00
    },
    {
      "travel_start_date": "2026-03-05",
      "travel_start_date_label": "05/03/2569",
      "total_orders": 8,
      "total_customers": 7,
      "total_net_amount": 400000.00,
      "avg_net_amount": 50000.00
    }
  ]
}
```

---

### 2. รายงานตามวันที่จอง (รายวัน)

**Endpoint:** `GET /api/reports/by-created-date`

**คำอธิบาย:** รวมข้อมูล orders ตามวันที่จอง/สร้าง (จาก `created_at`)

**Query Parameters:**
- `travel_date_from` (optional): กรองวันที่เริ่มต้น (YYYY-MM-DD)
- `travel_date_to` (optional): กรองวันที่สิ้นสุด (YYYY-MM-DD)
- `booking_date_from` (optional): กรองวันที่จองเริ่มต้น (YYYY-MM-DD)
- `booking_date_to` (optional): กรองวันที่จองสิ้นสุด (YYYY-MM-DD)
- `country_id` (optional): กรองตามประเทศ (รองรับหลาย ID คั่นด้วย comma)
- `supplier_id` (optional): กรองตาม Supplier (รองรับหลาย ID คั่นด้วย comma)
- `date_format` (optional): รูปแบบวันที่ในผลลัพธ์ (default: `numeric_full` = DD/MM/YYYY พ.ศ.)

**ตัวอย่าง Request:**
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-created-date?booking_date_from=2026-01-01&booking_date_to=2026-01-31&date_format=numeric_full" \
  -H "x-api-key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "created_date": "2026-01-13",
      "created_date_label": "13/01/2569",
      "total_orders": 25,
      "total_customers": 20,
      "total_net_amount": 1250000.00,
      "avg_net_amount": 50000.00
    },
    {
      "created_date": "2026-01-14",
      "created_date_label": "14/01/2569",
      "total_orders": 18,
      "total_customers": 15,
      "total_net_amount": 900000.00,
      "avg_net_amount": 50000.00
    }
  ]
}
```

---

## 📅 รูปแบบวันที่ที่รองรับ (date_format)

### รูปแบบตัวเลข (Numeric)
- `numeric_full` (default): `01/03/2569` (DD/MM/YYYY พ.ศ.)
- `numeric_full_ad`: `01/03/2026` (DD/MM/YYYY ค.ศ.)
- `numeric_short`: `01/03/69` (DD/MM/YY พ.ศ.)
- `numeric_short_ad`: `01/03/26` (DD/MM/YY ค.ศ.)
- `numeric_month_year_full`: `03/2569` (MM/YYYY พ.ศ.)
- `numeric_month_year_full_ad`: `03/2026` (MM/YYYY ค.ศ.)

### รูปแบบภาษาไทย + พ.ศ.
- `th_full_be_full`: `01 มีนาคม 2569`
- `th_short_be_full`: `01 มี.ค. 2569`
- `th_full_be_short`: `01 มีนาคม 69`
- `th_short_be_short`: `01 มี.ค. 69`

### รูปแบบภาษาไทย + ค.ศ.
- `th_full_ad_full`: `01 มีนาคม 2026`
- `th_short_ad_full`: `01 มี.ค. 2026`
- `th_full_ad_short`: `01 มีนาคม 26`
- `th_short_ad_short`: `01 มี.ค. 26`

### รูปแบบภาษาอังกฤษ + พ.ศ.
- `en_full_be_full`: `01 March 2569`
- `en_short_be_full`: `01 Mar 2569`
- `en_full_be_short`: `01 March 69`
- `en_short_be_short`: `01 Mar 69`

### รูปแบบภาษาอังกฤษ + ค.ศ.
- `en_full_ad_full`: `01 March 2026`
- `en_short_ad_full`: `01 Mar 2026`
- `en_full_ad_short`: `01 March 26`
- `en_short_ad_short`: `01 Mar 26`

---

## 🔍 ตัวอย่างการใช้งาน

### 1. ดึงข้อมูลรายวันของเดือนมีนาคม 2026
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-start-date?travel_date_from=2026-03-01&travel_date_to=2026-03-31" \
  -H "x-api-key: YOUR_API_KEY"
```

### 2. กรองตามประเทศและ Supplier
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-start-date?country_id=1,2,3&supplier_id=10,20" \
  -H "x-api-key: YOUR_API_KEY"
```

### 3. เปลี่ยนรูปแบบวันที่เป็นภาษาไทย
```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-created-date?booking_date_from=2026-01-01&booking_date_to=2026-01-31&date_format=th_full_be_full" \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 📊 Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `travel_start_date` / `created_date` | string | วันที่ในรูปแบบ YYYY-MM-DD |
| `travel_start_date_label` / `created_date_label` | string | วันที่ในรูปแบบที่เลือก (ตาม date_format) |
| `total_orders` | number | จำนวน orders ทั้งหมด |
| `total_customers` | number | จำนวนลูกค้าที่ไม่ซ้ำกัน |
| `total_net_amount` | number | ยอดรวมสุทธิ (บาท) |
| `avg_net_amount` | number | ยอดเฉลี่ยต่อ order (บาท) |

---

## 🚀 การใช้งานที่ Frontend

1. **Tab "ตามวันเดินทาง"** → เรียก `/api/reports/by-travel-start-date`
2. **Tab "ตามวันจอง"** → เรียก `/api/reports/by-created-date`
3. แสดงข้อมูลในรูปแบบ line chart และตารางที่เรียงลำดับได้

---

## ⚠️ หมายเหตุ

- ข้อมูลจะไม่รวม orders ที่ `order_status = 'Canceled'` หรือ `deleted_at IS NOT NULL`
- วันที่จองใช้เวลา timezone +07:00 (Bangkok)
- รองรับการกรองหลายเงื่อนไขพร้อมกัน
- ข้อมูลเรียงลำดับตามวันที่จากน้อยไปมาก (ASC)

---

**สร้างเมื่อ:** 16 มกราคม 2569  
**สถานะ:** ✅ พร้อมใช้งานบน staging  
**ติดต่อ:** Backend Team
