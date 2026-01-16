# Date Format Quick Reference

## 🚀 Quick Start

### API Endpoints ที่รองรับ
- `/api/reports/by-travel-date`
- `/api/reports/by-booking-date`

### เพิ่ม Parameter
```
?date_format=<format_code>
```

---

## 📋 Format Codes (8 แบบ)

| Code | Example | Use Case |
|------|---------|----------|
| `th_full_be_full` | มกราคม 2568 | **Default** - Table display |
| `th_short_be_short` | ม.ค. 68 | Chart labels (many data) |
| `th_full_ad_full` | มกราคม 2025 | ถ้าต้องการ ค.ศ. |
| `th_short_ad_short` | ม.ค. 25 | Chart + ค.ศ. |
| `en_full_be_full` | January 2568 | International + พ.ศ. |
| `en_short_be_short` | Jan 68 | International chart |
| `en_full_ad_full` | January 2025 | International + ค.ศ. |
| `en_short_ad_short` | Jan 25 | International chart + ค.ศ. |

---

## 💡 ตัวอย่างการใช้งาน

### 1. Default (ไม่ต้องส่ง parameter)
```bash
GET /api/reports/by-travel-date
```
**Result:** `"travel_month_label": "มกราคม 2568"`

### 2. Chart Labels (ประหยัดพื้นที่)
```bash
GET /api/reports/by-travel-date?date_format=th_short_be_short
```
**Result:** `"travel_month_label": "ม.ค. 68"`

### 3. English Interface
```bash
GET /api/reports/by-travel-date?date_format=en_full_be_full
```
**Result:** `"travel_month_label": "January 2568"`

### 4. English + ค.ศ.
```bash
GET /api/reports/by-travel-date?date_format=en_full_ad_full
```
**Result:** `"travel_month_label": "January 2025"`

---

## 🎯 แนะนำการใช้งาน

### สำหรับ Table
```typescript
const url = '/api/reports/by-travel-date?date_format=th_full_be_full'
// Result: "มกราคม 2568" - อ่านง่าย ชัดเจน
```

### สำหรับ Chart (ข้อมูลเยอะ)
```typescript
const url = '/api/reports/by-travel-date?date_format=th_short_be_short'
// Result: "ม.ค. 68" - ประหยัดพื้นที่
```

### สำหรับ International
```typescript
const url = '/api/reports/by-travel-date?date_format=en_full_be_full'
// Result: "January 2568" - เข้าใจสากล
```

---

## ⚠️ หมายเหตุ

- ถ้าไม่ส่ง `date_format` → ใช้ `th_full_be_full` (มกราคม 2568)
- ถ้าส่ง format ผิด → fallback ไปใช้ `th_full_be_full`
- รองรับเฉพาะ 8 รูปแบบที่กำหนดไว้

---

## 📚 เอกสารเพิ่มเติม

- **Full Documentation:** `DATE_FORMAT_GUIDE.md`
- **Utility Code:** `lib/dateFormatter.ts`

---

**Version:** 1.0  
**Last Updated:** 2025-01-16
