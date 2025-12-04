# Finance Backoffice - Tour Image Manager (Backend)

Python scripts สำหรับจัดการข้อมูลใน NoCodeBackend database

## 🚀 Features

- ✅ Seed data script - สร้างข้อมูลตัวอย่าง 50 รายการ
- ✅ Fetch images script - ดึงข้อมูลจาก API
- ✅ Unsplash API integration - ดึงรูปภาพคุณภาพสูง
- ✅ Automatic data generation - สร้างข้อมูลแบบสุ่ม

## 📁 Project Structure

```
finance-backoffice-back-end/
├── seed_data.py           # Script สำหรับ seed ข้อมูล
├── fetch_images.py        # Script สำหรับดึงรูปภาพ
├── requirements.txt       # Python dependencies
└── README.md             # Documentation
```

## 🛠️ Setup

### 1. Clone Repository

```bash
git clone https://github.com/design-tourwow/finance-backoffice-back-end.git
cd finance-backoffice-back-end
```

### 2. Install Dependencies

```bash
pip install requests
```

หรือใช้ requirements.txt:

```bash
pip install -r requirements.txt
```

### 3. Configure API Keys

แก้ไขไฟล์ Python scripts:

**seed_data.py:**
```python
API_KEY = "your_nocodebackend_api_key"
INSTANCE_ID = "your_instance_id"
```

**fetch_images.py:**
```python
UNSPLASH_ACCESS_KEY = "your_unsplash_access_key"
```

## 📝 Usage

### Seed Data Script

สร้างข้อมูลตัวอย่าง 50 รายการ:

```bash
python seed_data.py
```

Script จะสร้างข้อมูล:
- 50 รายการรูปภาพ
- ประเทศต่างๆ (ญี่ปุ่น, เกาหลี, จีน, ไต้หวัน, ฯลฯ)
- Wholesale: TTN PLUS และ ZEGO TRAVEL
- รูปภาพจาก Unsplash
- ข้อมูลการใช้งานแบบสุ่ม

### Fetch Images Script

ดึงรูปภาพจาก Unsplash:

```bash
python fetch_images.py
```

## 🔧 Technologies

- **Python 3.x** - Programming language
- **requests** - HTTP library
- **NoCodeBackend API** - Database service
- **Unsplash API** - Image service

## 📊 Data Structure

```json
{
  "image_url": "https://images.unsplash.com/...",
  "image_name": "tokyo-tower-sunset.jpg",
  "country": "Japan",
  "wholesale": "TTN PLUS",
  "tour_code": "TYO001",
  "usage_count": 5,
  "last_updated": "2024-12-04T10:30:00Z",
  "programs": [
    {
      "program_name": "Tokyo 5D4N",
      "program_code": "TYO5D4N",
      "url": "https://tourwow.com/tour/tokyo-5d4n"
    }
  ]
}
```

## 🔐 API Keys Required

1. **NoCodeBackend API Key**
   - สมัครที่: https://nocodebackend.com
   - สร้าง instance และ API key
   - ใส่ใน `seed_data.py`

2. **Unsplash Access Key** (Optional)
   - สมัครที่: https://unsplash.com/developers
   - สร้าง application
   - ใส่ใน `fetch_images.py`

## 📚 Documentation

### seed_data.py

สร้างข้อมูลตัวอย่างด้วย:
- ชื่อประเทศและเมืองจริง
- รูปภาพคุณภาพสูงจาก Unsplash
- ข้อมูล wholesale และ tour code
- จำนวนการใช้งานแบบสุ่ม
- รายการโปรแกรมทัวร์

### fetch_images.py

ดึงรูปภาพจาก Unsplash API:
- ค้นหาตามคำค้นหา (เช่น "tokyo", "seoul")
- ดึง URL รูปภาพคุณภาพสูง
- จัดการ rate limiting
- Error handling

## 🚧 Future Improvements

- [ ] Bulk import from CSV
- [ ] Data validation
- [ ] Duplicate detection
- [ ] Image optimization
- [ ] Backup/restore scripts
- [ ] Migration scripts

## 📄 License

Copyright © 2024 Tourwow. All rights reserved.

## 👥 Team

- **Developer**: Tourwow Development Team

## 📞 Support

สำหรับการสนับสนุนหรือคำถาม กรุณาติดต่อทีมพัฒนา

## 🔗 Related Repositories

- [Frontend Repository](https://github.com/design-tourwow/finance-backoffice-front-end)
