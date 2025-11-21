// Debug script to verify current dates and timezone handling
console.log('🇸🇻 DEBUG: Verificación de Fechas - El Salvador');
console.log('='.repeat(60));

// 1. Fechas del sistema
console.log('\n📅 FECHAS DEL SISTEMA:');
const now = new Date();
console.log(`Fecha del servidor: ${now.toString()}`);
console.log(`ISO String: ${now.toISOString()}`);
console.log(`UTC: ${now.toUTCString()}`);

// 2. Zona horaria de El Salvador
console.log('\n🇸🇻 EL SALVADOR (America/El_Salvador):');
const salvadorTime = new Date(now.toLocaleString("en-US", {timeZone: "America/El_Salvador"}));
console.log(`Hora El Salvador: ${salvadorTime.toString()}`);
console.log(`Fecha formateada: ${salvadorTime.toLocaleDateString('es-SV')}`);
console.log(`Hora formateada: ${salvadorTime.toLocaleTimeString('es-SV')}`);

// 3. Comparación de métodos
console.log('\n🔍 COMPARACIÓN DE MÉTODOS:');

// Método 1: toLocaleString con timezone
const method1 = new Date(now.toLocaleString("en-US", {timeZone: "America/El_Salvador"}));
console.log(`Método 1 (toLocaleString): ${method1.toLocaleDateString('es-SV')} ${method1.toLocaleTimeString('es-SV')}`);

// Método 2: Offset manual GMT-6
const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
const method2 = new Date(utc + (-6 * 60 * 60000));
console.log(`Método 2 (offset manual): ${method2.toLocaleDateString('es-SV')} ${method2.toLocaleTimeString('es-SV')}`);

// Método 3: Intl.DateTimeFormat
const method3 = new Intl.DateTimeFormat('es-SV', {
  timeZone: 'America/El_Salvador',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}).format(now);
console.log(`Método 3 (Intl.DateTimeFormat): ${method3}`);

// 4. Rangos para filtros
console.log('\n📊 RANGOS PARA FILTROS:');

// HOY en El Salvador
const salvadorToday = new Date(now.toLocaleString("en-US", {timeZone: "America/El_Salvador"}));
const todayStart = new Date(salvadorToday.getFullYear(), salvadorToday.getMonth(), salvadorToday.getDate());
const todayEnd = new Date(salvadorToday.getFullYear(), salvadorToday.getMonth(), salvadorToday.getDate(), 23, 59, 59);

console.log(`HOY - Inicio: ${todayStart.toLocaleDateString('es-SV')} ${todayStart.toLocaleTimeString('es-SV')}`);
console.log(`HOY - Fin: ${todayEnd.toLocaleDateString('es-SV')} ${todayEnd.toLocaleTimeString('es-SV')}`);

// ESTE MES en El Salvador
const monthStart = new Date(salvadorToday.getFullYear(), salvadorToday.getMonth(), 1);
const monthEnd = new Date(salvadorToday.getFullYear(), salvadorToday.getMonth() + 1, 0, 23, 59, 59);

console.log(`MES - Inicio: ${monthStart.toLocaleDateString('es-SV')}`);
console.log(`MES - Fin: ${monthEnd.toLocaleDateString('es-SV')}`);

// 5. Información del sistema
console.log('\n💻 INFORMACIÓN DEL SISTEMA:');
console.log(`Timezone offset: ${now.getTimezoneOffset()} minutos`);
console.log(`Timezone string: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

// 6. Fechas en diferentes formatos
console.log('\n📝 FORMATOS DE FECHA:');
console.log(`DD/MM/YYYY: ${salvadorToday.toLocaleDateString('es-SV', {day: '2-digit', month: '2-digit', year: 'numeric'})}`);
console.log(`YYYY-MM-DD: ${salvadorToday.toISOString().split('T')[0]}`);
console.log(`Mes actual: ${salvadorToday.toLocaleDateString('es-SV', {month: 'long'})}`);
console.log(`Día semana: ${salvadorToday.toLocaleDateString('es-SV', {weekday: 'long'})}`);

// 7. Detección de año
console.log('\n🗓️ VERIFICACIÓN DE AÑO:');
console.log(`Año actual (servidor): ${now.getFullYear()}`);
console.log(`Año actual (El Salvador): ${salvadorToday.getFullYear()}`);

if (now.getFullYear() !== salvadorToday.getFullYear()) {
  console.log('⚠️ ADVERTENCIA: Diferencia de año entre servidor y El Salvador');
} else {
  console.log('✅ Años coinciden correctamente');
}

// 8. Recomendación
console.log('\n🎯 RECOMENDACIÓN:');
console.log('Usar: new Date(now.toLocaleString("en-US", {timeZone: "America/El_Salvador"}))');
console.log('Este método respeta correctamente la zona horaria sin crear confusión de fechas.');

console.log('\n🚀 Verificación completa.');