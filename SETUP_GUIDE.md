# คู่มือการตั้งค่า NoCode Backend

## 📋 ขั้นตอนการตั้งค่า

### 1. ตรวจสอบข้อมูลจาก NoCode Backend

ไปที่ NoCode Backend ของคุณและหา:

#### A. API Base URL
- ไปที่ Settings → API
- คัดลอก Base URL
- ตัวอย่าง: `https://api.nocodebackend.com/api/v1`

#### B. API Key
- คุณมีแล้ว: `system23233d7b3c86c97bf30d6ad51bc5072049194d3ed8fcd3a598ea75609e59`

#### C. Instance ID
- คุณมีแล้ว: `54566_tourwow`

---

### 2. แก้ไขไฟล์ config.js

เปิดไฟล์ `config.js` และแก้ไข:

```javascript
const CONFIG = {
  // แก้ไข URL นี้ให้ตรงกับ Backend ของคุณ
  API_BASE_URL: 'https://YOUR_BACKEND_URL/api/v1',
  
  // ใช้ค่าเดิม
  INSTANCE_ID: '54566_tourwow',
  API_KEY: 'system23233d7b3c86c97bf30d6ad51bc5072049194d3ed8fcd3a598ea75609e59',
  
  // แก้ไข Endpoints ให้ตรงกับ Backend
  ENDPOINTS: {
    IMAGES: '/images',           // หรือ '/tour_images'
    SEARCH: '/images/search',    // หรือ '/search_images'
    PROGRAMS: '/programs',       // หรือ '/tour_programs'
    WHOLESALES: '/wholesales',
    COUNTRIES: '/countries'
  }
};
```

---

### 3. ตรวจสอบ Database Schema

#### ตาราง: images (หรือ tour_images)
```
id              - Primary Key
name            - ชื่อรูป
url             - URL รูปภาพ
thumbnail       - URL รูปย่อ
country         - ประเทศ
usage_count     - จำนวนรวมใช้ซ้ำ
banner_first_count    - Banner ลำดับที่ 1
banner_other_count    - Banner ลำดับที่ 2 ขึ้นไป
tour_detail_count     - รายละเอียดทัวร์
updated_at      - วันที่อัปเดต
created_at      - วันที่สร้าง
```

#### ตาราง: programs (หรือ tour_programs)
```
id              - Primary Key
code            - รหัสทัวร์ (เช่น XJ295)
wholesale       - Wholesale (เช่น TTN PLUS)
image_id        - Foreign Key → images.id
url             - URL โปรแกรม
updated_at      - วันที่อัปเดต
created_at      - วันที่สร้าง
```

#### ตาราง: wholesales
```
id              - Primary Key
name            - ชื่อ Wholesale
code            - รหัส
```

#### ตาราง: countries
```
id              - Primary Key
name            - ชื่อประเทศ
code            - รหัสประเทศ (เช่น JP, KR, TH)
```

---

### 4. สร้าง API Endpoints ใน NoCode Backend

#### A. Search Images (GET /images/search)
**Parameters:**
- `page` (number) - หน้าที่ต้องการ
- `limit` (number) - จำนวนต่อหน้า
- `wholesale` (string) - กรอง Wholesale
- `country` (string) - กรองประเทศ
- `tourCode` (string) - ค้นหารหัสทัวร์
- `imageName` (string) - ค้นหาชื่อรูป
- `usageCount` (number) - กรองจำนวนใช้ซ้ำ
- `dateRange` (string) - กรองวันที่

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "ภูเขาไฟฟูจิ-1",
      "url": "https://...",
      "thumbnail": "https://...",
      "country": "ญี่ปุ่น",
      "usage_count": 10,
      "banner_first_count": 8,
      "banner_other_count": 3,
      "tour_detail_count": 9,
      "updated_at": "2024-12-03T10:00:00Z",
      "programs": [
        {
          "id": 1,
          "code": "XJ295",
          "wholesale": "TTN PLUS",
          "updated_at": "2024-05-12T10:00:00Z",
          "url": "https://..."
        }
      ]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

