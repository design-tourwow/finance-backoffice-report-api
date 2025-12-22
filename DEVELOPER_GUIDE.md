# 👨‍💻 Developer Guide - Finance Backoffice Report

คู่มือสำหรับ Developer ใหม่ที่เข้ามาร่วมทีม

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Git Branching Strategy](#git-branching-strategy)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Deployment Process](#deployment-process)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## 🚀 Getting Started

### Prerequisites

ติดตั้งโปรแกรมเหล่านี้ก่อนเริ่มงาน:

```bash
# 1. Git
git --version  # ควรเป็น 2.x ขึ้นไป

# 2. Node.js (optional - สำหรับ local server)
node --version  # แนะนำ v18 ขึ้นไป

# 3. Code Editor
# แนะนำ: VS Code, Cursor, หรือ WebStorm
```

### Clone Repository

```bash
# 1. Clone project
git clone https://github.com/design-tourwow/finance-backoffice-report.git

# 2. เข้าไปใน folder
cd finance-backoffice-report

# 3. ดู branches ทั้งหมด
git branch -a
```

### Project Structure

```
finance-backoffice-report/
├── index.html                      # หน้าแรก (Welcome page)
├── tour-image-manager.html         # หน้าจัดการรูปภาพทัวร์
├── tour-image-manager.js           # Logic หลัก
├── tour-image-manager-api.js       # API service
├── tour-image-manager.css          # Styles
├── test-api-env.html               # Test environment detection
├── vercel.json                     # Vercel configuration
├── README.md                       # Project overview
├── DEVELOPER_GUIDE.md              # คู่มือนี้
└── DEPLOY_INSTRUCTIONS.md          # คำสั่ง deploy
```

---

## 🔄 Development Workflow

### 📊 Visual Workflow Diagram

**[👉 เปิด Workflow Diagram แบบ Interactive](./workflow-diagram.html)**

### ขั้นตอนการทำงานแบบมาตรฐาน

```
1. Pull ล่าสุด → 2. สร้าง Branch → 3. Code → 4. Test → 5. Commit → 6. Push → 7. Pull Request → 8. Review → 9. Merge → 10. Deploy
```

### 1. Pull โค้ดล่าสุด

ก่อนเริ่มงานทุกครั้ง ต้อง pull โค้ดล่าสุดก่อน:

```bash
# Switch ไป staging branch
git checkout staging

# Pull โค้ดล่าสุด
git pull origin staging

# ดูว่ามี changes อะไรบ้าง
git log --oneline -5
```

### 2. สร้าง Feature Branch

**ห้าม code ใน `main` หรือ `staging` โดยตรง!**

```bash
# สร้าง branch ใหม่จาก staging
git checkout -b feature/your-feature-name

# ตัวอย่าง:
git checkout -b feature/add-export-button
git checkout -b fix/api-timeout-issue
git checkout -b refactor/improve-performance
```

**Branch Naming Convention:**
- `feature/` - ฟีเจอร์ใหม่
- `fix/` - แก้บั๊ก
- `refactor/` - ปรับปรุงโค้ด
- `docs/` - แก้เอกสาร
- `test/` - เพิ่ม tests

### 3. เขียนโค้ด

```bash
# เปิด code editor
code .

# หรือ
cursor .
```

**กฎสำคัญ:**
- ✅ เขียนโค้ดให้อ่านง่าย มี comments
- ✅ ตั้งชื่อตัวแปรให้สื่อความหมาย
- ✅ ทำทีละ feature เล็กๆ
- ❌ อย่าแก้หลายอย่างพร้อมกันใน commit เดียว

### 4. Test โค้ด

```bash
# เปิด local server
python -m http.server 8080
# หรือ
npx http-server -p 8080

# เปิดเบราว์เซอร์
open http://localhost:8080/tour-image-manager.html
```

**Checklist ก่อน Commit:**
- [ ] โค้ดทำงานได้ใน localhost
- [ ] ไม่มี console errors
- [ ] ทดสอบใน Chrome, Safari, Firefox
- [ ] ทดสอบใน mobile view
- [ ] ลบ `console.log()` ที่ไม่จำเป็น

### 5. Commit Changes

```bash
# ดู files ที่เปลี่ยน
git status

# Add files ที่ต้องการ commit
git add tour-image-manager.js
git add tour-image-manager.css

# หรือ add ทั้งหมด (ระวัง!)
git add .

# Commit พร้อม message ที่ดี
git commit -m "feat: Add export to Excel button

- Add export button in toolbar
- Implement Excel export using SheetJS
- Add loading state during export
- Tested with 1000+ records"
```

**Commit Message Format:**

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat:` - ฟีเจอร์ใหม่
- `fix:` - แก้บั๊ก
- `refactor:` - ปรับปรุงโค้ด
- `style:` - แก้ CSS/UI
- `docs:` - แก้เอกสาร
- `test:` - เพิ่ม tests
- `chore:` - งานอื่นๆ (update dependencies, etc.)

**ตัวอย่าง Commit Messages ที่ดี:**

```bash
✅ feat: Add pagination to image list
✅ fix: Resolve API timeout on large datasets
✅ refactor: Simplify date picker logic
✅ style: Improve mobile responsive layout
✅ docs: Update API documentation

❌ update
❌ fix bug
❌ changes
❌ asdfasdf
```

### 6. Push to GitHub

```bash
# Push branch ขึ้น GitHub
git push origin feature/your-feature-name

# ถ้า push ครั้งแรก
git push -u origin feature/your-feature-name
```

### 7. สร้าง Pull Request (PR)

1. ไปที่ GitHub: https://github.com/design-tourwow/finance-backoffice-report
2. คลิก **"Compare & pull request"**
3. เลือก base branch: `staging` (ไม่ใช่ `main`!)
4. เขียน PR description:

```markdown
## 📝 Description
เพิ่มปุ่ม Export to Excel ในหน้า Tour Image Manager

## 🎯 Changes
- เพิ่มปุ่ม Export ใน toolbar
- ใช้ SheetJS library สำหรับ export
- เพิ่ม loading state ขณะ export

## 🧪 Testing
- [x] ทดสอบ export ข้อมูล 10 records
- [x] ทดสอบ export ข้อมูล 1000+ records
- [x] ทดสอบใน Chrome, Safari, Firefox
- [x] ทดสอบใน mobile view

## 📸 Screenshots
(แนบภาพหน้าจอ)

## 🔗 Related Issues
Closes #123
```

5. คลิก **"Create pull request"**

### 8. Code Review

รอให้ทีมอื่น review โค้ด:

- ✅ ตอบคำถามของ reviewer
- ✅ แก้ไขตาม feedback
- ✅ Push changes เพิ่มเติม (จะเข้า PR เดิมอัตโนมัติ)

```bash
# แก้โค้ดตาม feedback
# ...

# Commit และ push
git add .
git commit -m "fix: Address review comments"
git push origin feature/your-feature-name
```

### 9. Merge to Staging

เมื่อ PR ได้รับ approval:

1. คลิก **"Merge pull request"**
2. เลือก **"Squash and merge"** (แนะนำ)
3. ลบ branch หลัง merge

```bash
# กลับไป staging และ pull โค้ดใหม่
git checkout staging
git pull origin staging

# ลบ feature branch ใน local
git branch -d feature/your-feature-name
```

### 10. Deploy to Production

เมื่อทดสอบใน staging เรียบร้อยแล้ว:

```bash
# 1. Switch to main
git checkout main

# 2. Pull ล่าสุด
git pull origin main

# 3. Merge staging to main
git merge staging

# 4. Push to production
git push origin main
```

**Vercel จะ auto-deploy:**
- `staging` branch → `staging-finance-backoffice-report.vercel.app`
- `main` branch → `finance-backoffice-report.vercel.app`

---

## 🌳 Git Branching Strategy

```
main (production)
  ↑
  └── staging (testing)
        ↑
        ├── feature/add-export
        ├── feature/improve-search
        └── fix/api-timeout
```

### Branch Hierarchy

1. **`main`** - Production (ห้ามแก้โดยตรง!)
   - โค้ดที่ stable และ tested แล้ว
   - Deploy ไปที่ production

2. **`staging`** - Testing (ห้ามแก้โดยตรง!)
   - โค้ดที่รอทดสอบ
   - Deploy ไปที่ staging environment

3. **`feature/*`** - Feature branches (แก้ได้!)
   - สร้างจาก `staging`
   - Merge กลับไป `staging` ผ่าน PR

### Workflow Diagram

```
Developer A                Developer B
    │                          │
    ├─ feature/export          ├─ feature/search
    │                          │
    └─→ PR to staging ←────────┘
              │
              ↓
          staging (test)
              │
              ↓
          main (production)
```

---

## 📝 Coding Standards

### JavaScript

```javascript
// ✅ ดี: ใช้ const/let แทน var
const API_URL = 'https://api.example.com';
let currentPage = 1;

// ✅ ดี: ตั้งชื่อตัวแปรให้สื่อความหมาย
const userList = [];
const isLoading = false;

// ❌ แย่: ชื่อไม่สื่อความหมาย
const x = [];
const flag = false;

// ✅ ดี: ใช้ arrow functions
const fetchData = async () => {
  const response = await fetch(API_URL);
  return response.json();
};

// ✅ ดี: มี error handling
try {
  const data = await fetchData();
  console.log('✅ Data loaded:', data);
} catch (error) {
  console.error('❌ Error:', error);
  alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
}

// ✅ ดี: มี comments สำหรับโค้ดที่ซับซ้อน
// Calculate total price with discount
// Formula: (price * quantity) * (1 - discount/100)
const totalPrice = (price * quantity) * (1 - discount / 100);
```

### HTML

```html
<!-- ✅ ดี: ใช้ semantic HTML -->
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

<!-- ✅ ดี: มี accessibility attributes -->
<button aria-label="Close modal" onclick="closeModal()">
  <svg>...</svg>
</button>

<!-- ✅ ดี: มี alt text -->
<img src="logo.png" alt="Company Logo" />
```

### CSS

```css
/* ✅ ดี: ใช้ class names ที่สื่อความหมาย */
.btn-primary {
  background: #4a7ba7;
  color: white;
}

.card-header {
  padding: 20px;
}

/* ❌ แย่: ชื่อไม่สื่อความหมาย */
.box1 {
  padding: 20px;
}

/* ✅ ดี: จัดกลุ่ม properties */
.button {
  /* Layout */
  display: inline-block;
  padding: 10px 20px;
  
  /* Visual */
  background: blue;
  border: none;
  border-radius: 4px;
  
  /* Text */
  color: white;
  font-size: 16px;
}
```

---

## 🧪 Testing

### Manual Testing Checklist

ก่อน commit ทุกครั้ง ต้องทดสอบ:

**Functionality:**
- [ ] ฟีเจอร์ทำงานตามที่ออกแบบ
- [ ] ไม่มี JavaScript errors ใน Console
- [ ] API calls ทำงานถูกต้อง
- [ ] Loading states แสดงผลถูกต้อง
- [ ] Error handling ทำงาน

**Browser Compatibility:**
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

**Responsive Design:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Performance:**
- [ ] หน้าโหลดเร็ว (< 3 วินาที)
- [ ] ไม่มี memory leaks
- [ ] Smooth animations

### Using Test Script

```bash
# เปิด test script
open test-api-env.html

# หรือ
http://localhost:8080/test-api-env.html
```

กด **"Run All Tests"** เพื่อทดสอบ environment detection

---

## 🚀 Deployment Process

### Automatic Deployment (Vercel)

Vercel จะ auto-deploy เมื่อ push ไป GitHub:

```bash
# Push to staging → auto deploy to staging URL
git push origin staging

# Push to main → auto deploy to production URL
git push origin main
```

### Manual Deployment (Emergency)

ถ้า auto-deploy ไม่ทำงาน:

1. ไปที่ Vercel Dashboard
2. เลือก Project: `finance-backoffice-report`
3. ไปที่ **Deployments** tab
4. คลิก **"Redeploy"** ที่ deployment ล่าสุด

### Rollback

ถ้าเจอบั๊กใน production:

**Option 1: Rollback ใน Vercel (เร็ว)**
1. ไปที่ Vercel Dashboard → Deployments
2. หา deployment ก่อนหน้าที่ stable
3. คลิก **"Promote to Production"**

**Option 2: Revert ใน Git (ถาวร)**
```bash
# 1. หา commit ที่ต้องการ revert
git log --oneline -10

# 2. Revert commit
git revert <commit-hash>

# 3. Push
git push origin main
```

---

## 🔧 Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. Git Merge Conflicts

```bash
# เมื่อเจอ conflict
git status  # ดู files ที่ conflict

# แก้ conflict ใน code editor
# หา markers: <<<<<<< HEAD, =======, >>>>>>>

# หลังแก้เสร็จ
git add .
git commit -m "fix: Resolve merge conflicts"
```

#### 2. ลืม Pull ก่อน Push

```bash
# Error: Updates were rejected
git pull origin staging --rebase
git push origin staging
```

#### 3. Commit ผิด Branch

```bash
# ยังไม่ push
git reset HEAD~1  # undo commit แต่เก็บ changes
git stash         # เก็บ changes ไว้
git checkout correct-branch
git stash pop     # เอา changes กลับมา
git add .
git commit -m "..."
```

#### 4. ต้องการลบ Commit ล่าสุด

```bash
# ยังไม่ push
git reset HEAD~1  # undo commit, เก็บ changes
git reset --hard HEAD~1  # undo commit, ลบ changes (ระวัง!)

# Push แล้ว (ไม่แนะนำ)
git revert HEAD
git push origin branch-name
```

#### 5. API ไม่ทำงาน

```bash
# เช็ค environment
console.log('Environment:', window.ENVIRONMENT);
console.log('API URL:', window.API_BASE_URL);

# เช็ค token
console.log('Token:', sessionStorage.getItem('authToken'));

# เช็ค network requests ใน DevTools
```

---

## ✨ Best Practices

### 1. Commit Often

```bash
# ❌ แย่: commit ใหญ่ๆ ครั้งเดียว
git commit -m "update everything"

# ✅ ดี: commit เล็กๆ บ่อยๆ
git commit -m "feat: Add export button UI"
git commit -m "feat: Implement export logic"
git commit -m "test: Add export tests"
```

### 2. Write Good Commit Messages

```bash
# ❌ แย่
git commit -m "fix"
git commit -m "update"
git commit -m "changes"

# ✅ ดี
git commit -m "fix: Resolve API timeout on large datasets"
git commit -m "feat: Add pagination to image list"
git commit -m "refactor: Simplify date picker logic"
```

### 3. Keep Branches Updated

```bash
# ทุกวัน ก่อนเริ่มงาน
git checkout staging
git pull origin staging

# ถ้าอยู่ใน feature branch นาน
git checkout feature/your-feature
git merge staging  # เอา changes ล่าสุดจาก staging มา
```

### 4. Review Your Own Code

ก่อน push ทุกครั้ง:

```bash
# ดู changes ทั้งหมด
git diff

# ดู changes ที่จะ commit
git diff --staged

# ดู commit history
git log --oneline -5
```

### 5. Use .gitignore

```bash
# ไฟล์ที่ไม่ควร commit
.DS_Store
node_modules/
*.log
.env
.vscode/
*.backup
```

### 6. Backup Before Major Changes

```bash
# สร้าง backup branch
git checkout -b backup/before-refactor
git push origin backup/before-refactor

# กลับไปทำงานต่อ
git checkout feature/your-feature
```

---

## 📚 Additional Resources

### Documentation
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Vercel Documentation](https://vercel.com/docs)

### Internal Docs
- `README.md` - Project overview
- `DEPLOY_INSTRUCTIONS.md` - Deployment guide
- `API_KEY_SETUP.md` - API configuration
- `DATABASE_STRUCTURE.md` - Database schema

### Team Communication
- **Slack/Line**: สำหรับคุยงานประจำวัน
- **GitHub Issues**: สำหรับ track bugs และ features
- **Pull Requests**: สำหรับ code review

---

## 🆘 Need Help?

### ติดปัญหา?

1. **ลอง Google ก่อน** - มักจะมีคนเจอปัญหาเดียวกัน
2. **ดู Documentation** - อ่าน docs ของ library/tool ที่ใช้
3. **ถาม ChatGPT/Claude** - อธิบายปัญหาให้ละเอียด
4. **ถามทีม** - อย่ากลัวถาม! ทุกคนเคยเป็น junior

### Code Review Comments

ถ้าได้ feedback จาก reviewer:

- ✅ **รับฟัง** - เขาช่วยให้โค้ดดีขึ้น
- ✅ **ถามกลับ** - ถ้าไม่เข้าใจ
- ✅ **อธิบาย** - ถ้ามีเหตุผลที่ทำแบบนั้น
- ❌ **อย่าโกรธ** - มันเป็นเรื่องปกติ

---

## 🎓 Learning Path

### สำหรับ Junior Developer

**Week 1-2: Setup & Basics**
- [ ] Clone repository
- [ ] เข้าใจ project structure
- [ ] ทำ small bug fixes
- [ ] เรียนรู้ Git basics

**Week 3-4: Features**
- [ ] เพิ่ม small features
- [ ] เขียน PR ที่ดี
- [ ] รับ code review

**Month 2-3: Advanced**
- [ ] Refactor existing code
- [ ] Improve performance
- [ ] Help review others' code

**Month 4+: Expert**
- [ ] Design new features
- [ ] Mentor new developers
- [ ] Lead projects

---

## 📝 Checklist สำหรับ Developer ใหม่

### Day 1
- [ ] ได้รับ access GitHub repository
- [ ] Clone project ลงเครื่อง
- [ ] ติดตั้ง tools ที่จำเป็น
- [ ] Run project ใน localhost ได้
- [ ] อ่าน README.md และ DEVELOPER_GUIDE.md

### Week 1
- [ ] เข้าใจ project structure
- [ ] รู้จัก team members
- [ ] Fix bug เล็กๆ 1-2 อัน
- [ ] สร้าง PR แรก
- [ ] เข้าใจ Git workflow

### Month 1
- [ ] เพิ่ม feature ใหม่ได้
- [ ] เข้าใจ API structure
- [ ] Review code ของคนอื่นได้
- [ ] Deploy ไป staging ได้
- [ ] ช่วยเหลือ developer ใหม่ได้

---

**Happy Coding! 🚀**

*Last Updated: December 2024*
*Version: 1.0*
