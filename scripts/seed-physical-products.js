require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const Product = require('../lib/models/Product');
const User = require('../lib/models/User');

const physicalProducts = [
  {
    name: 'Mouse Gaming RGB Logitech G203',
    description: 'Mouse gaming con iluminación RGB, 8000 DPI, 6 botones programables',
    price: 45000,
    cost: 25000,
    category: 'otros',
    unit: 'unidades',
    stock: 15,
    minStock: 3,
    barcode: 'MOU001',
    image: '/assets/images/products/mouse-gaming.jpg',
    tags: ['mouse', 'gaming', 'rgb', 'logitech']
  },
  {
    name: 'Auriculares Gaming HyperX Cloud',
    description: 'Auriculares gaming con micrófono, sonido 7.1 virtual, cómodos para largas sesiones',
    price: 85000,
    cost: 50000,
    category: 'otros',
    unit: 'unidades',
    stock: 8,
    minStock: 2,
    barcode: 'AUR001',
    image: '/assets/images/products/auriculares-gaming.jpg',
    tags: ['auriculares', 'gaming', 'hyperx', 'microfono']
  },
  {
    name: 'Teclado Mecánico RGB Redragon',
    description: 'Teclado mecánico con switches blue, retroiluminación RGB, anti-ghosting',
    price: 65000,
    cost: 38000,
    category: 'otros',
    unit: 'unidades',
    stock: 12,
    minStock: 2,
    barcode: 'TEC001',
    image: '/assets/images/products/teclado-mecanico.jpg',
    tags: ['teclado', 'mecanico', 'rgb', 'redragon']
  },
  {
    name: 'USB 32GB Kingston DataTraveler',
    description: 'Memoria USB 3.0 de 32GB, alta velocidad de transferencia, diseño compacto',
    price: 15000,
    cost: 8000,
    category: 'otros',
    unit: 'unidades',
    stock: 25,
    minStock: 5,
    barcode: 'USB001',
    image: '/assets/images/products/usb-32gb.jpg',
    tags: ['usb', 'memoria', 'kingston', '32gb']
  },
  {
    name: 'Cable HDMI 2.0 - 1.5 metros',
    description: 'Cable HDMI 2.0 de alta velocidad, soporte 4K, conectores dorados',
    price: 12000,
    cost: 6000,
    category: 'otros',
    unit: 'unidades',
    stock: 30,
    minStock: 5,
    barcode: 'CAB001',
    image: '/assets/images/products/cable-hdmi.jpg',
    tags: ['cable', 'hdmi', '4k', 'conectividad']
  },
  {
    name: 'Webcam Logitech C920 HD',
    description: 'Cámara web Full HD 1080p, micrófono integrado, ideal para streaming',
    price: 120000,
    cost: 75000,
    category: 'otros',
    unit: 'unidades',
    stock: 5,
    minStock: 1,
    barcode: 'WEB001',
    image: '/assets/images/products/webcam-hd.jpg',
    tags: ['webcam', 'hd', 'logitech', 'streaming']
  },
  {
    name: 'Mousepad Gaming XL',
    description: 'Mousepad gaming extra grande, superficie de control, base antideslizante',
    price: 25000,
    cost: 12000,
    category: 'otros',
    unit: 'unidades',
    stock: 20,
    minStock: 3,
    barcode: 'PAD001',
    image: '/assets/images/products/mousepad-xl.jpg',
    tags: ['mousepad', 'gaming', 'xl', 'superficie']
  },
  {
    name: 'Cargador Universal USB-C 65W',
    description: 'Cargador universal USB-C de 65W, compatible con laptops y smartphones',
    price: 35000,
    cost: 20000,
    category: 'otros',
    unit: 'unidades',
    stock: 10,
    minStock: 2,
    barcode: 'CAR001',
    image: '/assets/images/products/cargador-usbc.jpg',
    tags: ['cargador', 'usb-c', 'universal', '65w']
  },
  {
    name: 'Hub USB 4 Puertos',
    description: 'Hub USB 3.0 con 4 puertos, diseño compacto, plug and play',
    price: 18000,
    cost: 10000,
    category: 'otros',
    unit: 'unidades',
    stock: 15,
    minStock: 3,
    barcode: 'HUB001',
    image: '/assets/images/products/hub-usb.jpg',
    tags: ['hub', 'usb', '4puertos', 'expansion']
  },
  {
    name: 'Adaptador WiFi USB AC600',
    description: 'Adaptador WiFi USB dual band, velocidad hasta 600Mbps, antena externa',
    price: 22000,
    cost: 12000,
    category: 'otros',
    unit: 'unidades',
    stock: 18,
    minStock: 3,
    barcode: 'WIF001',
    image: '/assets/images/products/wifi-adapter.jpg',
    tags: ['wifi', 'adaptador', 'usb', 'ac600']
  },
  {
    name: 'Soporte para Laptop Ajustable',
    description: 'Soporte ergonómico para laptop, altura ajustable, plegable y portable',
    price: 40000,
    cost: 22000,
    category: 'otros',
    unit: 'unidades',
    stock: 8,
    minStock: 2,
    barcode: 'SOP001',
    image: '/assets/images/products/soporte-laptop.jpg',
    tags: ['soporte', 'laptop', 'ergonomico', 'ajustable']
  },
  {
    name: 'Disco Duro Externo 1TB',
    description: 'Disco duro externo USB 3.0 de 1TB, portable, compatible con PC y Mac',
    price: 85000,
    cost: 55000,
    category: 'otros',
    unit: 'unidades',
    stock: 6,
    minStock: 1,
    barcode: 'HDD001',
    image: '/assets/images/products/disco-externo.jpg',
    tags: ['disco', 'externo', '1tb', 'storage']
  },
  {
    name: 'Ventilador USB Portátil',
    description: 'Ventilador USB portátil, 3 velocidades, silencioso, ideal para escritorio',
    price: 15000,
    cost: 8000,
    category: 'otros',
    unit: 'unidades',
    stock: 12,
    minStock: 2,
    barcode: 'VEN001',
    image: '/assets/images/products/ventilador-usb.jpg',
    tags: ['ventilador', 'usb', 'portatil', 'silencioso']
  },
  {
    name: 'Protector de Pantalla Laptop 15"',
    description: 'Protector de pantalla anti-reflejo para laptops de 15 pulgadas',
    price: 20000,
    cost: 10000,
    category: 'otros',
    unit: 'unidades',
    stock: 15,
    minStock: 3,
    barcode: 'PRO001',
    image: '/assets/images/products/protector-pantalla.jpg',
    tags: ['protector', 'pantalla', '15inch', 'anti-reflejo']
  },
  {
    name: 'Limpiador de Pantallas Kit',
    description: 'Kit de limpieza para pantallas, incluye spray y paño de microfibra',
    price: 12000,
    cost: 6000,
    category: 'otros',
    unit: 'unidades',
    stock: 25,
    minStock: 5,
    barcode: 'LIM001',
    image: '/assets/images/products/kit-limpieza.jpg',
    tags: ['limpieza', 'pantallas', 'spray', 'microfibra']
  }
];

