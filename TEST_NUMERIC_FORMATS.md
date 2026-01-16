# Testing Numeric Date Formats on Staging

## 🎯 Test Endpoints

### Staging URL
```
https://staging-finance-backoffice-report-api.vercel.app
```

### API Key (Test)
```
sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d
```

## 🧪 Test Cases

### Test 1: numeric_short format (MM/YY)

**Endpoint:** `/api/reports/by-travel-date`

```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-date?date_format=numeric_short" \
  -H "x-api-key: sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d"
```

**Expected Result:**
```json
{
  "success": true,
  "data": [
    {
      "travel_month": "2025-01",
      "travel_month_label": "01/68",
      "total_orders": 125,
      ...
    }
  ]
}
```

**✅ Pass Criteria:** `travel_month_label` should be in format "MM/YY" (e.g., "01/68")

---

### Test 2: numeric_short with booking date

**Endpoint:** `/api/reports/by-booking-date`

```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-booking-date?date_format=numeric_short" \
  -H "x-api-key: sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d"
```

**Expected Result:**
```json
{
  "success": true,
  "data": [
    {
      "booking_month": "2024-12",
      "booking_month_label": "12/67",
      "total_orders": 98,
      ...
    }
  ]
}
```

**✅ Pass Criteria:** `booking_month_label` should be in format "MM/YY" (e.g., "12/67")

---

### Test 3: numeric_full format (DD/MM/YYYY)

**Endpoint:** `/api/reports/lead-time-analysis`

```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/lead-time-analysis?limit=5" \
  -H "x-api-key: sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d"
```

**Expected Result:**
```json
{
  "success": true,
  "data": [
    {
      "order_id": 1262,
      "created_at": "14/01/2568",
      "travel_start_date": "01/03/2568",
      "travel_end_date": "05/03/2568",
      "lead_time_days": 47,
      ...
    }
  ]
}
```

**✅ Pass Criteria:** 
- `created_at` should be in format "DD/MM/YYYY" (e.g., "14/01/2568")
- `travel_start_date` should be in format "DD/MM/YYYY" (e.g., "01/03/2568")
- `travel_end_date` should be in format "DD/MM/YYYY" (e.g., "05/03/2568")

---

### Test 4: Default format still works

**Endpoint:** `/api/reports/by-travel-date` (no date_format parameter)

```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-date" \
  -H "x-api-key: sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d"
```

**Expected Result:**
```json
{
  "success": true,
  "data": [
    {
      "travel_month": "2025-01",
      "travel_month_label": "มกราคม 2568",
      "total_orders": 125,
      ...
    }
  ]
}
```

**✅ Pass Criteria:** `travel_month_label` should be in default format "มกราคม 2568" (Thai full + BE full)

---

### Test 5: Invalid format fallback

**Endpoint:** `/api/reports/by-travel-date` (invalid format)

```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-date?date_format=invalid_format" \
  -H "x-api-key: sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d"
```

**Expected Result:**
```json
{
  "success": true,
  "data": [
    {
      "travel_month": "2025-01",
      "travel_month_label": "มกราคม 2568",
      "total_orders": 125,
      ...
    }
  ]
}
```

**✅ Pass Criteria:** Should fallback to default format "มกราคม 2568" (not throw error)

---

### Test 6: Documentation page shows 10 formats

**URL:** https://staging-finance-backoffice-report-api.vercel.app

**Steps:**
1. Open the URL in browser
2. Look for "📅 Date Format Standards" in the endpoint list
3. Click on it to view details

**Expected Result:**
- Should show "รูปแบบทั้งหมด (10 แบบ)" in the response
- Should include `numeric_short` with example "01/68"
- Should include `numeric_full` with example "14/01/2568"

**✅ Pass Criteria:** Documentation shows all 10 formats including the 2 new numeric formats

---

## 📊 Test Results Template

| Test # | Test Case | Status | Notes |
|--------|-----------|--------|-------|
| 1 | numeric_short with travel date | ⬜ | |
| 2 | numeric_short with booking date | ⬜ | |
| 3 | numeric_full in lead-time-analysis | ⬜ | |
| 4 | Default format (no parameter) | ⬜ | |
| 5 | Invalid format fallback | ⬜ | |
| 6 | Documentation page | ⬜ | |

**Legend:**
- ⬜ Not tested
- ✅ Pass
- ❌ Fail

---

## 🔍 Quick Verification Commands

### Check all 10 formats work
```bash
# Test each format
for format in th_full_be_full th_short_be_short th_full_ad_full th_short_ad_short en_full_be_full en_short_be_short en_full_ad_full en_short_ad_short numeric_short; do
  echo "Testing: $format"
  curl -s "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-date?date_format=$format&limit=1" \
    -H "x-api-key: sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d" | jq '.data[0].travel_month_label'
  echo ""
done
```

### Expected Output
```
Testing: th_full_be_full
"มกราคม 2568"

Testing: th_short_be_short
"ม.ค. 68"

Testing: th_full_ad_full
"มกราคม 2025"

Testing: th_short_ad_short
"ม.ค. 25"

Testing: en_full_be_full
"January 2568"

Testing: en_short_be_short
"Jan 68"

Testing: en_full_ad_full
"January 2025"

Testing: en_short_ad_short
"Jan 25"

Testing: numeric_short
"01/68"
```

---

**Created:** 2025-01-16  
**Purpose:** Verify numeric date formats on staging environment  
**Status:** Ready for testing
