# Database API Documentation

## Overview

API สำหรับเข้าถึงข้อมูลทุก Database, ทุก Table และทุก Column ในระบบ

## Databases

| Key | Database Name | Prefix | Description |
|-----|---------------|--------|-------------|
| `TOURWOW` | `tw_tourwow_db_views` | `v_Xqc7k7_` | ข้อมูลหลัก: Orders, Customers, Bookings, Installments |
| `LOCATIONS` | `tw_locations_db_views` | `v_Hdz2WSB_` | ข้อมูลสถานที่: Countries, Provinces, Regions, Continents, Airports |
| `SUPPLIERS` | `tw_suppliers_db_views` | `v_GsF2WeS_` | ข้อมูล Suppliers/Wholesales |

---

## Endpoints

### 1. GET /api/database/tables
ดึงรายชื่อ Tables ทั้งหมดจากทุก Database

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `database` | string | No | กรองตาม Database (TOURWOW, LOCATIONS, SUPPLIERS) |
| `include_columns` | boolean | No | แสดงรายละเอียด Columns (`true`/`false`) |

**Example:**
```bash
# ดึงทุก tables จากทุก database
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/tables" \
  -H "Authorization: Bearer <token>"

# ดึงเฉพาะ TOURWOW database
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/tables?database=TOURWOW" \
  -H "Authorization: Bearer <token>"

# ดึงพร้อม column details
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/tables?include_columns=true" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "databases": [
      {
        "database": "tw_tourwow_db_views",
        "prefix": "v_Xqc7k7_",
        "tables": [
          {
            "table_name": "v_Xqc7k7_orders",
            "table_type": "VIEW",
            "table_rows": null,
            "create_time": "2026-01-01T00:00:00.000Z",
            "update_time": null,
            "table_comment": ""
          }
        ],
        "table_count": 4
      }
    ],
    "summary": {
      "total_databases": 3,
      "total_tables": 10
    }
  }
}
```

---

### 2. GET /api/database/schema
ดึง Schema ครบถ้วนของทุก Database, ทุก Table และทุก Column

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `database` | string | No | กรองตาม Database (TOURWOW, LOCATIONS, SUPPLIERS) |
| `table` | string | No | กรองตามชื่อ Table (partial match) |

**Example:**
```bash
# ดึง schema ทั้งหมด
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/schema" \
  -H "Authorization: Bearer <token>"

# ดึงเฉพาะ TOURWOW database
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/schema?database=TOURWOW" \
  -H "Authorization: Bearer <token>"

# ดึงเฉพาะ tables ที่มีคำว่า orders
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/schema?table=orders" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "databases": [
      {
        "database": "tw_tourwow_db_views",
        "prefix": "v_Xqc7k7_",
        "description": "ข้อมูลหลัก: Orders, Customers, Bookings, Installments",
        "tables": [
          {
            "table_name": "v_Xqc7k7_orders",
            "table_type": "VIEW",
            "table_rows": null,
            "create_time": "2026-01-01T00:00:00.000Z",
            "update_time": null,
            "table_comment": "",
            "columns": [
              {
                "column_name": "id",
                "data_type": "int",
                "column_type": "int(11)",
                "is_nullable": false,
                "column_key": "PRI",
                "column_default": null,
                "extra": "auto_increment",
                "column_comment": "",
                "ordinal_position": 1
              },
              {
                "column_name": "order_code",
                "data_type": "varchar",
                "column_type": "varchar(50)",
                "is_nullable": true,
                "column_key": null,
                "column_default": null,
                "extra": null,
                "column_comment": "",
                "ordinal_position": 2
              }
            ],
            "column_count": 45
          }
        ],
        "table_count": 4
      }
    ],
    "summary": {
      "total_databases": 3,
      "total_tables": 10,
      "total_columns": 150
    }
  }
}
```

---

### 3. GET /api/database/query
Query ข้อมูลจาก Table ใดก็ได้ (Simple Query)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `database` | string | **Yes** | Database key (TOURWOW, LOCATIONS, SUPPLIERS) |
| `table` | string | **Yes** | ชื่อ Table เต็ม (e.g., `v_Xqc7k7_orders`) |
| `columns` | string | No | Columns ที่ต้องการ (comma-separated) |
| `where_column` | string | No | Column สำหรับ WHERE |
| `where_value` | string | No | Value สำหรับ WHERE |
| `where_operator` | string | No | Operator (=, !=, >, <, >=, <=, LIKE) |
| `order_by` | string | No | Column สำหรับ ORDER BY |
| `order_dir` | string | No | Direction (ASC, DESC) |
| `limit` | number | No | จำนวน rows (default: 100, max: 1000) |
| `offset` | number | No | Offset for pagination |

