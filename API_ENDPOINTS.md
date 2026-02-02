# API Endpoints Documentation

## Overview
API endpoints สำหรับจัดการข้อมูล Customers, Orders, Installments และ Suppliers

## Authentication
ทุก API endpoint ต้องใช้ API Key ใน header:
```
x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e
```

## Rate Limiting
- **Limit**: 100 requests ต่อ 60 วินาที
- **Headers**: 
  - `X-RateLimit-Limit`: จำนวน request สูงสุด
  - `X-RateLimit-Remaining`: จำนวน request ที่เหลือ
  - `X-RateLimit-Reset`: เวลาที่ reset (timestamp)

---

## 1. Customers API

### GET /api/customers
ดึงข้อมูลลูกค้า

**Query Parameters:**
- `id` - Customer ID
- `customer_code` - รหัสลูกค้า
- `name` - ชื่อลูกค้า (partial match)
- `phone_number` - เบอร์โทรศัพท์
- `limit` - จำนวนข้อมูลต่อหน้า (default: 100, max: 1000)
- `offset` - เริ่มต้นที่ record ที่เท่าไหร่ (default: 0)

**Example:**
```bash
curl -X GET "http://localhost:3000/api/customers?name=สมชาย&limit=10" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "returned": 10
  }
}
```

### POST /api/customers
สร้างลูกค้าใหม่

**Required Fields:**
- `customer_code_prefix` - คำนำหน้ารหัสลูกค้า
- `customer_code_number` - หมายเลขรหัสลูกค้า
- `customer_code` - รหัสลูกค้าเต็ม
- `name` - ชื่อลูกค้า
- `phone_number` - เบอร์โทรศัพท์

**Example:**
```bash
curl -X POST "http://localhost:3000/api/customers" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_code_prefix": "CUS",
    "customer_code_number": 1001,
    "customer_code": "CUS1001",
    "name": "สมชาย ใจดี",
    "phone_number": "0812345678",
    "email": "somchai@example.com"
  }'
```

### PUT /api/customers
อัพเดทข้อมูลลูกค้า

**Required Fields:**
- `id` - Customer ID

**Example:**
```bash
curl -X PUT "http://localhost:3000/api/customers" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "name": "สมชาย ใจดีมาก",
    "email": "somchai.new@example.com"
  }'
```

### DELETE /api/customers
ลบลูกค้า

**Query Parameters:**
- `id` - Customer ID (required)

**Example:**
```bash
curl -X DELETE "http://localhost:3000/api/customers?id=1" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

---

## 2. Orders API

### GET /api/orders
ดึงข้อมูลคำสั่งซื้อ

**Query Parameters:**
- `id` - Order ID
- `order_code` - รหัสคำสั่งซื้อ
- `customer_id` - Customer ID
- `order_status` - สถานะคำสั่งซื้อ
- `limit` - จำนวนข้อมูลต่อหน้า (default: 100, max: 1000)
- `offset` - เริ่มต้นที่ record ที่เท่าไหร่ (default: 0)

**Example:**
```bash
curl -X GET "http://localhost:3000/api/orders?customer_id=1&order_status=approved" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### POST /api/orders
สร้างคำสั่งซื้อใหม่

**Required Fields:**
- `agcy_agency_id` - Agency ID
- `order_code_prefix` - คำนำหน้ารหัสคำสั่งซื้อ
- `order_code_number` - หมายเลขรหัสคำสั่งซื้อ
- `order_code` - รหัสคำสั่งซื้อเต็ม
- `order_status` - สถานะคำสั่งซื้อ
- `product_owner_supplier_id` - Supplier ID
- `product_id` - Product ID
- `product_snapshot` - ข้อมูล Product (JSON)
- `product_period_snapshot` - ข้อมูล Period (JSON)
- `amount` - ยอดเงิน
- `amount_with_discount` - ยอดเงินหลังหักส่วนลด
- `use_vat` - ใช้ VAT หรือไม่ (boolean)
- `vat_percentage` - เปอร์เซ็นต์ VAT
- `vat` - ยอด VAT
- `net_amount` - ยอดสุทธิ
- `commission_company` - ค่าคอมมิชชั่นบริษัท
- `commission_seller` - ค่าคอมมิชชั่นผู้ขาย
- `sum_supplier_order_installment_amount` - ยอดรวมงวดซัพพลายเออร์
- `sum_customer_order_installment_amount` - ยอดรวมงวดลูกค้า
- `customer_name` - ชื่อลูกค้า
- `customer_phone_number` - เบอร์โทรลูกค้า

