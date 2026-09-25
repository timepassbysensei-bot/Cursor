/**
 * Generated artwork.
 *
 * Used in two places, both deliberately:
 *   1. demo mode, before Supabase is connected, so the layout can be judged
 *      without a single fake photograph of a real person;
 *   2. as the graceful fallback when a YouTube thumbnail fails to load.
 *
 * The output is deterministic for a given seed, so the same card always looks
 * the same between renders.
 */

const PALETTES: [string, string, string][] = [
  ["#5E9FE8", "#9B7CFF", "#08111F"],
  ["#52D6E8", "#5E9FE8", "#07131C"],
  ["#9B7CFF", "#E97366", "#0D0A1C"],
  ["#72BC8F", "#52D6E8", "#08150F"],
  ["#5E9FE8", "#52D6E8", "#081019"],
  ["#9B7CFF", "#5E9FE8", "#0B0C1C"],
];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(list: T[], index: number): T {
  return list[index % list.length];
}

/**
 * A layered, cinematic gradient "frame" — soft light pools, a hairline grid
 * and a couple of arc strokes. Rendered as an inline SVG data URI so it costs
 * no extra request and works offline.
 */
export function placeholderArt(seed: string, width = 1200, height = 800): string {
  const h = hashSeed(seed);
  const [a, b, base] = pick(PALETTES, h);
  const [c] = pick(PALETTES, h >> 3);

  const lightX = 18 + (h % 64);
  const lightY = 8 + ((h >> 5) % 60);
  const secondX = 10 + ((h >> 9) % 80);
  const secondY = 30 + ((h >> 13) % 60);
  const arcOffset = (h >> 17) % 220;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="presentation">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}" stop-opacity="0.42"/>
      <stop offset="1" stop-color="${b}" stop-opacity="0.18"/>
    </linearGradient>
    <radialGradient id="p1" cx="${lightX}%" cy="${lightY}%" r="55%">
      <stop offset="0" stop-color="${a}" stop-opacity="0.62"/>
      <stop offset="1" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="p2" cx="${secondX}%" cy="${secondY}%" r="60%">
      <stop offset="0" stop-color="${b}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${b}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#F7F8FC" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="${base}"/>
  <rect width="${width}" height="${height}" fill="url(#p1)"/>
  <rect width="${width}" height="${height}" fill="url(#p2)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <g fill="none" stroke="url(#g)" stroke-width="1.5" stroke-opacity="0.55">
    <path d="M-40 ${height * 0.72} C ${width * 0.28} ${height * 0.5}, ${width * 0.62} ${height * 0.92}, ${width + 40} ${height * 0.62}"/>
    <path d="M-40 ${height * 0.84} C ${width * 0.34} ${height * 0.62}, ${width * 0.7} ${height * 1.02}, ${width + 40} ${height * 0.74}"/>
  </g>
  <circle cx="${width * 0.78}" cy="${height * 0.22}" r="${Math.round(width * 0.044) + (arcOffset % 40)}" fill="none" stroke="${c}" stroke-opacity="0.35" stroke-width="1.5"/>
  <rect x="0" y="${height - 3}" width="${width}" height="3" fill="url(#g)" opacity="0.75"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Squarer variant for gallery tiles. */
export function placeholderSquare(seed: string, size = 900): string {
  return placeholderArt(seed, size, size);
}
