# 🚀 Route Guards - Quick Start

เริ่มต้นใช้งาน Route Guards ใน 5 นาที!

## ✅ Setup (ครั้งเดียว)

### 1. ตรวจสอบ Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

**ไม่มี Supabase?** ใช้ bypass mode:
```bash
NEXT_PUBLIC_BYPASS_AUTH=true
```

---

## 📝 การใช้งาน

### สำหรับหน้า Admin (Owner/Manager เท่านั้น)

```tsx
'use client';
import { AdminGuard } from '@/components/RouteGuard';

export default function AdminPage() {
  return (
    <AdminGuard>
      {/* เนื้อหา Admin */}
    </AdminGuard>
  );
}
```

### สำหรับหน้าทั่วไป (ต้อง login)

```tsx
'use client';
import { AuthGuard } from '@/components/RouteGuard';

export default function MyPage() {
  return (
    <AuthGuard>
      {/* เนื้อหาที่ต้อง login */}
    </AuthGuard>
  );
}
```

### หน้า Public (ไม่ต้อง Guard)

```tsx
export default function PublicPage() {
  return <div>Public content</div>;
}
```

---

## 🎯 ตัวอย่าง Use Cases

| หน้า | Guard | เหตุผล |
|------|-------|--------|
| `/admin/products` | `AdminGuard` | จัดการสินค้า (Admin only) |
| `/dashboard` | `AuthGuard` | ดู Dashboard (ทุกคนที่ login) |
| `/about` | ไม่ต้อง | หน้า Public |
| `/admin/settings` | `AdminGuard` | ตั้งค่าระบบ (Admin only) |
| `/customers` | `AuthGuard` | ดูลูกค้า (ต้อง login) |

---

## 🐛 แก้ปัญหาเบื้องต้น

### Redirect Loop?
```tsx
// ❌ ผิด - ห้ามใส่ Guard ในหน้า login
<AuthGuard>
  <LoginForm />
</AuthGuard>

// ✅ ถูก
<LoginForm />
```

### Loading นาน?
ตรวจสอบ Supabase credentials หรือใช้ bypass:
```bash
NEXT_PUBLIC_BYPASS_AUTH=true
```

### ไม่สามารถเข้า Admin?
ตรวจสอบ role ใน database:
```sql
UPDATE users SET role = 'owner' WHERE email = 'your@email.com';
```

---

## 📚 เอกสารเพิ่มเติม

อ่านคู่มือฉบับเต็ม: [ROUTE_GUARDS_TUTORIAL.md](./ROUTE_GUARDS_TUTORIAL.md)

---

**เริ่มใช้งานได้เลย!** 🎉
