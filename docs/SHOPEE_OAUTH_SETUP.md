# Shopee OAuth Integration Guide

คู่มือการเชื่อมต่อ Shopee ผ่าน OAuth 2.0 อย่างถูกต้อง

## 📋 สิ่งที่ต้องเตรียม

1. **บัญชี Shopee Seller** ที่มีสิทธิ์ Admin
2. **Shopee Partner Account** จาก Shopee Open Platform
3. **Partner ID และ Partner Key** จาก Shopee Open Platform

---

## 🚀 ขั้นตอนการตั้งค่า

### Step 1: สมัคร Shopee Partner Account

1. เข้าไปที่ **https://open.shopee.com/**
2. คลิก **"Get Started"** หรือ **"Sign In"**
3. Login ด้วยบัญชี Shopee Seller ของคุณ
4. ยอมรับ Terms and Conditions

### Step 2: สร้าง Application

1. เข้า **Developer Console** > **My Apps**
2. คลิก **"Create New App"**
3. กรอกข้อมูล:
   - **App Name**: `Omni Sales Integration` (หรือชื่ออื่นที่ต้องการ)
   - **App Description**: `Integration for managing orders and products`
   - **Redirect URL**: `https://yourdomain.com/api/marketplace/shopee/callback`
     - สำหรับ development: `http://localhost:3000/api/marketplace/shopee/callback`

4. เลือก **Permissions** ที่ต้องการ:
   - ✅ `order.read_order` - อ่านข้อมูลคำสั่งซื้อ
   - ✅ `product.read_product` - อ่านข้อมูลสินค้า
   - ✅ `product.write_product` - เขียน/แก้ไขสินค้า (ถ้าต้องการ)
   - ✅ `shop.read_shop` - อ่านข้อมูลร้าน

5. **Submit** และรอการอนุมัติจาก Shopee

### Step 3: รับ Credentials

หลังจาก app ได้รับการอนุมัติ:

1. เข้าไปที่ **My Apps** > เลือก app ของคุณ
2. คุณจะเห็น:
   - **Partner ID** (เลขหลายหลัก)
   - **Partner Key** (string ยาว - เก็บเป็นความลับ!)

### Step 4: ตั้งค่า Environment Variables

เพิ่มใน `.env` ของคุณ:

```bash
# Shopee OAuth Credentials
SHOPEE_PARTNER_ID=1000xxx
SHOPEE_PARTNER_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# For development:
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: เชื่อมต่อร้านค้า Shopee

1. รันแอปพลิเคชัน:
   ```bash
   npm run dev
   ```

2. เข้าไปที่ **Marketplace Integrations** (`http://localhost:3000/marketplace`)

3. คลิก **"Connect"** บนการ์ด Shopee

4. คลิกปุ่ม **"Connect with Shopee"** (ปุ่มสีส้ม)

5. คุณจะถูก redirect ไปยัง Shopee:
   - Login ด้วยบัญชี Shopee Seller (ถ้ายังไม่ได้ login)
   - เลือกร้านที่ต้องการเชื่อมต่อ
   - คลิก **"Authorize"** เพื่ออนุมัติการเข้าถึง

6. หลังจากอนุมัติ จะถูก redirect กลับมาที่แอป
   - ระบบจะแสดงข้อความ "Shopee connected successfully"
   - ร้านของคุณจะปรากฏในรายการ Connected Shops

---

## 🔧 การทำงานของระบบ

### OAuth Flow Diagram

```
1. User คลิก "Connect with Shopee"
          ↓
2. App สร้าง Authorization URL
          ↓
3. Redirect ไป Shopee Authorization Page
          ↓
4. User อนุมัติการเข้าถึง
          ↓
5. Shopee redirect กลับพร้อม Auth Code
          ↓
6. App แลก Auth Code → Access Token
          ↓
7. บันทึก Access Token ลง Database
          ↓
8. เชื่อมต่อสำเร็จ!
```

### API Endpoints ที่ใช้งาน

