# API Endpoints Mapping Guide

## ปัญหา
ฝั่ง Front-end กำลังเรียก API endpoints ที่ยังไม่มีอยู่จริงในระบบ

---

## 📋 เปรียบเทียบ Endpoints

### ❌ Endpoints ที่ Front-end เรียก (ยังไม่มี)

```
/reports/orders/summary
/reports/orders/by-country
/reports/orders/by-supplier
/reports/orders/by-travel-date
/reports/orders/by-booking-date
/reports/customers/repeat-orders
/countries
/suppliers
```

### ✅ Endpoints ที่มีอยู่จริง

```
/api/health
/api/bookings
/api/customers
/api/orders
/api/installments
/api/suppliers
/api/users
/api/chat-history
/api/auth/check
/api/auth/login
/api/auth/logout
```

---

## 🔄 แนวทางแก้ไข

### วิธีที่ 1: แก้ไข Front-end ให้เรียก Endpoints ที่ถูกต้อง

| Front-end เรียก | แก้เป็น | คำอธิบาย |
|----------------|---------|----------|
| `/suppliers` | `/api/suppliers` | ดึงรายการ suppliers ทั้งหมด |
| `/countries` | ❌ ยังไม่มี | ต้องสร้าง endpoint ใหม่ |
| `/reports/orders/summary` | ใช้ `/api/orders` + คำนวณฝั่ง front | ดึง orders แล้วคำนวณ summary |
| `/reports/orders/by-supplier` | `/api/orders?supplier_id=X` | Filter orders ตาม supplier |
| `/reports/customers/repeat-orders` | `/api/customers` + `/api/orders` | Query 2 endpoints แล้ว merge |

### วิธีที่ 2: สร้าง Endpoints ใหม่ตามที่ Front-end ต้องการ

ต้องสร้าง endpoints เหล่านี้:

1. **GET /api/reports/orders/summary**
   - สรุปยอด orders ทั้งหมด
   - Response: `{ total_orders, total_amount, avg_amount, ... }`

2. **GET /api/reports/orders/by-country**
   - รายงาน orders แยกตามประเทศ
   - Response: `[{ country, order_count, total_amount }, ...]`

3. **GET /api/reports/orders/by-supplier**
   - รายงาน orders แยกตาม supplier
   - Response: `[{ supplier_id, supplier_name, order_count, total_amount }, ...]`

4. **GET /api/reports/orders/by-travel-date**
   - รายงาน orders แยกตามวันเดินทาง
   - Response: `[{ travel_date, order_count, total_amount }, ...]`

5. **GET /api/reports/orders/by-booking-date**
   - รายงาน orders แยกตามวันจอง
   - Response: `[{ booking_date, order_count, total_amount }, ...]`

6. **GET /api/reports/customers/repeat-orders**
   - รายการลูกค้าที่ซื้อซ้ำ
   - Response: `[{ customer_id, customer_name, order_count, total_spent }, ...]`

7. **GET /api/countries**
   - รายการประเทศทั้งหมด
   - Response: `[{ id, name, code }, ...]`

---

## 📝 แนะนำ: ใช้ Endpoints ที่มีอยู่แล้ว

### 1. ดึงรายการ Suppliers
```bash
# ❌ เดิม
GET /suppliers

# ✅ แก้เป็น
GET /api/suppliers?limit=1000
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 75,
      "name_th": "สบายดรทัวร์",
      "name_en": "Sabaidee Tour",
      "code": "SUP001",
      ...
    }
  ]
}
```

### 2. สรุปยอด Orders (คำนวณฝั่ง Front)
```bash
# ❌ เดิม
GET /reports/orders/summary

# ✅ แก้เป็น
GET /api/orders?limit=1000
# จากนั้นคำนวณ summary ฝั่ง front-end
```

**ตัวอย่างการคำนวณ:**
```javascript
const response = await fetch('/api/orders?limit=1000')
const { data } = await response.json()

const summary = {
  total_orders: data.length,
  total_amount: data.reduce((sum, order) => sum + parseFloat(order.net_amount), 0),
  avg_amount: data.reduce((sum, order) => sum + parseFloat(order.net_amount), 0) / data.length,
  pending_orders: data.filter(o => o.order_status === 'pending').length,
  approved_orders: data.filter(o => o.order_status === 'approved').length
}
```

### 3. Orders แยกตาม Supplier
```bash
# ❌ เดิม
GET /reports/orders/by-supplier

# ✅ แก้เป็น (ถ้าต้องการ supplier เดียว)
GET /api/orders?supplier_id=75&limit=1000

# หรือดึงทั้งหมดแล้ว group ฝั่ง front
GET /api/orders?limit=1000
```

