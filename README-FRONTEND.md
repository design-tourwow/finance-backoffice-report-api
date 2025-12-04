# Finance Backoffice - Tour Image Manager (Frontend)

ระบบจัดการรูปภาพทัวร์สำหรับ Tourwow Finance Backoffice

## 🚀 Features

- ✅ แสดงรายการรูปภาพทัวร์พร้อมข้อมูลการใช้งาน
- ✅ ค้นหาและกรองข้อมูลด้วยเงื่อนไขต่างๆ
- ✅ Infinite scroll สำหรับโหลดข้อมูลแบบ lazy loading
- ✅ Custom date range picker (Buddhist Era)
- ✅ Responsive design (Desktop, Tablet, Mobile)
- ✅ Accessibility compliant (ARIA labels, keyboard navigation)
- ✅ Loading states และ empty states
- ✅ Modal confirmations

## 📁 Project Structure

```
tour-image-manager/
├── index.html              # Main HTML file
├── styles.css              # Main stylesheet
├── script.js               # Main JavaScript
├── config.js               # API configuration
├── api-service.js          # API service layer
├── seed-data.html          # Seed data interface
├── seed-data.js            # Seed data script
└── docs/                   # Documentation files
    ├── SETUP_GUIDE.md
    ├── DATABASE_STRUCTURE.md
    ├── NOCODEBACKEND_SETUP.md
    ├── MIDDLEWARE_GUIDE.md
    ├── CORS_SETUP_GUIDE.md
    ├── API_KEY_SETUP.md
    ├── SEED_DATA_GUIDE.md
    ├── TESTING.md
    ├── IMPROVEMENTS.md
    ├── CHANGELOG.md
    └── SUMMARY.md
```

## 🛠️ Setup

### 1. Clone Repository

```bash
git clone https://github.com/design-tourwow/finance-backoffice-front-end.git
cd finance-backoffice-front-end
```

### 2. Configure API

แก้ไขไฟล์ `config.js`:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://nocodebackend.com/api/v1',
  API_KEY: 'YOUR_API_KEY_HERE',
  INSTANCE_ID: 'YOUR_INSTANCE_ID',
  ITEMS_PER_PAGE: 50
};
```

### 3. Run

เปิดไฟล์ `index.html` ในเบราว์เซอร์ หรือใช้ local server:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000
```

เปิดเบราว์เซอร์ที่ `http://localhost:8000`

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - คู่มือการติดตั้งและใช้งาน
- [Database Structure](DATABASE_STRUCTURE.md) - โครงสร้างฐานข้อมูล
- [NoCodeBackend Setup](NOCODEBACKEND_SETUP.md) - การตั้งค่า NoCodeBackend
- [API Key Setup](API_KEY_SETUP.md) - การสร้างและใช้งาน API Key
- [Testing Guide](TESTING.md) - คู่มือการทดสอบ
- [Changelog](CHANGELOG.md) - ประวัติการเปลี่ยนแปลง

## 🔧 Technologies

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox/Grid
- **Vanilla JavaScript** - No frameworks
- **NoCodeBackend API** - Backend as a Service
- **Google Fonts** - Kanit font family

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 API Integration

ระบบใช้ NoCodeBackend API สำหรับจัดการข้อมูล:

- `GET /data/{instance_id}` - ดึงข้อมูลรูปภาพ
- `POST /data/{instance_id}` - เพิ่มรูปภาพใหม่
- `PUT /data/{instance_id}/{id}` - แก้ไขข้อมูล
- `DELETE /data/{instance_id}/{id}` - ลบข้อมูล

## 🔐 Security

- API Key authentication
- CORS configuration
- Input validation
- XSS protection

## 📱 Responsive Design

- **Desktop**: Full layout with sidebar
- **Tablet**: Optimized grid layout
- **Mobile**: Card-based layout with hamburger menu

## ♿ Accessibility

- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Focus management
- High contrast mode support

## 🚧 Future Improvements

- [ ] Image upload functionality
- [ ] Bulk operations
- [ ] Export to CSV/Excel
- [ ] Advanced filtering
- [ ] Image preview modal
- [ ] Drag & drop sorting

## 📄 License

Copyright © 2024 Tourwow. All rights reserved.

## 👥 Team

- **Developer**: Tourwow Development Team
- **Designer**: Tourwow Design Team

## 📞 Support

สำหรับการสนับสนุนหรือคำถาม กรุณาติดต่อทีมพัฒนา
