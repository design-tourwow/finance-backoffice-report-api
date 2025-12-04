# คู่มือตั้งค่า NoCodeBackend.com

## 🔍 ขั้นตอนที่ 1: หาข้อมูลจาก NoCodeBackend.com

### 1.1 เข้าสู่ระบบ
1. ไปที่ https://app.nocodebackend.com/
2. Login เข้าสู่ระบบ
3. เลือก Instance: **54566_tourwow**

### 1.2 หา API Base URL
1. ไปที่เมนู **"Settings"** หรือ **"API"**
2. หา **"API Endpoint"** หรือ **"Base URL"**
3. คัดลอก URL (น่าจะเป็นรูปแบบนี้):
   ```
   https://api.nocodebackend.com/database/54566_tourwow
   ```
   หรือ
   ```
   https://54566-tourwow.nocodebackend.com/api
   ```

### 1.3 ตรวจสอบ API Key
- คุณมี API Key แล้ว: `system23233d7b3c86c97bf30d6ad51bc5072049194d3ed8fcd3a598ea75609e59`
- ตรวจสอบว่า Key นี้ยังใช้งานได้อยู่หรือไม่

### 1.4 ดู Database Tables
1. ไปที่เมนู **"Database"** หรือ **"Tables"**
2. บันทึกชื่อ tables ที่มี:
   - [ ] `images` หรือ `tour_images` หรือ `_____`
   - [ ] `programs` หรือ `tour_programs` หรือ `_____`
   - [ ] `wholesales` หรือ `_____`
   - [ ] `countries` หรือ `_____`

### 1.5 ดู Table Schema
สำหรับแต่ละ table ให้ดู columns/fields:

#### Table: images (หรือชื่ออื่น)
```
- id
- name
- url
- thumbnail
- country
- usage_count
- banner_first_count
- banner_other_count
- tour_detail_count
- updated_at
- created_at
```

---

## ⚙️ ขั้นตอนที่ 2: แก้ไขไฟล์ config.js

### 2.1 เปิดไฟล์ `config.js`

### 2.2 แก้ไข API_BASE_URL
```javascript
// แทนที่ URL นี้ด้วย URL ที่ได้จาก NoCodeBackend
API_BASE_URL: 'https://api.nocodebackend.com/database/54566_tourwow',
```

### 2.3 แก้ไข ENDPOINTS (ถ้าชื่อ table ต่าง)
```javascript
ENDPOINTS: {
  IMAGES: '/images',        // แก้เป็นชื่อ table จริง
  SEARCH: '/images',        // แก้เป็นชื่อ table จริง
  PROGRAMS: '/programs',    // แก้เป็นชื่อ table จริง
  WHOLESALES: '/wholesales',
  COUNTRIES: '/countries'
}
```

---

## 🧪 ขั้นตอนที่ 3: ทดสอบ API

### 3.1 ทดสอบด้วย Browser Console