**Example:**
```bash
curl -X POST "http://localhost:3000/api/orders" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \
  -H "Content-Type: application/json" \
  -d '{
    "agcy_agency_id": 1,
    "order_code_prefix": "ORD",
    "order_code_number": 2001,
    "order_code": "ORD2001",
    "order_status": "pending",
    "product_owner_supplier_id": 1,
    "product_id": 100,
    "product_snapshot": {"name": "ทัวร์ญี่ปุ่น 5 วัน 4 คืน"},
    "product_period_snapshot": {"start_date": "2026-03-01", "end_date": "2026-03-05"},
    "amount": 50000.00,
    "amount_with_discount": 45000.00,
    "use_vat": true,
    "vat_percentage": 7.00,
    "vat": 3150.00,
    "net_amount": 48150.00,
    "commission_company": 5000.00,
    "commission_seller": 2000.00,
    "sum_supplier_order_installment_amount": 40000.00,
    "sum_customer_order_installment_amount": 48150.00,
    "customer_name": "สมชาย ใจดี",
    "customer_phone_number": "0812345678"
  }'
```

### PUT /api/orders
อัพเดทคำสั่งซื้อ

**Required Fields:**
- `id` - Order ID

### DELETE /api/orders
ลบคำสั่งซื้อ (Soft Delete)

**Query Parameters:**
- `id` - Order ID (required)

---

## 3. Installments API

### GET /api/installments
ดึงข้อมูลงวดการชำระเงิน

**Query Parameters:**
- `id` - Installment ID
- `order_id` - Order ID
- `status` - สถานะการชำระ
- `limit` - จำนวนข้อมูลต่อหน้า (default: 100, max: 1000)
- `offset` - เริ่มต้นที่ record ที่เท่าไหร่ (default: 0)

**Example:**
```bash
curl -X GET "http://localhost:3000/api/installments?order_id=1&status=paid" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### POST /api/installments
สร้างงวดการชำระเงินใหม่

**Required Fields:**
- `order_id` - Order ID
- `ordinal` - ลำดับงวด
- `status` - สถานะ
- `amount` - ยอดเงิน

**Example:**
```bash
curl -X POST "http://localhost:3000/api/installments" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "ordinal": 1,
    "status": "pending",
    "due_date": "2026-02-15",
    "amount": 24075.00,
    "payment_is_in_progress": 0
  }'
```

### PUT /api/installments
อัพเดทงวดการชำระเงิน

**Required Fields:**
- `id` - Installment ID

**Example:**
```bash
curl -X PUT "http://localhost:3000/api/installments" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "status": "paid",
    "payment_is_in_progress": 0
  }'
```

### DELETE /api/installments
ลบงวดการชำระเงิน

**Query Parameters:**
- `id` - Installment ID (required)

---

## 4. Suppliers API

### GET /api/suppliers
ดึงข้อมูลซัพพลายเออร์

**Query Parameters:**
- `id` - Supplier ID
- `code` - รหัสซัพพลายเออร์
- `name_en` - ชื่อภาษาอังกฤษ (partial match)
- `name_th` - ชื่อภาษาไทย (partial match)
- `status_code` - รหัสสถานะ
- `limit` - จำนวนข้อมูลต่อหน้า (default: 100, max: 1000)
- `offset` - เริ่มต้นที่ record ที่เท่าไหร่ (default: 0)

**Example:**
```bash
curl -X GET "http://localhost:3000/api/suppliers?name_th=ทัวร์&status_code=1" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### POST /api/suppliers
สร้างซัพพลายเออร์ใหม่

