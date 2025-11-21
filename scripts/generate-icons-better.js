const fs = require('fs');
const path = require('path');

// Script mejorado para generar iconos PWA
// Crea iconos SVG con mejor diseño que funcionan como placeholder

const iconSizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

// Crear un SVG mejorado con diseño más profesional
const createIconSVG = (size) => {
  const fontSize = Math.floor(size * 0.35);
  const borderRadius = Math.floor(size * 0.15);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow${size}">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad${size})" rx="${borderRadius}" filter="url(#shadow${size})"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="white" opacity="0.2"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" letter-spacing="-2">MC</text>
</svg>`;
};

console.log('🎨 Generando iconos temporales para PWA...\n');

const publicDir = path.join(process.cwd(), 'public');

// Verificar si existe el logo original
const logoPath = path.join(publicDir, 'assets', 'images', 'logo.png');
const hasLogo = fs.existsSync(logoPath);

if (hasLogo) {
  console.log('📷 Logo encontrado en:', logoPath);
  console.log('💡 Para iconos PNG reales, usa una herramienta online o instala sharp:\n');
  console.log('   npm install sharp --save-dev');
  console.log('   (Luego actualiza este script para usar sharp)\n');
}

iconSizes.forEach(({ size, name }) => {
  const svg = createIconSVG(size);
  const filePath = path.join(publicDir, name);
  
  // Guardar como PNG (aunque sea SVG, algunos navegadores lo aceptan)
  fs.writeFileSync(filePath, svg);
  console.log(`✅ Creado: ${name} (${size}x${size})`);
});

console.log('\n✨ Iconos temporales generados exitosamente!');
console.log('\n📱 Para iOS:');
console.log('   1. Despliega la app en Vercel (HTTPS requerido)');
console.log('   2. Abre Safari en iOS');
console.log('   3. Ve a tu URL');
console.log('   4. Toca "Compartir" → "Añadir a pantalla de inicio"');
console.log('\n⚠️  Nota: Estos son placeholders SVG. Para producción:');
console.log('   - Usa https://realfavicongenerator.net/');
console.log('   - O instala sharp y actualiza el script para generar PNG reales');