1. เปิดหน้าเว็บ (http://localhost:8080)
2. กด F12 เปิด Developer Tools
3. ไปที่ tab **Console**
4. รันคำสั่งนี้:

```javascript
// ทดสอบโหลดรูปภาพทั้งหมด
ImageService.getAllImages(1, 20)
  .then(data => {
    console.log('✅ Success! Data:', data);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
```

### 3.2 ดูผลลัพธ์

#### ✅ ถ้าสำเร็จ:
```javascript
{
  data: [...],
  total: 100,
  page: 1,
  limit: 20
}
```

#### ❌ ถ้าเจอ Error:

**Error: CORS**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**แก้ไข:** ไปที่ NoCodeBackend Settings → เพิ่ม `http://localhost:8080` ใน Allowed Origins

**Error: 401 Unauthorized**
```
HTTP error! status: 401
```
**แก้ไข:** ตรวจสอบ API Key ใน config.js

**Error: 404 Not Found**
```
HTTP error! status: 404
```
**แก้ไข:** ตรวจสอบ API_BASE_URL และ ENDPOINTS

---

## 🔧 ขั้นตอนที่ 4: ปรับแต่ง (ถ้าจำเป็น)

### 4.1 ถ้า Field Names ต่าง

แก้ไขใน `api-service.js` → `DataFormatter.formatImageData()`:

```javascript
formatImageData(image) {
  return {
    id: image.id || image._id,                    // ถ้าใช้ _id
    name: image.name || image.image_name,         // ถ้าใช้ image_name
    url: image.url || image.image_url,            // ถ้าใช้ image_url
    thumbnail: image.thumbnail || image.thumb,    // ถ้าใช้ thumb
    country: image.country || image.country_name, // ถ้าใช้ country_name
    usageCount: image.usage_count || image.total_usage || 0,
    // ... แก้ไขตามชื่อ fields จริง
  };
}
```

### 4.2 ถ้า Response Format ต่าง

NoCodeBackend อาจ return format แบบนี้:
```javascript
{
  "items": [...],      // แทน "data"
  "count": 100,        // แทน "total"
  "page": 1,
  "pageSize": 20       // แทน "limit"
}
```

แก้ไขใน `api-service.js`:
```javascript
async getAllImages(page = 1, limit = 20) {
  try {
    const response = await API.get(CONFIG.ENDPOINTS.IMAGES, { page, limit });
    
    // แปลง format ให้ตรงกับที่ใช้
    return {
      data: response.items || response.data || [],
      total: response.count || response.total || 0,
      page: response.page || page,
      limit: response.pageSize || response.limit || limit
    };
  } catch (error) {
    console.error('Get All Images Error:', error);
    throw new Error('ไม่สามารถโหลดรูปภาพได้');
  }
}
```

---

## 📝 ขั้นตอนที่ 5: ตั้งค่า CORS (ถ้าจำเป็น)

### 5.1 ใน NoCodeBackend.com
1. ไปที่ **Settings** → **API** → **CORS**
2. เพิ่ม Allowed Origins:
   ```
   http://localhost:8080
   http://127.0.0.1:8080
   ```
3. เพิ่ม Allowed Methods:
   ```
   GET, POST, PUT, DELETE, OPTIONS
   ```
4. เพิ่ม Allowed Headers:
   ```
   Content-Type, Authorization, X-Instance-ID
   ```

---

## 🎯 ขั้นตอนที่ 6: ทดสอบการค้นหา

### 6.1 ทดสอบ Search Function

```javascript
// ทดสอบค้นหาด้วย filters
ImageService.searchImages({
  country: 'ญี่ปุ่น',
  wholesale: 'TTN PLUS'
}, 1, 20)
  .then(data => {
    console.log('Search Results:', data);
  })
  .catch(error => {
    console.error('Search Error:', error);
  });
```

### 6.2 ทดสอบผ่าน UI
1. กรอกข้อมูลในฟอร์มค้นหา
2. กดปุ่ม "ค้นหา"
3. ดูผลลัพธ์

---

## 🐛 Troubleshooting

### ปัญหา: ไม่มีข้อมูลแสดง
1. เช็ค Console (F12) ดู error messages
2. เช็คว่า API return ข้อมูลหรือไม่
3. เช็ค DataFormatter ว่าแปลงข้อมูลถูกต้องหรือไม่

### ปัญหา: CORS Error
1. เพิ่ม domain ใน NoCodeBackend CORS settings
2. ลอง disable browser CORS (สำหรับ development)
3. ใช้ proxy server

### ปัญหา: 401 Error
1. เช็ค API Key ถูกต้องหรือไม่
2. เช็ค Authorization header format
3. เช็คว่า API Key ยังใช้งานได้หรือไม่

---

## 📞 ต้องการความช่วยเหลือ?

ส่งข้อมูลเหล่านี้มาให้ผม:

1. **API Base URL** จาก NoCodeBackend
2. **ชื่อ Tables** ที่มีในฐานข้อมูล
3. **Field Names** ของแต่ละ table
4. **Error Messages** (ถ้ามี)
5. **Screenshot** จาก Console (F12)

ผมจะช่วยแก้ไขให้เฉพาะเจาะจงครับ! 🚀

---

## ✅ Checklist

- [ ] หา API Base URL แล้ว
- [ ] ตรวจสอบ API Key แล้ว
- [ ] ดูชื่อ Tables แล้ว
- [ ] แก้ไข config.js แล้ว
- [ ] ทดสอบ API ใน Console แล้ว
- [ ] ตั้งค่า CORS แล้ว (ถ้าจำเป็น)
- [ ] ทดสอบการค้นหาแล้ว
- [ ] ระบบทำงานได้แล้ว ✨
