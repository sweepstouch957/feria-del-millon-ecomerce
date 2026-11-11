/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Pocos anchos a propósito: cada ancho distinto es una derivación nueva en
    // Cloudinary (≈1 s la primera vez). Con 4 anchos el catálogo entero se
    // precalienta con `node scripts/warm-images.mjs` y después sale del CDN.
    deviceSizes: [400, 828, 1280, 1920],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ]
  }
};
export default nextConfig;
