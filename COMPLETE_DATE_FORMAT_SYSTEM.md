# Complete Date Format System - 22 Formats

## ✅ สรุป

ระบบรองรับ **22 รูปแบบวันที่** ครบทุก case ที่อาจเกิดขึ้น

## 📊 รูปแบบทั้งหมด (22 แบบ)

### 🇹🇭 Thai Month + Buddhist Era (พ.ศ.) - 4 แบบ

| Format Code | Example | Use Case |
|-------------|---------|----------|
| `th_full_be_full` | มกราคม 2568 | **Default** - Table display |
| `th_short_be_short` | ม.ค. 68 | Chart labels (compact) |
| `th_full_be_short` | มกราคม 68 | Readable + compact year |
| `th_short_be_full` | ม.ค. 2568 | Compact month + full year |

### 🇹🇭 Thai Month + Christian Era (ค.ศ.) - 4 แบบ

| Format Code | Example | Use Case |
|-------------|---------|----------|
| `th_full_ad_full` | มกราคม 2025 | Thai text + Christian year |
| `th_short_ad_short` | ม.ค. 25 | Compact + Christian year |
| `th_full_ad_short` | มกราคม 25 | Readable + compact CE year |
| `th_short_ad_full` | ม.ค. 2025 | Compact month + full CE year |

### 🌍 English Month + Buddhist Era (พ.ศ.) - 4 แบบ

| Format Code | Example | Use Case |
|-------------|---------|----------|
| `en_full_be_full` | January 2568 | International + Buddhist Era |
| `en_short_be_short` | Jan 68 | International chart + BE |
| `en_full_be_short` | January 68 | Readable English + compact BE |
| `en_short_be_full` | Jan 2568 | Compact English + full BE |

### 🌍 English Month + Christian Era (ค.ศ.) - 4 แบบ

| Format Code | Example | Use Case |
|-------------|---------|----------|
| `en_full_ad_full` | January 2025 | Standard international format |
| `en_short_ad_short` | Jan 25 | International chart |
| `en_full_ad_short` | January 25 | Readable + compact CE |
| `en_short_ad_full` | Jan 2025 | Compact + full CE year |

### 🔢 Numeric + Buddhist Era (พ.ศ.) - 3 แบบ

| Format Code | Example | Use Case |
|-------------|---------|----------|
| `numeric_short` | 01/68 | Most compact - Chart (MM/YY) |
| `numeric_month_year_full` | 01/2568 | ⭐ **แนะนำสำหรับ Frontend** (MM/YYYY) |
| `numeric_full` | 14/01/2568 | Full date (DD/MM/YYYY) |

### 🔢 Numeric + Christian Era (ค.ศ.) - 3 แบบ

| Format Code | Example | Use Case |
|-------------|---------|----------|
| `numeric_short_ad` | 01/25 | Compact international (MM/YY) |
| `numeric_month_year_full_ad` | 01/2025 | International standard (MM/YYYY) |
| `numeric_full_ad` | 14/01/2025 | Full date CE (DD/MM/YYYY) |

---

## 🎯 แนะนำการใช้งาน

### สำหรับ Frontend (แนะนำ)

```bash
# ⭐ แนะนำที่สุด - ชัดเจน ไม่สับสน
GET /api/reports/by-travel-date?date_format=numeric_month_year_full
Response: "travel_month_label": "01/2568"

# หรือถ้าต้องการ ค.ศ.
GET /api/reports/by-travel-date?date_format=numeric_month_year_full_ad
Response: "travel_month_label": "01/2025"
```

### สำหรับ Table Display

```bash
# Default - อ่านง่าย
GET /api/reports/by-travel-date
Response: "travel_month_label": "มกราคม 2568"
```

### สำหรับ Chart (ข้อมูลเยอะ)

```bash
# กระชับสุด
GET /api/reports/by-travel-date?date_format=numeric_short
Response: "travel_month_label": "01/68"

# หรือ
GET /api/reports/by-travel-date?date_format=th_short_be_short
Response: "travel_month_label": "ม.ค. 68"
```

### สำหรับ International

```bash
# Standard international
GET /api/reports/by-travel-date?date_format=en_full_ad_full
Response: "travel_month_label": "January 2025"
```

---

## 📡 API Endpoints ที่รองรับ

### 1. `/api/reports/by-travel-date`
รองรับทุก format (22 แบบ)

```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-date?date_format=numeric_month_year_full" \
  -H "x-api-key: YOUR_API_KEY"
```

### 2. `/api/reports/by-booking-date`
รองรับทุก format (22 แบบ)

```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-booking-date?date_format=numeric_month_year_full" \
  -H "x-api-key: YOUR_API_KEY"
```

### 3. `/api/reports/lead-time-analysis`
ใช้ `numeric_full` (DD/MM/YYYY) สำหรับวันที่เต็ม

