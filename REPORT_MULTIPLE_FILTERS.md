# Report API - Multiple Country/Supplier Filtering

## Overview
All report endpoints now support filtering by multiple countries and/or multiple suppliers using comma-separated values.

## Updated Endpoints

### 1. GET /api/reports/summary
Summary of all orders with optional filters.

**Query Parameters:**
- `country_id` - Single or comma-separated country IDs (e.g., `7` or `7,39,4`)
- `supplier_id` - Single or comma-separated supplier IDs (e.g., `1` or `1,5,10`)
- `travel_date_from` - Start travel date (YYYY-MM-DD)
- `travel_date_to` - End travel date (YYYY-MM-DD)
- `booking_date_from` - Start booking date (YYYY-MM-DD)
- `booking_date_to` - End booking date (YYYY-MM-DD)

**Examples:**
```bash
# Single country
GET /api/reports/summary?country_id=7

# Multiple countries
GET /api/reports/summary?country_id=7,39,4

# Multiple countries + multiple suppliers
GET /api/reports/summary?country_id=7,39&supplier_id=1,5,10

# Multiple filters with date range
GET /api/reports/summary?country_id=7,39&supplier_id=1,5&travel_date_from=2024-01-01&travel_date_to=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_orders": 708,
    "total_customers": 165,
    "total_net_amount": 98108019,
    "avg_net_amount": 138571
  }
}
```

---

### 2. GET /api/reports/by-country
Orders grouped by country.

**Query Parameters:**
- `country_id` - Single or comma-separated country IDs (filters to specific countries)
- `supplier_id` - Single or comma-separated supplier IDs
- `travel_date_from`, `travel_date_to`, `booking_date_from`, `booking_date_to`

**Examples:**
```bash
# All countries
GET /api/reports/by-country

# Specific countries only
GET /api/reports/by-country?country_id=7,39,4

# Countries filtered by supplier
GET /api/reports/by-country?country_id=7,39&supplier_id=1,5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "country_id": 7,
      "country_name": "ญี่ปุ่น",
      "total_orders": 463,
      "total_customers": 95,
      "total_net_amount": 85738019,
      "avg_net_amount": 185179
    },
    {
      "country_id": 39,
      "country_name": "จีน",
      "total_orders": 156,
      "total_customers": 42,
      "total_net_amount": 12450000,
      "avg_net_amount": 79807
    }
  ]
}
```

---

### 3. GET /api/reports/by-supplier
Orders grouped by supplier.

**Query Parameters:**
- `country_id` - Single or comma-separated country IDs
- `supplier_id` - Single or comma-separated supplier IDs (filters to specific suppliers)
- `travel_date_from`, `travel_date_to`, `booking_date_from`, `booking_date_to`

**Examples:**
```bash
# All suppliers
GET /api/reports/by-supplier

# Specific suppliers only
GET /api/reports/by-supplier?supplier_id=1,5,10

# Suppliers filtered by country
GET /api/reports/by-supplier?country_id=7,39&supplier_id=1,5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "supplier_id": 1,
      "supplier_name": "Supplier A",
      "total_orders": 245,
      "total_customers": 68,
      "total_net_amount": 45000000,
      "avg_net_amount": 183673
    },
    {
      "supplier_id": 5,
      "supplier_name": "Supplier B",
      "total_orders": 189,
      "total_customers": 52,
      "total_net_amount": 32000000,
      "avg_net_amount": 169312
    }
  ]
}
```

---

### 4. GET /api/reports/by-travel-date
Orders grouped by travel month.

**Query Parameters:**
- `country_id` - Single or comma-separated country IDs
- `supplier_id` - Single or comma-separated supplier IDs
- `travel_date_from`, `travel_date_to`, `booking_date_from`, `booking_date_to`

**Examples:**
```bash
# All travel dates
GET /api/reports/by-travel-date

# Filtered by multiple countries
GET /api/reports/by-travel-date?country_id=7,39,4

# Filtered by countries and suppliers
GET /api/reports/by-travel-date?country_id=7,39&supplier_id=1,5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "travel_month": "2024-01",
      "travel_month_label": "มกราคม 2024",
      "total_orders": 45,
      "total_customers": 32,
      "total_net_amount": 8500000
    },
    {
      "travel_month": "2024-02",
      "travel_month_label": "กุมภาพันธ์ 2024",
      "total_orders": 52,
      "total_customers": 38,
      "total_net_amount": 9800000
    }
  ]
}
```

---

### 5. GET /api/reports/by-booking-date
Orders grouped by booking month.

**Query Parameters:**
- `country_id` - Single or comma-separated country IDs
- `supplier_id` - Single or comma-separated supplier IDs
- `travel_date_from`, `travel_date_to`, `booking_date_from`, `booking_date_to`

