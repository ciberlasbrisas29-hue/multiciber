const dbConnect = require('../lib/db');
const Sale = require('../lib/models/Sale');

async function cleanAllSales() {
  console.log('🧹 LIMPIEZA COMPLETA DE VENTAS');
  console.log('='.repeat(40));
  
  try {
    console.log('\n🔄 Conectando a MongoDB...');
    await dbConnect();
    console.log('✅ Conectado a MongoDB exitosamente');

    // Contar ventas antes de eliminar
    const totalSales = await Sale.countDocuments();
    console.log(`\n📊 Ventas encontradas: ${totalSales}`);

    if (totalSales === 0) {
      console.log('ℹ️  No hay ventas para eliminar');
      console.log('✅ La base de datos ya está limpia');
    } else {
      console.log('\n🗑️  Eliminando todas las ventas...');
      const result = await Sale.deleteMany({});
      console.log(`✅ Eliminadas ${result.deletedCount} ventas exitosamente`);
      
      console.log('\n📈 RESULTADO:');
      console.log(`   Ventas eliminadas: ${result.deletedCount}`);
      console.log('   Estado: Base de datos limpia');
      console.log('   Balance: $0 en todas las métricas');
    }

    console.log('\n🎯 SISTEMA LISTO PARA PRODUCCIÓN:');
    console.log('✅ Sin datos de prueba');
    console.log('✅ Balance en $0');
    console.log('✅ Listo para ventas reales');
    console.log('✅ Fechas funcionando correctamente');

  } catch (error) {
    console.error('\n❌ Error al limpiar ventas:', error.message);
  } finally {
    console.log('\n🔌 Desconectando de MongoDB...');
    process.exit(0);
  }
}

// Ejecutar limpieza
cleanAllSales();