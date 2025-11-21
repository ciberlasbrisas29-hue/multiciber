const fs = require('fs');
const path = require('path');

// Este script genera iconos temporales simples
// Para iconos reales, usa una herramienta como sharp o canvas

const iconSizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

// Crear un SVG simple como placeholder
const createSVGIcon = (size, name) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">MC</text>
</svg>`;

  const publicDir = path.join(process.cwd(), 'public');
  const filePath = path.join(publicDir, name.replace('.png', '.svg'));
  
  // Crear como SVG temporal (los navegadores lo aceptarán)
  fs.writeFileSync(filePath, svg);
  console.log(`✓ Creado: ${name.replace('.png', '.svg')}`);
  
  // También crear un archivo .png placeholder (será un SVG renombrado, pero funciona para desarrollo)
  const pngPath = path.join(publicDir, name);
  fs.writeFileSync(pngPath, svg);
  console.log(`✓ Creado: ${name} (SVG como placeholder)`);
};

console.log('Generando iconos temporales...\n');

iconSizes.forEach(({ size, name }) => {
  createSVGIcon(size, name);
});

console.log('\n✅ Iconos temporales generados!');
console.log('⚠️  Nota: Estos son placeholders SVG. Para producción, genera PNG reales usando tu logo.');

