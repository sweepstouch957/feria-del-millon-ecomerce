"use client";

import { ShopShell } from "@components/views/catalog/shared";

/* Acceso de artistas (login y recuperar contraseña) — port de "Acceso
   artistas" de Claude Design. Columna centrada de 420px: rótulo verde, título
   liviano, tarjeta blanca con campos de 52px y botón verde de 56px. Usa los
   tokens de la tienda (ShopShell), así sigue al modo claro/oscuro. */

const AUTH_CSS = `
.fdm-au{min-height:calc(100dvh - var(--nav-h,73px));display:flex;align-items:center;justify-content:center;padding:32px 16px 56px}
.fdm-au-col{width:100%;max-width:420px;display:flex;flex-direction:column;gap:24px}
.fdm-au-head{display:flex;flex-direction:column;gap:8px}
.fdm-au-h1{margin:0;font-size:36px;line-height:1.1;font-weight:300}
.fdm-au-lead{margin:0;font-size:16px;line-height:1.5;color:var(--fg2)}
.fdm-au-lead b{font-weight:500;color:var(--fg);overflow-wrap:anywhere}
.fdm-au-card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:16px}
.fdm-au-seg{display:flex;padding:4px;background:var(--tile);border-radius:999px}
.fdm-au-seg button{flex:1 1 0;min-width:0;height:44px;border:none;background:transparent;color:var(--fg);border-radius:999px;font-size:14px;cursor:pointer;transition:background .2s}
.fdm-au-seg button[aria-pressed="true"]{background:var(--card);font-weight:500;box-shadow:0 1px 2px rgba(17,17,17,.08)}
.fdm-au-field{display:flex;flex-direction:column;gap:6px}
.fdm-au-field label,.fdm-au-row label{font-size:14px;font-weight:500}
.fdm-au-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.fdm-au-row a{font-size:14px;color:var(--fg2);text-decoration:underline;text-underline-offset:3px}
.fdm-au-input{height:52px;width:100%;padding:0 16px;border:1px solid var(--line2);border-radius:12px;background:var(--card);font:inherit;font-size:16px;color:var(--fg);scroll-margin-top:calc(var(--nav-h,73px) + 24px);transition:border-color .2s}
.fdm-au-input:focus{outline:none;border-color:var(--green);box-shadow:0 0 0 3px var(--green-soft)}
.fdm-au-input[aria-invalid="true"]{border-color:var(--heart)}
.fdm-au-pass{position:relative}
.fdm-au-pass .fdm-au-input{padding-right:96px}
.fdm-au-pass button{position:absolute;right:4px;top:4px;height:44px;padding:0 12px;border:none;background:transparent;font-size:14px;color:var(--fg);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.fdm-au-hint{font-size:13px;color:var(--fg2)}
.fdm-au-hint.is-warn{color:var(--heart)}
.fdm-au-check{display:flex;align-items:center;gap:10px;min-height:28px;font-size:14px;color:var(--fg2);cursor:pointer}
.fdm-au-check input{width:18px;height:18px;margin:0}
.fdm-au-submit{height:56px;border:none;background:var(--green);color:#fff;border-radius:999px;font-size:16px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:filter .2s,opacity .2s}
.fdm-au-submit:hover:not(:disabled){filter:brightness(.9);color:#fff}
.fdm-au-submit:disabled{opacity:.6;cursor:wait}
.fdm-au-ghost{height:48px;border:1px solid var(--line2);background:transparent;color:var(--fg);border-radius:999px;font-size:15px;cursor:pointer;transition:border-color .2s}
.fdm-au-ghost:hover{border-color:var(--fg)}
.fdm-au-link{align-self:flex-start;height:44px;padding:0;border:none;background:transparent;font-size:14px;color:var(--fg2);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.fdm-au-ok{padding:20px;background:var(--green-soft);border-radius:12px;display:flex;flex-direction:column;gap:6px}
.fdm-au-ok .t{font-size:18px;font-weight:500;color:var(--green-deep)}
.fdm-au-ok .s{font-size:15px;line-height:1.5;color:var(--fg)}
.fdm-au-ok .s b{font-weight:500;overflow-wrap:anywhere}
.fdm-au-ok button{align-self:flex-start;height:44px;padding:0;border:none;background:transparent;font-size:14px;color:var(--green-deep);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.fdm-au-err{padding:12px 16px;border-radius:12px;background:color-mix(in srgb,var(--heart) 10%,transparent);color:var(--fg);font-size:14px;line-height:1.5}
.fdm-au-info{padding:12px 16px;border-radius:12px;background:var(--green-soft);font-size:14px;line-height:1.5}
.fdm-au-foot{margin:0;font-size:15px;line-height:1.5;color:var(--fg2);text-align:center}
.fdm-au-foot a{color:var(--fg);text-decoration:underline;text-underline-offset:3px}
.fdm-au-steps{display:flex;gap:6px}
.fdm-au-steps i{flex:1;height:3px;border-radius:999px;background:var(--line)}
.fdm-au-steps i.is-on{background:var(--green)}
.fdm-au-meter{display:flex;align-items:center;gap:10px}
.fdm-au-meter .bars{flex:1;display:flex;gap:4px}
.fdm-au-meter .bars i{flex:1;height:3px;border-radius:999px;background:var(--line);transition:background .3s}
.fdm-au-meter span{font-size:13px;white-space:nowrap}
@media (max-width:480px){.fdm-au{align-items:flex-start;padding-top:24px}.fdm-au-h1{font-size:32px}.fdm-au-card{padding:20px}}
`;

export function AuthShell({ eyebrow, title, lead, children, foot }: { eyebrow: string; title: string; lead?: React.ReactNode; children: React.ReactNode; foot?: React.ReactNode }) {
  return (
    <ShopShell>
      <style>{AUTH_CSS}</style>
      <main className="fdm-au">
        <div className="fdm-au-col">
          <div className="fdm-au-head">
            <span className="fdm-eyebrow">{eyebrow}</span>
            <h1 className="fdm-au-h1">{title}</h1>
            {lead && <p className="fdm-au-lead">{lead}</p>}
          </div>
          {children}
          {foot && <p className="fdm-au-foot">{foot}</p>}
        </div>
      </main>
    </ShopShell>
  );
}

/** Campo de contraseña con "Mostrar / Ocultar" y aviso de Bloq Mayús. */
export function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggle,
  onCaps,
  autoComplete,
  placeholder,
  invalid,
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  onCaps?: (on: boolean) => void;
  autoComplete: string;
  placeholder?: string;
  invalid?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const caps = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const on = e.getModifierState?.("CapsLock");
    if (typeof on === "boolean") onCaps?.(on);
  };
  return (
    <div className="fdm-au-pass">
      <input
        id={id}
        ref={inputRef}
        className="fdm-au-input"
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyUp={caps}
        onKeyDown={caps}
        onBlur={() => onCaps?.(false)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
      />
      <button type="button" aria-pressed={show} onClick={onToggle}>
        {show ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
