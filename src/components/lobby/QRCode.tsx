'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  roomCode: string;
  joinUrl: string;
}

export function QRCodeDisplay({ roomCode, joinUrl }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="bg-white p-4 rounded-2xl">
        <QRCodeSVG
          value={joinUrl}
          size={200}
          level="M"
          bgColor="#ffffff"
          fgColor="#1a1a2e"
        />
      </div>

      <div className="text-center">
        <p className="text-white/60 text-sm uppercase tracking-wider mb-2">Room Code</p>
        <p className="text-6xl font-black text-[var(--color-gold)] tracking-[0.3em] drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]">
          {roomCode}
        </p>
      </div>

      <p className="text-white/40 text-sm">
        Scan QR code or visit <span className="text-white/60 font-mono">{joinUrl}</span>
      </p>
    </div>
  );
}
