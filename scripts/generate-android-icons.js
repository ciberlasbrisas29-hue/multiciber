const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración de iconos de Android por densidad
const androidIconSizes = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

// Ruta del logo fuente
const sourceLogo = path.join(process.cwd(), 'public', 'assets', 'images', 'logo.png');
const androidResDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

// Verificar que el logo existe
if (!fs.existsSync(sourceLogo)) {
  console.error('❌ Error: No se encuentra el logo en:', sourceLogo);
  process.exit(1);
}

console.log('🎨 Generando iconos de Android desde el logo...\n');

// Función para generar un icono redondeado
async function generateRoundedIcon(input, output, size) {
  // Crear un icono cuadrado con fondo redondeado
  const radius = Math.floor(size * 0.25); // 25% del tamaño para esquinas redondeadas
  const padding = Math.floor(size * 0.1); // 10% de padding alrededor del logo
  const logoSize = size - (padding * 2);
  
  // Primero redimensionar el logo con padding
  const logo = await sharp(input)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 } // Fondo transparente
    })
    .png()
    .toBuffer();
  
  // Crear el fondo con esquinas redondeadas
  const background = Buffer.from(`
    <svg width="${size}" height="${size}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${radius}" fill="url(#grad)"/>
    </svg>
  `);
  
  // Combinar fondo y logo
  return sharp(background)
    .composite([{
      input: logo,
      top: padding,
      left: padding
    }])
    .png()
    .toFile(output);
}

// Función para generar un icono redondo (para ic_launcher_round)
async function generateRoundIcon(input, output, size) {
  // Crear un círculo perfecto
  const radius = size / 2;
  const padding = Math.floor(size * 0.1); // 10% de padding alrededor del logo
  const logoSize = size - (padding * 2);
  
  // Primero redimensionar el logo con padding
  const logo = await sharp(input)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 } // Fondo transparente
    })
    .png()
    .toBuffer();
  
  // Crear el fondo circular
  const background = Buffer.from(`
    <svg width="${size}" height="${size}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="url(#grad)"/>
    </svg>
  `);
  
  // Combinar fondo y logo
  return sharp(background)
    .composite([{
      input: logo,
      top: padding,
      left: padding
    }])
    .png()
    .toFile(output);
}

// Función para generar foreground (solo el logo, sin fondo)
async function generateForeground(input, output, size) {
  return sharp(input)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 } // Fondo transparente
    })
    .png()
    .toFile(output);
}

// Generar iconos para cada densidad
async function generateAllIcons() {
  for (const [density, size] of Object.entries(androidIconSizes)) {
    const densityDir = path.join(androidResDir, `mipmap-${density}`);
    
    // Crear directorio si no existe
    if (!fs.existsSync(densityDir)) {
      fs.mkdirSync(densityDir, { recursive: true });
    }
    
    // Generar ic_launcher.png (icono cuadrado con esquinas redondeadas)
    const launcherPath = path.join(densityDir, 'ic_launcher.png');
    await generateRoundedIcon(sourceLogo, launcherPath, size);
    console.log(`✓ Generado: mipmap-${density}/ic_launcher.png (${size}x${size})`);
    
    // Generar ic_launcher_round.png (icono circular)
    const launcherRoundPath = path.join(densityDir, 'ic_launcher_round.png');
    await generateRoundIcon(sourceLogo, launcherRoundPath, size);
    console.log(`✓ Generado: mipmap-${density}/ic_launcher_round.png (${size}x${size})`);
    
    // Generar ic_launcher_foreground.png (solo el logo para adaptive icons)
    // El foreground debe ser más pequeño que el icono total
    const foregroundSize = Math.floor(size * 0.7); // 70% del tamaño para dejar margen
    const foregroundPath = path.join(densityDir, 'ic_launcher_foreground.png');
    await generateForeground(sourceLogo, foregroundPath, foregroundSize);
    console.log(`✓ Generado: mipmap-${density}/ic_launcher_foreground.png (${foregroundSize}x${foregroundSize})`);
  }
  
  console.log('\n✅ ¡Iconos de Android generados exitosamente!');
  console.log('📱 Ahora ejecuta: npm run cap:sync\n');
}

generateAllIcons().catch(error => {
  console.error('❌ Error generando iconos:', error);
  process.exit(1);
});

