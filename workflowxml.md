# 🚀 Vibe Code Complete Workflow Diagram

## 📋 ภาพรวม

Workflow นี้แสดงการทำงานแบบสมบูรณ์ของทีม Vibe Code:
- **3 คนทำงานพร้อมกัน**: GAP (Report A), Por (Report B), Cherry (Report C)
- **Deploy Staging Auto + Production Manual**
- **กรณีแก้โค้ดของคนอื่น**
- **Shared Code Workflow**
- **Conflict Resolution**
- **Hotfix Workflow**

---

## 🎯 Workflow หลัก: 3 คนทำงานพร้อมกัน

### 👥 สมาชิกในทีม

```
├─ GAP    → Report A (report-a.js)
├─ Por    → Report B (report-b.js)
└─ Cherry → Report C (report-c.js)
```

### 🔄 Timeline การทำงาน

```
09:00 - ทั้ง 3 คน Pull Staging พร้อมกัน
        ├─ GAP:    git pull origin staging
        ├─ Por:    git pull origin staging
        └─ Cherry: git pull origin staging
        → ทุกคนได้ code เวอร์ชันเดียวกัน (v1.0)

09:05 - แต่ละคนสร้าง Branch ของตัวเอง
        ├─ GAP:    git checkout -b feature/gap-report-a
        ├─ Por:    git checkout -b feature/por-report-b
        └─ Cherry: git checkout -b feature/cherry-report-c
        → แยกห้องทำงานกัน

09:10 - เริ่มเขียนโค้ดพร้อมกัน
        ├─ GAP:    แก้ report-a.js
        ├─ Por:    แก้ report-b.js
        └─ Cherry: แก้ report-c.js
        → ทำงานพร้อมกัน ไม่รบกวนกัน ✅

10:00 - GAP เสร็จก่อน
        GAP: Commit → Push → PR → Merge ✅
        → Staging ตอนนี้ v1.1 (มี Report A)

10:30 - Por เสร็จ
        Por: Pull Staging (ดึงงาน GAP มา) → Merge → Push → PR → Merge ✅
        → Staging ตอนนี้ v1.2 (มี Report A + B)

11:00 - Cherry เสร็จ
        Cherry: Pull Staging (ดึงงาน GAP + Por มา) → Merge → Push → PR → Merge ✅
        → Staging ตอนนี้ v1.3 (มี Report A + B + C)
```

---

## 📝 Workflow แต่ละคน (7 ขั้นตอน)

### STEP 1: Pull Staging
```bash
git checkout staging
git pull origin staging
```
**ทำไม:** ได้ code ล่าสุดที่เพื่อนทำไว้

### STEP 2: สร้าง Branch
```bash
# GAP
git checkout -b feature/gap-report-a

# Por
git checkout -b feature/por-report-b

# Cherry
git checkout -b feature/cherry-report-c
```
**ทำไม:** แยกห้องทำงาน ไม่กระทบกัน

### STEP 3: แก้ไขโค้ด

#### 🟢 กรณีปกติ: แก้ไฟล์ของตัวเอง
```
GAP:    แก้ report-a.js    ✅ แก้ได้เลย
Por:    แก้ report-b.js    ✅ แก้ได้เลย
Cherry: แก้ report-c.js    ✅ แก้ได้เลย
```

#### 🟡 กรณีพิเศษ 1: แก้ไฟล์ของคนอื่น
```
GAP ต้องการแก้ report-b.js (ของ Por)

ขั้นตอน:
1. แจ้ง Por ก่อน
   "Por, ผมต้องแก้ report-b.js ของคุณหน่อย เพราะ..."

2. Por ตอบ
   "OK ไปได้" หรือ "รอก่อน ผมกำลังแก้อยู่"

3. ถ้า OK → แก้ได้
   - GitHub จะ auto-assign Por เป็น reviewer
   - Por ต้อง approve ก่อน merge

4. ถ้ารอ → รอให้ Por ทำเสร็จก่อน
```

