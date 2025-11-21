require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const Product = require('../lib/models/Product');
const User = require('../lib/models/User');

// Lista de productos de ejemplo que queremos eliminar
const sampleProductNames = [
  'Internet - 1 Hora',
  'Internet - 30 Minutos',
  'Impresión Blanco/Negro',
  'Impresión a Color',
  'Copia Blanco/Negro',
  'Copia a Color',
  'Escaneo Simple',
  'Descarga de Archivos',
  'Quemado de CD/DVD',
  'Impresión Formato A3',
  'Mouse Gaming RGB Logitech G203',
  'Auriculares Gaming HyperX Cloud',
  'Teclado Mecánico RGB Redragon',
  'USB 32GB Kingston DataTraveler',
  'Cable HDMI 2.0 - 1.5 metros',
  'Webcam Logitech C920 HD',
  'Mousepad Gaming XL',
  'Cargador Universal USB-C 65W',
  'Hub USB 4 Puertos',
  'Adaptador WiFi USB AC600',
  'Soporte para Laptop Ajustable',
  'Disco Duro Externo 1TB',
  'Ventilador USB Portátil',
  'Protector de Pantalla Laptop 15"',
  'Limpiador de Pantallas Kit'
];

const cleanSampleProducts = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/multiciber');
    console.log('✅ Conectado a MongoDB exitosamente');

    // Buscar el usuario admin
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('❌ No se encontró el usuario admin');
      return;
    }

    console.log(`👤 Usuario admin encontrado: ${adminUser.username}`);

    // Mostrar todos los productos actuales
    const allProducts = await Product.find({ createdBy: adminUser._id });
    console.log(`\n📦 Productos actuales en el inventario (${allProducts.length}):`);
    
    allProducts.forEach((product, index) => {
      const isSample = sampleProductNames.includes(product.name);
      const icon = isSample ? '🗑️' : '✅';
      console.log(`${icon} ${index + 1}. ${product.name} - $${product.price.toLocaleString()}`);
    });

    // Contar productos de ejemplo vs productos reales
    const sampleProducts = allProducts.filter(product => 
      sampleProductNames.includes(product.name)
    );
    
    const realProducts = allProducts.filter(product => 
      !sampleProductNames.includes(product.name)
    );

    console.log(`\n📊 Resumen:`);
    console.log(`🗑️  Productos de ejemplo a eliminar: ${sampleProducts.length}`);
    console.log(`✅ Productos reales a conservar: ${realProducts.length}`);

    if (sampleProducts.length === 0) {
      console.log('\n🎉 No hay productos de ejemplo para eliminar. ¡Todo limpio!');
      return;
    }

    // Eliminar productos de ejemplo
    console.log('\n🧹 Eliminando productos de ejemplo...');
    
    const deleteResult = await Product.deleteMany({
      createdBy: adminUser._id,
      name: { $in: sampleProductNames }
    });

    console.log(`\n🎉 Limpieza completada!`);
    console.log('=====================================');
    console.log(`🗑️  Productos eliminados: ${deleteResult.deletedCount}`);
    console.log(`✅ Productos conservados: ${realProducts.length}`);
    console.log(`📦 Total final en inventario: ${realProducts.length}`);
    console.log('=====================================');

    if (realProducts.length > 0) {
      console.log('\n✅ Productos conservados:');
      realProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - $${product.price.toLocaleString()} (Stock: ${product.stock})`);
      });
    }

    console.log('\n🚀 ¡Inventario limpio! Solo tus productos reales permanecen.');

  } catch (error) {
    console.error('❌ Error al limpiar productos:', error.message);
    
    if (error.message.includes('MONGODB_URI')) {
      console.log('💡 Asegúrate de configurar MONGODB_URI en tu archivo .env.local');
    } else {
      console.log('💡 Verifica tu conexión a MongoDB.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  console.log('🧹 Script de limpieza de productos de ejemplo');
  console.log('Este script eliminará solo los productos de ejemplo/demo');
  console.log('y conservará todos los productos que hayas creado tú.\n');
  
  cleanSampleProducts();
}

module.exports = cleanSampleProducts;