# 🚀 Backend Middleware Guide

## ภาพรวม

Backend Middleware เป็นตัวกลางระหว่าง Frontend กับ NoCodeBackend API ที่จะ:
- ✅ คำนวณ usage statistics อัตโนมัติ
- ✅ รวมข้อมูลจากหลาย tables
- ✅ เพิ่มชื่อประเทศ (country_name)
- ✅ กรองเฉพาะทัวร์ที่ active
- ✅ แก้ปัญหา CORS

## วิธีใช้งาน

### ขั้นตอนที่ 1: รัน Middleware Server

```bash
node proxy-server.js
```

คุณจะเห็น:
```
╔════════════════════════════════════════════════════════╗
║   🚀 Tour Image Manager - Backend Middleware          ║
╚════════════════════════════════════════════════════════╝

📡 Server running on: http://localhost:3000
🔗 Forwarding to: https://api.nocodebackend.com
🔑 API Key: 23233d7b3c86c97bf...

✨ Features:
   • Auto-calculate usage statistics
   • Join data from multiple tables
   • Add country names
   • Filter active tours only

⏳ Waiting for requests...
```

### ขั้นตอนที่ 2: อัพเดท config.js

เปลี่ยน Base URL ใน `config.js`:

```javascript
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000',  // เปลี่ยนตรงนี้
  INSTANCE_ID: '54566_tourwow',
  API_KEY: '23233d7b3c86c97bf30d6ad51bc5072049194d3ed8fcd3a598ea75609e59',
  // ...
};
```

### ขั้นตอนที่ 3: ลบ Mock API

ใน `index.html` ลบบรรทัดนี้:

```html
<script src="mock-api.js"></script>  <!-- ลบบรรทัดนี้ -->
```

### ขั้นตอนที่ 4: ทดสอบ

1. เปิด `http://localhost:8000/index.html`
2. ระบบจะเรียก API ผ่าน Middleware
3. ข้อมูลจะถูกคำนวณอัตโนมัติ

## การทำงาน

### Endpoint: GET /read/images

**Request:**
```
GET http://localhost:3000/read/images?page=1&limit=20
```

**Process:**
1. เรียก `/read/images` จาก NoCodeBackend
2. สำหรับแต่ละรูป:
   - เรียก `/read/tour_images?image_id={id}` - ดึงความสัมพันธ์
   - เรียก `/read/tours?id[in]=...&is_active=1` - กรองทัวร์ที่ active
   - คำนวณ:
     - `usage_count` = จำนวนทัวร์ที่ใช้รูปนี้
     - `banner_first_count` = usage_type='banner' AND sequence=1
     - `banner_other_count` = usage_type='banner' AND sequence>1
     - `tour_detail_count` = usage_type='detail'
   - เรียก `/read/wholesales/{id}` - ดึงชื่อ wholesale
3. เรียก `/read/countries` - ดึงชื่อประเทศ
4. รวมข้อมูลทั้งหมด

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "file_name": "ภูเขาไฟฟูจิ-1",
      "file_path": "https://...",
      "country_id": 1,
      "country_name": "ญี่ปุ่น",
      "updated_at": "2024-11-15T10:30:00Z",
      "usage_count": 10,
      "banner_first_count": 8,
      "banner_other_count": 3,
      "tour_detail_count": 9,
      "programs": [
        {
          "id": 10,
          "code": "XJ295",
          "wholesale": "TTN PLUS",
          "updated_at": "2024-11-20T10:00:00Z",
          "url": "#tour-10"
        }
      ]
    }
  ],
  "total": 20
}
```

### Endpoint: GET /read/countries

**Pass-through** - ส่งต่อไปยัง NoCodeBackend โดยตรง

## ข้อดี

✅ **Frontend ไม่ต้องแก้โค้ด** - ใช้ API เดิมได้เลย
✅ **คำนวณอัตโนมัติ** - ไม่ต้องคำนวณใน Frontend
✅ **แก้ปัญหา CORS** - Middleware รันบน server
✅ **แก้ปัญหา Domain Restriction** - เรียกจาก server ไม่ใช่ browser
✅ **Cache ได้** - เพิ่ม caching ในอนาคต
✅ **Business Logic** - ควบคุม logic ได้ดีกว่า

## ข้อควรระวัง

⚠️ **Performance** - แต่ละรูปต้องเรียก API หลายครั้ง
- แนะนำ: เพิ่ม caching
- แนะนำ: ใช้ pagination (limit ไม่เกิน 20)

⚠️ **Rate Limiting** - NoCodeBackend อาจจำกัดจำนวน requests
- แนะนำ: เพิ่ม delay ระหว่าง requests
- แนะนำ: ใช้ batch requests

## การปรับปรุงในอนาคต

### 1. เพิ่ม Caching
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

### 2. เพิ่ม Batch Processing
```javascript
async function batchCalculateStats(imageIds) {
  // คำนวณหลายรูปพร้อมกัน
}
```

### 3. เพิ่ม Error Handling
```javascript
try {
  // ...
} catch (error) {
  // Fallback to basic data
  return basicImageData;
}
```

### 4. เพิ่ม Logging
```javascript
const winston = require('winston');
logger.info('Calculated stats for image', { imageId, stats });
```

## Troubleshooting

### ปัญหา: Middleware ช้า
**แก้:** เพิ่ม caching หรือลด limit

### ปัญหา: API Error
**แก้:** ตรวจสอบ API Key และ Instance ID

### ปัญหา: CORS Error
**แก้:** ตรวจสอบว่า Middleware รันอยู่หรือไม่

### ปัญหา: ข้อมูลไม่ถูกต้อง
**แก้:** ตรวจสอบ console log ของ Middleware

## Production Deployment

สำหรับ Production แนะนำ:

1. **ใช้ PM2** - จัดการ process
```bash
npm install -g pm2
pm2 start proxy-server.js --name tour-middleware
```

2. **ใช้ Nginx** - Reverse proxy
```nginx
location /api/ {
  proxy_pass http://localhost:3000/;
}
```

3. **ใช้ Environment Variables**
```javascript
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;
```

4. **เพิ่ม Monitoring**
```javascript
const prometheus = require('prom-client');
// Track metrics
```
