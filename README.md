# Finance Backoffice Report API

API backend สำหรับระบบ Finance Backoffice Report

## เริ่มต้นใช้งาน

### ติดตั้ง Dependencies

```bash
npm install
# หรือ
yarn install
# หรือ
pnpm install
```

### รัน Development Server

```bash
npm run dev
# หรือ
yarn dev
# หรือ
pnpm dev
```

API จะรันที่ [http://localhost:3001](http://localhost:3001)

## API Endpoints

### Health Check
```
GET /api/health
```
No authentication required.

### Reports
```
GET /api/bookings
GET /api/bookings?limit=10
POST /api/bookings
```
**Authentication required** - Include API key in header.

#### ตัวอย่าง Request with API Key
```bash
curl https://staging-finance-backoffice-report-api.vercel.app/api/bookings \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

#### ตัวอย่าง POST Request
```bash
curl -X POST https://staging-finance-backoffice-report-api.vercel.app/api/bookings \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \
  -d '{
    "title": "New Booking",
    "type": "standard"
  }'
```

### Test API Keys

สำหรับการทดสอบ (Development/Staging):
- `sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e`
- `sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d`

⚠️ **หมายเหตุ:** API keys เหล่านี้ใช้สำหรับทดสอบเท่านั้น อย่านำไปใช้ใน production

## Environment Variables

สร้างไฟล์ `.env.local`:

```bash
cp .env.example .env.local
```

### ตัวแปรสำคัญ:

#### API Security
- `REQUIRE_API_KEY` - เปิด/ปิดการใช้ API Key (`true`/`false`)
- `API_KEY_1` - API Key สำหรับทดสอบ
- `API_KEY_2` - API Key สำหรับทดสอบ

#### Database Configuration (MySQL on AWS RDS)
- `DB_HOST` - Database host (e.g., `xxx.rds.amazonaws.com`)
- `DB_PORT` - Database port (default: `3306`)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password

**หมายเหตุ:** Database ใช้ SSL connection และมีสิทธิ์เข้าถึงเฉพาะตาราง `Xqc7k7_bookings` เท่านั้น
- `API_KEY_1`, `API_KEY_2` - API Keys สำหรับควบคุมการเข้าถึง
- `ALLOWED_ORIGINS` - Frontend URLs ที่อนุญาตให้เรียก API

ดูรายละเอียดเพิ่มเติมใน [API_SECURITY.md](./API_SECURITY.md)

## Deployment

### Vercel

โปรเจ็คนี้พร้อมสำหรับ deploy บน Vercel:

```bash
vercel
```

## โครงสร้างโปรเจ็ค

```
finance-backoffice-report-api/
├── app/
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts
│   │   └── reports/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── .env.example
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## กฎการพัฒนา (Development Rules)

### สร้าง API Endpoint ใหม่

**เมื่อสร้าง API endpoint ใหม่ ต้องทำทั้ง 2 อย่างเสมอ:**

1. **สร้าง Route File** - สร้างไฟล์ `route.ts` ใน `app/api/[endpoint-name]/`

2. **เพิ่มใน API Documentation** - เพิ่ม endpoint ในไฟล์ `app/page.tsx` ใน array `endpoints` เพื่อให้แสดงบนหน้าเว็บ API Documentation

```typescript
// ตัวอย่างการเพิ่ม endpoint ใน page.tsx
{
  id: 'GET-/api/your-endpoint',
  method: 'GET',
  path: '/api/your-endpoint',
  description: 'คำอธิบาย endpoint',
  category: 'MySQL Database',
  subCategory: 'your-category',
  requiresAuth: true,
  parameters: [
    { name: 'param1', type: 'string', description: 'คำอธิบาย parameter' }
  ],
  curl: `curl "\${apiUrl}/api/your-endpoint" -H "Authorization: Bearer YOUR_TOKEN"`,
  response: `{ "success": true, "data": [...] }`,
  responses: [
    { status: 200, description: 'Success' },
    { status: 401, description: 'Unauthorized' }
  ]
}
```

**ห้ามสร้าง API endpoint โดยไม่เพิ่มใน API Documentation เด็ดขาด!**

### Frontend เรียกใช้ API Endpoint

**เมื่อฝั่ง Frontend หยิบ API endpoint ไปใช้งาน ต้องตรวจสอบและอัปเดต 2 จุดเสมอ:**

1. **ตรวจสอบ API Documentation** — เปิดหน้า API Documentation (`app/page.tsx` > array `endpoints`) ตรวจว่า endpoint ที่จะใช้มีอยู่แล้วหรือยัง ถ้ายังไม่มีให้เพิ่มตามรูปแบบด้านบน

2. **อัปเดต Frontend Pages** — ในไฟล์ `app/page.tsx` ส่วน "Frontend Pages" (sidebar) ให้อัปเดตหน้าที่เกี่ยวข้อง:
   - เพิ่ม endpoint ใหม่ในตาราง "API Endpoints ที่ใช้"
   - อัปเดต Filters ถ้ามี parameter ใหม่
   - อัปเดต Client-side Features ถ้ามี feature ใหม่

```
ตัวอย่าง: Frontend หน้า /sales-by-country เรียก GET /api/reports/summary
  -> ตรวจว่า GET /api/reports/summary มีใน endpoints array หรือยัง
  -> ตรวจว่า Frontend Pages > /sales-by-country มี endpoint นี้ในตารางหรือยัง
```

**ทุกครั้งที่ Frontend เพิ่มหรือเปลี่ยน API endpoint ที่ใช้ ต้องอัปเดตทั้ง API Documentation และ Frontend Pages เสมอ!**

---

## หมายเหตุ

- API Documentation อยู่ที่หน้าแรกของเว็บ (ต้อง login ก่อน)
- ใช้ MySQL Database บน AWS RDS
- พร้อมสำหรับการพัฒนาต่อยอด
