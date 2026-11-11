/* Precalienta en Cloudinary las derivaciones que usa la tienda.

   Cada ancho distinto de una imagen es una transformación nueva que Cloudinary
   genera en caliente la primera vez (0,8–1,8 s); después sale de su caché en
   ~25 ms. Este script pide, una vez, cada obra publicada en los anchos que
   next/image va a usar (ver deviceSizes en next.config.mjs), en AVIF y WebP.

   Uso:  node scripts/warm-images.mjs [apiBase] [eventId]
         apiBase por defecto: https://api3.sweepstouch.com/api
   Correrlo después de cada tanda grande de obras nuevas. Es idempotente. */

const API = (process.argv[2] || "https://api3.sweepstouch.com/api").replace(/\/+$/, "");
let EVENT = process.argv[3];
const WIDTHS = [400, 828, 1280]; // tarjeta (1x/2x) y visor de la obra
const ACCEPTS = ["image/avif,image/webp,image/*", "image/webp,image/*"]; // Chrome/Safari nuevo y Safari viejo
const PAR = 10;

const cloudinary = (src, w) => {
  const i = src.indexOf("/upload/");
  if (i < 0) return null;
  let tail = src.slice(i + 8);
  const first = tail.split("/")[0];
  if (/(^|,)(f_|q_|w_|h_|c_|dpr_|e_|g_)/.test(first)) tail = tail.slice(first.length + 1);
  return `${src.slice(0, i + 8)}f_auto,q_auto,w_${w},c_limit/${tail}`;
};

if (!EVENT) {
  const cur = await (await fetch(`${API}/event/events/current`)).json();
  EVENT = cur?.event?._id;
}
if (!EVENT) throw new Error("sin eventId");

const images = [];
let cursor;
do {
  const u = new URL(`${API}/catalogs/artworks`);
  u.searchParams.set("event", EVENT);
  u.searchParams.set("limit", "60");
  u.searchParams.set("lite", "1");
  if (cursor) u.searchParams.set("cursor", cursor);
  const page = await (await fetch(u)).json();
  for (const d of page.docs || []) if (typeof d.image === "string" && d.image.includes("res.cloudinary.com")) images.push(d.image);
  cursor = page.pageInfo?.nextCursor || null;
} while (cursor);
console.log(`${images.length} imágenes · ${WIDTHS.length} anchos · ${ACCEPTS.length} formatos`);

const jobs = [];
for (const src of images) for (const w of WIDTHS) for (const accept of ACCEPTS) jobs.push({ url: cloudinary(src, w), accept });
let done = 0, cold = 0, failed = 0;
const t0 = Date.now();
await Promise.all(
  Array.from({ length: PAR }, async () => {
    while (jobs.length) {
      const { url, accept } = jobs.shift();
      if (!url) continue;
      const t = Date.now();
      try {
        const r = await fetch(url, { headers: { accept } });
        await r.arrayBuffer();
        if (!r.ok) failed++;
        else if (Date.now() - t > 400) cold++;
      } catch {
        failed++;
      }
      if (++done % 200 === 0) console.log(`${done} listas · ${cold} estaban frías · ${failed} fallaron · ${Math.round((Date.now() - t0) / 1000)}s`);
    }
  })
);
console.log(`fin: ${done} pedidas · ${cold} estaban frías · ${failed} fallaron · ${Math.round((Date.now() - t0) / 1000)}s`);
