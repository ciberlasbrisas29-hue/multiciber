const dbConnect = require('../lib/db');
const Sale = require('../lib/models/Sale');

// Helper function to get El Salvador time
function getSalvadorTime() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const salvadorTime = new Date(utc + (-6 * 60 * 60000)); // GMT-6
  return salvadorTime;
}

// Helper function to format date
function formatDate(date) {
  return date.toLocaleString('es-SV', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

async function checkTimezone() {
  console.log('🕐 VERIFICACIÓN DE ZONA HORARIA - EL SALVADOR');
  console.log('='.repeat(50));
  
  // 1. Mostrar fechas actuales
  const now = new Date();
  const salvadorTime = getSalvadorTime();
  
  console.log('\n📅 FECHAS ACTUALES:');
  console.log(`Servidor (UTC):     ${now.toISOString()}`);
  console.log(`El Salvador (GMT-6): ${formatDate(salvadorTime)}`);
  console.log(`Diferencia: ${(now.getTime() - salvadorTime.getTime()) / (1000 * 60 * 60)} horas`);
  
  // 2. Verificar rangos de fechas para "hoy"
  const todayStart = new Date(salvadorTime.getFullYear(), salvadorTime.getMonth(), salvadorTime.getDate());
  const todayEnd = new Date(salvadorTime.getFullYear(), salvadorTime.getMonth(), salvadorTime.getDate(), 23, 59, 59);
  
  console.log('\n🗓️ RANGO PARA "HOY" EN EL SALVADOR:');
  console.log(`Inicio: ${formatDate(todayStart)}`);
  console.log(`Fin:    ${formatDate(todayEnd)}`);
  
  // 3. Verificar rango para "este mes"
  const monthStart = new Date(salvadorTime.getFullYear(), salvadorTime.getMonth(), 1);
  const monthEnd = new Date(salvadorTime.getFullYear(), salvadorTime.getMonth() + 1, 0, 23, 59, 59);
  
  console.log('\n📊 RANGO PARA "ESTE MES":');
  console.log(`Inicio: ${formatDate(monthStart)}`);
  console.log(`Fin:    ${formatDate(monthEnd)}`);
  
  // 4. Conectar a DB y verificar ventas
  try {
    await dbConnect();
    console.log('\n💾 CONEXIÓN A BASE DE DATOS: ✅');
    
    // Contar ventas totales
    const totalSales = await Sale.countDocuments();
    console.log(`Total de ventas en BD: ${totalSales}`);
    
    // Contar ventas de hoy
    const todaySales = await Sale.countDocuments({
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd
      }
    });
    console.log(`Ventas de hoy (${formatDate(todayStart).split(',')[0]}): ${todaySales}`);
    
    // Contar ventas de este mes
    const monthSales = await Sale.countDocuments({
      createdAt: {
        $gte: monthStart,
        $lte: monthEnd
      }
    });
    console.log(`Ventas de este mes: ${monthSales}`);
    
    // Mostrar últimas 3 ventas con fechas
    console.log('\n📈 ÚLTIMAS 3 VENTAS:');
    const recentSales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('total createdAt status');
    
    if (recentSales.length > 0) {
      recentSales.forEach((sale, index) => {
        const saleDate = new Date(sale.createdAt);
        const salvadorSaleDate = new Date(saleDate.getTime() - (6 * 60 * 60000));
        console.log(`${index + 1}. $${sale.total} - ${formatDate(salvadorSaleDate)} (${sale.status})`);
      });
    } else {
      console.log('No hay ventas en la base de datos');
    }
    
  } catch (error) {
    console.log('❌ ERROR AL CONECTAR A BD:', error.message);
  }
  
  console.log('\n🎯 RECOMENDACIONES:');
  console.log('- El sistema ahora usa GMT-6 (El Salvador)');
  console.log('- Las fechas en el dashboard deben coincidir con tu hora local');
  console.log('- Los filtros "Hoy", "Esta Semana", etc. usan hora de El Salvador');
  console.log('- Los PDFs se generan con fecha y hora local');
  
  process.exit(0);
}

// Ejecutar verificación
checkTimezone().catch(console.error);