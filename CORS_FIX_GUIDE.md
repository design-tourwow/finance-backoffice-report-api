# CORS Configuration Fix Guide

## ✅ สิ่งที่แก้ไขแล้ว (Updated)

### 1. สร้าง `middleware.js` (✅ ถูกต้อง)
```javascript
// middleware.js - จัดการ CORS แบบ dynamic
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://staging-finance-backoffice-report.vercel.app',
  'https://finance-backoffice-report.vercel.app'
]

export function middleware(request) {
  const origin = request.headers.get('origin')
  
  // ส่งกลับแค่ origin ที่ตรงกับ request
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin) // ✅ ส่งแค่ตัวเดียว
  }
}
```

### 2. ลบ CORS headers ออกจาก `next.config.js`
```javascript
// next.config.js - ให้ middleware จัดการแทน
const nextConfig = {
  // CORS is now handled by middleware.js
}
```

---

## 🔍 ทำไมต้องส่งแค่ origin เดียว?

### ❌ วิธีเดิม (ผิด)
```
Access-Control-Allow-Origin: http://localhost:3000,http://localhost:3001,https://staging-finance-backoffice-report.vercel.app
```
**ปัญหา:** Browser จะ reject เพราะ CORS spec กำหนดว่าต้องส่งแค่ origin เดียว

### ✅ วิธีใหม่ (ถูกต้อง)
```
# Request จาก staging
Origin: https://staging-finance-backoffice-report.vercel.app

# Response ส่งกลับแค่ origin ที่ตรง
Access-Control-Allow-Origin: https://staging-finance-backoffice-report.vercel.app
```

---

## 🚀 การทำงานของ Middleware

```
1. Request มาจาก: https://staging-finance-backoffice-report.vercel.app
   ↓
2. Middleware เช็ค origin header
   ↓
3. ถ้า origin อยู่ใน allowedOrigins
   ↓
4. ส่ง Access-Control-Allow-Origin: https://staging-finance-backoffice-report.vercel.app
   (ส่งแค่ตัวที่ตรงเท่านั้น)
```

---

## ⚠️ สิ่งที่ต้องทำหลัง Deploy

### 1. รอ Vercel Deploy เสร็จ
- Vercel จะ auto-deploy เมื่อ push code
- ใช้เวลาประมาณ 1-2 นาที

### 2. ทดสอบ CORS Headers
```bash
# ทดสอบจาก staging origin
curl -I -X OPTIONS \
  -H "Origin: https://staging-finance-backoffice-report.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: x-api-key" \
  https://staging-finance-backoffice-report-api.vercel.app/api/suppliers

# ควรเห็น (ส่งแค่ origin เดียว):
# Access-Control-Allow-Origin: https://staging-finance-backoffice-report.vercel.app
```

### 3. ทดสอบจาก Front-end
```javascript
// ใน staging front-end
fetch('https://staging-finance-backoffice-report-api.vercel.app/api/suppliers?limit=5', {
  headers: {
    'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
  }
})
.then(res => res.json())
.then(data => console.log('✅ CORS working!', data))
.catch(err => console.error('❌ CORS error:', err))
```

---

## 📊 เปรียบเทียบ

| | ก่อนแก้ไข | หลังแก้ไข |
|---|---|---|
| **วิธีการ** | ส่งหลาย origins พร้อมกัน | ส่งแค่ origin ที่ตรงกับ request |
| **Header** | `Access-Control-Allow-Origin: origin1,origin2,origin3` | `Access-Control-Allow-Origin: origin1` |
| **ผลลัพธ์** | ❌ Browser reject | ✅ Browser accept |
| **ที่จัดการ** | `next.config.js` | `middleware.js` |

---

## 🧪 ทดสอบหลาย Origins

### Request จาก localhost:3000
```bash
curl -I -H "Origin: http://localhost:3000" \
  https://staging-finance-backoffice-report-api.vercel.app/api/health

# Response:
# Access-Control-Allow-Origin: http://localhost:3000
```

### Request จาก staging
```bash
curl -I -H "Origin: https://staging-finance-backoffice-report.vercel.app" \
  https://staging-finance-backoffice-report-api.vercel.app/api/health

# Response:
# Access-Control-Allow-Origin: https://staging-finance-backoffice-report.vercel.app
```

### Request จาก origin ที่ไม่อนุญาต
```bash
curl -I -H "Origin: https://evil-site.com" \
  https://staging-finance-backoffice-report-api.vercel.app/api/health

# Response:
# (ไม่มี Access-Control-Allow-Origin header)
```

---

## 🔧 Troubleshooting

### ถ้ายังเห็น multiple origins
1. **Clear Vercel cache และ redeploy**
   ```bash
   # ใน Vercel Dashboard
   # Deployments → เลือก latest → ... → Redeploy
   ```

2. **เช็คว่า middleware.js ถูก deploy**
   ```bash
   # ดูใน Vercel Dashboard → Deployments → Source
   # ต้องมีไฟล์ middleware.js
   ```

3. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
   - หรือเปิด Incognito mode

### ถ้ายังไม่ได้
ลองเพิ่ม logging ใน middleware:
```javascript
export function middleware(request) {
  const origin = request.headers.get('origin')
  console.log('🔍 Request origin:', origin)
  
  // ... rest of code
}
```

---

## 📝 Files Changed

| File | Status | Description |
|------|--------|-------------|
| `middleware.js` | ✅ Created | จัดการ CORS แบบ dynamic |
| `next.config.js` | ✅ Updated | ลบ CORS headers ออก |
| `.env.local` | ✅ Updated | เพิ่ม allowed origins |

---

## ✅ Checklist

- [x] สร้าง `middleware.js`
- [x] แก้ไข `next.config.js`
- [x] Push code ขึ้น staging
- [ ] รอ Vercel deploy เสร็จ
- [ ] ทดสอบ CORS headers
- [ ] ทดสอบจาก front-end
- [ ] Verify ว่าส่งแค่ origin เดียว

---

**อัพเดทล่าสุด:** 13 มกราคม 2026  
**Status:** ✅ Code แก้ไขถูกต้องแล้ว | ⏳ รอ Vercel deploy