#### 🔴 กรณีพิเศษ 2: แก้ Shared Code
```
GAP ต้องการแก้ shared/utils.js

⚠️ CRITICAL: Shared code กระทบทุกคน!

ขั้นตอน:
1. แจ้ง Team Lead
   "Team Lead, ผมต้องแก้ shared/utils.js เพราะ..."

2. รอ Approval
   Team Lead: "OK แต่ต้อง backward compatible"

3. แก้แบบ backward compatible
   ✅ เพิ่ม function ใหม่
   ❌ ห้ามลบ function เก่า
   ❌ ห้ามเปลี่ยน function เก่า

4. ทดสอบทุกโมดูล
   - Test Report A
   - Test Report B
   - Test Report C

5. อัพเดท shared/README.md
   - เพิ่มคำอธิบาย function ใหม่
   - เพิ่มตัวอย่างการใช้งาน

6. Commit → Push → PR
   - GitHub auto-assign Team Lead
   - Team Lead review อย่างละเอียด

7. Merge → แจ้งทีม
   "ทุกคน ผมเพิ่ม function ใหม่ใน shared/utils.js แล้ว"
```

### STEP 4: Commit
```bash
git add .
git commit -m "feat: add report A feature"
```

### STEP 5: Push (Sync + Merge + Push)
```bash
# 💡 สำคัญ: Pull อีกครั้งก่อน Push!

# 1. Pull staging ล่าสุด
git checkout staging
git pull origin staging

# 2. กลับมา branch ของตัวเอง
git checkout feature/gap-report-a

# 3. Merge staging เข้ามา
git merge staging

# 4. ถ้ามี conflict → แก้ conflict
# 5. Push
git push origin feature/gap-report-a
```

**ทำไมต้อง Pull อีกครั้ง:**
- คนอื่นอาจ merge งานไปแล้วระหว่างที่คุณทำงาน
- ป้องกัน code ไม่ sync

**💡 ใช้ Script ช่วย (Optional):**
```bash
./scripts/safe-push.sh
# Script จะทำ pull + merge + push อัตโนมัติ
```

### STEP 6: สร้าง Pull Request
```
1. ไป GitHub
2. คลิก "Compare & pull request"
3. กรอกข้อมูล:
   - Title: feat: add report A
   - Description: อธิบายว่าทำอะไร
4. Create pull request

GitHub จะ:
✅ Auto-assign reviewers ตาม CODEOWNERS
✅ ส่ง notification ให้เจ้าของไฟล์
✅ เช็คว่า branch up-to-date หรือไม่
```

### STEP 7: Merge
```
1. รอ Review
   - Code owner review
   - อาจมี comment หรือขอแก้ไข

2. ถ้าต้องแก้
   - แก้ไข → Commit → Push
   - PR จะอัพเดทอัตโนมัติ

3. เมื่อได้ Approval
   - คลิก "Merge pull request"
   - คลิก "Confirm merge"

4. หลัง Merge
   - Pull code ล่าสุด
   - ลบ branch เก่า
   - พร้อมเริ่มงานใหม่
```

---

## 🚀 Deployment Workflow

### Staging (Auto Deploy)
```
1. Merge PR เข้า staging
   → Vercel auto-deploy ทันที ✅

2. ทดสอบที่ Staging
   → https://staging.yourapp.com

3. ถ้า OK → ไป Step Production
   ถ้าพัง → แก้ไข → Push staging อีกครั้ง
```

### Production (Manual Deploy)
```
1. Merge staging → main
   git checkout main
   git merge staging
   git push origin main
   → Git sync แต่ Vercel ไม่ auto-deploy ❌

2. สร้าง Version Tag (Backup)
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin v1.1.0
   → Backup version สำหรับ rollback

3. Deploy Production (Manual)
   - เข้า Vercel Dashboard
   - Deployments → หา deployment ล่าสุดจาก staging
   - คลิก "Promote to Production"
   → Production deploy ✅
```

