# Feria del Millón — Design System v2

Sistema de diseño editorial de la landing (rediseño 2026). Úsalo como base para
páginas futuras (catálogo, obra, tickets, convocatoria) para que todo se vea
coherente.

Fuente de verdad en código:
- Tokens de tema: [app/layout.tsx](app/layout.tsx) (inyecta las CSS vars `--fdm-*`).
- Base + helpers: [app/globals.css](app/globals.css) (bloque `FDM v2`, scope `.fdm-v2`).
- Contenido editable: [src/lib/siteDefaults.ts](src/lib/siteDefaults.ts) (todo el copy es config, editable desde el admin → Personalización).

---

## 1. Paleta (CSS variables)

Todas viven en `:root`, inyectadas server-side desde el tema del admin. El modo
oscuro se activa con `:root[data-theme="dark"]` (toggle en el navbar, persistido
en `localStorage['fdm-theme']`).

| Token | Claro | Oscuro | Uso |
|-------|-------|--------|-----|
| `--fdm-bg` | `#F7F6F2` | `#0C0C0B` | Fondo de página (crema) |
| `--fdm-fg` | `#0B0B0A` | `#F0EFEA` | Texto principal |
| `--fdm-panel` | `#0B0B0A` | `#161614` | Secciones oscuras (hero, obras, convocatoria) |
| `--fdm-green` | `#3FA46E` | = | Acento (hover, precios, kickers) |
| `--fdm-green-deep` | `#14513C` | `#0F3C2C` | Sección Sedes |
| `--fdm-on-dark` | `#F5F4EF` | = | Texto sobre fondos oscuros |

Texto sobre fondo: usa `color-mix(in srgb, var(--fdm-fg) N%, transparent)` para
las jerarquías (48% labels, 58–65% secundario, 100% principal).

## 2. Tipografía

- **Display / UI:** `Jost` (200, 300, 400, 500). Cargada en `<head>` (Google Fonts).
- **Mono / labels:** `Instrument Sans` (clase `.fdm-mono`) para números, kickers y metadatos.
- Títulos grandes: `font-weight: 200`, `letter-spacing: 0.004em`, `text-transform: uppercase` en héroes.
- Cuerpo: `font-weight: 300`, `line-height: 1.65–1.7`.
- Kickers/labels: `font-size: 10.5px`, `letter-spacing: 0.24–0.28em`, uppercase.

Escala de títulos (responsiva con `clamp`):
- H1 hero: `clamp(50px, 11.2vw, 190px)`
- H2 sección: `clamp(30px, 4.2vw, 66px)`
- H2 convocatoria: `clamp(34px, 5.4vw, 92px)`

## 3. Layout

- Contenedor: `max-width: 1600px; margin: 0 auto`.
- Padding de sección: `clamp(64px, 9vw, 140px) clamp(20px, 4vw, 56px)`.
- Grids fluidos: `repeat(auto-fit, minmax(min(100%, Npx), 1fr))`.
- Separadores tipo "hairline": grid `gap: 1px` sobre fondo `color-mix(... 14–24%)`.

## 4. Componentes

### Kicker (`01 —— Título`)
Número + línea + label en verde (o gris sobre oscuro). Ver `Kicker` en [app/page.tsx](app/page.tsx).

### Botón pill
- Sólido: `height: 54px; border-radius: 999px; padding: 0 34px; text-transform: uppercase; letter-spacing: 0.2em; font-size: 11.5px`.
- Outline: mismo tamaño, `border: 1px solid` translúcido.
- Hover: fondo → `--fdm-green`, texto → `#0B0B0A`.

### Link editorial (`.fdm-link`)
Subrayado que aparece en hover con color verde.

### Card técnica (`.fdm-tech`)
Imagen en grayscale que se colorea en hover + outline verde. Overlay gradiente inferior.

### Card programa (`.fdm-prog`)
Borde fino; en hover invierte a panel oscuro con texto claro.

### Ticker (marquee)
`animation: fdm-marquee 46s linear infinite` sobre panel oscuro. Duplica el
contenido para loop sin cortes.

### Navbar
Sticky, translúcido con `backdrop-filter: blur(14px)`, barra de progreso de
scroll en verde, toggle de tema, pestañas configurables desde el admin.

## 5. Animaciones

- `fdm-marquee` — ticker.
- `fdm-rise` — entrada `opacity + translateY(18px)`.
- Respeta `prefers-reduced-motion` (ya global en `globals.css`).

## 6. Todo es configurable (admin → Personalización)

- **Tema:** colores.
- **Navbar:** pestañas (texto, ruta, mostrar/ocultar, habilitar, reordenar).
- **Secciones:** orden + visibilidad (about, featured, techniques, sedes, programs, convocatoria, newsletter).
- **Copys:** hero, about, sedes, programas, convocatoria, boletín, contacto, redes.
- **Obras destacadas:** se cargan reales del catálogo (`useArtworksCursor`).

## 7. Cómo aplicar en una página nueva

1. Envuelve el contenido en `<div className="fdm-v2">`.
2. Usa las CSS vars (`var(--fdm-bg)`, `var(--fdm-fg)`, `var(--fdm-green)`, …) — nunca colores hardcodeados.
3. Reusa `Kicker`, los estilos `pill`/`pillOutline` y las clases `.fdm-link` / `.fdm-mono`.
4. Padding y grids con los `clamp()` de arriba.
5. Texto que el cliente deba poder cambiar → mételo en `siteDefaults.ts` + editor en el admin.