```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/lead-time-analysis" \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 🔧 Technical Implementation

### Type Definition

```typescript
export type DateFormatType = 
  // Thai + Buddhist Era
  | 'th_full_be_full'   // มกราคม 2568
  | 'th_short_be_short' // ม.ค. 68
  | 'th_full_be_short'  // มกราคม 68
  | 'th_short_be_full'  // ม.ค. 2568
  
  // Thai + Christian Era
  | 'th_full_ad_full'   // มกราคม 2025
  | 'th_short_ad_short' // ม.ค. 25
  | 'th_full_ad_short'  // มกราคม 25
  | 'th_short_ad_full'  // ม.ค. 2025
  
  // English + Buddhist Era
  | 'en_full_be_full'   // January 2568
  | 'en_short_be_short' // Jan 68
  | 'en_full_be_short'  // January 68
  | 'en_short_be_full'  // Jan 2568
  
  // English + Christian Era
  | 'en_full_ad_full'   // January 2025
  | 'en_short_ad_short' // Jan 25
  | 'en_full_ad_short'  // January 25
  | 'en_short_ad_full'  // Jan 2025
  
  // Numeric + Buddhist Era
  | 'numeric_short'     // 01/68
  | 'numeric_month_year_full' // 01/2568
  | 'numeric_full'      // 14/01/2568
  
  // Numeric + Christian Era
  | 'numeric_short_ad'  // 01/25
  | 'numeric_month_year_full_ad' // 01/2025
  | 'numeric_full_ad'   // 14/01/2025
```

### Usage Examples

```typescript
import { formatMonthLabel, formatFullDate } from '@/lib/dateFormatter'

// Month formats
formatMonthLabel('2025-01', 'th_full_be_full')  // "มกราคม 2568"
formatMonthLabel('2025-01', 'numeric_month_year_full') // "01/2568"
formatMonthLabel('2025-01', 'numeric_month_year_full_ad') // "01/2025"
formatMonthLabel('2025-01', 'en_short_ad_short') // "Jan 25"

// Full date formats
formatFullDate('2025-01-14')        // "14/01/2568" (Buddhist Era)
formatFullDate('2025-01-14', false) // "14/01/2025" (Christian Era)
```

---

## 🎨 Format Matrix

### Month Name Options
- **Thai Full:** มกราคม, กุมภาพันธ์, มีนาคม...
- **Thai Short:** ม.ค., ก.พ., มี.ค...
- **English Full:** January, February, March...
- **English Short:** Jan, Feb, Mar...
- **Numeric:** 01, 02, 03...

### Year Options
- **Buddhist Era Full:** 2568, 2569, 2570...
- **Buddhist Era Short:** 68, 69, 70...
- **Christian Era Full:** 2025, 2026, 2027...
- **Christian Era Short:** 25, 26, 27...

### Combinations
- 4 Month Types × 2 Era Types × 2 Length Types = **16 text formats**
- 3 Numeric Types × 2 Era Types = **6 numeric formats**
- **Total: 22 formats**

---

## ⚠️ Important Notes

### Default Behavior
- ถ้าไม่ส่ง `date_format` → ใช้ `th_full_be_full` (มกราคม 2568)
- ถ้าส่ง format ไม่ถูกต้อง → fallback ไปใช้ `th_full_be_full`

### Recommended Formats

#### ⭐ สำหรับ Frontend (แนะนำ)
```
numeric_month_year_full → 01/2568
```
- ชัดเจนที่สุด
- ไม่สับสนกับศตวรรษอื่น
- รูปแบบตัวเลขอ่านง่าย

#### สำหรับ Chart (กระชับ)
```
numeric_short → 01/68
th_short_be_short → ม.ค. 68
```
- ประหยัดพื้นที่
- เหมาะกับข้อมูลเยอะ

#### สำหรับ Table (อ่านง่าย)
```
th_full_be_full → มกราคม 2568 (Default)
```
- อ่านง่ายที่สุด
- เป็นมาตรฐานไทย

---

## 📚 Documentation

### Files Updated
- ✅ `lib/dateFormatter.ts` - Core utility (22 formats)
- ✅ `app/page.tsx` - API documentation page
- ✅ `DATE_FORMAT_GUIDE.md` - Comprehensive guide
- ✅ `DATE_FORMAT_QUICK_REFERENCE.md` - Quick reference
- ✅ `COMPLETE_DATE_FORMAT_SYSTEM.md` - This file

### View Documentation
- **Web:** https://staging-finance-backoffice-report-api.vercel.app
- **Look for:** "📅 Date Format Standards" endpoint

---

## 🚀 Deployment

### Status
- ✅ Build successful
- ✅ Committed to git
- ✅ Pushed to staging branch
- ✅ Auto-deployed to Vercel

### Staging URL
```
https://staging-finance-backoffice-report-api.vercel.app
```

### Test API Key
```
sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d
```

---

## 🧪 Quick Test

```bash
# Test แนะนำ format (numeric_month_year_full)
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-date?date_format=numeric_month_year_full&limit=1" \
  -H "x-api-key: sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d"

# Expected: "travel_month_label": "01/2568"
```

---

## 📊 Summary

✅ **22 รูปแบบครบทุก case**
- 4 Thai + Buddhist Era
- 4 Thai + Christian Era  
- 4 English + Buddhist Era
- 4 English + Christian Era
- 3 Numeric + Buddhist Era
- 3 Numeric + Christian Era

✅ **แนะนำสำหรับ Frontend:** `numeric_month_year_full` → `01/2568`

✅ **Backward Compatible:** Default ยังคงเป็น `th_full_be_full`

✅ **Type Safe:** TypeScript types ครบทุก format

✅ **Deployed:** Staging environment พร้อมใช้งาน

---

**Created:** 2025-01-16  
**Version:** 2.0 (Complete System)  
**Status:** ✅ Production Ready  
**Total Formats:** 22