---

## ⚠️ Conflict Resolution

### สถานการณ์: งานชนกัน
```
GAP และ Por แก้ไฟล์เดียวกัน (shared/utils.js)

Timeline:
09:00 - GAP และ Por pull staging (v1.0)
10:00 - GAP แก้ shared/utils.js → Merge ✅
        → Staging ตอนนี้ v1.1
11:00 - Por แก้ shared/utils.js → Push
        → ❌ Conflict!
```

### วิธีแก้:
```bash
# Por เจอ conflict
$ git push origin feature/por-report-b
# Error: Conflict detected!

# 1. Pull staging ล่าสุด
git checkout staging
git pull origin staging

# 2. Merge เข้า branch ของตัวเอง
git checkout feature/por-report-b
git merge staging
# Conflict in: shared/utils.js

# 3. เปิดไฟล์ → เลือกว่าจะเอาโค้ดของใคร
# ไฟล์จะมีลักษณะนี้:
<<<<<<< HEAD
// โค้ดของ Por
=======
// โค้ดของ GAP
>>>>>>> staging

# 4. แก้ไขให้เหลือโค้ดที่ต้องการ
# 5. Commit อีกครั้ง
git add shared/utils.js
git commit -m "resolve: merge conflict with GAP's changes"

# 6. Push ใหม่
git push origin feature/por-report-b
```

---

## 🔥 Hotfix Workflow (Production มี Bug ด่วน)

### สถานการณ์:
```
Production มี bug ร้ายแรง
แต่ staging มีงานที่ยังไม่พร้อม deploy
```

### Hotfix Workflow:
```bash
# 1. สร้าง hotfix branch จาก main (production)
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. แก้ bug
# ...

# 3. Commit
git add .
git commit -m "hotfix: fix critical bug"

# 4. Push
git push origin hotfix/critical-bug

# 5. สร้าง PR → main (ไม่ใช่ staging!)
# 6. Review เร็ว → Merge → main

# 7. Deploy production
# Vercel Dashboard → Promote to Production

# 8. Merge hotfix กลับไป staging ด้วย
git checkout staging
git merge hotfix/critical-bug
git push origin staging

# 9. ลบ hotfix branch
git branch -d hotfix/critical-bug
```

---

## 📊 Workflow Diagram (Visual)

