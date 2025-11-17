'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, X, Package, Search as SearchIcon } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string, type: 'barcode' | 'qr') => void;
  onClose?: () => void;
  title?: string;
}

export default function BarcodeScanner({
  onScanSuccess,
  onClose,
  title = 'สแกนบาร์โค้ด/QR Code',
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScanning && !scanner) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true,
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          // Determine if it's a barcode or QR code based on format
          const type = decodedText.length > 20 || decodedText.includes('http') ? 'qr' : 'barcode';
          onScanSuccess(decodedText, type);
          html5QrcodeScanner.clear();
          setIsScanning(false);
        },
        (errorMessage) => {
          // Handle scan errors silently (too noisy otherwise)
        }
      );

      setScanner(html5QrcodeScanner);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isScanning, scanner, onScanSuccess]);

  const handleStartScanning = () => {
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim(), 'barcode');
      setManualCode('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Scanner View */}
        {isScanning ? (
          <div className="space-y-4">
            <div
              id="qr-reader"
              className="rounded-lg overflow-hidden border-2 border-blue-500 dark:border-blue-400"
            />
            <button
              onClick={handleStopScanning}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              หยุดสแกน
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Start Scan Button */}
            <button
              onClick={handleStartScanning}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">เปิดกล้องเพื่อสแกน</span>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  หรือ
                </span>
              </div>
            </div>

            {/* Manual Input */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  กรอกรหัสสินค้าด้วยตนเอง
                </span>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="กรอก SKU หรือบาร์โค้ด"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </label>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SearchIcon className="w-4 h-4" />
                ค้นหาสินค้า
              </button>
            </form>
          </div>
        )}

        {/* Instructions */}
        {!isScanning && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              วิธีใช้งาน:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>กดปุ่ม "เปิดกล้อง" เพื่อสแกนบาร์โค้ดหรือ QR Code</li>
              <li>นำกล้องไปส่องที่บาร์โค้ดของสินค้า</li>
              <li>หรือกรอกรหัสสินค้าด้วยตนเองในช่องด้านล่าง</li>
              <li>ระบบจะค้นหาสินค้าอัตโนมัติเมื่อสแกนสำเร็จ</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