**Examples:**
```bash
# All booking dates
GET /api/reports/by-booking-date

# Filtered by multiple countries
GET /api/reports/by-booking-date?country_id=7,39,4

# Filtered by countries and suppliers
GET /api/reports/by-booking-date?country_id=7,39&supplier_id=1,5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "booking_month": "2024-01",
      "booking_month_label": "มกราคม 2024",
      "total_orders": 38,
      "total_customers": 28,
      "total_net_amount": 7200000
    },
    {
      "booking_month": "2024-02",
      "booking_month_label": "กุมภาพันธ์ 2024",
      "total_orders": 47,
      "total_customers": 35,
      "total_net_amount": 8900000
    }
  ]
}
```

---

### 6. GET /api/reports/repeat-customers
Customers who made multiple orders.

**Query Parameters:**
- `country_id` - Single or comma-separated country IDs
- `supplier_id` - Single or comma-separated supplier IDs
- `travel_date_from`, `travel_date_to`, `booking_date_from`, `booking_date_to`

**Examples:**
```bash
# All repeat customers
GET /api/reports/repeat-customers

# Filtered by multiple countries
GET /api/reports/repeat-customers?country_id=7,39,4

# Filtered by countries and suppliers
GET /api/reports/repeat-customers?country_id=7,39&supplier_id=1,5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customer_id": 123,
      "customer_code": "C001",
      "customer_name": "สมชาย ใจดี",
      "phone_number": "0812345678",
      "total_orders": 5,
      "countries": "ญี่ปุ่น, จีน",
      "total_spent": 950000
    },
    {
      "customer_id": 456,
      "customer_code": "C002",
      "customer_name": "สมหญิง รักสวย",
      "phone_number": "0823456789",
      "total_orders": 3,
      "countries": "ญี่ปุ่น",
      "total_spent": 580000
    }
  ]
}
```

---

## Implementation Details

### Comma-Separated Value Parsing
All endpoints now parse comma-separated IDs:

```typescript
// Parse comma-separated IDs
const countryIds = countryIdParam 
  ? countryIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) 
  : []
const supplierIds = supplierIdParam 
  ? supplierIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) 
  : []
```

### SQL IN Clause
Uses SQL `IN` clause for multiple values:

```typescript
// Filter by country_id (support multiple IDs)
if (countryIds.length > 0) {
  const placeholders = countryIds.map(() => '?').join(',')
  query += ` AND CAST(JSON_EXTRACT(product_snapshot, '$.countries[0].id') AS UNSIGNED) IN (${placeholders})`
  params.push(...countryIds)
}

// Filter by supplier_id (support multiple IDs)
if (supplierIds.length > 0) {
  const placeholders = supplierIds.map(() => '?').join(',')
  query += ` AND product_owner_supplier_id IN (${placeholders})`
  params.push(...supplierIds)
}
```

### Backward Compatibility
✅ Single value: `country_id=7` → Works as before
✅ Multiple values: `country_id=7,39,4` → New functionality
✅ No value: No `country_id` parameter → Shows all (as before)

---

## Testing Examples

### Test Case 1: Single Country
```bash
curl -X GET "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-country?country_id=7" \
  -H "x-api-key: YOUR_API_KEY"
```

### Test Case 2: Multiple Countries
```bash
curl -X GET "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-country?country_id=7,39,4" \
  -H "x-api-key: YOUR_API_KEY"
```

### Test Case 3: Multiple Countries + Date Range
```bash
curl -X GET "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-country?country_id=7,39&travel_date_from=2024-01-01&travel_date_to=2024-12-31" \
  -H "x-api-key: YOUR_API_KEY"
```

### Test Case 4: Multiple Countries + Multiple Suppliers
```bash
curl -X GET "https://staging-finance-backoffice-report-api.vercel.app/api/reports/summary?country_id=7,39&supplier_id=1,5,10" \
  -H "x-api-key: YOUR_API_KEY"
```

---

## Modified Files
- `app/api/reports/summary/route.ts`
- `app/api/reports/by-country/route.ts`
- `app/api/reports/by-supplier/route.ts`
- `app/api/reports/by-travel-date/route.ts`
- `app/api/reports/by-booking-date/route.ts`
- `app/api/reports/repeat-customers/route.ts`

---

## Status
✅ **COMPLETED** - All 6 report endpoints now support multiple country/supplier filtering
✅ **BACKWARD COMPATIBLE** - Single values still work as before
✅ **READY FOR DEPLOYMENT** - Can be deployed to staging/production

---

**Created:** January 15, 2026
**Status:** Ready for Testing
