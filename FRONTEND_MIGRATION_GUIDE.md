# Frontend Migration Guide - Report Endpoints

## 📋 สรุป

Backend ได้สร้าง Report/Summary endpoints ใหม่แล้ว เพื่อให้ Frontend เรียกข้อมูลสรุปได้โดยตรง โดยไม่ต้องดึงข้อมูล orders ทั้งหมดมาคำนวณเอง

**วันที่**: 13 มกราคม 2026  
**Staging URL**: https://staging-finance-backoffice-report-api.vercel.app  
**สถานะ**: ✅ พร้อมใช้งานแล้ว

---

## 🎯 Endpoints ที่สร้างใหม่

| Old Endpoint (ที่ Front เรียกผิด) | New Endpoint (ที่ถูกต้อง) | Status |
|-----------------------------------|---------------------------|--------|
| `/reports/orders/summary` | `/api/reports/summary` | ✅ พร้อมใช้ |
| `/reports/orders/by-country` | `/api/reports/by-country` | ✅ พร้อมใช้ |
| `/reports/orders/by-supplier` | `/api/reports/by-supplier` | ✅ พร้อมใช้ |
| `/reports/orders/by-travel-date` | `/api/reports/by-travel-date` | ✅ พร้อมใช้ |
| `/reports/orders/by-booking-date` | `/api/reports/by-booking-date` | ✅ พร้อมใช้ |
| `/reports/customers/repeat-orders` | `/api/reports/repeat-customers` | ✅ พร้อมใช้ |
| `/countries` | `/api/reports/countries` | ✅ พร้อมใช้ |
| `/suppliers` | `/api/suppliers` | ✅ มีอยู่แล้ว |

---

## 🔄 การ Migrate

### 1. สรุปภาพรวม Orders

**เดิม (ผิด)**:
```javascript
// ❌ Endpoint นี้ไม่มี
fetch('/reports/orders/summary')
```

**ใหม่ (ถูกต้อง)**:
```javascript
// ✅ ใช้ endpoint นี้แทน
const response = await fetch(
  'https://staging-finance-backoffice-report-api.vercel.app/api/reports/summary',
  {
    headers: {
      'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
    }
  }
)

const data = await response.json()
// {
//   "success": true,
//   "data": {
//     "total_orders": 872,
//     "total_customers": 128,
//     "total_net_amount": 90360314,
//     "avg_net_amount": 103624.213302752
//   }
// }
```

---

### 2. รายงานตามประเทศ

**เดิม (ผิด)**:
```javascript
// ❌ Endpoint นี้ไม่มี
fetch('/reports/orders/by-country')
```

**ใหม่ (ถูกต้อง)**:
```javascript
// ✅ ใช้ endpoint นี้แทน
const response = await fetch(
  'https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-country',
  {
    headers: {
      'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
    }
  }
)

const data = await response.json()
// {
//   "success": true,
//   "data": [
//     {
//       "country_id": 7,
//       "country_name": "ญี่ปุ่น",
//       "total_orders": 459,
//       "total_customers": 102,
//       "total_net_amount": 56800237,
//       "avg_net_amount": 123747.793028322
//     }
//   ]
// }
```

---

### 3. รายงานตาม Supplier

**เดิม (ผิด)**:
```javascript
// ❌ Endpoint นี้ไม่มี
fetch('/reports/orders/by-supplier')
```

**ใหม่ (ถูกต้อง)**:
```javascript
// ✅ ใช้ endpoint นี้แทน
const response = await fetch(
  'https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-supplier',
  {
    headers: {
      'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
    }
  }
)

const data = await response.json()
// {
//   "success": true,
//   "data": [
//     {
//       "supplier_id": 46,
//       "supplier_name": "บริษัท โปร บุ๊คกิ้ง เซนเตอร์ จำกัด",
//       "total_orders": 231,
//       "total_customers": 76,
//       "total_net_amount": 13709510,
//       "avg_net_amount": 59348.528138528
//     }
//   ]
// }
```

---

### 4. รายงานตามเดือนเดินทาง

**เดิม (ผิด)**:
```javascript
// ❌ Endpoint นี้ไม่มี
fetch('/reports/orders/by-travel-date')
```