const seedPhysicalProducts = async () => {
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

    // Limpiar productos existentes (servicios)
    console.log('🧹 Limpiando productos de servicios anteriores...');
    const deletedCount = await Product.deleteMany({ createdBy: adminUser._id });
    console.log(`🗑️  Eliminados ${deletedCount.deletedCount} productos anteriores`);

    console.log('🔨 Creando productos físicos para el ciber...');
    
    let createdCount = 0;
    let errorCount = 0;

    for (const productData of physicalProducts) {
      try {
        // Crear el producto
        const product = new Product({
          ...productData,
          createdBy: adminUser._id,
          isActive: true
        });

        await product.save();
        console.log(`✅ Creado: ${productData.name} - Stock: ${productData.stock} - $${productData.price.toLocaleString()}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creando "${productData.name}":`, error.message);
        errorCount++;
      }
    }

    // Resumen de productos por categoría de precio
    const totalProducts = await Product.countDocuments({ createdBy: adminUser._id });
    const totalValue = await Product.aggregate([
      { $match: { createdBy: adminUser._id } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$stock'] } } } }
    ]);

    console.log('\n🎉 Inventario físico creado exitosamente!');
    console.log('==========================================');
    console.log(`✅ Productos creados: ${createdCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📦 Total en inventario: ${totalProducts} productos`);
    console.log(`💰 Valor total del inventario: $${totalValue[0]?.totalValue?.toLocaleString() || 0}`);
    console.log('==========================================');
    console.log('\n📱 Productos físicos incluidos:');
    console.log('• Accesorios gaming (mouse, teclados, auriculares)');
    console.log('• Dispositivos de almacenamiento (USB, discos externos)');
    console.log('• Conectividad (cables, adaptadores, hubs)');
    console.log('• Accesorios de trabajo (soportes, protectores)');
    console.log('• Dispositivos de captura (webcams)');
    console.log('• Productos de mantenimiento (limpieza)');
    console.log('\n🚀 Ve al inventario para ver todos los productos con stock e imágenes!');

  } catch (error) {
    console.error('❌ Error al crear inventario físico:', error.message);
    
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
  seedPhysicalProducts();
}

module.exports = seedPhysicalProducts;