```
┌─────────────────────────────────────────────────────────────┐
│                    STAGING BRANCH                           │
│              (กองกลางที่ทุกคนใช้ร่วมกัน)                    │
│                     โค้ดล่าสุดของทีม                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  👨‍💻 GAP      │   │  👨‍💻 Por      │   │  👩‍💻 Cherry   │
│  Report A     │   │  Report B     │   │  Report C     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        │ 1. Pull           │ 1. Pull           │ 1. Pull
        │ 2. Branch         │ 2. Branch         │ 2. Branch
        │ 3. Code           │ 3. Code           │ 3. Code
        │ 4. Commit         │ 4. Commit         │ 4. Commit
        │ 5. Push           │ 5. Push           │ 5. Push
        │ 6. PR             │ 6. PR             │ 6. PR
        │ 7. Merge          │ 7. Merge          │ 7. Merge
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    STAGING BRANCH                           │
│              (รวมงานของทั้ง 3 คนแล้ว)                       │
│                 Report A + B + C ✅                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Merge to main
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     MAIN BRANCH                             │
│                  (Ready for Production)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Manual Deploy
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION                               │
│                   (Live Website)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 กฎทอง 5 ข้อ

### 1. Pull ก่อนเริ่มงานเสมอ
```bash
git checkout staging
git pull origin staging
```

### 2. Pull ก่อน Push เสมอ
```bash
# ก่อน push
git checkout staging
git pull origin staging
git checkout feature/my-feature
git merge staging
```

### 3. แก้ไฟล์คนอื่น → ประสานก่อน
```
"Por, ผมต้องแก้ report-b.js ของคุณหน่อย"
```

### 4. แก้ Shared Code → แจ้ง Team Lead ก่อน
```
"Team Lead, ผมต้องแก้ shared/utils.js"
```

### 5. ใช้ PR เสมอ (ห้าม push ตรง)
```
❌ git push origin staging
✅ สร้าง PR แทน
```

---

## 💡 Best Practices

### แบ่งงานชัดเจน
```
✅ แต่ละคนรับผิดชอบไฟล์ต่างกัน
✅ ลดโอกาส conflict
```

### Pull บ่อยๆ
```
✅ ก่อนเริ่มงานใหม่ ดึงโค้ดล่าสุดเสมอ
✅ ก่อน push ดึงอีกครั้ง
```

### Commit เล็กๆ
```
✅ อย่ารอทำเสร็จหมดค่อย commit
✅ Commit บ่อยๆ ดีกว่า commit ครั้งเดียวใหญ่ๆ
```

### แจ้งทีม
```
✅ ถ้าจะแก้ shared code ต้องบอกก่อน
✅ ถ้าจะแก้ไฟล์คนอื่น ต้องบอกก่อน
```

### ใช้ Branch
```
✅ อย่า push ตรงไป staging เด็ดขาด
✅ ใช้ feature branch เสมอ
```

### Review PR
```
✅ ตรวจงานกันก่อน merge
✅ Comment ถ้าเห็นปัญหา
```

### Test ก่อน Push
```
✅ ทดสอบให้แน่ใจว่าโค้ดไม่พัง
✅ Test ใน local ก่อน
```

---

## 📚 เอกสารที่ควรอ่าน

### จำเป็น (2 ไฟล์):
1. **FINAL_WORKFLOW.md** - Workflow หลัก
2. **QUICK_REFERENCE.md** - คำสั่งที่ใช้บ่อย

### เมื่อต้องการ:
3. **shared/README.md** - เมื่อต้องใช้ shared code
4. **CODEOWNERS_QUICKSTART.md** - เมื่ออยากเข้าใจ CODEOWNERS
5. **PULL_vs_PR_EXPLAINED.md** - เมื่อสับสน Pull vs PR
6. **SYNC_PROBLEM_SOLUTION.md** - เมื่อเจอปัญหา sync
7. **POTENTIAL_ISSUES.md** - เมื่อเจอปัญหาอื่นๆ

---

## 🔧 เครื่องมือช่วย (Optional)

### Scripts:
```bash
./scripts/check-before-commit.sh  # เช็คก่อน commit
./scripts/safe-push.sh            # Push แบบปลอดภัย
./scripts/who-owns.sh             # เช็คว่าไฟล์ใครเป็นเจ้าของ
```

### Web Tools:
```bash
open codeowners-viewer.html       # ดู CODEOWNERS แบบ visual
open team-workflow-diagram.html   # ดู workflow แบบ visual
```

---

## ✅ Checklist

### ก่อนเริ่มงาน:
```
☐ Pull code ล่าสุด
☐ สร้าง branch ใหม่
```

### ขณะทำงาน:
```
☐ แก้เฉพาะไฟล์ที่ควรแก้
☐ ถ้าแก้ไฟล์คนอื่น → ประสาน
☐ ถ้าแก้ shared code → แจ้ง team lead
```

### ก่อน Push:
```
☐ git status (ดูว่าแก้อะไร)
☐ Pull staging อีกครั้ง
☐ Merge staging
☐ Test ว่าทำงานได้
```

### สร้าง PR:
```
☐ Title ชัดเจน
☐ Description ครบถ้วน
☐ Create pull request
```

### หลัง Merge:
```
☐ Pull staging ล่าสุด
☐ ลบ branch เก่า
```

---

**สร้างโดย:** Vibe Code Team  
**อัพเดทล่าสุด:** 2 มกราคม 2026  
**เวอร์ชัน:** Complete 1.0
