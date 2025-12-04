# คำสั่งสำหรับ Deploy โค้ดขึ้น GitHub

## 📦 Frontend Repository

### ขั้นตอนที่ 1: เตรียม Frontend

```bash
# อยู่ใน folder tour-image-manager
cd /Users/gap/tour-image-manager

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Tour Image Manager Frontend

Features:
- Image listing with infinite scroll
- Advanced search and filtering
- Custom date range picker (Buddhist Era)
- Responsive design (Desktop/Tablet/Mobile)
- Accessibility compliant
- Loading states and empty states
- Modal confirmations
- NoCodeBackend API integration"

# Add remote
git remote add origin https://github.com/design-tourwow/finance-backoffice-front-end.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### ไฟล์ที่จะถูก push (Frontend):
- ✅ index.html
- ✅ styles.css
- ✅ script.js
- ✅ config.js
- ✅ api-service.js
- ✅ seed-data.html
- ✅ seed-data.js
- ✅ All documentation files (*.md)
- ✅ .gitignore

### ไฟล์ที่จะถูกละเว้น (ตาม .gitignore):
- ❌ *.backup files
- ❌ test-*.html files
- ❌ .DS_Store
- ❌ console_log.txt

---

## 🐍 Backend Repository

### ขั้นตอนที่ 2: เตรียม Backend

```bash
# สร้าง folder ใหม่สำหรับ backend
cd ..
mkdir finance-backoffice-back-end
cd finance-backoffice-back-end

# Copy Python files และ documentation
cp ../tour-image-manager/seed_data.py .
cp ../tour-image-manager/fetch_images.py .
cp ../tour-image-manager/requirements.txt .
cp ../tour-image-manager/README-BACKEND.md README.md

# สร้าง .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
*.egg-info/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# macOS
.DS_Store

# Environment
.env
.env.local

# Logs
*.log
EOF

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Backend scripts for Tour Image Manager

Scripts:
- seed_data.py: Generate 50 sample records
- fetch_images.py: Fetch images from Unsplash
- NoCodeBackend API integration
- Automatic data generation"

# Add remote
git remote add origin https://github.com/design-tourwow/finance-backoffice-back-end.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### ไฟล์ที่จะถูก push (Backend):
- ✅ seed_data.py
- ✅ fetch_images.py
- ✅ requirements.txt
- ✅ README.md
- ✅ .gitignore

---

## ✅ Checklist ก่อน Push

### Frontend:
- [ ] ตรวจสอบว่า API_KEY ใน config.js ไม่ใช่ production key
- [ ] ลบ console.log ที่ไม่จำเป็นออก
- [ ] ตรวจสอบว่า .gitignore ครบถ้วน
- [ ] ทดสอบว่าโค้ดทำงานได้

### Backend:
- [ ] ตรวจสอบว่า API_KEY ใน Python scripts เป็น placeholder
- [ ] เพิ่ม instructions สำหรับการตั้งค่า API keys
- [ ] ทดสอบ scripts ทำงานได้
- [ ] อัพเดท README.md

---

## 🔐 Security Notes

**⚠️ สำคัญมาก:**

1. **อย่า commit API keys จริง** - ใช้ placeholder แทน
2. **ใช้ environment variables** - สำหรับ production
3. **เพิ่ม .env ใน .gitignore** - ป้องกัน credentials รั่วไหล

### ตัวอย่าง config.js ที่ปลอดภัย:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://nocodebackend.com/api/v1',
  API_KEY: 'YOUR_API_KEY_HERE', // ⚠️ Replace with your actual API key
  INSTANCE_ID: 'YOUR_INSTANCE_ID', // ⚠️ Replace with your instance ID
  ITEMS_PER_PAGE: 50
};
```

---

## 📝 หลังจาก Push แล้ว

### 1. ตรวจสอบ GitHub:
- เข้าไปดูที่ https://github.com/design-tourwow/finance-backoffice-front-end
- เข้าไปดูที่ https://github.com/design-tourwow/finance-backoffice-back-end

### 2. เพิ่ม Description:
- Frontend: "Tour Image Manager - Frontend application for Tourwow Finance Backoffice"
- Backend: "Tour Image Manager - Backend scripts for data management"

### 3. เพิ่ม Topics (Tags):
- Frontend: `javascript`, `html`, `css`, `tour-management`, `image-manager`, `responsive-design`
- Backend: `python`, `api`, `data-seeding`, `nocodebackend`

### 4. ตั้งค่า Repository:
- เปิด Issues (ถ้าต้องการ)
- เปิด Discussions (ถ้าต้องการ)
- เพิ่ม LICENSE file (ถ้าต้องการ)

---

## 🚀 Next Steps

1. **Deploy Frontend:**
   - GitHub Pages
   - Netlify
   - Vercel

2. **Setup CI/CD:**
   - GitHub Actions
   - Automated testing
   - Automated deployment

3. **Documentation:**
   - Wiki pages
   - API documentation
   - User guide

---

## 📞 Need Help?

ถ้ามีปัญหาในการ push:

1. ตรวจสอบว่ามี git credentials
2. ตรวจสอบว่า repository ถูกสร้างบน GitHub แล้ว
3. ตรวจสอบ permissions

```bash
# ตรวจสอบ git config
git config --list

# ตรวจสอบ remote
git remote -v

# ถ้า push ไม่ได้ ลองใช้ HTTPS แทน SSH
git remote set-url origin https://github.com/design-tourwow/finance-backoffice-front-end.git
```
