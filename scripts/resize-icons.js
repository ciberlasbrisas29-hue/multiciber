const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const sourceDir = path.join(process.cwd(), 'Esta es la carpeta');

// Tamaños requeridos
const iconSizes = [
  { size: 192, name: 'icon-192x192.png', source: '1024.png' },
  { size: 512, name: 'icon-512x512.png', source: 'play_store_512.png' },
  { size: 180, name: 'apple-touch-icon.png', source: '1024.png' }
];

console.log('🎨 Redimensionando iconos para PWA...\n');

// Usar el 1024 original como fuente para los tamaños más pequeños
const resizePromises = iconSizes.map(({ size, name, source }) => {
  const sourcePath = path.join(sourceDir, source);
  const outputPath = path.join(publicDir, name);
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Error: No se encontró el icono fuente (${source})`);
    return Promise.resolve(); // Continuar con los demás
  }
  
  // Para el 512, si el play_store_512 existe, solo copiarlo
  if (name === 'icon-512x512.png' && source === 'play_store_512.png') {
    if (fs.existsSync(outputPath)) {
      console.log(`✅ ${name} ya existe (512x512)`);
      return Promise.resolve();
    }
    console.log(`📋 Copiando ${source} como ${name}...`);
    fs.copyFileSync(sourcePath, outputPath);
    console.log(`✅ Copiado: ${name} (512x512)`);
    return Promise.resolve();
  }
  
  console.log(`📏 Redimensionando ${source} a ${size}x${size}...`);
  
  // Redimensionar usando sharp
  return sharp(sourcePath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png({ quality: 100 })
    .toFile(outputPath)
    .then(() => {
      console.log(`✅ Creado: ${name} (${size}x${size})`);
    })
    .catch((error) => {
      console.error(`❌ Error al crear ${name}:`, error.message);
    });
});

Promise.all(resizePromises)
  .then(() => {
    console.log('\n✨ Iconos redimensionados exitosamente!');
    console.log('\n📝 Archivos generados:');
    iconSizes.forEach(({ size, name }) => {
      const filePath = path.join(publicDir, name);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`   ✅ ${name} (${size}x${size}) - ${(stats.size / 1024).toFixed(2)} KB`);
      }
    });
  })
  .catch((error) => {
    console.error('❌ Error general:', error);
    process.exit(1);
  });

