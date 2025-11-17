import { Resend } from 'resend';

// Initialize Resend with API key from environment variable
// To use: Set RESEND_API_KEY in your .env.local file
const apiKey = process.env.RESEND_API_KEY || 're_placeholder';
export const resend = new Resend(apiKey);

export const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
