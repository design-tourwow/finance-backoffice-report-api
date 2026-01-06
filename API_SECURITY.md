# API Security Guide

## การควบคุมการเข้าถึง API

API นี้รองรับการใช้ API Key เพื่อควบคุมการเข้าถึง

### 1. เปิด/ปิดการใช้ API Key

แก้ไขไฟล์ `.env.local`:

```bash
# ปิดการใช้ API Key (เปิดให้ทุกคนเข้าถึงได้)
REQUIRE_API_KEY=false

# เปิดการใช้ API Key (ต้องมี API Key ถึงจะเข้าถึงได้)
REQUIRE_API_KEY=true
```

### 2. สร้าง API Keys

แก้ไขไฟล์ `.env.local`:

```bash
API_KEY_1=sk_live_abc123xyz789
API_KEY_2=sk_live_def456uvw012
```

**วิธีสร้าง API Key ที่ปลอดภัย:**

```bash
# macOS/Linux
openssl rand -hex 32

# หรือใช้ Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. การใช้งาน API Key

#### วิธีที่ 1: ใช้ Header `x-api-key`

```bash
curl https://your-api.vercel.app/api/reports \
  -H "x-api-key: sk_live_abc123xyz789"
```

#### วิธีที่ 2: ใช้ Authorization Bearer Token

```bash
curl https://your-api.vercel.app/api/reports \
  -H "Authorization: Bearer sk_live_abc123xyz789"
```

#### ตัวอย่างใน JavaScript

```javascript
// ใช้ fetch
fetch('https://your-api.vercel.app/api/reports', {
  headers: {
    'x-api-key': 'sk_live_abc123xyz789'
  }
})

// ใช้ axios
axios.get('https://your-api.vercel.app/api/reports', {
  headers: {
    'x-api-key': 'sk_live_abc123xyz789'
  }
})
```

### 4. Response เมื่อไม่มี API Key

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Valid API key is required. Please include x-api-key header."
}
```

Status Code: `401 Unauthorized`

## CORS Configuration

API รองรับ CORS สำหรับ frontend ที่กำหนดไว้

### ตั้งค่า Allowed Origins

แก้ไขไฟล์ `.env.local`:

```bash
# Single origin
ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Multiple origins (คั่นด้วย comma)
ALLOWED_ORIGINS=https://frontend1.com,https://frontend2.com,http://localhost:3000
```

### ตั้งค่าใน next.config.js

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS || '*' },
        // ... other headers
      ],
    },
  ]
}
```

## Best Practices

### ✅ ควรทำ

1. **ใช้ HTTPS เสมอ** - อย่าส่ง API Key ผ่าน HTTP
2. **เก็บ API Key ใน Environment Variables** - อย่า commit ลง Git
3. **ใช้ API Key ที่แตกต่างกันสำหรับแต่ละ environment**
   - Development: `API_KEY_DEV`
   - Staging: `API_KEY_STAGING`
   - Production: `API_KEY_PROD`
4. **Rotate API Keys เป็นระยะ** - เปลี่ยน API Key ทุก 3-6 เดือน
5. **Log การเข้าถึง API** - เพื่อตรวจสอบการใช้งานที่ผิดปกติ

### ❌ ไม่ควรทำ

1. **อย่า commit API Key ลง Git**
2. **อย่าแชร์ API Key ใน public**
3. **อย่าใช้ API Key เดียวกันสำหรับทุก environment**
4. **อย่าเก็บ API Key ใน frontend code**

## การตั้งค่าใน Vercel

### 1. ไปที่ Project Settings

```
Vercel Dashboard → Your Project → Settings → Environment Variables
```

### 2. เพิ่ม Environment Variables

| Key | Value | Environment |
|-----|-------|-------------|
| `REQUIRE_API_KEY` | `true` | Production, Preview |
| `API_KEY_1` | `sk_live_...` | Production |
| `API_KEY_2` | `sk_staging_...` | Preview |
| `ALLOWED_ORIGINS` | `https://your-frontend.com` | Production, Preview |

### 3. Redeploy

หลังจากเพิ่ม Environment Variables แล้ว ต้อง redeploy:

```bash
vercel --prod
```

## ตัวอย่างการใช้งาน

### Scenario 1: Development (ไม่ต้องการ API Key)

`.env.local`:
```bash
REQUIRE_API_KEY=false
```

### Scenario 2: Production (ต้องการ API Key)

Vercel Environment Variables:
```bash
REQUIRE_API_KEY=true
API_KEY_1=sk_live_abc123...
API_KEY_2=sk_live_xyz789...
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Scenario 3: Multiple Clients

```bash
REQUIRE_API_KEY=true
API_KEY_1=sk_client_a_abc123...  # สำหรับ Client A
API_KEY_2=sk_client_b_xyz789...  # สำหรับ Client B
API_KEY_3=sk_internal_def456...  # สำหรับใช้งานภายใน
```

## การ Monitor และ Debug

### ตรวจสอบ API Key ใน Development

```bash
# ดู environment variables
npm run dev

# ตรวจสอบว่า API Key ทำงานหรือไม่
curl http://localhost:3001/api/reports \
  -H "x-api-key: your-api-key" \
  -v
```

### ดู Logs ใน Vercel

```
Vercel Dashboard → Your Project → Deployments → [Select Deployment] → Logs
```

## การอัพเกรดความปลอดภัย (Advanced)

สำหรับอนาคต สามารถเพิ่มได้:

1. **Rate Limiting** - จำกัดจำนวน request ต่อนาที
2. **JWT Authentication** - ใช้ JWT แทน API Key
3. **OAuth 2.0** - สำหรับ third-party integrations
4. **IP Whitelist** - จำกัดการเข้าถึงจาก IP ที่กำหนด
5. **Request Signing** - ใช้ HMAC signature
6. **API Key Expiration** - กำหนดวันหมดอายุของ API Key
