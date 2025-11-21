require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const Product = require('../lib/models/Product');
const User = require('../lib/models/User');

const sampleProducts = [
  {
    name: 'Internet - 1 Hora',
    description: 'Servicio de internet por una hora completa',
    price: 5000,
    cost: 2000,
    category: 'internet',
    unit: 'horas',
    stock: 0,
    minStock: 0,
    barcode: 'INT001',
    tags: ['internet', 'tiempo', 'navegacion']
  },
  {
    name: 'Internet - 30 Minutos',
    description: 'Servicio de internet por media hora',
    price: 2500,
    cost: 1000,
    category: 'internet',
    unit: 'minutos',
    stock: 0,
    minStock: 0,
    barcode: 'INT002',
    tags: ['internet', 'tiempo', 'navegacion']
  },
  {
    name: 'Impresión Blanco/Negro',
    description: 'Impresión en papel tamaño carta blanco y negro',
    price: 500,
    cost: 200,
    category: 'impresion',
    unit: 'hojas',
    stock: 500,
    minStock: 50,
    barcode: 'IMP001',
    tags: ['impresion', 'papel', 'blanco', 'negro']
  },
  {
    name: 'Impresión a Color',
    description: 'Impresión en papel tamaño carta a color',
    price: 1200,
    cost: 500,
    category: 'impresion',
    unit: 'hojas',
    stock: 200,
    minStock: 20,
    barcode: 'IMP002',
    tags: ['impresion', 'papel', 'color']
  },
  {
    name: 'Copia Blanco/Negro',
    description: 'Fotocopia en papel tamaño carta blanco y negro',
    price: 300,
    cost: 100,
    category: 'copia',
    unit: 'hojas',
    stock: 1000,
    minStock: 100,
    barcode: 'COP001',
    tags: ['copia', 'fotocopia', 'blanco', 'negro']
  },
  {
    name: 'Copia a Color',
    description: 'Fotocopia en papel tamaño carta a color',
    price: 800,
    cost: 300,
    category: 'copia',
    unit: 'hojas',
    stock: 300,
    minStock: 30,
    barcode: 'COP002',
    tags: ['copia', 'fotocopia', 'color']
  },
  {
    name: 'Escaneo Simple',
    description: 'Escaneo de documentos a formato digital PDF',
    price: 1000,
    cost: 200,
    category: 'escaneo',
    unit: 'hojas',
    stock: 0,
    minStock: 0,
    barcode: 'ESC001',
    tags: ['escaneo', 'digital', 'pdf', 'documentos']
  },
  {
    name: 'Descarga de Archivos',
    description: 'Servicio de descarga de archivos desde internet',
    price: 2000,
    cost: 500,
    category: 'otros',
    unit: 'mb',
    stock: 0,
    minStock: 0,
    barcode: 'DES001',
    tags: ['descarga', 'archivos', 'internet']
  },
  {
    name: 'Quemado de CD/DVD',
    description: 'Grabación de archivos en CD o DVD',
    price: 3000,
    cost: 1500,
    category: 'otros',
    unit: 'unidades',
    stock: 50,
    minStock: 10,
    barcode: 'QUE001',
    tags: ['cd', 'dvd', 'grabacion', 'respaldo']
  },
  {
    name: 'Impresión Formato A3',
    description: 'Impresión en papel tamaño A3 blanco y negro',
    price: 2000,
    cost: 800,
    category: 'impresion',
    unit: 'hojas',
    stock: 100,
    minStock: 20,
    barcode: 'IMP003',
    tags: ['impresion', 'a3', 'grande', 'blanco', 'negro']
  }
];

const seedProducts = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/multiciber');
    console.log('✅ Conectado a MongoDB exitosamente');

    // Buscar el usuario admin
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('❌ No se encontró el usuario admin. Ejecuta primero: node scripts/init-db.js');
      return;
    }

    console.log(`👤 Usuario admin encontrado: ${adminUser.username}`);

    // Verificar si ya existen productos
    const existingProducts = await Product.countDocuments({ createdBy: adminUser._id });
    
    if (existingProducts > 0) {
      console.log(`⚠️  Ya existen ${existingProducts} productos. ¿Deseas continuar? (Esto agregará más productos)`);
      console.log('   Si quieres limpiar primero, usa: db.products.deleteMany({})');
    }

    console.log('🔨 Creando productos de ejemplo...');
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const productData of sampleProducts) {
      try {
        // Verificar si ya existe un producto con el mismo nombre o código de barras
        const existingProduct = await Product.findOne({
          $or: [
            { name: productData.name, createdBy: adminUser._id },
            { barcode: productData.barcode, createdBy: adminUser._id }
          ]
        });

        if (existingProduct) {
          console.log(`⏭️  Saltando "${productData.name}" - ya existe`);
          skippedCount++;
          continue;
        }

        // Crear el producto
        const product = new Product({
          ...productData,
          createdBy: adminUser._id,
          isActive: true
        });

        await product.save();
        console.log(`✅ Creado: ${productData.name} - $${productData.price}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creando "${productData.name}":`, error.message);
      }
    }

    console.log('\n🎉 Proceso completado!');
    console.log('=====================================');
    console.log(`✅ Productos creados: ${createdCount}`);
    console.log(`⏭️  Productos saltados: ${skippedCount}`);
    console.log(`📦 Total en base de datos: ${await Product.countDocuments({ createdBy: adminUser._id })}`);
    console.log('=====================================');
    console.log('\n🚀 Ahora puedes ver los productos en el inventario!');

  } catch (error) {
    console.error('❌ Error al crear productos:', error.message);
    
    if (error.message.includes('MONGODB_URI')) {
      console.log('💡 Asegúrate de configurar MONGODB_URI en tu archivo .env.local');
    } else {
      console.log('💡 Verifica tu conexión a MongoDB y que el usuario admin exista.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;