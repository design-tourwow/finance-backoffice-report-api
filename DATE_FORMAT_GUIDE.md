# Date Format Standards - Order Report System

## 📋 สรุป
เอกสารนี้กำหนดมาตรฐานการแสดงวันที่ในระบบ Order Report ให้รองรับทุกรูปแบบที่อาจเกิดขึ้น

## 🎯 รูปแบบที่รองรับ

### รูปแบบทั้งหมด (8 แบบ)

| Format Code | ตัวอย่าง | คำอธิบาย |
|-------------|----------|----------|
| `th_full_be_full` | มกราคม 2568 | เดือนไทยเต็ม + ปี พ.ศ. เต็ม (Default) |
| `th_short_be_short` | ม.ค. 68 | เดือนไทยย่อ + ปี พ.ศ. ย่อ |
| `th_full_ad_full` | มกราคม 2025 | เดือนไทยเต็ม + ปี ค.ศ. เต็ม |
| `th_short_ad_short` | ม.ค. 25 | เดือนไทยย่อ + ปี ค.ศ. ย่อ |
| `en_full_be_full` | January 2568 | เดือนอังกฤษเต็ม + ปี พ.ศ. เต็ม |
| `en_short_be_short` | Jan 68 | เดือนอังกฤษย่อ + ปี พ.ศ. ย่อ |
| `en_full_ad_full` | January 2025 | เดือนอังกฤษเต็ม + ปี ค.ศ. เต็ม |
| `en_short_ad_short` | Jan 25 | เดือนอังกฤษย่อ + ปี ค.ศ. ย่อ |

## 📡 API Endpoints ที่รองรับ

### 1. GET /api/reports/by-travel-date

รายงาน Orders แยกตามเดือนเดินทาง

**Query Parameters:**
- `date_format` (optional) - รูปแบบวันที่ (default: `th_full_be_full`)
- `country_id`, `supplier_id`, `travel_date_from`, `travel_date_to`, etc.

**ตัวอย่างการใช้งาน:**

```bash
# Default (เดือนไทยเต็ม + ปี พ.ศ. เต็ม)
GET /api/reports/by-travel-date
Response: "travel_month_label": "มกราคม 2568"

# เดือนไทยย่อ + ปี พ.ศ. ย่อ
GET /api/reports/by-travel-date?date_format=th_short_be_short
Response: "travel_month_label": "ม.ค. 68"

# เดือนอังกฤษเต็ม + ปี พ.ศ. เต็ม
GET /api/reports/by-travel-date?date_format=en_full_be_full
Response: "travel_month_label": "January 2568"

# เดือนอังกฤษย่อ + ปี ค.ศ. ย่อ
GET /api/reports/by-travel-date?date_format=en_short_ad_short
Response: "travel_month_label": "Jan 25"
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "travel_month": "2025-01",
      "travel_month_label": "มกราคม 2568",
      "total_orders": 125,
      "total_customers": 45,
      "total_net_amount": 12500000
    }
  ]
}
```

---

### 2. GET /api/reports/by-booking-date

รายงาน Orders แยกตามเดือนที่จอง

**Query Parameters:**
- `date_format` (optional) - รูปแบบวันที่ (default: `th_full_be_full`)
- `country_id`, `supplier_id`, `booking_date_from`, `booking_date_to`, etc.

**ตัวอย่างการใช้งาน:**

```bash
# Default (เดือนไทยเต็ม + ปี พ.ศ. เต็ม)
GET /api/reports/by-booking-date
Response: "booking_month_label": "ธันวาคม 2567"

# เดือนไทยย่อ + ปี พ.ศ. ย่อ
GET /api/reports/by-booking-date?date_format=th_short_be_short
Response: "booking_month_label": "ธ.ค. 67"

# เดือนอังกฤษเต็ม + ปี ค.ศ. เต็ม
GET /api/reports/by-booking-date?date_format=en_full_ad_full
Response: "booking_month_label": "December 2024"
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "booking_month": "2024-12",
      "booking_month_label": "ธันวาคม 2567",
      "total_orders": 98,
      "total_customers": 38,
      "total_net_amount": 9800000
    }
  ]
}
```

---

## 🔧 การใช้งาน Date Formatter Utility

### Import

```typescript
import { 
  formatMonthLabel, 
  formatFullDate, 
  isValidDateFormat,
  DateFormatType,
  DATE_FORMAT_EXAMPLES 
} from '@/lib/dateFormatter'
```

### ตัวอย่างการใช้งาน

