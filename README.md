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
GET /api/reports
GET /api/reports?type=monthly
POST /api/reports
```
**Authentication required** - Include API key in header.

#### ตัวอย่าง Request with API Key
```bash
curl https://your-api.vercel.app/api/reports \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

#### ตัวอย่าง POST Request
```bash
curl -X POST https://your-api.vercel.app/api/reports \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \
  -d '{
    "title": "Monthly Report January 2026",
    "type": "monthly"
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

- `REQUIRE_API_KEY` - เปิด/ปิดการใช้ API Key (`true`/`false`)
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

## หมายเหตุ

- API นี้ยังไม่ได้เชื่อมต่อกับ frontend (finance-backoffice-report)
- ใช้ mock data ในตอนนี้ ยังไม่ได้เชื่อมต่อกับ database
- พร้อมสำหรับการพัฒนาต่อยอด
