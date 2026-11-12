/* Panel de cuenta (/admin/account): usa el sistema del estudio (studioTheme).
   Aquí solo queda lo propio de esta página: las pestañas de shadcn y la
   tarjeta de dos columnas. Campos, botones y colores los pone STUDIO_CSS. */

import { EYEBROW as STUDIO_EYEBROW, STUDIO_CSS, STUDIO_VARS, mix as studioMix } from "./studioTheme";

export const mix = studioMix;
export const EYEBROW = STUDIO_EYEBROW;

export const ROOT_VARS = {
  ...STUDIO_VARS,
  background: "var(--bg)",
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden",
} as React.CSSProperties;

export const ACCOUNT_CSS = `
  ${STUDIO_CSS}

  .fdm-acc-tablist {
    display: flex; flex-wrap: wrap; gap: 4px;
    background: var(--tile); border: 0; border-radius: 999px;
    padding: 4px; height: auto; box-shadow: none; width: 100%; max-width: 560px;
    justify-content: flex-start;
  }
  .fdm-studio button.fdm-acc-tab {
    flex: 1 1 0; min-width: 0; height: 44px; padding: 0 12px;
    background: transparent; border: 0; border-radius: 999px; cursor: pointer;
    font-size: 14px; font-weight: 400; color: var(--fg); white-space: nowrap;
    transition: background .2s ease;
  }
  .fdm-studio button.fdm-acc-tab[data-state="active"] { background: var(--card); font-weight: 500; box-shadow: none; }

  .fdm-acc-card {
    display: grid; gap: 24px;
    padding: 20px; background: var(--card);
    border: 1px solid var(--line); border-radius: 16px;
  }
  @media (min-width: 861px) {
    .fdm-acc-card { grid-template-columns: minmax(0, 1fr) minmax(0, 1.9fr); gap: 40px; padding: 28px; }
  }
  .fdm-acc .rounded-full { border-radius: 999px; }
  .fdm-acc [data-slot="separator"], .fdm-acc [role="none"] { background: var(--line3); }
`;
