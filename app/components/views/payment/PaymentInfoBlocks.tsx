// components/Payment/PaymentInfoBlocks.tsx

'use client';

import React from 'react';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

export function TrustBadges() {
  return (
    <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        <Lock size={16} style={{ verticalAlign: '-2px' }} /> Cifrado TLS 1.2+
      </div>
      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        <ShieldCheck size={16} style={{ verticalAlign: '-2px' }} /> Prevención de fraude
      </div>
      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        <CheckCircle2 size={16} style={{ verticalAlign: '-2px' }} /> Garantía de autenticidad
      </div>
    </div>
  );
}
