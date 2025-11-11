'use client';

import { useState, useMemo } from 'react';
import type { ComponentProps } from 'react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Shield, CreditCard } from 'lucide-react';

/* ================================
   Utils de formato/validación
================================== */
const onlyDigits = (v = '') => v.replace(/\D/g, '');

const formatCardNumber = (v = '') =>
  onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim();

const detectBrand = (num = '') => {
  const n = onlyDigits(num);
  if (/^4\d{0,}$/.test(n)) return 'visa';
  if (/^(5[1-5]\d{0,}|2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)\d{0,})$/.test(n)) return 'mastercard';
  return 'generic';
};

const formatExpiry = (v = '') => {
  const d = onlyDigits(v).slice(0, 4);
  if (d.length <= 2) return d;
  return d.slice(0, 2) + '/' + d.slice(2);
};

const isValidLuhn = (num: string) => {
  const arr = onlyDigits(num).split('').reverse().map(n => parseInt(n, 10));
  if (arr.length < 12) return false;
  const sum = arr.reduce((acc, n, i) => {
    if (i % 2 === 1) {
      let dbl = n * 2;
      if (dbl > 9) dbl -= 9;
      return acc + dbl;
    }
    return acc + n;
  }, 0);
  return sum % 10 === 0;
};

const formatPriceCO = (price: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

/* ================================
   Logos inline VISA / Mastercard
================================== */
function VisaLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 20" aria-hidden="true">
      <rect width="64" height="20" rx="3" fill="#1A1F71" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fontFamily="Arial" fill="#fff" fontWeight="700">
        VISA
      </text>
    </svg>
  );
}

function McLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 20" aria-hidden="true">
      <rect width="64" height="20" rx="3" fill="#000" />
      <circle cx="28" cy="10" r="6.5" fill="#EB001B" />
      <circle cx="36" cy="10" r="6.5" fill="#F79E1B" />
    </svg>
  );
}

function GenericLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <div className={className + ' rounded-md bg-gray-900 text-white flex items-center justify-center px-2'}>
      <span className="text-[10px] tracking-widest font-semibold">CARD</span>
    </div>
  );
}

