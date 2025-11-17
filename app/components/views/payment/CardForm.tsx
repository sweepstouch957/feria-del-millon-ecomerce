// components/Payment/CardForm.tsx

'use client';

import React, { ChangeEvent } from 'react';
import { Input } from '@components/ui/input';
import { CreditCard } from 'lucide-react';
import {
  formatCardNumber,
  formatExpiry,
  isValidLuhn,
  onlyDigits,
} from './paymentUtils';
import { VisaLogo, McLogo, GenericLogo } from './CardLogos';

export type CardFormProps = {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  saveCard: boolean;
  brand: 'visa' | 'mastercard' | 'generic';
  onChangeName: (v: string) => void;
  onChangeNumber: (v: string) => void;
  onChangeExpiry: (v: string) => void;
  onChangeCvv: (v: string) => void;
  onToggleSaveCard: (v: boolean) => void;
  onCvvFocus: (focused: boolean) => void;
};

export function CardForm({
  cardName,
  cardNumber,
  expiry,
  cvv,
  saveCard,
  brand,
  onChangeName,
  onChangeNumber,
  onChangeExpiry,
  onChangeCvv,
  onToggleSaveCard,
  onCvvFocus,
}: CardFormProps) {
  const Logo =
    brand === 'visa' ? VisaLogo : brand === 'mastercard' ? McLogo : GenericLogo;

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del titular
        </label>
        <Input
          placeholder="Como aparece en la tarjeta"
          value={cardName}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChangeName(e.target.value.toUpperCase())
          }
          autoComplete="cc-name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de tarjeta
        </label>
        <div className="relative">
          <Input
            placeholder="0000 0000 0000 0000"
            value={formatCardNumber(cardNumber)}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChangeNumber(e.target.value)
            }
            inputMode="numeric"
            autoComplete="cc-number"
            required
            className="pr-16"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Logo className="h-5" />
          </div>
        </div>
        <p
          className={`mt-1 text-xs ${
            cardNumber && !isValidLuhn(cardNumber)
              ? 'text-red-600'
              : 'text-transparent'
          }`}
        >
          Número inválido. Revisa los dígitos.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vencimiento (MM/AA)
          </label>
          <Input
            placeholder="MM/AA"
            value={expiry}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChangeExpiry(formatExpiry(e.target.value))
            }
            inputMode="numeric"
            autoComplete="cc-exp"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <Input
            placeholder="•••"
            value={cvv}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChangeCvv(onlyDigits(e.target.value).slice(0, 4))
            }
            onFocus={() => onCvvFocus(true)}
            onBlur={() => onCvvFocus(false)}
            inputMode="numeric"
            autoComplete="cc-csc"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={saveCard}
            onChange={(e) => onToggleSaveCard(e.target.checked)}
          />
          Guardar tarjeta como referencia
        </label>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CreditCard className="h-4 w-4" />
          Datos cifrados
        </div>
      </div>
    </>
  );
}
