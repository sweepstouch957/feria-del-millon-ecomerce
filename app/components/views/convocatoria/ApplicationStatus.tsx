"use client";

export const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  pending_payment: { 
    label: "Pago pendiente", 
    color: "#fbbf24", 
    bg: "rgba(251, 191, 36, 0.12)", 
    icon: "💳", 
    desc: "Debes completar el pago para activar tu postulación." 
  },
  draft: { 
    label: "En borrador", 
    color: "#a1a1aa", 
    bg: "rgba(255, 255, 255, 0.08)", 
    icon: "✏️", 
    desc: "Tu postulación está en progreso. Completa el formulario y envíala." 
  },
  submitted: { 
    label: "Enviada", 
    color: "#4ade80", 
    bg: "rgba(74, 222, 128, 0.12)", 
    icon: "📨", 
    desc: "Tu postulación fue enviada. Está en espera de revisión." 
  },
  under_review: { 
    label: "En revisión", 
    color: "#60a5fa", 
    bg: "rgba(96, 165, 250, 0.12)", 
    icon: "🔍", 
    desc: "El equipo de curaduría está evaluando tu proyecto." 
  },
  accepted: { 
    label: "¡Aceptada!", 
    color: "#22c55e", 
    bg: "rgba(34, 197, 94, 0.15)", 
    icon: "🎉", 
    desc: "¡Felicitaciones! Tu postulación fue aceptada. Pronto recibirás instrucciones." 
  },
  rejected: { 
    label: "No seleccionada", 
    color: "#f87171", 
    bg: "rgba(248, 113, 113, 0.12)", 
    icon: "📋", 
    desc: "En esta ocasión tu postulación no fue seleccionada." 
  },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, color: "#374151", bg: "#f3f4f6", icon: "❓", desc: "" };
  return (
    <span style={{ 
      background: s.bg, 
      color: s.color, 
      border: `1px solid ${s.color}33`, 
      padding: "4px 14px", 
      borderRadius: 100, 
      fontSize: 13, 
      fontWeight: 700 
    }}>
      {s.icon} {s.label}
    </span>
  );
}