**Example:**
```bash
curl -X POST "http://localhost:3000/api/suppliers" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \
  -H "Content-Type: application/json" \
  -d '{
    "name_en": "Amazing Tours",
    "name_th": "ทัวร์สุดยอด",
    "code": "SUP001",
    "email": "contact@amazingtours.com",
    "tel": "021234567",
    "status_code": 1
  }'
```

### PUT /api/suppliers
อัพเดทซัพพลายเออร์

**Required Fields:**
- `id` - Supplier ID

### DELETE /api/suppliers
ลบซัพพลายเออร์

**Query Parameters:**
- `id` - Supplier ID (required)

---

## 5. Database Tables API

### GET /api/database/tables
ดึงรายการ Tables ทั้งหมดจากทุก Database

**Query Parameters:**
- `database` - กรองตาม Database (TOURWOW, LOCATIONS, SUPPLIERS)
- `include_columns` - แสดงรายละเอียด Columns (`true`/`false`, default: `false`)

**Example:**
```bash
# ดึงทุก tables จากทุก database
curl -X GET "http://localhost:3001/api/database/tables" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# ดึงเฉพาะ TOURWOW database
curl -X GET "http://localhost:3001/api/database/tables?database=TOURWOW" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# ดึงพร้อม column details
curl -X GET "http://localhost:3001/api/database/tables?include_columns=true" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
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
          },
          {
            "table_name": "v_Xqc7k7_customers",
            "table_type": "VIEW",
            "table_rows": null,
            "create_time": "2026-01-01T00:00:00.000Z",
            "update_time": null,
            "table_comment": ""
          }
        ],
        "table_count": 4
      },
      {
        "database": "tw_locations_db_views",
        "prefix": "v_Hdz2WSB_",
        "tables": [...],
        "table_count": 5
      },
      {
        "database": "tw_suppliers_db_views",
        "prefix": "v_GsF2WeS_",
        "tables": [...],
        "table_count": 1
      }
    ],
    "summary": {
      "total_databases": 3,
      "total_tables": 10
    }
  }
}
```

**Response with `include_columns=true`:**
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
                "column_comment": ""
              },
              {
                "column_name": "order_code",
                "data_type": "varchar",
                "column_type": "varchar(50)",
                "is_nullable": true,
                "column_key": null,
                "column_default": null,
                "extra": null,
                "column_comment": ""
              }
            ]
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

**Databases:**
| Database | Prefix | Description |
|----------|--------|-------------|
| `tw_tourwow_db_views` | `v_Xqc7k7_` | ข้อมูล Orders, Customers, Bookings, Installments |
| `tw_locations_db_views` | `v_Hdz2WSB_` | ข้อมูล Locations (Countries, Provinces, etc.) |
| `tw_suppliers_db_views` | `v_GsF2WeS_` | ข้อมูล Suppliers |

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
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

## Testing

### ทดสอบด้วย curl:
```bash
# Test Customers API
curl -X GET "http://localhost:3000/api/customers?limit=5" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# Test Orders API
curl -X GET "http://localhost:3000/api/orders?limit=5" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# Test Installments API
curl -X GET "http://localhost:3000/api/installments?limit=5" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# Test Suppliers API
curl -X GET "http://localhost:3000/api/suppliers?limit=5" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# Test Database Tables API
curl -X GET "http://localhost:3001/api/database/tables" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

### ทดสอบด้วย Postman:
1. สร้าง Collection ใหม่
2. เพิ่ม Header `x-api-key` ใน Collection settings
3. สร้าง Request สำหรับแต่ละ endpoint
4. ทดสอบ GET, POST, PUT, DELETE

---

## Notes

- ทุก API endpoint มี rate limiting 100 requests/minute
- Orders API ใช้ soft delete (ตั้งค่า `deleted_at` แทนการลบจริง)
- Suppliers API อยู่ใน database `tw_suppliers_db`
- ข้อมูล JSON fields (product_snapshot, product_period_snapshot) ต้องเป็น valid JSON
- Timestamps (created_at, updated_at) จะถูกตั้งค่าอัตโนมัติ