```typescript
// Format เดือน
formatMonthLabel('2025-01', 'th_full_be_full')  // "มกราคม 2568"
formatMonthLabel('2025-01', 'th_short_be_short') // "ม.ค. 68"
formatMonthLabel('2025-01', 'en_full_be_full')   // "January 2568"
formatMonthLabel('2025-01', 'en_short_ad_short') // "Jan 25"

// Format วันที่เต็ม
formatFullDate('2025-01-14') // "14/01/2568"

// ตรวจสอบ format ถูกต้อง
isValidDateFormat('th_full_be_full')  // true
isValidDateFormat('invalid_format')   // false

// ดูตัวอย่างทั้งหมด
console.log(DATE_FORMAT_EXAMPLES)
/*
{
  'th_full_be_full': 'มกราคม 2568',
  'th_short_be_short': 'ม.ค. 68',
  'th_full_ad_full': 'มกราคม 2025',
  'th_short_ad_short': 'ม.ค. 25',
  'en_full_be_full': 'January 2568',
  'en_short_be_short': 'Jan 68',
  'en_full_ad_full': 'January 2025',
  'en_short_ad_short': 'Jan 25'
}
*/
```

---

## 📊 แนวทางการเลือกใช้รูปแบบ

### สำหรับ Table Display
**แนะนำ:** `th_full_be_full` → "มกราคม 2568"
- ✅ อ่านง่าย ชัดเจน
- ✅ เป็นมาตรฐานไทย
- ❌ ใช้พื้นที่มาก

### สำหรับ Chart Labels (ข้อมูลเยอะ)
**แนะนำ:** `th_short_be_short` → "ม.ค. 68"
- ✅ ประหยัดพื้นที่
- ✅ เหมาะกับ chart ที่มีข้อมูลเยอะ
- ❌ อาจสับสนถ้าข้ามศตวรรษ

### สำหรับ International Users
**แนะนำ:** `en_full_be_full` → "January 2568"
- ✅ เข้าใจสากล
- ✅ รักษาปี พ.ศ. ตามมาตรฐานไทย
- ❌ ไม่เป็นมาตรฐานไทยทั่วไป

---

## 🎨 ตัวอย่างการใช้งานจริง

### ตัวอย่างที่ 1: Table Display
```typescript
// Frontend Code
const response = await fetch('/api/reports/by-travel-date?date_format=th_full_be_full')
const data = await response.json()

// Display in table
data.data.forEach(row => {
  console.log(row.travel_month_label) // "มกราคม 2568"
})
```

### ตัวอย่างที่ 2: Chart with Many Data Points
```typescript
// Frontend Code - Chart with 12+ months
const response = await fetch('/api/reports/by-travel-date?date_format=th_short_be_short')
const data = await response.json()

// Chart labels
const labels = data.data.map(row => row.travel_month_label)
// ["ม.ค. 68", "ก.พ. 68", "มี.ค. 68", ...]
```

### ตัวอย่างที่ 3: International Dashboard
```typescript
// Frontend Code - English interface
const response = await fetch('/api/reports/by-travel-date?date_format=en_full_ad_full')
const data = await response.json()

// Display
data.data.forEach(row => {
  console.log(row.travel_month_label) // "January 2025"
})
```

---

## 🔍 การทดสอบ

### Test Cases

```bash
# Test 1: Default format
curl "https://api.example.com/api/reports/by-travel-date" \
  -H "x-api-key: YOUR_API_KEY"
# Expected: "travel_month_label": "มกราคม 2568"

# Test 2: Short Thai format
curl "https://api.example.com/api/reports/by-travel-date?date_format=th_short_be_short" \
  -H "x-api-key: YOUR_API_KEY"
# Expected: "travel_month_label": "ม.ค. 68"

# Test 3: English format
curl "https://api.example.com/api/reports/by-travel-date?date_format=en_full_be_full" \
  -H "x-api-key: YOUR_API_KEY"
# Expected: "travel_month_label": "January 2568"

# Test 4: Invalid format (fallback to default)
curl "https://api.example.com/api/reports/by-travel-date?date_format=invalid" \
  -H "x-api-key: YOUR_API_KEY"
# Expected: "travel_month_label": "มกราคม 2568" (fallback to default)
```

---

## ⚙️ Technical Details

### Date Formatter Utility Location
`lib/dateFormatter.ts`

### Supported Endpoints
- `/api/reports/by-travel-date`
- `/api/reports/by-booking-date`

### Default Behavior
- ถ้าไม่ส่ง `date_format` parameter → ใช้ `th_full_be_full` (มกราคม 2568)
- ถ้าส่ง format ไม่ถูกต้อง → fallback ไปใช้ `th_full_be_full`

### Validation
- API จะตรวจสอบ `date_format` parameter ด้วย `isValidDateFormat()`
- รองรับเฉพาะ 8 รูปแบบที่กำหนดไว้

---

## 📝 สรุป

✅ **รองรับ 8 รูปแบบ** - เดือนไทย/อังกฤษ (เต็ม/ย่อ) + ปี พ.ศ./ค.ศ. (เต็ม/ย่อ)  
✅ **ใช้งานง่าย** - เพิ่ม query parameter `date_format` เท่านั้น  
✅ **Backward Compatible** - Default เป็น `th_full_be_full` (มกราคม 2568)  
✅ **Type Safe** - มี TypeScript types และ validation  
✅ **Reusable** - มี utility function ใช้ได้ทั่วทั้งระบบ

---

**Created:** 2025-01-16  
**Version:** 1.0  
**Status:** ✅ Production Ready
