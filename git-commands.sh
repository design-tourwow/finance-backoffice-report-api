#!/bin/bash

# คำสั่งสำหรับ push โค้ดขึ้น GitHub
# รันคำสั่งทีละบรรทัดใน Terminal

echo "=== Setup Git Repository for Frontend ==="

# 1. Initialize git repository
git init

# 2. Add all files
git add .

# 3. Create initial commit
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

# 4. Add remote repository
git remote add origin https://github.com/design-tourwow/finance-backoffice-front-end.git

# 5. Push to GitHub
git branch -M main
git push -u origin main

echo "=== Frontend pushed to GitHub successfully! ==="
echo ""
echo "=== Setup Git Repository for Backend (Python Scripts) ==="
echo ""
echo "สำหรับ Backend (Python scripts) ให้รันคำสั่งต่อไปนี้:"
echo ""
echo "# 1. สร้าง folder ใหม่สำหรับ backend"
echo "mkdir ../finance-backoffice-back-end"
echo "cd ../finance-backoffice-back-end"
echo ""
echo "# 2. Copy Python files"
echo "cp ../tour-image-manager/seed_data.py ."
echo "cp ../tour-image-manager/fetch_images.py ."
echo ""
echo "# 3. สร้าง README"
echo "# (ดูไฟล์ README-BACKEND.md ที่จะสร้างให้)"
echo ""
echo "# 4. Initialize git"
echo "git init"
echo "git add ."
echo "git commit -m 'Initial commit: Backend scripts for Tour Image Manager'"
echo "git remote add origin https://github.com/design-tourwow/finance-backoffice-back-end.git"
echo "git branch -M main"
echo "git push -u origin main"
