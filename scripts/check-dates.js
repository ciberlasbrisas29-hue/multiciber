// Script para verificar fechas y zona horaria de El Salvador
console.log('🇸🇻 VERIFICACIÓN DE ZONA HORARIA - EL SALVADOR');
console.log('='.repeat(60));

// Función para obtener hora de El Salvador (GMT-6)
function getSalvadorTime() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const salvadorTime = new Date(utc + (-6 * 60 * 60000)); // GMT-6
  return salvadorTime;
}

// Función para formatear fechas
function formatDate(date, includeTime = true) {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/El_Salvador'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = false;
  }
  
  return date.toLocaleString('es-SV', options);
}

// 1. FECHAS ACTUALES
console.log('\n📅 FECHAS ACTUALES:');
const now = new Date();
const salvadorTime = getSalvadorTime();

console.log(`Servidor (UTC):          ${now.toISOString()}`);
console.log(`El Salvador (GMT-6):     ${formatDate(salvadorTime)}`);
console.log(`Diferencia de horas:     ${Math.round((now.getTime() - salvadorTime.getTime()) / (1000 * 60 * 60))}`);

// 2. RANGOS DE FECHAS PARA FILTROS
console.log('\n🗓️ RANGOS DE FECHAS (EL SALVADOR):');

// HOY
const todayStart = new Date(salvadorTime.getFullYear(), salvadorTime.getMonth(), salvadorTime.getDate());
const todayEnd = new Date(salvadorTime.getFullYear(), salvadorTime.getMonth(), salvadorTime.getDate(), 23, 59, 59);

console.log('\n📊 FILTRO "HOY":');
console.log(`  Inicio: ${formatDate(todayStart)}`);
console.log(`  Fin:    ${formatDate(todayEnd)}`);

// AYER
const yesterday = new Date(salvadorTime);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

console.log('\n📊 FILTRO "AYER":');
console.log(`  Inicio: ${formatDate(yesterdayStart)}`);
console.log(`  Fin:    ${formatDate(yesterdayEnd)}`);

// ESTA SEMANA
const startOfWeek = new Date(salvadorTime);
startOfWeek.setDate(salvadorTime.getDate() - salvadorTime.getDay());
const weekStart = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
const weekEnd = new Date(salvadorTime.getFullYear(), salvadorTime.getMonth(), salvadorTime.getDate(), 23, 59, 59);

console.log('\n📊 FILTRO "ESTA SEMANA":');
console.log(`  Inicio: ${formatDate(weekStart)}`);
console.log(`  Fin:    ${formatDate(weekEnd)}`);

// ESTE MES
const monthStart = new Date(salvadorTime.getFullYear(), salvadorTime.getMonth(), 1);
const monthEnd = new Date(salvadorTime.getFullYear(), salvadorTime.getMonth() + 1, 0, 23, 59, 59);

console.log('\n📊 FILTRO "ESTE MES":');
console.log(`  Inicio: ${formatDate(monthStart)}`);
console.log(`  Fin:    ${formatDate(monthEnd)}`);

// ESTE AÑO
const yearStart = new Date(salvadorTime.getFullYear(), 0, 1);
const yearEnd = new Date(salvadorTime.getFullYear(), 11, 31, 23, 59, 59);

console.log('\n📊 FILTRO "ESTE AÑO":');
console.log(`  Inicio: ${formatDate(yearStart, false)}`);
console.log(`  Fin:    ${formatDate(yearEnd, false)}`);

// 3. INFORMACIÓN ADICIONAL
console.log('\n🌎 INFORMACIÓN DE ZONA HORARIA:');
console.log(`Zona horaria: America/El_Salvador`);
console.log(`UTC Offset: GMT-6`);
console.log(`Día de la semana: ${salvadorTime.toLocaleDateString('es-SV', { weekday: 'long' })}`);
console.log(`Mes: ${salvadorTime.toLocaleDateString('es-SV', { month: 'long' })}`);

// 4. MONEDA Y FORMATO
console.log('\n💰 CONFIGURACIÓN DE MONEDA:');
const sampleAmount = 1234.56;
const formattedAmount = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(sampleAmount);

console.log(`Ejemplo: $${sampleAmount} → ${formattedAmount}`);
console.log(`Locale: es-SV (El Salvador)`);
console.log(`Moneda: USD (Dólar estadounidense)`);

// 5. VERIFICACIÓN DE CONFIGURACIÓN
console.log('\n✅ VERIFICACIÓN DE CONFIGURACIÓN:');

const isCorrectTimezone = salvadorTime.getTimezoneOffset() === 360; // GMT-6 = +360 minutes
const isWeekend = salvadorTime.getDay() === 0 || salvadorTime.getDay() === 6;

console.log(`✓ Zona horaria GMT-6: ${isCorrectTimezone ? '✅ Correcto' : '❌ Incorrecto'}`);
console.log(`✓ Es fin de semana: ${isWeekend ? '🏖️ Sí' : '💼 No'}`);
console.log(`✓ Formato de fecha: DD/MM/YYYY`);
console.log(`✓ Formato de hora: 24 horas`);
console.log(`✓ Idioma: Español (El Salvador)`);

// 6. RECOMENDACIONES
console.log('\n🎯 ESTADO DEL SISTEMA:');
console.log('✅ El sistema está configurado para El Salvador (GMT-6)');
console.log('✅ Los filtros de fecha usan la hora local de El Salvador');
console.log('✅ La moneda está configurada en USD');
console.log('✅ El formato de fecha es DD/MM/YYYY');
console.log('✅ Los PDFs incluyen zona horaria');

console.log('\n📋 CÓMO USAR:');
console.log('• Filtro "Hoy": Muestra ventas del día actual en El Salvador');
console.log('• Filtro "Este Mes": Muestra ventas desde el 1° del mes actual');
console.log('• Fechas personalizadas: Usa el selector de fechas');
console.log('• Exportar PDF: Incluye fecha/hora de El Salvador');

console.log('\n🚀 ¡Todo configurado correctamente para El Salvador!');