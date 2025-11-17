'use client';

import { useState } from 'react';
import { MessageCircle, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function LeadCaptureWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'ส่งคำขอไม่สำเร็จ');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
      });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  const handleChange = (field: keyof LeadFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setStatus('idle');
    setError(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open ? (
        <div className="w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">อยากอัปเกรดแพ็กเกจ?</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">คุยกับทีมขาย</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ฝากข้อมูลไว้ ทีมของเราจะติดต่อกลับไปเสนอแพ็กเกจที่เหมาะสม
              </p>
            </div>
            <button onClick={() => { setOpen(false); setStatus('idle'); setError(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">ชื่อ-นามสกุล *</label>
              <input
                required
                value={formData.name}
                onChange={handleChange('name')}
                className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">อีเมล *</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">เบอร์โทร</label>
                <input
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">บริษัท</label>
                <input
                  value={formData.company}
                  onChange={handleChange('company')}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">รายละเอียดเพิ่มเติม</label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={handleChange('message')}
                className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 text-sm disabled:opacity-50"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ส่งคำขอ...
                </>
              ) : (
                'ขอใบเสนอราคา'
              )}
            </button>
          </form>

          {status === 'success' && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 px-3 py-2 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              ส่งคำขอเรียบร้อย ทีมของเราจะติดต่อกลับโดยเร็ว
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 px-3 py-2 text-xs">
              <AlertTriangle className="w-4 h-4" />
              {error || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-full px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <MessageCircle className="w-4 h-4 text-indigo-600" />
          พูดคุยทีมขาย
        </button>
      )}
    </div>
  );
}