#### 1. Generate Authorization URL
```
GET /api/marketplace/shopee/auth
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://partner.shopeemobile.com/api/v2/shop/auth_partner?...",
  "redirectUri": "http://localhost:3000/api/marketplace/shopee/callback"
}
```

#### 2. OAuth Callback
```
GET /api/marketplace/shopee/callback?code=XXXXX&shop_id=12345
```

**Process:**
1. รับ `code` และ `shop_id` จาก query parameters
2. เรียก Shopee API: `POST /api/v2/auth/token/get`
3. รับ `access_token` และ `refresh_token`
4. บันทึกลง `marketplace_connections` table
5. Redirect กลับไปหน้า marketplace พร้อม success message

---

## ⚠️ ข้อควรระวัง

### 1. Authorization Code มีอายุสั้น (5-10 นาที)

**ปัญหา:**
```json
{"code":57,"error":"error_invalid_code","msg":"verify code fail"}
```

**สาเหตุ:**
- Code หมดอายุแล้ว
- Code ถูกใช้ไปแล้ว (ใช้ได้ครั้งเดียว)
- Code ไม่ถูกต้อง

**วิธีแก้:**
- ทำ OAuth flow ใหม่ทั้งหมด
- อย่า refresh หน้าในระหว่าง callback
- ตรวจสอบว่า callback URL ถูกต้อง

### 2. Access Token มีอายุ (4 ชั่วโมง)

Access token จะหมดอายุหลังจาก 4 ชั่วโมง (14,400 วินาที)

**วิธีแก้:**
ใช้ Refresh Token เพื่อขอ Access Token ใหม่:

```typescript
import { createShopeeClient } from '@/lib/integrations/marketplace/shopee/client';

const client = createShopeeClient({
  partnerId: PARTNER_ID,
  partnerKey: PARTNER_KEY,
  shopId: SHOP_ID,
  accessToken: OLD_ACCESS_TOKEN,
});

// Refresh access token
const newAuth = await client.refreshAccessToken(refreshToken, shopId);
// newAuth.access_token = new access token
// newAuth.refresh_token = new refresh token
```

### 3. Redirect URL ต้องตรงกับที่ตั้งค่าใน Shopee Open Platform

**ผิด:**
- Shopee: `https://yourdomain.com/callback`
- .env: `http://localhost:3000`

**ถูก:**
- Shopee: `http://localhost:3000/api/marketplace/shopee/callback`
- .env: `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### 4. HTTPS สำหรับ Production

Shopee **บังคับใช้ HTTPS** สำหรับ redirect URL ใน production

- Development: `http://localhost:3000` (OK)
- Production: `https://yourdomain.com` (ต้องมี SSL)

---

## 🧪 การทดสอบ

### 1. ทดสอบ Authorization URL

```bash
curl http://localhost:3000/api/marketplace/shopee/auth
```

ควรได้:
```json
{
  "success": true,
  "authUrl": "https://partner.shopeemobile.com/api/v2/shop/auth_partner?partner_id=...",
  "redirectUri": "http://localhost:3000/api/marketplace/shopee/callback"
}
```

### 2. ทดสอบการเชื่อมต่อผ่าน UI

1. เปิด browser ไปที่ `/marketplace`
2. คลิก Connect บน Shopee card
3. คลิก "Connect with Shopee"
4. ตรวจสอบว่า:
   - ถูก redirect ไปหน้า Shopee
   - หน้า Shopee แสดงชื่อ app ที่ถูกต้อง
   - หลังอนุมัติ redirect กลับมาถูกต้อง
   - แสดงข้อความ success

### 3. ตรวจสอบ Database

```sql
SELECT * FROM marketplace_connections WHERE marketplace_type = 'shopee';
```

ควรเห็น:
- `shop_id`: รหัสร้าน
- `access_token`: มีค่า (encrypted)
- `refresh_token`: มีค่า (encrypted)
- `is_active`: true

---

## 🔄 Refresh Token Strategy

แนะนำให้มีระบบ auto-refresh token:

```typescript
// lib/marketplace/token-refresh.ts
import { createShopeeClient } from '@/lib/integrations/marketplace/shopee/client';

export async function refreshShopeeToken(connectionId: string) {
  // 1. ดึง connection จาก database
  const connection = await getConnection(connectionId);

  // 2. Check ว่า token ใกล้หมดอายุหรือยัง
  const tokenAge = Date.now() - new Date(connection.updated_at).getTime();
  const FOUR_HOURS = 4 * 60 * 60 * 1000;

  if (tokenAge < FOUR_HOURS - 600000) { // ถ้ายังเหลือเวลา > 10 นาที
    return connection.access_token;
  }

  // 3. Refresh token
  const client = createShopeeClient({
    partnerId: connection.credentials.partner_id,
    partnerKey: connection.credentials.partner_key,
    shopId: parseInt(connection.shop_id),
    accessToken: connection.access_token,
  });

  const newAuth = await client.refreshAccessToken(
    connection.refresh_token,
    parseInt(connection.shop_id)
  );

  // 4. บันทึก token ใหม่
  await updateConnection(connectionId, {
    access_token: newAuth.access_token,
    refresh_token: newAuth.refresh_token,
  });

  return newAuth.access_token;
}
```

---

## 📊 Database Schema

### marketplace_connections

```sql
CREATE TABLE marketplace_connections (
  id UUID PRIMARY KEY,
  marketplace_type VARCHAR(50), -- 'shopee'
  shop_id VARCHAR(255),          -- Shopee Shop ID
  shop_name VARCHAR(255),        -- Display name
  access_token TEXT,             -- Encrypted access token
  refresh_token TEXT,            -- Encrypted refresh token
  credentials JSONB,             -- { partner_id, partner_key, expire_in }
  is_active BOOLEAN,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🛠️ Troubleshooting

### Error: "missing_shopee_credentials"

**สาเหตุ:** ไม่ได้ตั้ง `SHOPEE_PARTNER_ID` หรือ `SHOPEE_PARTNER_KEY`

**วิธีแก้:**
```bash
# ตรวจสอบ .env
cat .env | grep SHOPEE

# ต้องมี:
SHOPEE_PARTNER_ID=xxxxx
SHOPEE_PARTNER_KEY=xxxxx
```

### Error: "code_expired"

**สาเหตุ:** Authorization code หมดอายุ (เกิน 5-10 นาที)

**วิธีแก้:**
- ทำ OAuth flow ใหม่อีกครั้ง
- ตรวจสอบว่า callback endpoint ทำงานได้ปกติ
- ตรวจสอบ network ว่ามี latency สูงหรือไม่

### Error: "database_error"

**สาเหตุ:** ไม่สามารถบันทึกข้อมูลลง database

**วิธีแก้:**
- ตรวจสอบ Supabase connection
- ตรวจสอบว่า table `marketplace_connections` มีอยู่
- ตรวจสอบ RLS policies

---

## 📚 Resources

- **Shopee Open Platform**: https://open.shopee.com/
- **Shopee API Documentation**: https://open.shopee.com/documents
- **OAuth 2.0 Specification**: https://oauth.net/2/

---

## ✅ Checklist

สำหรับ Production Deployment:

- [ ] สมัคร Shopee Partner Account
- [ ] สร้าง App และรอการอนุมัติ
- [ ] ตั้งค่า Redirect URL เป็น HTTPS
- [ ] เพิ่ม SHOPEE_PARTNER_ID และ SHOPEE_PARTNER_KEY ใน .env
- [ ] ทดสอบ OAuth flow ใน staging
- [ ] ตรวจสอบว่า callback URL accessible จาก internet
- [ ] ตั้งค่า token refresh strategy
- [ ] ทดสอบการ sync orders
- [ ] ตรวจสอบ error handling
- [ ] เพิ่ม logging และ monitoring

---

**สร้างเมื่อ:** 2025-11-23
**อัพเดตล่าสุด:** 2025-11-23
**Version:** 1.0