**Example:**
```bash
# ดึง orders ทั้งหมด (limit 100)
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/query?database=TOURWOW&table=v_Xqc7k7_orders" \
  -H "Authorization: Bearer <token>"

# ดึงเฉพาะบาง columns
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/query?database=TOURWOW&table=v_Xqc7k7_orders&columns=id,order_code,customer_name,net_amount" \
  -H "Authorization: Bearer <token>"

# ดึงพร้อม filter
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/query?database=TOURWOW&table=v_Xqc7k7_orders&where_column=order_status&where_value=approved" \
  -H "Authorization: Bearer <token>"

# ดึงพร้อม LIKE search
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/query?database=TOURWOW&table=v_Xqc7k7_customers&where_column=name&where_operator=LIKE&where_value=สมชาย" \
  -H "Authorization: Bearer <token>"

# ดึงพร้อม sorting และ pagination
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/query?database=TOURWOW&table=v_Xqc7k7_orders&order_by=created_at&order_dir=DESC&limit=50&offset=100" \
  -H "Authorization: Bearer <token>"

# ดึงข้อมูล Countries จาก LOCATIONS database
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/query?database=LOCATIONS&table=v_Hdz2WSB_countries" \
  -H "Authorization: Bearer <token>"

# ดึงข้อมูล Suppliers
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/query?database=SUPPLIERS&table=v_GsF2WeS_suppliers" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_code": "ORD001",
      "customer_name": "สมชาย ใจดี",
      "net_amount": 50000.00
    }
  ],
  "meta": {
    "database": "tw_tourwow_db_views",
    "table": "v_Xqc7k7_orders",
    "query": {
      "columns": "id,order_code,customer_name,net_amount",
      "where": { "column": "order_status", "operator": "=", "value": "approved" },
      "order_by": { "column": "created_at", "direction": "DESC" }
    }
  },
  "pagination": {
    "total": 5000,
    "limit": 100,
    "offset": 0,
    "returned": 100,
    "has_more": true
  }
}
```

---

### 4. POST /api/database/query
Query ข้อมูลแบบ Advanced (Multiple WHERE conditions)

**Request Body:**
```json
{
  "database": "TOURWOW",
  "table": "v_Xqc7k7_orders",
  "columns": ["id", "order_code", "customer_name", "net_amount", "order_status"],
  "where": [
    { "column": "order_status", "operator": "=", "value": "approved" },
    { "column": "net_amount", "operator": ">=", "value": 10000 },
    { "column": "customer_name", "operator": "LIKE", "value": "สมชาย" }
  ],
  "order_by": [
    { "column": "net_amount", "direction": "DESC" },
    { "column": "created_at", "direction": "DESC" }
  ],
  "limit": 50,
  "offset": 0
}
```

**Supported Operators:**
| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equal | `{ "column": "status", "operator": "=", "value": "active" }` |
| `!=` | Not equal | `{ "column": "status", "operator": "!=", "value": "canceled" }` |
| `>` | Greater than | `{ "column": "amount", "operator": ">", "value": 1000 }` |
| `<` | Less than | `{ "column": "amount", "operator": "<", "value": 5000 }` |
| `>=` | Greater or equal | `{ "column": "amount", "operator": ">=", "value": 1000 }` |
| `<=` | Less or equal | `{ "column": "amount", "operator": "<=", "value": 5000 }` |
| `LIKE` | Pattern match | `{ "column": "name", "operator": "LIKE", "value": "john" }` |
| `IN` | In list | `{ "column": "status", "operator": "IN", "value": ["active", "pending"] }` |
| `IS NULL` | Is null | `{ "column": "deleted_at", "operator": "IS NULL" }` |
| `IS NOT NULL` | Is not null | `{ "column": "email", "operator": "IS NOT NULL" }` |

**Example:**
```bash
curl -X POST "https://staging-finance-backoffice-report-api.vercel.app/api/database/query" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "database": "TOURWOW",
    "table": "v_Xqc7k7_orders",
    "columns": ["id", "order_code", "customer_name", "net_amount"],
    "where": [
      { "column": "order_status", "operator": "IN", "value": ["approved", "pending"] },
      { "column": "deleted_at", "operator": "IS NULL" }
    ],
    "order_by": [{ "column": "created_at", "direction": "DESC" }],
    "limit": 50
  }'
```

---

## Tables Reference