/* ================================
   Previsualización de Tarjeta
================================== */
function CardPreview({
  name,
  number,
  expiry,
  brand,
  cvvFocused,
}: {
  name: string;
  number: string;
  expiry: string;
  brand: 'visa' | 'mastercard' | 'generic';
  cvvFocused: boolean;
}) {
  const logo =
    brand === 'visa' ? <VisaLogo /> : brand === 'mastercard' ? <McLogo /> : <GenericLogo />;

  const maskedNumber = useMemo(() => {
    const digits = onlyDigits(number).padEnd(16, '•');
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ');
  }, [number]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className={`relative h-56 rounded-2xl shadow-xl overflow-hidden transition-transform duration-500 ${cvvFocused ? 'rotate-y-180' : ''}`}>
        {/* Frente */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest bg-white/15 px-2 py-1 rounded-full">Feria del Millón</div>
            {logo}
          </div>
          <div>
            <div className="text-xl md:text-2xl font-semibold tracking-widest">{maskedNumber}</div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>
                <div className="text-white/60 uppercase tracking-wide">Titular</div>
                <div className="font-medium">{name || 'TU NOMBRE'}</div>
              </div>
              <div className="text-right">
                <div className="text-white/60 uppercase tracking-wide">Vence</div>
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

/* ================================
   Formulario de Pago
================================== */
export type PaymentFormProps = {
  total: number;
  isProcessing: boolean;
  onPay: ComponentProps<typeof Button>['onClick'];
  onBack: ComponentProps<typeof Button>['onClick'];
};

export default function PaymentForm({ total, isProcessing, onPay, onBack }: PaymentFormProps) {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [cvvFocused, setCvvFocused] = useState(false);

  const brand = detectBrand(cardNumber) as 'visa' | 'mastercard' | 'generic';

  const isValid =
    cardName.trim().length >= 4 &&
    isValidLuhn(cardNumber) &&
    /^[0-1]\d\/\d{2}$/.test(expiry) &&
    (() => {
      const [m] = expiry.split('/');
      const mm = parseInt(m, 10);
      return mm >= 1 && mm <= 12 && /^\d{3,4}$/.test(cvv);
    })();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Método de Pago</h2>

      {/* Info de seguridad / Mercado Pago */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-semibold text-blue-900">Pago Seguro con Mercado Pago</span>
        </div>
        <p className="text-sm text-blue-700">
          Tu información está protegida con encriptación de nivel bancario. Aceptamos tarjetas de crédito, débito y más.
        </p>
      </div>

      {/* Encabezado con marcas */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Aceptamos</span>
          <div className="flex items-center gap-2">
            <VisaLogo />
            <McLogo />
            <GenericLogo />
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Total a pagar:{' '}
          <span className="font-semibold text-gray-900">{formatPriceCO(total)}</span>
        </div>
      </div>

      {/* Grid principal: preview + form */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* PREVIEW */}
        <div className="order-2 lg:order-1">
          <CardPreview
            name={cardName}
            number={cardNumber}
            expiry={expiry}
            brand={brand}
            cvvFocused={cvvFocused}
          />
          <div className="mt-4 text-xs text-gray-500">
            Pagos procesados por Mercado Pago. No almacenamos tu CVV.
          </div>
        </div>

        {/* FORM */}
        <div className="order-1 lg:order-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del titular</label>
              <Input
                placeholder="Como aparece en la tarjeta"
                value={cardName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardName(e.target.value.toUpperCase())}
                autoComplete="cc-name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta</label>
              <div className="relative">
                <Input
                  placeholder="0000 0000 0000 0000"
                  value={formatCardNumber(cardNumber)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardNumber(e.target.value)}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                  className="pr-16"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {brand === 'visa' ? (
                    <VisaLogo className="h-5" />
                  ) : brand === 'mastercard' ? (
                    <McLogo className="h-5" />
                  ) : (
                    <GenericLogo className="h-5" />
                  )}
                </div>
              </div>
              <p className={`mt-1 text-xs ${cardNumber && !isValidLuhn(cardNumber) ? 'text-red-600' : 'text-transparent'}`}>
                Número inválido. Revisa los dígitos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento (MM/AA)</label>
                <Input
                  placeholder="MM/AA"
                  value={expiry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiry(formatExpiry(e.target.value))}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <Input
                  placeholder="•••"
                  value={cvv}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
                  onFocus={() => setCvvFocused(true)}
                  onBlur={() => setCvvFocused(false)}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  required
                />
              </div>
            </div>

            {/* Opcional: cuotas / guardar tarjeta */}
            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                />
                Guardar tarjeta para futuras compras
              </label>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CreditCard className="h-4 w-4" />
                Datos cifrados
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={onPay}
                disabled={isProcessing || !isValid}
                className="w-full bg-blue-600 hover:bg-blue-700 mb-2"
                size="lg"
                title={!isValid ? 'Completa los campos correctamente' : undefined}
              >
                {isProcessing ? 'Procesando...' : `Pagar ${formatPriceCO(total)}`}
              </Button>
              <Button variant="outline" onClick={onBack} className="w-full mt-3">
                Volver a Información
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Badges de confianza */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">🔒 Cifrado TLS 1.2+</div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">🛡️ Prevención de fraude</div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">✅ Garantía de autenticidad</div>
      </div>
    </div>
  );
}

/* =========================================
   Exports opcionales si quieres reutilizar
=========================================== */
export {
  onlyDigits,
  formatCardNumber,
  formatExpiry,
  isValidLuhn,
  detectBrand,
  formatPriceCO,
  VisaLogo,
  McLogo,
  GenericLogo,
};
