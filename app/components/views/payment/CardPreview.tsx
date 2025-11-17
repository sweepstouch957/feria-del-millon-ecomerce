// components/Payment/CardPreview.tsx

'use client';

import React, { useMemo } from 'react';
import { onlyDigits } from './paymentUtils';
import { VisaLogo, McLogo, GenericLogo } from './CardLogos';

export type CardPreviewProps = {
  name: string;
  number: string;
  expiry: string;
  brand: 'visa' | 'mastercard' | 'generic';
  cvvFocused: boolean;
};

export function CardPreview({
  name,
  number,
  expiry,
  brand,
  cvvFocused,
}: CardPreviewProps) {
  const logo =
    brand === 'visa' ? (
      <VisaLogo />
    ) : brand === 'mastercard' ? (
      <McLogo />
    ) : (
      <GenericLogo />
    );

  const maskedNumber = useMemo(() => {
    const digits = onlyDigits(number).padEnd(16, '•');
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ');
  }, [number]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div
        className={`relative h-56 rounded-2xl shadow-xl overflow-hidden transition-transform duration-500 ${
          cvvFocused ? 'rotate-y-180' : ''
        }`}
      >
        {/* Frente */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest bg-white/15 px-2 py-1 rounded-full">
              Feria del Millón
            </div>
            {logo}
          </div>
          <div>
            <div className="text-xl md:text-2xl font-semibold tracking-widest">
              {maskedNumber}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>
                <div className="text-white/60 uppercase tracking-wide">
                  Titular
                </div>
                <div className="font-medium">{name || 'TU NOMBRE'}</div>
              </div>
              <div className="text-right">
                <div className="text-white/60 uppercase tracking-wide">
                  Vence
                </div>
                <div className="font-medium">{expiry || 'MM/AA'}</div>
              </div>
            </div>
          </div>
          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Reverso */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gray-900 text-white p-5">
          <div className="w-full h-10 bg-gray-700 rounded-sm mb-4" />
          <div className="bg-white rounded-md px-3 py-2 w-1/2 ml-auto">
            <div className="text-right text-gray-900 tracking-widest">•••</div>
          </div>
          <div className="mt-6 flex justify-end">{logo}</div>
        </div>
      </div>

      {/* Efecto 3D */}
      <style>{`
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; transform-style: preserve-3d; }
        .relative > .absolute { transition: transform 0.6s; transform-style: preserve-3d; }
      `}</style>
    </div>
  );
}
