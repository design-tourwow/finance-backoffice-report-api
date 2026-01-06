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

### Reports
```
GET /api/reports
GET /api/reports?type=monthly
POST /api/reports
```

#### ตัวอย่าง POST Request
```json
{
  "title": "Monthly Report January 2026",
  "type": "monthly"
}
```

## Environment Variables

คัดลอก `.env.example` เป็น `.env.local` และปรับแต่งค่าตามต้องการ

```bash
cp .env.example .env.local
```

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
