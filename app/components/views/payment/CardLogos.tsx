// components/Payment/CardLogos.tsx

import React from 'react';

export function VisaLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 20" aria-hidden="true">
      <rect width="64" height="20" rx="3" fill="#1A1F71" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="11"
        fontFamily="Arial"
        fill="#fff"
        fontWeight="700"
      >
        VISA
      </text>
    </svg>
  );
}

export function McLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 20" aria-hidden="true">
      <rect width="64" height="20" rx="3" fill="#000" />
      <circle cx="28" cy="10" r="6.5" fill="#EB001B" />
      <circle cx="36" cy="10" r="6.5" fill="#F79E1B" />
    </svg>
  );
}

export function GenericLogo({
  className = 'h-6 w-auto',
}: {
  className?: string;
}) {
  return (
    <div
      className={
        className +
        ' rounded-md bg-gray-900 text-white flex items-center justify-center px-2'
      }
    >
      <span className="text-[10px] tracking-widest font-semibold">CARD</span>
    </div>
  );
}
