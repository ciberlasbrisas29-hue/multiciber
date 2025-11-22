const fs = require('fs');
const path = require('path');

// Rutas de origen y destino
const sourceDir = path.join(process.cwd(), 'Esta es la carpeta');
const publicDir = path.join(process.cwd(), 'public');

// Mapeo de iconos: { archivo_origen: [archivos_destino] }
const iconMapping = {
  'play_store_512.png': ['icon-512x512.png'],
  '1024.png': ['icon-192x192.png', 'apple-touch-icon.png']
};

console.log('🎨 Copiando iconos de la carpeta al proyecto...\n');

// Verificar que existe la carpeta de origen
if (!fs.existsSync(sourceDir)) {
  console.error('❌ Error: No se encontró la carpeta "Esta es la carpeta"');
  process.exit(1);
}

// Crear directorio public si no existe
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

let copiedCount = 0;
let skippedCount = 0;

// Copiar archivos
Object.entries(iconMapping).forEach(([sourceFile, destFiles]) => {
  const sourcePath = path.join(sourceDir, sourceFile);
  
  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  No se encontró: ${sourceFile}`);
    skippedCount++;
    return;
  }

  destFiles.forEach(destFile => {
    const destPath = path.join(publicDir, destFile);
    
    try {
      // Copiar archivo
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copiado: ${sourceFile} → ${destFile}`);
      copiedCount++;
    } catch (error) {
      console.error(`❌ Error al copiar ${sourceFile} → ${destFile}:`, error.message);
    }
  });
});

console.log(`\n✨ Proceso completado!`);
console.log(`   ✅ Copiados: ${copiedCount} archivos`);
if (skippedCount > 0) {
  console.log(`   ⚠️  No encontrados: ${skippedCount} archivos`);
}

console.log('\n📝 Nota:');
console.log('   - icon-512x512.png: Listo (512x512)');
console.log('   - icon-192x192.png: Copiado desde 1024.png (necesita redimensionarse)');
console.log('   - apple-touch-icon.png: Copiado desde 1024.png (necesita redimensionarse)');
console.log('\n💡 Para redimensionar, usa una herramienta online o instala sharp:');
console.log('   npm install sharp --save-dev');

