require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const Sale = require('../lib/models/Sale');
const Product = require('../lib/models/Product');
const User = require('../lib/models/User');

const sampleSales = [
  {
    type: 'product',
    status: 'paid',
    paymentMethod: 'cash',
    items: [
      {
        productName: 'nails',
        quantity: 2,
        unitPrice: 20,
        totalPrice: 40
      }
    ],
    subtotal: 40,
    total: 40,
    concept: 'Venta de nails',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 día atrás
  },
  {
    type: 'free',
    status: 'paid',
    paymentMethod: 'cash',
    freeSaleAmount: 15000,
    subtotal: 15000,
    total: 15000,
    concept: 'Servicio de internet - 2 horas',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 días atrás
  },
  {
    type: 'free',
    status: 'paid',
    paymentMethod: 'card',
    freeSaleAmount: 8000,
    subtotal: 8000,
    total: 8000,
    concept: 'Impresión de documentos',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 días atrás
  },
  {
    type: 'free',
    status: 'debt',
    paymentMethod: 'cash',
    freeSaleAmount: 25000,
    subtotal: 25000,
    total: 25000,
    paidAmount: 10000,
    debtAmount: 15000,
    concept: 'Servicio de diseño gráfico',
    client: {
      name: 'María González',
      phone: '3001234567'
    },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 días atrás
  },
  {
    type: 'free',
    status: 'paid',
    paymentMethod: 'transfer',
    freeSaleAmount: 12000,
    subtotal: 12000,
    total: 12000,
    concept: 'Copia de documentos y escaneo',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 días atrás
  },
  {
    type: 'free',
    status: 'paid',
    paymentMethod: 'cash',
    freeSaleAmount: 30000,
    subtotal: 30000,
    total: 30000,
    concept: 'Internet - día completo',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 días atrás
  },
  {
    type: 'free',
    status: 'paid',
    paymentMethod: 'cash',
    freeSaleAmount: 5000,
    subtotal: 5000,
    total: 5000,
    concept: 'Uso de computadora - 1 hora',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 días atrás
  },
  {
    type: 'free',
    status: 'debt',
    paymentMethod: 'cash',
    freeSaleAmount: 18000,
    subtotal: 18000,
    total: 18000,
    paidAmount: 5000,
    debtAmount: 13000,
    concept: 'Trabajo de digitación',
    client: {
      name: 'Carlos Ramírez',
      phone: '3009876543'
    },
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 días atrás
  },
  {
    type: 'free',
    status: 'paid',
    paymentMethod: 'card',
    freeSaleAmount: 22000,
    subtotal: 22000,
    total: 22000,
    concept: 'Impresión de fotos y laminado',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) // 9 días atrás
  },
  {
    type: 'free',
    status: 'paid',
    paymentMethod: 'cash',
    freeSaleAmount: 7500,
    subtotal: 7500,
    total: 7500,
    concept: 'Navegación por internet - 1.5 horas',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 días atrás
  }
];

const seedSampleSales = async () => {
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

    // Buscar el producto "nails" para las ventas de productos
    const nailsProduct = await Product.findOne({ name: 'nails', createdBy: adminUser._id });
    
    console.log('🧹 Limpiando ventas anteriores...');
    const deletedSales = await Sale.deleteMany({ createdBy: adminUser._id });
    console.log(`🗑️  Eliminadas ${deletedSales.deletedCount} ventas anteriores`);

    console.log('🔨 Creando ventas de ejemplo...');
    
    let createdCount = 0;
    let totalRevenue = 0;

    for (const saleData of sampleSales) {
      try {
        // Configurar datos base para cada venta
        const sale = new Sale({
          ...saleData,
          createdBy: adminUser._id
        });

        // Si es una venta de producto, asociar el producto real
        if (saleData.type === 'product' && nailsProduct && saleData.items) {
          sale.items = saleData.items.map(item => ({
            ...item,
            product: nailsProduct._id,
            productName: nailsProduct.name
          }));
        }

        // Si no hay items (venta libre), crear un array vacío
        if (!sale.items) {
          sale.items = [];
        }

        await sale.save();
        console.log(`✅ Creada: ${sale.concept} - ${sale.status} - $${sale.total.toLocaleString()}`);
        
        createdCount++;
        totalRevenue += sale.total;

      } catch (error) {
        console.error(`❌ Error creando venta "${saleData.concept}":`, error.message);
      }
    }

    // Calcular estadísticas
    const totalSales = await Sale.countDocuments({ createdBy: adminUser._id });
    const paidSales = await Sale.countDocuments({ createdBy: adminUser._id, status: 'paid' });
    const debtSales = await Sale.countDocuments({ createdBy: adminUser._id, status: 'debt' });
    const totalDebts = await Sale.aggregate([
      { $match: { createdBy: adminUser._id, status: 'debt' } },
      { $group: { _id: null, totalDebt: { $sum: { $subtract: ['$total', '$paidAmount'] } } } }
    ]);

    console.log('\n🎉 Ventas de ejemplo creadas exitosamente!');
    console.log('==========================================');
    console.log(`✅ Ventas creadas: ${createdCount}`);
    console.log(`💰 Ingresos totales: $${totalRevenue.toLocaleString()}`);
    console.log(`📊 Estadísticas:`);
    console.log(`   - Total ventas: ${totalSales}`);
    console.log(`   - Ventas pagadas: ${paidSales}`);
    console.log(`   - Ventas con deuda: ${debtSales}`);
    console.log(`   - Total deudas: $${totalDebts[0]?.totalDebt?.toLocaleString() || 0}`);
    console.log('==========================================');
    console.log('\n📊 Ahora puedes ver el balance con datos reales!');

  } catch (error) {
    console.error('❌ Error al crear ventas de ejemplo:', error.message);
    
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
  console.log('💼 Script de ventas de ejemplo para Balance');
  console.log('Este script creará ventas de ejemplo para probar el Balance\n');
  
  seedSampleSales();
}

module.exports = seedSampleSales;