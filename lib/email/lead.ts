import nodemailer from 'nodemailer';

interface LeadEmailPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendLeadAcknowledgement(payload: LeadEmailPayload) {
  if (!process.env.SMTP_PASSWORD) {
    console.warn('[LeadEmail] Missing SMTP credentials, skipping acknowledgement email.');
    return;
  }

  const { name, email, company } = payload;
  const fromEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@omni-sales.app';

  const html = `
    <p>สวัสดีคุณ ${name}</p>
    <p>ขอบคุณที่สนใจ Omni Sales ทีมของเรากำลังตรวจสอบข้อมูลและจะติดต่อกลับภายใน 1 วันทำการ</p>
    ${
      company
        ? `<p>ข้อมูลบริษัท: <strong>${company}</strong></p>`
        : ''
    }
    <p>สามารถนัดหมายเดโมได้จากลิงก์นี้: <a href="https://calendly.com/omni-sales/demo">จองเวลาพูดคุย</a></p>
    <p>ขอบคุณครับ,<br />ทีม Omni Sales</p>
  `;

  await transporter.sendMail({
    from: `Omni Sales <${fromEmail}>`,
    to: email,
    subject: 'ทีม Omni Sales ได้รับคำขอของคุณแล้ว',
    html,
  });
}
