# 🤖 AI Chat Demo & Testing Guide

คู่มือทดสอบและใช้งาน AI Chat ระบบ

---

## 📋 สารบัญ

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [การตั้งค่า AI Providers](#ai-providers)
4. [Demo Scenarios](#demo-scenarios)
5. [Testing Checklist](#testing-checklist)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

AI Chat Widget รองรับ 3 AI Providers:
- **OpenAI** (GPT-4, GPT-3.5 Turbo)
- **Anthropic** (Claude 3.5 Sonnet, Claude Opus)
- **Google** (Gemini Pro)

### Features

✅ **Real-time Chat** - สนทนาแบบเรียลไทม์
✅ **Conversation History** - บันทึกประวัติการสนทนา
✅ **Keyword Fallback** - ตอบอัตโนมัติเมื่อ AI ไม่พร้อม
✅ **Typing Indicators** - แสดงสถานะกำลังพิมพ์
✅ **Feedback System** - ให้ feedback ได้ (👍/👎)
✅ **Customizable** - ปรับสี ตำแหน่ง ข้อความได้
✅ **Persistent** - จำการสนทนาแม้ refresh

---

## 🚀 Quick Start

### Step 1: เปิดใช้งาน AI Agent

1. ไปที่ **Admin → Settings → Advanced → AI Agent**
2. Toggle "Enable AI Agent" → **ON**
3. กด **Save Settings**

### Step 2: ทดสอบโหมด Fallback (ไม่ต้องมี API Key)

```bash
# Widget จะปรากฏมุมล่างขวา (default)
# คลิกเพื่อเปิดแชท
```

**ทดลองถาม:**
- "สวัสดีครับ"
- "มีสินค้าอะไรบ้าง"
- "ราคาเท่าไหร่"
- "จัดส่งอย่างไร"

**ผลลัพธ์:** ได้คำตอบจาก keyword-based system (ไม่มีค่าใช้จ่าย)

---

## 🔑 AI Providers Setup

### Option 1: OpenAI (GPT-4)

**ขั้นตอน:**

1. **ไป https://platform.openai.com/api-keys**
2. **Create API Key** → Copy key
3. **ใน Omni Sales:**
   ```
   Provider: OpenAI
   Model: gpt-4
   API Key: sk-xxxxxxxxx
   Max Tokens: 1000
   Temperature: 0.7
   ```
4. **Save Settings**

**ทดสอบ:**
```
ผู้ใช้: "แนะนำสินค้าหน่อยครับ ผมชอบเล่นเกม"
AI: จะแนะนำสินค้าเกม, อุปกรณ์ gaming, headset, mouse ฯลฯ
```

**Cost:** ~฿1.50 ต่อ 1,000 tokens (conversation)

---

### Option 2: Anthropic Claude (แนะนำ!)

**ขั้นตอน:**

1. **ไป https://console.anthropic.com**
2. **Create API Key** → Copy
3. **ใน Omni Sales:**
   ```
   Provider: Anthropic
   Model: claude-3-5-sonnet-20241022
   API Key: sk-ant-xxxxxxxxx
   Max Tokens: 1000
   Temperature: 0.7
   ```
4. **Save Settings**

**ทดสอบ:**
```
ผู้ใช้: "อธิบายความแตกต่างระหว่างสินค้า A กับ B"
Claude: จะให้คำอธิบายละเอียด เปรียบเทียบอย่างชัดเจน
```

**Cost:** ถูกกว่า GPT-4 (~฿0.30 ต่อ 1,000 tokens)

---

### Option 3: Google Gemini (ฟรี!)

**ขั้นตอน:**

1. **ไป https://aistudio.google.com/app/apikey**
2. **Create API Key**
3. **ใน Omni Sales:**
   ```
   Provider: Google
   Model: gemini-pro
   API Key: AIzaSxxxxxxxxx
   Max Tokens: 1000
   Temperature: 0.7
   ```

**ทดสอบ:**
```
ผู้ใช้: "มีโปรโมชั่นอะไรบ้างคะ"
Gemini: จะตอบเกี่ยวกับโปรโมชั่น (ตาม knowledge base)
```

**Cost:** **ฟรี** (limited quota), แล้วจ่ายตาม usage

---

## 🎬 Demo Scenarios

### Scenario 1: Customer Support

**User Journey:**
```
1. ผู้ใช้: "สวัสดีครับ"
   AI: "สวัสดีครับ! ยินดีต้อนรับสู่ Omni Sales..."

2. ผู้ใช้: "ติดตามคำสั่งซื้อ #12345"
   AI: "กำลังตรวจสอบคำสั่งซื้อ #12345 ให้นะครับ..."

3. ผู้ใช้: "เปลี่ยนที่อยู่จัดส่งได้ไหม"
   AI: "แน่นอนครับ สามารถเปลี่ยนได้ภายใน 24 ชม..."
```

**Expected:**
- ✅ ตอบรวดเร็ว (< 3 วินาที)
- ✅ คำตอบเกี่ยวข้อง
- ✅ ใช้ภาษาไทยได้ดี

---

### Scenario 2: Product Inquiry

```
1. ผู้ใช้: "มีเสื้อผ้าผู้หญิงไหม"
   AI: "มีครับ! เรามีเสื้อผ้าผู้หญิงหลากหลายสไตล์..."

2. ผู้ใช้: "ราคาเท่าไหร่"
   AI: "เสื้อผ้าผู้หญิงของเรามีราคาตั้งแต่ 199-1,999 บาท..."

3. ผู้ใช้: "ขอดูรูปภาพ"
   AI: "สามารถดูรูปภาพและรายละเอียดได้ที่..."
```

---

### Scenario 3: Order Tracking

```
ผู้ใช้: "ของผมส่งถึงเมื่อไหร่"
AI: "ขอทราบหมายเลขคำสั่งซื้อของคุณได้ไหมครับ"

ผู้ใช้: "#ORD-2025-001"
AI: "คำสั่งซื้อของคุณอยู่ในสถานะ 'จัดส่งแล้ว'
     คาดว่าจะถึงภายใน 2-3 วันทำการครับ"
```

---

### Scenario 4: Escalation to Human

```
ผู้ใช้: "ต้องการคุยกับคนจริง"
AI: "เข้าใจครับ กำลังเชื่อมต่อไปยังเจ้าหน้าที่
     กรุณารอสักครู่นะครับ..."

[System: Create support ticket + notify staff]
```

**Expected:**
- ✅ AI รู้จักคำสำคัญ ("คุยกับคน", "พนักงาน", "เจ้าหน้าที่")
- ✅ Escalate ทันที
- ✅ แจ้ง staff ผ่าน notification

---

## ✅ Testing Checklist

### Basic Functionality

- [ ] Widget ปรากฏมุมล่างขวา
- [ ] คลิกเปิด-ปิดได้
- [ ] Minimize/Maximize ทำงาน
- [ ] Typing indicator แสดง
- [ ] Scroll เลื่อนลงอัตโนมัติ

### AI Integration

- [ ] เชื่อมต่อ OpenAI สำเร็จ
- [ ] เชื่อมต่อ Claude สำเร็จ
- [ ] เชื่อมต่อ Gemini สำเร็จ
- [ ] Fallback ทำงานเมื่อ AI error
- [ ] Response time < 5 วินาที

### Conversation

- [ ] จำบทสนทนาได้ (ไม่ reset)
- [ ] บันทึกใน database
- [ ] Load history เมื่อเปิดใหม่
- [ ] Multi-turn conversation ทำงาน
- [ ] Context awareness ถูกต้อง

### UI/UX

- [ ] สีตาม settings
- [ ] ตำแหน่งตาม settings
- [ ] Greeting message แสดง
- [ ] Timestamp แสดง
- [ ] Feedback buttons ทำงาน
- [ ] Mobile responsive

### Error Handling

- [ ] แสดง error message ชัดเจน
- [ ] Retry button ทำงาน
- [ ] ไม่ crash เมื่อ network ขาด
- [ ] Rate limiting protection
- [ ] Invalid API key handling

---

## 🐛 Troubleshooting

### Problem 1: Widget ไม่แสดง

**Symptoms:**
- ไม่เห็น chat button

**Solutions:**
```bash
# 1. Check AI Agent Settings
Admin → Settings → Advanced → AI Agent
→ ต้อง Enable = ON

# 2. Check browser console
F12 → Console → ดู errors

# 3. Hard refresh
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

---

### Problem 2: AI ไม่ตอบ

**Symptoms:**
- Typing indicator แสดงตลอด
- ได้ fallback response เท่านั้น

**Solutions:**
```bash
# 1. Check API Key
→ ต้องถูกต้องและยังใช้ได้

# 2. Check API Credits
→ OpenAI/Anthropic มี credits เหลือ?

# 3. Check Console Logs
F12 → Console → ดู "AI Chat error"

# 4. Test API Key separately
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.openai.com/v1/models
```

---

### Problem 3: Error "Unauthorized"

**Cause:** ไม่ได้ login

**Solution:**
```bash
# Login ก่อนใช้งาน
→ ไปหน้า /login
→ Login ด้วย credentials
```

---

### Problem 4: Response ช้า

**Symptoms:**
- ใช้เวลา > 10 วินาที

**Solutions:**
```bash
# 1. ลด Max Tokens
Settings → Max Tokens: 500 (แทน 1000)

# 2. เปลี่ยน Model
GPT-4 → GPT-3.5 Turbo (เร็วกว่า)

# 3. Check Network
→ Internet connection speed
```

---

### Problem 5: ค่าใช้จ่ายสูง

**Solutions:**
```bash
# 1. Set Max Tokens ต่ำ
→ 500 tokens ต่อ response

# 2. Enable conversation limit
→ เก็บแค่ 10 messages ล่าสุด

# 3. Add rate limiting
→ จำกัด messages ต่อ user

# 4. Use cheaper model
GPT-4 → Claude Sonnet → Gemini Pro
```

---

## 📊 Performance Benchmarks

| Provider | Response Time | Quality | Cost (฿/1K) |
|----------|---------------|---------|-------------|
| GPT-4 | 3-5s | ⭐⭐⭐⭐⭐ | 1.50 |
| GPT-3.5 | 1-2s | ⭐⭐⭐⭐ | 0.08 |
| Claude Sonnet | 2-4s | ⭐⭐⭐⭐⭐ | 0.30 |
| Gemini Pro | 2-3s | ⭐⭐⭐⭐ | 0.01 (ฟรี) |
| Fallback | < 0.1s | ⭐⭐⭐ | 0.00 |

---

## 🎯 Best Practices

### 1. การเลือก AI Provider

**For Production:**
- **Gemini Pro** - Cost-effective, good quality
- **Claude Sonnet** - Best balance
- **GPT-3.5** - Fast responses

**For Premium:**
- **GPT-4** - Highest quality
- **Claude Opus** - Complex queries

### 2. Token Optimization

```javascript
// Good - Specific questions
"ขอราคาสินค้า A"

// Bad - Too general
"บอกทุกอย่างเกี่ยวกับสินค้าทั้งหมดในร้าน"
```

### 3. Knowledge Base

```bash
# Add to Settings → AI Agent → Behavior
- Product catalog
- FAQ
- Return policy
- Shipping info
```

### 4. Monitoring

```bash
# Track in Admin Dashboard
- Total conversations
- Average satisfaction score
- Common questions
- Response times
```

---

## 🚀 Production Deployment

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_AI_CHAT_ENABLED=true

# Optional: Set default provider
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_API_KEY=AIzaxxxxx
```

### Vercel Deployment

```bash
# Deploy with AI Chat
vercel --prod

# Check deployment
vercel logs

# Test on production
https://your-domain.com
```

---

## 📞 Support

**Issues?**
- เช็ค Console logs (F12)
- ดู API provider status
- Contact support

**Documentation:**
- [AI Agent Setup](./AI_AGENT_SETUP.md)
- [API Reference](./API.md)

---

**Version:** 2.0.0
**Last Updated:** 2025-01-28
**Author:** Claude Code