**ตัวอย่างการ group:**
```javascript
const response = await fetch('/api/orders?limit=1000')
const { data } = await response.json()

const bySupplier = data.reduce((acc, order) => {
  const supplierId = order.product_owner_supplier_id
  if (!acc[supplierId]) {
    acc[supplierId] = {
      supplier_id: supplierId,
      orders: [],
      total_amount: 0
    }
  }
  acc[supplierId].orders.push(order)
  acc[supplierId].total_amount += parseFloat(order.net_amount)
  return acc
}, {})
```

### 4. ลูกค้าซื้อซ้ำ
```bash
# ❌ เดิม
GET /reports/customers/repeat-orders

# ✅ แก้เป็น (ดึง 2 endpoints)
GET /api/customers?limit=1000
GET /api/orders?limit=1000
# จากนั้น merge และ filter ลูกค้าที่มี order > 1
```

**ตัวอย่างการ merge:**
```javascript
const [customersRes, ordersRes] = await Promise.all([
  fetch('/api/customers?limit=1000'),
  fetch('/api/orders?limit=1000')
])

const customers = (await customersRes.json()).data
const orders = (await ordersRes.json()).data

const repeatCustomers = customers.map(customer => {
  const customerOrders = orders.filter(o => o.customer_id === customer.id)
  return {
    ...customer,
    order_count: customerOrders.length,
    total_spent: customerOrders.reduce((sum, o) => sum + parseFloat(o.net_amount), 0)
  }
}).filter(c => c.order_count > 1)
```

---

## 🚀 Quick Fix สำหรับ Front-end

### ไฟล์ที่ต้องแก้ (ตัวอย่าง)

```javascript
// ❌ เดิม
const suppliers = await fetch('/suppliers')

// ✅ แก้เป็น
const response = await fetch('/api/suppliers?limit=1000', {
  headers: {
    'x-api-key': 'YOUR_API_KEY'
  }
})
const { data: suppliers } = await response.json()
```

```javascript
// ❌ เดิม
const summary = await fetch('/reports/orders/summary')

// ✅ แก้เป็น
const response = await fetch('/api/orders?limit=1000', {
  headers: {
    'x-api-key': 'YOUR_API_KEY'
  }
})
const { data: orders } = await response.json()

// คำนวณ summary
const summary = {
  total_orders: orders.length,
  total_amount: orders.reduce((sum, o) => sum + parseFloat(o.net_amount), 0),
  pending: orders.filter(o => o.order_status === 'pending').length,
  approved: orders.filter(o => o.order_status === 'approved').length
}
```

---

## 📊 ตาราง Mapping แบบเต็ม

| Front-end Endpoint | Status | Backend Endpoint | วิธีใช้ |
|-------------------|--------|------------------|---------|
| `/suppliers` | ❌ | `/api/suppliers` | เปลี่ยน path + เพิ่ม API key |
| `/countries` | ❌ | ยังไม่มี | ต้องสร้างใหม่ หรือ hardcode ฝั่ง front |
| `/reports/orders/summary` | ❌ | `/api/orders` | ดึงทั้งหมดแล้วคำนวณ |
| `/reports/orders/by-country` | ❌ | `/api/orders` | ดึงทั้งหมดแล้ว group by country |
| `/reports/orders/by-supplier` | ❌ | `/api/orders` | ดึงทั้งหมดแล้ว group by supplier |
| `/reports/orders/by-travel-date` | ❌ | `/api/orders` | ดึงทั้งหมดแล้ว group by travel date |
| `/reports/orders/by-booking-date` | ❌ | `/api/orders` | ดึงทั้งหมดแล้ว group by created_at |
| `/reports/customers/repeat-orders` | ❌ | `/api/customers` + `/api/orders` | Merge 2 endpoints |

---

## ⚠️ สิ่งที่ต้องทำ

### ทางเลือก A: แก้ Front-end (แนะนำ - เร็วกว่า)
1. เปลี่ยน endpoint paths ทั้งหมดจาก `/xxx` เป็น `/api/xxx`
2. เพิ่ม header `x-api-key` ในทุก request
3. ปรับ response handling เพราะ format เปลี่ยน
4. เพิ่ม logic คำนวณ summary/reports ฝั่ง front

### ทางเลือก B: สร้าง Backend Endpoints ใหม่
1. สร้าง `/api/reports/orders/summary`
2. สร้าง `/api/reports/orders/by-country`
3. สร้าง `/api/reports/orders/by-supplier`
4. สร้าง `/api/reports/orders/by-travel-date`
5. สร้าง `/api/reports/orders/by-booking-date`
6. สร้าง `/api/reports/customers/repeat-orders`
7. สร้าง `/api/countries`

---

## 📞 ติดต่อ

หากต้องการให้สร้าง endpoints ใหม่ตามที่ front-end ต้องการ กรุณาแจ้ง:
1. Endpoint ไหนที่ต้องการ
2. Response format ที่ต้องการ
3. Query parameters ที่ต้องการ

---

**สร้างเมื่อ:** 13 มกราคม 2026  
**สถานะ:** ✅ Endpoints พื้นฐานพร้อมใช้งาน | ⚠️ Reports endpoints ยังไม่มี