**ใหม่ (ถูกต้อง)**:
```javascript
// ✅ ใช้ endpoint นี้แทน
const response = await fetch(
  'https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-travel-date',
  {
    headers: {
      'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
    }
  }
)

const data = await response.json()
// {
//   "success": true,
//   "data": [
//     {
//       "travel_month": "2025-01",
//       "travel_month_label": "มกราคม 2025",
//       "total_orders": 15,
//       "total_customers": 10,
//       "total_net_amount": 970973
//     }
//   ]
// }
```

---

### 5. รายงานตามเดือนจอง

**เดิม (ผิด)**:
```javascript
// ❌ Endpoint นี้ไม่มี
fetch('/reports/orders/by-booking-date')
```

**ใหม่ (ถูกต้อง)**:
```javascript
// ✅ ใช้ endpoint นี้แทน
const response = await fetch(
  'https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-booking-date',
  {
    headers: {
      'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
    }
  }
)

const data = await response.json()
// {
//   "success": true,
//   "data": [
//     {
//       "booking_month": "2024-12",
//       "booking_month_label": "ธันวาคม 2024",
//       "total_orders": 26,
//       "total_customers": 14,
//       "total_net_amount": 1589499
//     }
//   ]
// }
```

---

### 6. ลูกค้าซื้อซ้ำ

**เดิม (ผิด)**:
```javascript
// ❌ Endpoint นี้ไม่มี
fetch('/reports/customers/repeat-orders')
```

**ใหม่ (ถูกต้อง)**:
```javascript
// ✅ ใช้ endpoint นี้แทน
const response = await fetch(
  'https://staging-finance-backoffice-report-api.vercel.app/api/reports/repeat-customers',
  {
    headers: {
      'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
    }
  }
)

const data = await response.json()
// {
//   "success": true,
//   "data": [
//     {
//       "customer_id": 6,
//       "customer_code": "CUS240200004",
//       "customer_name": "supasit",
//       "phone_number": "0844665515",
//       "total_orders": 18,
//       "countries": "ญี่ปุ่น, ฝรั่งเศส, เกาหลีใต้, เยอรมัน",
//       "total_spent": 2471292
//     }
//   ]
// }
```

---

### 7. รายการประเทศ (สำหรับ dropdown)

**เดิม (ผิด)**:
```javascript
// ❌ Endpoint นี้ไม่มี
fetch('/countries')
```

**ใหม่ (ถูกต้อง)**:
```javascript
// ✅ ใช้ endpoint นี้แทน
const response = await fetch(
  'https://staging-finance-backoffice-report-api.vercel.app/api/reports/countries',
  {
    headers: {
      'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
    }
  }
)

const data = await response.json()
// {
//   "success": true,
//   "data": [
//     {
//       "id": 7,
//       "name_th": "ญี่ปุ่น",
//       "name_en": "Japan"
//     }
//   ]
// }
```

---

### 8. รายการ Suppliers (มีอยู่แล้ว)

**ใช้ได้เลย**:
```javascript
// ✅ Endpoint นี้มีอยู่แล้ว
const response = await fetch(
  'https://staging-finance-backoffice-report-api.vercel.app/api/suppliers',
  {
    headers: {
      'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
    }
  }
)

const data = await response.json()
// {
//   "success": true,
//   "data": [
//     {
//       "id": 75,
//       "name_en": "SABAY DE TOUR",
//       "name_th": "สบายดรทัวร์",
//       ...
//     }
//   ]
// }
```

---

## 🔍 Query Parameters (Filters)

ทุก report endpoint (ยกเว้น `/countries`) รองรับ filters:

```javascript
const params = new URLSearchParams({
  travel_date_from: '2025-01-01',    // วันเดินทางเริ่มต้น
  travel_date_to: '2025-12-31',      // วันเดินทางสิ้นสุด
  booking_date_from: '2024-01-01',   // วันจองเริ่มต้น
  booking_date_to: '2024-12-31',     // วันจองสิ้นสุด
  country_id: '7',                   // Filter ตามประเทศ (ญี่ปุ่น)
  supplier_id: '46'                  // Filter ตาม Supplier
})

const response = await fetch(
  `https://staging-finance-backoffice-report-api.vercel.app/api/reports/summary?${params}`,
  {
    headers: {
      'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
    }
  }
)
```

---

## 💡 ตัวอย่าง React Component

```typescript
import { useState, useEffect } from 'react'

