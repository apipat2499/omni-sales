# 🎬 Route Guards Simulation & Testing Guide

คู่มือทดสอบและจำลองการทำงานของ Route Guards แบบ Step-by-Step

---

## 📋 สารบัญ

1. [การเตรียมความพร้อม](#การเตรียมความพร้อม)
2. [Scenario 1: ทดสอบโหมด Demo (Bypass Auth)](#scenario-1-demo-mode)
3. [Scenario 2: ทดสอบการ Login](#scenario-2-login)
4. [Scenario 3: ทดสอบ AuthGuard](#scenario-3-authguard)
5. [Scenario 4: ทดสอบ AdminGuard](#scenario-4-adminguard)
6. [Scenario 5: ทดสอบ Role Permission](#scenario-5-role-permission)
7. [Verification Checklist](#verification-checklist)

---

## 🎯 การเตรียมความพร้อม

### ขั้นตอนที่ 1: Setup Environment

สร้างไฟล์ `.env.local`:

```bash
# Demo Mode (ไม่ต้องมี Supabase)
NEXT_PUBLIC_BYPASS_AUTH=true

# หรือถ้ามี Supabase แล้ว
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### ขั้นตอนที่ 2: รัน Development Server

```bash
npm run dev
# Server จะรันที่ http://localhost:3000
```

---

## 🎬 Scenario 1: Demo Mode (Bypass Auth)

**วัตถุประสงค์:** ทดสอบว่าระบบทำงานได้โดยไม่ต้อง Supabase

### Steps:

1. **ตั้งค่า Bypass Mode**
   ```bash
   # .env.local
   NEXT_PUBLIC_BYPASS_AUTH=true
   ```

2. **Restart Server**
   ```bash
   # กด Ctrl+C แล้วรันใหม่
   npm run dev
   ```

3. **เปิด Browser Console** (F12 > Console)

4. **ทดสอบเข้าหน้าต่างๆ:**

   | หน้า | URL | คาดหวัง |
   |------|-----|---------|
   | Dashboard | `/dashboard` | ✅ เข้าได้, แสดง warning banner "โหมด Demo" |
   | Admin Products | `/admin/products` | ✅ เข้าได้, แสดง warning banner |
   | Analytics | `/analytics` | ✅ เข้าได้ตามปกติ |

5. **ตรวจสอบ Console Log:**
   ```
   🚨 Auth bypass enabled (DEV_BYPASS=true)
   ```

### ✅ Expected Results:
- แสดง **yellow warning banner** บน top ของทุกหน้า
- ข้อความ: "⚠️ ระบบยืนยันตัวตนยังไม่พร้อม - กำลังใช้งานในโหมด Demo"
- เข้าหน้าไหนก็ได้ ไม่ถูก redirect
- Console แสดง warning log

---

## 🎬 Scenario 2: Login Flow

**วัตถุประสงค์:** ทดสอบการ redirect เมื่อไม่ได้ login

### Setup:

```bash
# .env.local - ปิด bypass mode
NEXT_PUBLIC_BYPASS_AUTH=false

# ต้องมี Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Steps:

1. **Clear Browser Cache & Cookies**
   - Chrome: Ctrl+Shift+Delete > Clear all
   - หรือใช้ Incognito Mode

2. **เปิดหน้า Dashboard โดยตรง**
   ```
   http://localhost:3000/dashboard
   ```

3. **สังเกต:**
   - โหลดหน้า loading "กำลังตรวจสอบสิทธิ์..." ประมาณ 0.5-1 วินาที
   - Redirect ไป `/login`

4. **เปิด Console ดู log:**
   ```
   🔒 No user - redirecting to login
   ```

5. **Login ด้วย credentials:**
   ```
   Email: test@example.com
   Password: password123
   ```

6. **หลัง Login สำเร็จ:**
   - Redirect กลับไปหน้า Dashboard
   - ไม่มี warning banner (ถ้า Supabase พร้อม)

### ✅ Expected Results:
- ไม่มี redirect loop (ไม่วนกลับไปกลับมา)
- Loading state แสดงชัดเจน
- Redirect smooth ไม่กระตุก
- หลัง login เข้าหน้า Dashboard ได้ทันที

---

## 🎬 Scenario 3: AuthGuard Test

**วัตถุประสงค์:** ทดสอบว่า AuthGuard ป้องกันหน้าที่ต้อง login

### Steps:

1. **Logout (ถ้า login อยู่)**
   - คลิก profile icon > Logout

2. **ลองเข้าหน้าที่มี AuthGuard:**

   | หน้า | URL | คาดหวัง |
   |------|-----|---------|
   | Dashboard | `/dashboard` | ❌ Redirect → `/login` |
   | Customers | `/customers` | ❌ Redirect → `/login` |
   | Inventory | `/inventory` | ❌ Redirect → `/login` |
   | CRM | `/crm` | ❌ Redirect → `/login` |

3. **ทดสอบ direct URL access:**
   ```bash
   # พิมพ์ URL โดยตรงใน address bar
   http://localhost:3000/customers
   ```

4. **Console Log ต้องแสดง:**
   ```
   🔒 No user - redirecting to login
   ```

### ✅ Expected Results:
- ทุกหน้าที่มี `AuthGuard` redirect ไป `/login`
- ไม่เห็นเนื้อหาหน้าเลย (flash of content)
- Loading indicator แสดงก่อน redirect

---

## 🎬 Scenario 4: AdminGuard Test

**วัตถุประสงค์:** ทดสอบว่า AdminGuard บล็อก user ที่ไม่ใช่ admin

### Setup:

ต้องมี user 2 accounts:
1. **Admin user** - role: `owner` หรือ `manager`
2. **Regular user** - role: `staff` หรือ `viewer`

### Steps with Regular User:

1. **Login ด้วย Regular User**
   ```
   Email: staff@example.com
   Password: password123
   ```

2. **ลองเข้าหน้า Admin:**

   | หน้า | URL | คาดหวัง |
   |------|-----|---------|
   | Admin Products | `/admin/products` | ❌ Redirect → `/dashboard` |
   | Admin Settings | `/admin/settings` | ❌ Redirect → `/dashboard` |
   | Admin Analytics | `/admin/analytics` | ❌ Redirect → `/dashboard` |

3. **Console Log:**
   ```
   🚫 Unauthorized admin access attempt: { userRole: 'staff', pathname: '/admin/products' }
   ```

4. **ดูหน้า Unauthorized (ก่อน redirect):**
   - ข้อความ: "ไม่มีสิทธิ์เข้าถึง"
   - "หน้านี้สำหรับผู้ดูแลระบบเท่านั้น (Owner/Manager)"
   - แสดง role ปัจจุบัน: "staff"

### Steps with Admin User:

1. **Logout และ Login ใหม่ด้วย Admin**
   ```
   Email: admin@example.com (role: owner)
   Password: password123
   ```

2. **ลองเข้าหน้า Admin:**

   | หน้า | URL | คาดหวัง |
   |------|-----|---------|
   | Admin Products | `/admin/products` | ✅ เข้าได้ |
   | Admin Settings | `/admin/settings` | ✅ เข้าได้ |
   | Admin Analytics | `/admin/analytics` | ✅ เข้าได้ |

3. **ไม่มี warning banner**
4. **Console ไม่มี error**

### ✅ Expected Results:
- Regular user ถูก redirect จาก admin pages
- Admin user เข้า admin pages ได้
- แสดง role ของ user ชัดเจนในหน้า unauthorized
- ไม่มี redirect loop

---

## 🎬 Scenario 5: Role Permission Matrix

**วัตถุประสงค์:** ทดสอบ permission ทุก role

### Test Matrix:

| หน้า | Public | Staff | Viewer | Manager | Owner |
|------|--------|-------|--------|---------|-------|
| `/` (Landing) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/about` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/customers` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/orders` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/admin/products` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/admin/settings` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/admin/tenants` | ❌ | ❌ | ❌ | ✅ | ✅ |

### Testing Script:

สำหรับแต่ละ role:

1. Login ด้วย account ของ role นั้น
2. ลองเข้าทุกหน้าในตาราง
3. บันทึกผล (✅ เข้าได้ / ❌ ถูกบล็อก)
4. Compare กับ expected results ในตาราง

---

## ✅ Verification Checklist

### Performance Checks:

- [ ] Loading state แสดงภายใน 100ms
- [ ] Redirect เสร็จภายใน 500ms
- [ ] ไม่มี flash of unauthorized content
- [ ] ไม่มี re-render ซ้ำซ้อน (เช็คใน React DevTools)

### Security Checks:

- [ ] ไม่สามารถ bypass guard ด้วย direct URL
- [ ] ไม่สามารถ bypass ด้วย back button
- [ ] Session หมดอายุแล้ว redirect ไป login
- [ ] Refresh page ยังคง auth state

### UX Checks:

- [ ] Error messages ชัดเจน เข้าใจง่าย
- [ ] Loading indicator มี animation smooth
- [ ] Warning banner สีเหลืองชัดเจน (demo mode)
- [ ] Console logs มีประโยชน์ในการ debug

### Edge Cases:

- [ ] **Expired Token:** Login แล้วรอ 24 ชม. → ต้อง redirect ไป login
- [ ] **Network Offline:** ปิด internet → แสดง error ชัดเจน
- [ ] **Concurrent Requests:** กด refresh หลายครั้ง → ไม่ crash
- [ ] **Role Change:** เปลี่ยน role ระหว่างใช้งาน → อัพเดททันที

---

## 🐛 Common Issues & Solutions

### 1. Redirect Loop

**อาการ:** หน้าวนไปวนมาระหว่าง `/login` และ `/dashboard`

**วิธีแก้:**
```bash
# ตรวจสอบว่าหน้า login ไม่มี Guard
# app/login/page.tsx - ห้ามใส่ AuthGuard/AdminGuard!

export default function LoginPage() {
  return <LoginForm />; // ✅ ถูก
}

// ❌ ผิด - ห้ามทำ
<AuthGuard>
  <LoginForm />
</AuthGuard>
```

### 2. Supabase Connection Error

**อาการ:** แสดง "Supabase not configured"

**วิธีแก้:**
```bash
# 1. เช็ค .env.local
cat .env.local | grep SUPABASE

# 2. Restart server
npm run dev

# 3. หรือใช้ bypass mode ชั่วคราว
NEXT_PUBLIC_BYPASS_AUTH=true
```

### 3. Role ไม่อัพเดท

**อาการ:** เปลี่ยน role ใน database แล้วยังเข้า admin ไม่ได้

**วิธีแก้:**
```bash
# 1. Logout และ Login ใหม่
# 2. Clear browser cache
# 3. ตรวจสอบ role ใน database:

# SQL
SELECT id, email, role FROM users WHERE email = 'your@email.com';

# Update role
UPDATE users SET role = 'owner' WHERE email = 'your@email.com';
```

---

## 📊 Test Report Template

```markdown
# Route Guards Test Report

**Date:** 2025-01-28
**Tester:** Your Name
**Environment:** Development / Production

## Test Results

### Scenario 1: Demo Mode
- [ ] PASS - Warning banner แสดง
- [ ] PASS - เข้าทุกหน้าได้
- [ ] PASS - Console log ถูกต้อง

### Scenario 2: Login Flow
- [ ] PASS - Redirect to login
- [ ] PASS - Login สำเร็จ
- [ ] PASS - Redirect กลับหน้าเดิม

### Scenario 3: AuthGuard
- [ ] PASS - Block unauthorized users
- [ ] PASS - Allow logged-in users

### Scenario 4: AdminGuard
- [ ] PASS - Block non-admin users
- [ ] PASS - Allow admin users

### Scenario 5: Role Permissions
- [ ] PASS - Owner: Full access
- [ ] PASS - Manager: Admin access
- [ ] PASS - Staff: Limited access
- [ ] PASS - Viewer: Read-only access

## Issues Found

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| #001 | Loading too slow | Medium | Open |
| #002 | ... | ... | ... |

## Conclusion

✅ All tests passed / ⚠️ Some issues found / ❌ Critical issues
```

---

## 🚀 Production Deployment Checklist

ก่อน deploy production:

- [ ] ปิด `NEXT_PUBLIC_BYPASS_AUTH` (ต้องเป็น `false`)
- [ ] ตั้งค่า Supabase credentials ใน Vercel
- [ ] ทดสอบทุก scenario บน staging
- [ ] เช็ค performance (Lighthouse score)
- [ ] Monitor error logs (Sentry)
- [ ] แจ้งทีมเกี่ยวกับการเปลี่ยนแปลง

---

**Version:** 1.0.0
**Last Updated:** 2025-01-28
**Author:** Claude Code
