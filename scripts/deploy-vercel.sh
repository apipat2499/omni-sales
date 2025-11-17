#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-.env.production}"

if [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
  if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
    echo "ℹ️  ไม่พบ $ENV_FILE ใช้ .env.local แทน"
    ENV_FILE=".env.local"
  else
    echo "⚠️  ไม่พบไฟล์ $ENV_FILE และไม่มี .env.local กรุณาสร้างไฟล์ env ก่อน"
  fi
fi

REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  STRIPE_SECRET_KEY
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
)

MISSING=()

read_var_from_env_file() {
  local key="$1"
  if [[ -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
    grep -E "^${key}=" "$PROJECT_ROOT/$ENV_FILE" | tail -n 1 | cut -d '=' -f2-
  fi
}

for var_name in "${REQUIRED_VARS[@]}"; do
  value="${!var_name:-}"
  if [[ -z "$value" ]]; then
    value="$(read_var_from_env_file "$var_name")"
  fi

  if [[ -z "$value" ]]; then
    MISSING+=("$var_name")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "❌ ยังขาดค่า Environment ต่อไปนี้:"
  for item in "${MISSING[@]}"; do
    echo "   - $item"
  done
  echo ""
  echo "เพิ่มค่าที่ไฟล์ $ENV_FILE (หรือ export ใน shell) แล้วรันคำสั่งนี้อีกครั้ง"
  exit 1
fi

cat <<'EOF'
✅ Environment พร้อมสำหรับ Deploy

ขั้นตอนแนะนำ:
  1. vercel login
  2. vercel pull --environment=production
  3. vercel --prod

หมายเหตุ: สคริปต์นี้ไม่เรียก vercel ให้อัตโนมัติ เพื่อให้คุณตรวจสอบอีกครั้งก่อน Deploy จริง
EOF