const API_BASE_URL = 'https://staging-finance-backoffice-report-api.vercel.app'
const API_KEY = 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'

interface OrderSummary {
  total_orders: number
  total_customers: number
  total_net_amount: number
  avg_net_amount: number
}

export function OrderSummaryCard() {
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports/summary`, {
          headers: {
            'x-api-key': API_KEY
          }
        })
        
        const data = await response.json()
        
        if (data.success) {
          setSummary(data.data)
        }
      } catch (error) {
        console.error('Error fetching summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="card">
        <h3>Total Orders</h3>
        <p className="text-2xl">{summary?.total_orders.toLocaleString()}</p>
      </div>
      <div className="card">
        <h3>Total Customers</h3>
        <p className="text-2xl">{summary?.total_customers.toLocaleString()}</p>
      </div>
      <div className="card">
        <h3>Total Revenue</h3>
        <p className="text-2xl">฿{summary?.total_net_amount.toLocaleString()}</p>
      </div>
      <div className="card">
        <h3>Average Order</h3>
        <p className="text-2xl">฿{summary?.avg_net_amount.toLocaleString()}</p>
      </div>
    </div>
  )
}
```

---

## 🔐 Authentication

ทุก request ต้องส่ง API key ผ่าน header:

```javascript
headers: {
  'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
}
```

หรือ

```javascript
headers: {
  'Authorization': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
}
```

---

## ⚠️ สิ่งที่ต้องเปลี่ยน

### ❌ อย่าทำแบบนี้อีก:
```javascript
// ดึง orders ทั้งหมดมาคำนวณเอง
const orders = await fetch('/api/orders?limit=10000')
const total = orders.data.reduce((sum, order) => sum + order.net_amount, 0)
```

### ✅ ทำแบบนี้แทน:
```javascript
// เรียก report endpoint โดยตรง
const summary = await fetch('/api/reports/summary')
const total = summary.data.total_net_amount
```

**ข้อดี**:
- ⚡ เร็วกว่า (ไม่ต้องดึงข้อมูลทั้งหมด)
- 💾 ประหยัด bandwidth
- 🎯 ได้ข้อมูลที่ต้องการเลย
- 📊 Backend คำนวณให้แล้ว (ถูกต้องแน่นอน)

---

## 📝 Checklist สำหรับ Frontend

- [ ] เปลี่ยน endpoint จาก `/reports/orders/summary` เป็น `/api/reports/summary`
- [ ] เปลี่ยน endpoint จาก `/reports/orders/by-country` เป็น `/api/reports/by-country`
- [ ] เปลี่ยน endpoint จาก `/reports/orders/by-supplier` เป็น `/api/reports/by-supplier`
- [ ] เปลี่ยน endpoint จาก `/reports/orders/by-travel-date` เป็น `/api/reports/by-travel-date`
- [ ] เปลี่ยน endpoint จาก `/reports/orders/by-booking-date` เป็น `/api/reports/by-booking-date`
- [ ] เปลี่ยน endpoint จาก `/reports/customers/repeat-orders` เป็น `/api/reports/repeat-customers`
- [ ] เปลี่ยน endpoint จาก `/countries` เป็น `/api/reports/countries`
- [ ] เพิ่ม `x-api-key` header ในทุก request
- [ ] ทดสอบ filters (travel_date, booking_date, country_id, supplier_id)
- [ ] ลบโค้ดที่ดึง orders ทั้งหมดมาคำนวณเอง

---

## 🧪 ทดสอบ

### Test บน Staging:
```bash
# 1. Summary
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/summary" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# 2. By Country
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/by-country" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# 3. Countries List
curl "https://staging-finance-backoffice-report-api.vercel.app/api/reports/countries" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

---

## 📚 เอกสารเพิ่มเติม

- [REPORT_ENDPOINTS.md](./REPORT_ENDPOINTS.md) - เอกสารครบถ้วนของทุก endpoint
- [API_MAPPING_GUIDE.md](./API_MAPPING_GUIDE.md) - คู่มือ mapping endpoints เดิมกับใหม่

---

**สรุป**: Backend ได้สร้าง endpoints ครบถ้วนตามที่ Frontend ต้องการแล้ว พร้อมใช้งานบน staging ได้เลย! 🎉

