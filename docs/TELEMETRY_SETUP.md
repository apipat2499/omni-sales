# Telemetry Setup & Verification

เอกสารนี้ช่วยให้ทีม Dev/Ops ตั้งค่า Slack/Sentry สำหรับระบบเทเลเมทรีใหม่

## 1. ตั้งค่า Environment Variables

เพิ่มค่าเหล่านี้บน Vercel (Production) และ GitHub Secrets (ใช้สำหรับ GitHub Actions + Slack Heartbeat)

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
TELEMETRY_SLACK_WEBHOOK_URL= # (optional alias)
TELEMETRY_SLACK_WEBHOOK=     # (อีก alias ที่รองรับ)
```

> สำหรับ Sentry ไม่ต้องตั้งค่าเพิ่ม เพราะ `@sentry/nextjs` ใช้ DSN เดิม

## 2. ทดสอบด้วยสคริปต์ CLI

หลังตั้งค่าแล้ว ให้รันจากโฟลเดอร์โปรเจ็กต์:

```bash
SLACK_WEBHOOK_URL=... npm run telemetry:test "Test telemetry wiring"
```

สคริปต์ `scripts/test-telemetry.mjs` จะยิงข้อความไปยัง Slack เพื่อยืนยันว่า webhook ใช้งานได้

## 3. ทดสอบผ่าน API

คุณสามารถส่ง event ตัวอย่างจาก client/server โดยเรียก:

```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "type": "telemetry_manual_test",
    "message": "Sent from curl",
    "level": "info",
    "context": { "initiator": "ops" }
  }'
```

ผลจะถูกส่งไป Slack + Sentry

## 4. การเฝ้าระวัง

- `middleware.ts` และ `AuthContext` จะส่ง event เมื่อเกิด redirect ผิดปกติหรือ Supabase offline
- GitHub Action `deploy-check` และ `telemetry-heartbeat` จะใช้ `SLACK_WEBHOOK_URL` เหมือนกัน
- หากต้องปิดการแจ้งเตือนชั่วคราว ให้ลบค่า `SLACK_WEBHOOK_URL` ใน environment นั้น

> แนะนำให้ตั้ง Slack channel `#omni-telemetry` และจำกัดสิทธิ์ webhook เฉพาะ channel นี้
