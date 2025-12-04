# 📊 Database Structure - Tour Image Manager

## ปัญหาที่พบ

UI ต้องการแสดงข้อมูล:
- รวมใช้ซ้ำ (usage_count)
- Banner ลำดับที่ 1 (banner_first_count)
- Banner ลำดับที่ 2 ขึ้นไป (banner_other_count)
- รายละเอียดทัวร์ (tour_detail_count)

แต่ API ไม่มีฟิลด์เหล่านี้ใน table `images`

## โครงสร้างฐานข้อมูลจริง

### Table: images
```json
{
  "id": 1,
  "file_name": "ภูเขาไฟฟูจิ-1",
  "file_path": "https://...",
  "country_id": 1,
  "updated_at": "2024-11-15T10:30:00Z"
}
```

### Table: tour_images (ความสัมพันธ์)
```json
{
  "id": 1,
  "tour_id": 10,
  "image_id": 1,
  "usage_type": "banner",  // "banner" หรือ "detail"
  "sequence": 1            // ลำดับที่ (1 = banner แรก, 2+ = banner อื่นๆ)
}
```

### Table: tours
```json
{
  "id": 10,
  "code": "XJ295",
  "wholesale_id": 1,
  "is_active": 1,
  "updated_at": "2024-11-20T10:00:00Z"
}
```

### Table: wholesales
```json
{
  "id": 1,
  "name": "TTN PLUS"
}
```

## วิธีคำนวณข้อมูลที่ต้องการ

### 1. รวมใช้ซ้ำ (usage_count)
```sql
SELECT COUNT(*) 
FROM tour_images 
WHERE image_id = 1 
  AND tour_id IN (SELECT id FROM tours WHERE is_active = 1)
```

### 2. Banner ลำดับที่ 1 (banner_first_count)
```sql
SELECT COUNT(*) 
FROM tour_images 
WHERE image_id = 1 
  AND usage_type = 'banner' 
  AND sequence = 1
  AND tour_id IN (SELECT id FROM tours WHERE is_active = 1)
```

### 3. Banner ลำดับที่ 2 ขึ้นไป (banner_other_count)
```sql
SELECT COUNT(*) 
FROM tour_images 
WHERE image_id = 1 
  AND usage_type = 'banner' 
  AND sequence > 1
  AND tour_id IN (SELECT id FROM tours WHERE is_active = 1)
```

### 4. รายละเอียดทัวร์ (tour_detail_count)
```sql
SELECT COUNT(*) 
FROM tour_images 
WHERE image_id = 1 
  AND usage_type = 'detail'
  AND tour_id IN (SELECT id FROM tours WHERE is_active = 1)
```

## วิธีแก้ไข

### ทางเลือกที่ 1: ใช้ JOIN Endpoint (แนะนำ)
```
GET /read/join/tourpackages_tourschedules_join?Instance=54566_tourwow
```

แต่ต้องสร้าง JOIN configuration ใน NoCodeBackend ก่อน

### ทางเลือกที่ 2: Query หลายครั้ง
1. GET `/read/images` - ดึงรูปภาพทั้งหมด
2. สำหรับแต่ละรูป:
   - GET `/read/tour_images?image_id={id}&usage_type=banner&sequence=1` - นับ banner แรก
   - GET `/read/tour_images?image_id={id}&usage_type=banner&sequence[gt]=1` - นับ banner อื่นๆ
   - GET `/read/tour_images?image_id={id}&usage_type=detail` - นับรายละเอียด
3. รวมผลลัพธ์

### ทางเลือกที่ 3: สร้าง View/Stored Procedure ใน NoCodeBackend
สร้าง view ที่คำนวณข้อมูลไว้แล้ว

### ทางเลือกที่ 4: ใช้ Backend Middleware (แนะนำสำหรับ Production)
สร้าง API ตัวกลางที่:
1. เรียก NoCodeBackend API
2. คำนวณข้อมูลที่ต้องการ
3. ส่งกลับไปยัง Frontend

## สรุป

**ปัจจุบัน:** ใช้ Mock Data ที่มีฟิลด์ครบ ✅

**เมื่อเชื่อม API จริง:** ต้องเลือกวิธีใดวิธีหนึ่งข้างบน

**แนะนำ:** ใช้ Backend Middleware (proxy-server.js) เพื่อ:
- คำนวณข้อ��ูลที่ต้องการ
- Cache ผลลัพธ์
- ลด API calls
- ควบคุม business logic ได้ดีกว่า
