'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface ClassQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  joinCode: string;
}

export function ClassQRModal({ isOpen, onClose, className, joinCode }: ClassQRModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // A single hidden canvas always mounted when modal is open — used for download
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${joinCode}`
      : `/join/${joinCode}`;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isFullscreen, onClose]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (isFullscreen) setIsFullscreen(false);
      else onClose();
    }
  };

  // Download via the dedicated hidden canvas
  const handleDownload = useCallback(() => {
    const canvas = downloadCanvasRef.current;
    if (!canvas) return;

    // Draw white background first (JPEG doesn't support transparency)
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `QR-${className.replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 'image/jpeg', 0.95);
  }, [className]);

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden high-res canvas exclusively for download — always rendered when modal is open */}
      <div className="sr-only" aria-hidden="true">
        <QRCodeCanvas
          ref={downloadCanvasRef}
          value={joinUrl}
          size={512}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* Main modal */}
      {!isFullscreen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdrop}
        >
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 flex flex-col items-center text-center">

              {/* Header */}
              <div className="w-full flex justify-between items-center mb-6">
                <div className="w-10" />
                <h2 className="text-2xl font-extrabold tracking-tight text-[#111418] dark:text-white">
                  Mã QR tham gia {className}
                </h2>
                <button
                  onClick={onClose}
                  className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-[#617589]">close</span>
                </button>
              </div>

              {/* QR Code */}
              <div className="relative group">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 relative">
                  <div className="relative size-64 bg-white flex items-center justify-center">
                    <QRCodeCanvas
                      value={joinUrl}
                      size={256}
                      level="H"
                      includeMargin={false}
                      style={{ width: '100%', height: '100%' }}
                    />
                    <div className="absolute inset-0 border-2 border-primary/10 rounded-xl pointer-events-none" />
                  </div>

                  {/* Fullscreen button */}
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-4 right-4 size-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center text-[#617589] hover:text-primary hover:border-primary/30 shadow-sm transition-all hover:scale-105 active:scale-95"
                    title="Xem toàn màn hình"
                  >
                    <span className="material-symbols-outlined text-[24px]">fullscreen</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <p className="text-lg font-medium text-[#111418] dark:text-white mb-2">
                  Học sinh quét mã này
                </p>
                <p className="text-[#617589] dark:text-gray-400">
                  để tự điền thông tin và tham gia lớp
                </p>
                <p className="mt-2 text-xs font-mono text-[#617589] bg-[#f0f2f4] dark:bg-gray-800 px-3 py-1.5 rounded-lg inline-block">
                  {joinUrl}
                </p>
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-primary/20 group"
              >
                <span className="material-symbols-outlined group-hover:translate-y-0.5 transition-transform">download</span>
                <span>Tải xuống ảnh QR</span>
              </button>
            </div>

            {/* Footer */}
            <div className="bg-[#f8fafc] dark:bg-gray-800/50 px-8 py-4 flex justify-center border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm font-medium text-[#617589]">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Mã này có hiệu lực vô thời hạn</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={handleBackdrop}
        >
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Tải xuống
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="size-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              title="Thu nhỏ"
            >
              <span className="material-symbols-outlined text-[24px]">fullscreen_exit</span>
            </button>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-2xl">
            <QRCodeCanvas
              value={joinUrl}
              size={380}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="mt-8 text-center">
            <p className="text-2xl font-extrabold text-white mb-2">{className}</p>
            <p className="text-white/60 text-sm font-mono">{joinUrl}</p>
          </div>

          <p className="absolute bottom-6 text-white/40 text-sm">
            Nhấn <kbd className="bg-white/10 px-2 py-0.5 rounded text-xs">Esc</kbd> hoặc click bên ngoài để thoát
          </p>
        </div>
      )}
    </>
  );
}