#### B. Get All Images (GET /images)
**Parameters:**
- `page` (number)
- `limit` (number)

**Response:** เหมือน Search Images

#### C. Get Image by ID (GET /images/:id)
**Response:**
```json
{
  "id": 1,
  "name": "ภูเขาไฟฟูจิ-1",
  "url": "https://...",
  ...
}
```

#### D. Get Programs by Image ID (GET /images/:id/programs)
**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "code": "XJ295",
      "wholesale": "TTN PLUS",
      ...
    }
  ]
}
```

#### E. Get All Wholesales (GET /wholesales)
**Response:**
```json
{
  "data": [
    { "id": 1, "name": "TTN PLUS", "code": "ttn" },
    { "id": 2, "name": "ZEGO TRAVEL CO.,LTD.", "code": "zego" }
  ]
}
```

#### F. Get All Countries (GET /countries)
**Response:**
```json
{
  "data": [
    { "id": 1, "name": "ญี่ปุ่น", "code": "jp" },
    { "id": 2, "name": "เกาหลี", "code": "kr" },
    { "id": 3, "name": "ไทย", "code": "th" }
  ]
}
```

---

### 5. ทดสอบ API

#### ใช้ Browser Console:
```javascript
// ทดสอบค้นหา
ImageService.searchImages({}, 1, 20)
  .then(data => console.log('Search Results:', data))
  .catch(error => console.error('Error:', error));

// ทดสอบโหลดรูปภาพทั้งหมด
ImageService.getAllImages(1, 20)
  .then(data => console.log('All Images:', data))
  .catch(error => console.error('Error:', error));
```

#### ใช้ Postman หรือ curl:
```bash
# ทดสอบ Search
curl -X GET "https://YOUR_API_URL/images/search?page=1&limit=20" \
  -H "X-API-Key: system23233d7b3c86c97bf30d6ad51bc5072049194d3ed8fcd3a598ea75609e59" \
  -H "X-Instance-ID: 54566_tourwow"
```

---

### 6. แก้ไข DataFormatter (ถ้าจำเป็น)

ถ้า field names ใน database ของคุณต่างจากที่กำหนด แก้ไขใน `api-service.js`:

```javascript
formatImageData(image) {
  return {
    id: image.id || image.image_id,           // ถ้าใช้ชื่อต่าง
    name: image.name || image.image_name,     // ถ้าใช้ชื่อต่าง
    url: image.url || image.image_url,        // ถ้าใช้ชื่อต่าง
    // ... แก้ไขตามชื่อ fields จริง
  };
}
```

---

### 7. Authentication Headers

ถ้า NoCode Backend ของคุณใช้ authentication แบบอื่น แก้ไขใน `config.js`:

```javascript
// ตัวอย่าง: Bearer Token
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${CONFIG.API_KEY}`
}

// ตัวอย่าง: Basic Auth
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Basic ' + btoa(`${username}:${password}`)
}
```

---

### 8. CORS Configuration

ถ้าเจอ CORS error:

1. ไปที่ NoCode Backend Settings
2. เพิ่ม allowed domain: `http://localhost:8080` (สำหรับ development)
3. เพิ่ม allowed domain: `https://your-production-domain.com` (สำหรับ production)

---

## 🔍 Troubleshooting

### ปัญหา: CORS Error
**แก้ไข:** เพิ่ม domain ใน NoCode Backend settings

### ปัญหา: 401 Unauthorized
**แก้ไข:** ตรวจสอบ API Key และ Instance ID

### ปัญหา: 404 Not Found
**แก้ไข:** ตรวจสอบ endpoint URLs ใน config.js

### ปัญหา: Data ไม่แสดง
**แก้ไข:** ตรวจสอบ response format และ DataFormatter

---

## 📞 ต้องการความช่วยเหลือ?

บอกผมว่า:
1. คุณใช้ NoCode Backend อะไร?
2. API Base URL คืออะไร?
3. Database schema เป็นอย่างไร?
4. มี error messages อะไรบ้าง?

ผมจะช่วยตั้งค่าให้เฉพาะเจาะจงครับ! 🚀
