# Git Workflow สำหรับ Finance Backoffice Report API

## Branch Structure

```
main (Production)
  ↑
staging (Staging/Preview)
  ↑
feature/* (Development)
```

## Workflow การพัฒนา

### 1. เริ่มต้นพัฒนา Feature ใหม่

```bash
# สร้าง feature branch จาก staging
git checkout staging
git pull origin staging
git checkout -b feature/your-feature-name
```

### 2. พัฒนาและ Commit

```bash
# เขียนโค้ด...
git add .
git commit -m "Add: your feature description"
```

### 3. Push ขึ้น Feature Branch

```bash
git push origin feature/your-feature-name
```

### 4. Merge เข้า Staging (สำหรับทดสอบ)

```bash
# กลับไปที่ staging
git checkout staging
git pull origin staging

# Merge feature เข้า staging
git merge feature/your-feature-name

# Push ขึ้น staging
git push origin staging
```

**Vercel จะ auto-deploy ไปที่ Staging environment**
- URL: https://staging-finance-backoffice-report-api.vercel.app

### 5. ทดสอบใน Staging

ทดสอบให้แน่ใจว่าทุกอย่างทำงานถูกต้อง:
- ทดสอบ API endpoints
- ตรวจสอบ logs
- ทดสอบกับ frontend (ถ้ามี)

### 6. Deploy ขึ้น Production

⚠️ **สำคัญ: ต้องรอการอนุมัติก่อน Deploy Production**

**ห้าม** merge จาก staging ไปยัง main โดยอัตโนมัติ ต้องทำตามขั้นตอนนี้:

1. ทดสอบใน Staging ให้เรียบร้อย
2. **รอการอนุมัติจากผู้รับผิดชอบโปรเจค**
3. เมื่อได้รับอนุมัติแล้ว จึงทำการ merge:

```bash
# กลับไปที่ main
git checkout main
git pull origin main

# Merge staging เข้า main
git merge staging

# Push ขึ้น main
git push origin main
```

**Vercel จะ auto-deploy ไปที่ Production environment**
- URL: https://finance-backoffice-report-api.vercel.app

## Quick Commands

### Deploy Staging
```bash
git checkout staging
git pull origin staging
# ... ทำการแก้ไข ...
git add .
git commit -m "Your message"
git push origin staging
```

### Deploy Production
```bash
git checkout main
git pull origin main
git merge staging
git push origin main
```

### ตรวจสอบสถานะ
```bash
git status
git branch -a
git log --oneline -5
```

## Environment URLs

- **Production:** https://finance-backoffice-report-api.vercel.app
- **Staging:** https://staging-finance-backoffice-report-api.vercel.app
- **Preview:** Auto-generated สำหรับแต่ละ PR

## หมายเหตุ

- ห้าม push ตรงไปที่ `main` โดยตรง (ยกเว้นกรณีฉุกเฉิน)
- ทดสอบใน `staging` ก่อนเสมอ
- **ต้องรอการอนุมัติก่อน deploy ขึ้น Production**
- ใช้ commit message ที่ชัดเจน
- ลบ feature branch หลังจาก merge เรียบร้อยแล้ว

## Deployment Policy

### Staging Deployment
- Deploy ได้ทันทีหลังจาก merge เข้า `staging` branch
- ใช้สำหรับทดสอบและ QA
- Auto-deploy ผ่าน Vercel

### Production Deployment
- **ต้องได้รับการอนุมัติจากผู้รับผิดชอบโปรเจคก่อน**
- ห้าม merge จาก `staging` ไปยัง `main` โดยอัตโนมัติ
- ต้องแจ้งและรอคำสั่งก่อนทุกครั้ง
- Auto-deploy ผ่าน Vercel หลังจาก push ไปยัง `main`
