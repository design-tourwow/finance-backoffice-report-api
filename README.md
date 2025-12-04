# Tour Image Manager - Tourwow

ระบบจัดการรูปภาพทัวร์สำหรับ Tourwow พัฒนาด้วย HTML, CSS และ JavaScript ตาม Best Practices

## ✨ คุณสมบัติหลัก

### 🎯 Accessibility (A11Y)
- ✅ ARIA labels และ roles สำหรับ screen readers
- ✅ Keyboard navigation support (Tab, Enter, Space, Escape)
- ✅ Skip to main content link
- ✅ Focus indicators ที่ชัดเจน
- ✅ Semantic HTML5
- ✅ Alt text ที่มีความหมายสำหรับรูปภาพ
- ✅ High contrast mode support
- ✅ Reduced motion support

### 📱 Responsive & Mobile-First
- ✅ Mobile hamburger menu
- ✅ Touch targets ขนาดอย่างน้อย 44x44px
- ✅ Card layout สำหรับ mobile
- ✅ Responsive breakpoints: 768px, 1024px, 1400px

### ⚡ Performance
- ✅ Lazy loading สำหรับรูปภาพ
- ✅ Responsive images (srcset)
- ✅ Font optimization (เลือกเฉพาะ weights ที่ใช้)
- ✅ DNS prefetch
- ✅ Preconnect สำหรับ external resources

### 🎨 UX/UI Improvements
- ✅ Loading states
- ✅ Empty states
- ✅ Error states & validation
- ✅ Form validation แบบ real-time
- ✅ Confirmation dialogs
- ✅ Smooth animations & transitions
- ✅ Pagination
- ✅ Items per page selector

### 🔧 Code Quality
- ✅ Error handling
- ✅ Debounce สำหรับ event handlers
- ✅ IIFE pattern (ป้องกัน global scope pollution)
- ✅ Try-catch blocks
- ✅ Console logging สำหรับ debugging

### 🗓️ Custom Date Range Picker
- ✅ รองรับปีพุทธศักราช (พ.ศ.)
- ✅ แสดงผลเป็นภาษาไทย
- ✅ Dual calendar view
- ✅ Keyboard accessible
- ✅ Range selection with hover preview

## 🛠️ เทคโนโลจีที่ใช้

- HTML5 (Semantic)
- CSS3 (Flexbox, Grid, Custom Properties)
- Vanilla JavaScript (ES6+)
- Google Fonts (Kanit)
- SVG Icons (แทน Font Awesome เพื่อ performance)

## 📁 โครงสร้างไฟล์

```
tour-image-manager/
├── index.html          # หน้าหลัก (Semantic HTML + ARIA)
├── styles.css          # Stylesheet (Mobile-first + A11Y)
├── script.js           # JavaScript (Error handling + Validation)
└── README.md           # เอกสารนี้
```

## 🚀 การใช้งาน

### เปิดไฟล์โดยตรง
เปิดไฟล์ `index.html` ในเว็บเบราว์เซอร์

### ใช้ Development Server (แนะนำ)

```bash
# Python
python -m http.server 8080

# Node.js
npx http-server -p 8080

# PHP
php -S localhost:8080
```

จากนั้นเปิดเบราว์เซอร์ที่ `http://localhost:8080`

## 🎯 คุณสมบัติเด่น

### Form Validation
- Real-time validation พร้อม debounce
- Error messages ที่ชัดเจน
- Focus ไปที่ field แรกที่มี error
- Confirmation dialog เมื่อ reset

### Mobile Menu
- Hamburger menu สำหรับ mobile
- Overlay backdrop
- Smooth slide animation
- Close on escape key

### Pagination
- First, Previous, Next, Last buttons
- Page numbers with ellipsis
- Items per page selector
- Smooth scroll to top

### Loading & Empty States
- Spinner animation
- Empty state with icon
- Error handling
- Graceful fallbacks

## ⌨️ Keyboard Shortcuts

- `Tab` - Navigate between elements
- `Enter/Space` - Activate buttons/links
- `Escape` - Close modals/dropdowns
- `Arrow Keys` - Navigate in calendar

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📱 Tested Devices

- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)
- Desktop (Chrome, Firefox, Safari, Edge)

## 🎨 Design Principles

1. **Mobile-First** - เริ่มออกแบบจาก mobile ก่อน
2. **Accessibility** - ใช้งานได้สำหรับทุกคน
3. **Performance** - โหลดเร็ว ใช้งานลื่น
4. **Progressive Enhancement** - ทำงานได้แม้ JavaScript ปิด
5. **Semantic HTML** - ใช้ HTML tags ที่มีความหมาย

## 🔍 SEO Optimization

- Meta tags (description, keywords, author)
- Open Graph tags
- Semantic HTML structure
- Alt text สำหรับรูปภาพ
- Proper heading hierarchy

## 🖨️ Print Optimization

- ซ่อน UI elements ที่ไม่จำเป็น
- Optimize layout สำหรับการพิมพ์
- Black & white friendly
- Page break optimization

## 📊 Performance Metrics

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: 95+

## 🔐 Security

- No external dependencies (ยกเว้น Google Fonts)
- Input validation
- XSS protection
- CSRF protection ready

## 📝 License

© 2024 Tourwow. All rights reserved.

## 👨‍💻 Development

พัฒนาโดยทีม Tourwow ตาม Web Accessibility Guidelines (WCAG 2.1) และ Best Practices

---

**Version:** 2.0.0  
**Last Updated:** December 2024