### TOURWOW Database (`tw_tourwow_db_views`)

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `Xqc7k7_orders` | คำสั่งซื้อ/ออเดอร์ | `id`, `order_code`, `customer_id`, `order_status`, `net_amount`, `product_snapshot`, `product_period_snapshot` |
| `Xqc7k7_order_items` | รายการสินค้าในออเดอร์ | `id`, `order_id`, `product_room_type_id`, `quantity`, `price` |
| `Xqc7k7_customers` | ข้อมูลลูกค้า | `id`, `customer_code`, `name`, `phone_number`, `email` |
| `Xqc7k7_bookings` | ข้อมูลการจอง | `id`, `booking_code`, `status` |
| `Xqc7k7_customer_order_installments` | งวดการชำระเงินลูกค้า | `id`, `order_id`, `ordinal`, `amount`, `status`, `due_date` |
| `Xqc7k7_customer_order_installment_files` | ไฟล์แนบงวดชำระเงิน | `id`, `installment_id`, `file_path` |
| `Xqc7k7_supplier_order_installments` | งวดการชำระเงิน Supplier | `id`, `order_id`, `amount`, `status` |
| `Xqc7k7_agencies` | บริษัททัวร์/Agency | `id`, `name`, `code` |
| `Xqc7k7_products` | สินค้า/ทัวร์ | `id`, `name`, `supplier_id` |
| `Xqc7k7_product_periods` | ช่วงเวลาของสินค้า | `id`, `product_id`, `start_at`, `end_at` |
| `Xqc7k7_product_room_types` | ประเภทห้อง/ที่พัก | `id`, `product_id`, `name`, `price` |

**หมายเหตุ:** ใช้ `/api/database/schema?database=TOURWOW` เพื่อดู columns ทั้งหมดของแต่ละ table

### LOCATIONS Database (`tw_locations_db_views`)

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `Xqc7k7_countries` | ประเทศ | `id`, `name_th`, `name_en`, `code` |
| `Xqc7k7_provinces` | จังหวัด | `id`, `country_id`, `name_th`, `name_en` |
| `Xqc7k7_regions` | ภูมิภาค | `id`, `name_th`, `name_en` |
| `Xqc7k7_continents` | ทวีป | `id`, `name_th`, `name_en` |
| `Xqc7k7_airports` | สนามบิน | `id`, `country_id`, `name`, `code` |

### SUPPLIERS Database (`tw_suppliers_db_views`)

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `Xqc7k7_suppliers` | ซัพพลายเออร์/Wholesales | `id`, `name_th`, `name_en`, `code`, `status_code` |

---

## order_items Table Detail

Table `Xqc7k7_order_items` ใช้สำหรับคำนวณจำนวนผู้เดินทาง

### Columns
| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary Key |
| `order_id` | int | FK เชื่อมกับ orders.id |
| `product_room_type_id` | int | FK เชื่อมกับ product_room_types.id (NULL = ไม่นับ) |
| `quantity` | int | จำนวนผู้เดินทาง |
| `price` | decimal | ราคา |
| `created_at` | datetime | วันที่สร้าง |
| `updated_at` | datetime | วันที่อัปเดต |

### การคำนวณจำนวนผู้เดินทาง
```sql
SELECT SUM(quantity) as total_travelers
FROM Xqc7k7_order_items
WHERE order_id = ? AND product_room_type_id IS NOT NULL
```

### Example API Call
```bash
# ดึงข้อมูล order_items
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/query?database=TOURWOW&table=Xqc7k7_order_items&limit=10" \
  -H "Authorization: Bearer <token>"

# ดึง order_items ของ order เฉพาะ
curl "https://staging-finance-backoffice-report-api.vercel.app/api/database/query?database=TOURWOW&table=Xqc7k7_order_items&where_column=order_id&where_value=123" \
  -H "Authorization: Bearer <token>"

# ดึงเฉพาะที่มี product_room_type_id
curl -X POST "https://staging-finance-backoffice-report-api.vercel.app/api/database/query" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "database": "TOURWOW",
    "table": "Xqc7k7_order_items",
    "where": [
      { "column": "product_room_type_id", "operator": "IS NOT NULL" }
    ],
    "limit": 100
  }'
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required parameters: database and table",
  "usage": { ... }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized - Invalid token or API key"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Table not found: invalid_table",
  "valid_tables": ["v_Xqc7k7_orders", "v_Xqc7k7_customers", ...]
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later.",
  "retryAfter": 30
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Notes

- ทุก API endpoint มี rate limiting 100 requests/minute
- Maximum limit per request: 1000 rows
- ใช้ `include_columns=true` หรือ `/api/database/schema` เพื่อดู columns ของแต่ละ table
- WHERE conditions ใน POST request จะเชื่อมด้วย AND
