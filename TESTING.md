# คู่มือการทดสอบ - Tour Image Manager

## 🧪 Accessibility Testing

### 1. Keyboard Navigation
```
✅ Tab - เคลื่อนที่ระหว่าง elements
✅ Shift+Tab - เคลื่อนที่ย้อนกลับ
✅ Enter - Activate buttons/links
✅ Space - Activate buttons/checkboxes
✅ Escape - Close modals/dropdowns
```

**ทดสอบ:**
1. กด Tab จากต้นหน้า → ควรเห็น focus indicator ชัดเจน
2. กด Enter บน "Skip to main content" → ควร jump ไปที่เนื้อหาหลัก
3. กด Tab ไปที่ date picker → กด Enter เพื่อเปิด
4. กด Escape → calendar ควรปิด
5. กด Tab ไปที่ "แสดงโปรแกรมทัวร์ทั้งหมด" → กด Enter

### 2. Screen Reader Testing

**macOS (VoiceOver):**
```bash
Cmd + F5 - เปิด/ปิด VoiceOver
```

**Windows (NVDA):**
```bash
Ctrl + Alt + N - เปิด NVDA
```

**ทดสอบ:**
1. เปิด screen reader
2. Navigate ผ่านหน้า
3. ฟัง ARIA labels
4. ตรวจสอบ alt text ของรูปภาพ
5. ตรวจสอบ form labels

### 3. Focus Indicators

**ทดสอบ:**
1. กด Tab ไปที่ input field → ควรเห็น outline สีน้ำเงิน
2. กด Tab ไปที่ button → ควรเห็น outline ชัดเจน
3. กด Tab ไปที่ link → ควรเห็น outline
4. ตรวจสอบว่า focus indicator มองเห็นได้ชัดเจน

### 4. Color Contrast

**ทดสอบ:**
1. ใช้ browser extension: "WAVE" หรือ "axe DevTools"
2. ตรวจสอบ contrast ratio ≥ 4.5:1 สำหรับ text
3. ตรวจสอบ contrast ratio ≥ 3:1 สำหรับ UI components

## 📱 Mobile Testing

### 1. Responsive Design

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**ทดสอบ:**
1. เปิด DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. ทดสอบขนาดหน้าจอต่างๆ:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)

### 2. Touch Targets

**ทดสอบ:**
1. ตรวจสอบว่า buttons มีขนาดอย่างน้อย 44x44px
2. ตรวจสอบว่า links มีขนาดเพียงพอ
3. ตรวจสอบระยะห่างระหว่าง touch targets

### 3. Mobile Menu

**ทดสอบ:**
1. เปิดในหน้าจอ mobile (< 768px)
2. คลิก hamburger menu → sidebar ควร slide in
3. คลิก overlay → sidebar ควรปิด
4. กด Escape → sidebar ควรปิด

## 🎨 UX Testing

### 1. Form Validation

**ทดสอบ:**
1. กรอก "จำนวนรวมใช้ซ้ำ" = "-5" → ควรแสดง error
2. กรอก "จำนวนรวมใช้ซ้ำ" = "abc" → ควรแสดง error
3. กรอกข้อมูลถูกต้อง → error ควรหาย
4. กด Submit โดยไม่กรอกข้อมูล → ควรแสดง loading state
5. กด Reset → ควรแสดง confirmation dialog

### 2. Loading States

**ทดสอบ:**
1. กด "ค้นหา" → ควรเห็น spinner
2. รอ 1.5 วินาที → ควรเห็นผลลัพธ์
3. ตรวจสอบว่า button disabled ระหว่าง loading

### 3. Empty State

**ทดสอบ:**
1. แก้ไข `hasResults = false` ใน script.js
2. กด "ค้นหา" → ควรเห็น empty state
3. ตรวจสอบ icon และข้อความ

### 4. Pagination

**ทดสอบ:**
1. คลิกหน้า 2 → ควร scroll ไปด้านบน
2. คลิก "หน้าถัดไป" → ควรเปลี่ยนหน้า
3. เปลี่ยน items per page → ควรอัปเดต

## ⚡ Performance Testing

### 1. Lighthouse

**ทดสอบ:**
1. เปิด DevTools (F12)
2. ไปที่ tab "Lighthouse"
3. เลือก "Desktop" หรือ "Mobile"
4. คลิก "Generate report"
5. ตรวจสอบ scores:
   - Performance: ≥ 90
   - Accessibility: ≥ 90
   - Best Practices: ≥ 90
   - SEO: ≥ 90

### 2. Network

**ทดสอบ:**
1. เปิด DevTools → Network tab
2. Reload หน้า
3. ตรวจสอบ:
   - Total size: < 500KB
   - Requests: < 20
   - Load time: < 2s

### 3. Images

**ทดสอบ:**
1. ตรวจสอบว่ารูปภาพมี `loading="lazy"`
2. ตรวจสอบว่ามี `srcset` สำหรับ responsive
3. ตรวจสอบว่า alt text มีความหมาย

## 🔍 Browser Testing

### Browsers to Test:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Features to Test:
1. Layout rendering
2. CSS Grid/Flexbox
3. JavaScript functionality
4. Date picker
5. Form validation
6. Animations

## 🖨️ Print Testing

**ทดสอบ:**
1. กด Ctrl+P (Cmd+P on Mac)
2. ตรวจสอบ print preview:
   - ✅ Sidebar ถูกซ่อน
   - ✅ Filter section ถูกซ่อน
   - ✅ Pagination ถูกซ่อน
   - ✅ Layout เหมาะสมสำหรับการพิมพ์
   - ✅ Links แสดง underline

## 🎯 Checklist

### Accessibility
- [ ] Keyboard navigation ทำงานได้
- [ ] Screen reader อ่านได้ถูกต้อง
- [ ] Focus indicators ชัดเจน
- [ ] ARIA attributes ครบถ้วน
- [ ] Color contrast เพียงพอ
- [ ] Alt text มีความหมาย

### Mobile
- [ ] Responsive ทุกขนาดหน้าจอ
- [ ] Touch targets ≥ 44x44px
- [ ] Mobile menu ทำงานได้
- [ ] Card layout บน mobile
- [ ] Scroll ลื่นไหล

### UX
- [ ] Loading states แสดงผล
- [ ] Empty state แสดงผล
- [ ] Error messages ชัดเจน
- [ ] Form validation ทำงาน
- [ ] Confirmation dialogs แสดง
- [ ] Pagination ทำงาน

### Performance
- [ ] Lighthouse score ≥ 90
- [ ] Load time < 2s
- [ ] Images lazy load
- [ ] No console errors
- [ ] Smooth animations

### Browser
- [ ] Chrome ทำงานได้
- [ ] Firefox ทำงานได้
- [ ] Safari ทำงานได้
- [ ] Edge ทำงานได้

## 🐛 Known Issues

ไม่มี issues ที่ทราบในขณะนี้

## 📝 Bug Report Template

```markdown
**Browser:** Chrome 120
**OS:** macOS 14
**Screen Size:** 1920x1080

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:**
...

**Actual Result:**
...

**Screenshots:**
[attach screenshots]
```

---

**Last Updated:** December 2024
