#!/usr/bin/env node
// Génère public/logo.png (600x60, bandeau horizontal pour Google News) et
// public/logo-square.png (512x512, variant carré pour schema Organization).
// Sharp rasterise un SVG avec texte — zéro dépendance de police exotique.

import sharp from "sharp";
import path from "node:path";

const NAVY = "#0B1733";
const PRIMARY = "#ff5a1f";
const OUT_DIR = path.resolve("public");

async function renderSvgToPng(svg, destPath, width, height) {
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(width, height, { fit: "contain", background: NAVY })
    .png({ quality: 95 })
    .toFile(destPath);
  console.log(`[logo] ${destPath}`);
}

const wordmarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" viewBox="0 0 600 60">
  <rect width="600" height="60" fill="${NAVY}"/>
  <g font-family="Arial, Helvetica, sans-serif" font-weight="900" text-anchor="middle">
    <text x="300" y="38" font-size="28" fill="white" letter-spacing="2">ALTITUDE TRAIL</text>
    <rect x="242" y="45" width="116" height="3" fill="${PRIMARY}"/>
  </g>
</svg>`;

const squareSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${NAVY}"/>
  <g font-family="Arial, Helvetica, sans-serif" font-weight="900" text-anchor="middle">
    <text x="256" y="240" font-size="64" fill="white" letter-spacing="3">ALTITUDE</text>
    <text x="256" y="310" font-size="64" fill="white" letter-spacing="3">TRAIL</text>
    <rect x="180" y="340" width="152" height="6" fill="${PRIMARY}"/>
    <text x="256" y="390" font-size="20" fill="#94a3b8" letter-spacing="6" font-weight="600">LE MEDIA TRAIL</text>
    <text x="256" y="418" font-size="20" fill="#94a3b8" letter-spacing="6" font-weight="600">DE RÉFÉRENCE</text>
  </g>
</svg>`;

await renderSvgToPng(wordmarkSvg, path.join(OUT_DIR, "logo.png"), 600, 60);
await renderSvgToPng(squareSvg, path.join(OUT_DIR, "logo-square.png"), 512, 512);
