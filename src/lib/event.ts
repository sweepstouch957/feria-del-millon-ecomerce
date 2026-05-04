// ========================= lib/event.ts =========================
import { Calendar, MapPin, Users } from "lucide-react";

export const EVENT_ID = "6909aef219f26eec22af4220";
export const EVENT_BADGE_TEXT = "14ª Edición • 2026";
export const EVENT_DATES_LABEL = "2026";

export const EVENT_CARDS = [
  {
    icon: Calendar,
    title: EVENT_DATES_LABEL,
    description: "Una semana completa dedicada al arte contemporáneo colombiano",
    gradient: "from-neutral-800 to-neutral-900",
  },
  {
    icon: MapPin,
    title: "Bogotá, Colombia",
    description: "Celebrando la diversidad y riqueza del arte nacional",
    gradient: "from-neutral-800 to-neutral-900",
  },
  {
    icon: Users,
    title: "22+ Artistas",
    description: "Talentos emergentes y establecidos en diversas disciplinas",
    gradient: "from-neutral-800 to-neutral-900",
  },
];

export const STATS = [
  { number: "14", label: "Años de Trayectoria", suffix: "+" },
  { number: "500", label: "Artistas Participantes", suffix: "+" },
  { number: "2000", label: "Obras Exhibidas", suffix: "+" },
  { number: "50", label: "Ciudades Alcanzadas", suffix: "+" },
];