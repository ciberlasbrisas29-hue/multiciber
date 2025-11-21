// Script para debuggear problemas de fechas y filtros en las ventas
console.log('🔍 DEBUG: Fechas de Ventas vs Filtros de Balance');
console.log('='.repeat(60));

const dbConnect = require('../lib/db');
const Sale = require('../lib/models/Sale');

async function debugSalesDates() {
  try {
    console.log('\n🔄 Conectando a MongoDB...');
    await dbConnect();
    console.log('✅ Conectado a MongoDB');

    // 1. Obtener todas las ventas y mostrar sus fechas
    console.log('\n📊 TODAS LAS VENTAS EN LA BASE DE DATOS:');
    const allSales = await Sale.find().sort({ createdAt: -1 }).limit(10);
    
    if (allSales.length === 0) {
      console.log('❌ No hay ventas en la base de datos');
      return;
    }

    allSales.forEach((sale, index) => {
      const createdAt = sale.createdAt;
      console.log(`${index + 1}. Venta: $${sale.total}`);
      console.log(`   Fecha UTC: ${createdAt.toISOString()}`);
      console.log(`   Fecha Local: ${createdAt.toLocaleString('es-SV', {timeZone: 'America/El_Salvador'})}`);
      console.log(`   Timestamp: ${createdAt.getTime()}`);
      console.log('   ---');
    });

    // 2. Calcular filtros de fecha como lo hace el sistema
    console.log('\n🗓️ CÁLCULOS DE FILTROS (como en el sistema):');
    const now = new Date();
    console.log(`Fecha actual del servidor: ${now.toISOString()}`);
    console.log(`Fecha actual El Salvador: ${now.toLocaleString('es-SV', {timeZone: 'America/El_Salvador'})}`);

    // Filtro "HOY"
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    console.log(`\n📅 FILTRO "HOY":`);
    console.log(`Inicio: ${todayStart.toISOString()} (${todayStart.toLocaleString('es-SV', {timeZone: 'America/El_Salvador'})})`);
    console.log(`Fin:    ${todayEnd.toISOString()} (${todayEnd.toLocaleString('es-SV', {timeZone: 'America/El_Salvador'})})`);

    // 3. Probar cuántas ventas encuentra el filtro "HOY"
    const todaySales = await Sale.find({
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd
      }
    });

    console.log(`\n🎯 RESULTADO DEL FILTRO "HOY":`);
    console.log(`Ventas encontradas: ${todaySales.length}`);
    
    if (todaySales.length > 0) {
      console.log(`Detalles de ventas de hoy:`);
      todaySales.forEach((sale, index) => {
        console.log(`  ${index + 1}. $${sale.total} - ${sale.createdAt.toLocaleString('es-SV', {timeZone: 'America/El_Salvador'})}`);
      });
    }

    // 4. Filtro "AYER"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

    console.log(`\n📅 FILTRO "AYER":`);
    console.log(`Inicio: ${yesterdayStart.toISOString()} (${yesterdayStart.toLocaleString('es-SV', {timeZone: 'America/El_Salvador'})})`);
    console.log(`Fin:    ${yesterdayEnd.toISOString()} (${yesterdayEnd.toLocaleString('es-SV', {timeZone: 'America/El_Salvador'})})`);

    const yesterdaySales = await Sale.find({
      createdAt: {
        $gte: yesterdayStart,
        $lte: yesterdayEnd
      }
    });

    console.log(`\n🎯 RESULTADO DEL FILTRO "AYER":`);
    console.log(`Ventas encontradas: ${yesterdaySales.length}`);
    
    if (yesterdaySales.length > 0) {
      console.log(`Detalles de ventas de ayer:`);
      yesterdaySales.forEach((sale, index) => {
        console.log(`  ${index + 1}. $${sale.total} - ${sale.createdAt.toLocaleString('es-SV', {timeZone: 'America/El_Salvador'})}`);
      });
    }

    // 5. Análisis del problema
    console.log(`\n🔍 ANÁLISIS DEL PROBLEMA:`);
    
    if (allSales.length > 0) {
      const latestSale = allSales[0];
      const saleDate = latestSale.createdAt;
      const saleDateLocal = new Date(saleDate.toLocaleString('en-US', {timeZone: 'America/El_Salvador'}));
      
      console.log(`Última venta creada:`);
      console.log(`  Fecha UTC: ${saleDate.toISOString()}`);
      console.log(`  Fecha El Salvador: ${saleDate.toLocaleString('es-SV', {timeZone: 'America/El_Salvador'})}`);
      console.log(`  Día de la semana: ${saleDate.toLocaleString('es-SV', {weekday: 'long', timeZone: 'America/El_Salvador'})}`);
      
      // Verificar si la venta está en el rango de "hoy"
      const isInTodayRange = saleDate >= todayStart && saleDate <= todayEnd;
      const isInYesterdayRange = saleDate >= yesterdayStart && saleDate <= yesterdayEnd;
      
      console.log(`\n📊 VERIFICACIÓN DE RANGOS:`);
      console.log(`¿La venta está en el rango de HOY? ${isInTodayRange ? '✅ SÍ' : '❌ NO'}`);
      console.log(`¿La venta está en el rango de AYER? ${isInYesterdayRange ? '✅ SÍ' : '❌ NO'}`);
      
      if (!isInTodayRange && !isInYesterdayRange) {
        console.log(`⚠️  La venta no está en ninguno de los dos rangos principales`);
        console.log(`Esto indica un problema de zona horaria o fechas`);
      }
    }

    // 6. Recomendaciones
    console.log(`\n💡 RECOMENDACIONES:`);
    if (todaySales.length === 0 && allSales.length > 0) {
      console.log(`❌ El filtro "HOY" no encuentra ventas, pero hay ventas en la BD`);
      console.log(`🔧 Problema: Desfase de zona horaria entre creación y filtrado`);
      console.log(`🎯 Solución: Ajustar los cálculos de fecha para usar consistentemente la misma zona horaria`);
    } else if (todaySales.length > 0) {
      console.log(`✅ El filtro "HOY" funciona correctamente`);
      console.log(`✅ Encuentra ${todaySales.length} venta(s) de hoy`);
    }

    console.log(`\n🎯 CONCLUSIÓN:`);
    console.log(`Total ventas en BD: ${allSales.length}`);
    console.log(`Ventas encontradas con filtro HOY: ${todaySales.length}`);
    console.log(`Ventas encontradas con filtro AYER: ${yesterdaySales.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar debug
debugSalesDates();