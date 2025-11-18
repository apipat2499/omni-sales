'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface UsageInfo {
  orderPercent: number;
  storagePercent: number;
}

export function UpsellBanner({ usage }: { usage: UsageInfo }) {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 p-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5" />
        <div>
          <p className="font-semibold">คุณกำลังใช้แพ็กเกจฟรีใกล้เต็ม</p>
          <p className="text-sm">
            คำสั่งซื้อใช้ไปแล้ว {Math.round(usage.orderPercent * 100)}% แนะนำให้อัปเกรดเป็น Pro เพื่อรองรับยอดขายที่เพิ่มขึ้น
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          setClicked(true);
          window.dispatchEvent(new Event('lead-widget:open'));
        }}
        className="inline-flex items-center gap-2 bg-white text-amber-900 font-semibold px-4 py-2 rounded-lg border border-amber-200 hover:bg-amber-100"
      >
        {clicked ? 'กำลังเปิดแบบฟอร์ม...' : 'ขอใบเสนอราคา'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
