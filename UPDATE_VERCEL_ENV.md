# Update Vercel Environment Variables

## ⚠️ สำคัญ: ต้องอัพเดท Environment Variable บน Vercel

เนื่องจาก user `vibecode` มีสิทธิ์เข้าถึงเฉพาะ database `tw_tourwow_db_views` เท่านั้น

## วิธีอัพเดท:

### 1. ไปที่ Vercel Dashboard
https://vercel.com/tourwows-projects/finance-backoffice-report-api/settings/environment-variables

### 2. แก้ไข Environment Variable
ค้นหา: `DB_NAME`

**เปลี่ยนจาก:**
```
tw_tourwow_db
```

**เป็น:**
```
tw_tourwow_db_views
```

### 3. เลือก Environment
- ✅ Production
- ✅ Preview  
- ✅ Development

### 4. Save และ Redeploy
- คลิก "Save"
- ไปที่ Deployments tab
- คลิก "Redeploy" deployment ล่าสุด

## หรือใช้ Vercel CLI:

```bash
# Set for production
vercel env add DB_NAME production
# พิมพ์: tw_tourwow_db_views

# Set for preview
vercel env add DB_NAME preview
# พิมพ์: tw_tourwow_db_views

# Redeploy
vercel --prod
```

## ตรวจสอบหลัง Deploy:

```bash
curl "https://staging-finance-backoffice-report-api.vercel.app/api/orders?limit=2" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

ควรได้ข้อมูลกลับมาแทนที่จะเป็น "Access denied"

---

## สรุป User Permissions:

```
GRANT USAGE ON *.* TO `vibecode`@`%`
GRANT SELECT, SHOW VIEW ON `tw_locations_db_views`.* TO `vibecode`@`%`
GRANT SELECT, SHOW VIEW ON `tw_suppliers_db_views`.* TO `vibecode`@`%`
GRANT SELECT, SHOW VIEW ON `tw_tourwow_db_views`.* TO `vibecode`@`%`
```

User `vibecode` มีสิทธิ์:
- ✅ SELECT และ SHOW VIEW บน `tw_tourwow_db_views`
- ❌ ไม่มีสิทธิ์บน `tw_tourwow_db`
