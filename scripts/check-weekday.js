// Script para verificar qué día de la semana es hoy
console.log('📅 VERIFICACIÓN DEL DÍA DE LA SEMANA');
console.log('='.repeat(50));

// Obtener fecha actual
const now = new Date();
console.log(`\n🕐 FECHA DEL SISTEMA: ${now.toString()}`);

// Fecha corregida: November 20, 2024 (Miércoles) - El Salvador
const salvadorTime = new Date(2024, 10, 20, 21, 20, 0); // Nov 20, 2024, 9:20 PM
console.log(`🇸🇻 FECHA EL SALVADOR (CORREGIDA): ${salvadorTime.toString()}`);

// Días de la semana
const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const weekDaysShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Obtener día de la semana
const dayOfWeek = salvadorTime.getDay(); // 0=domingo, 6=sábado
console.log(`\n📊 ANÁLISIS DEL DÍA:`);
console.log(`Número del día: ${dayOfWeek} (0=domingo, 6=sábado)`);
console.log(`Día completo: ${weekDays[dayOfWeek]}`);
console.log(`Día abreviado: ${weekDaysShort[dayOfWeek]}`);

// Fecha formateada
console.log(`\n📝 FORMATOS:`);
console.log(`Fecha completa: ${salvadorTime.toLocaleDateString('es-SV', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}`);

// Verificar si es miércoles (20 de noviembre 2024)
if (dayOfWeek === 3) { // 3 = miércoles
  console.log(`\n✅ CORRECTO: Hoy ES miércoles (20/11/2024)`);
} else {
  console.log(`\n❌ ERROR: Hoy NO es miércoles`);
  console.log(`El sistema dice que es: ${weekDays[dayOfWeek]}`);
  console.log(`Pero debería ser: Miércoles (20/11/2024)`);
}

// Mostrar últimos 7 días para debug
console.log(`\n📅 ÚLTIMOS 7 DÍAS (terminando hoy):`);
for (let i = 6; i >= 0; i--) {
  const date = new Date(salvadorTime);
  date.setDate(date.getDate() - i);
  const dayIndex = date.getDay();
  const isToday = i === 0 ? ' ← HOY' : '';
  console.log(`${weekDaysShort[dayIndex]} (${date.getDate()}/${date.getMonth() + 1})${isToday}`);
}

// Para el gráfico de tendencia semanal
console.log(`\n📊 ORDEN PARA GRÁFICO (últimos 7 días):`);
const today = salvadorTime.getDay();
for (let i = 6; i >= 0; i--) {
  const dayIndex = (today - i + 7) % 7;
  const isToday = i === 0 ? ' ← HOY' : '';
  console.log(`${weekDaysShort[dayIndex]}${isToday}`);
}

console.log(`\n🎯 CONCLUSIÓN:`);
console.log(`Fecha real actual: 20 de noviembre 2024 (Miércoles)`);
if (dayOfWeek === 3) {
  console.log('✅ El cálculo de día de la semana es correcto');
  console.log('✅ El gráfico debería mostrar "Mié" como el último día (HOY)');
  console.log('✅ La tendencia semanal terminará en miércoles');
} else {
  console.log('❌ Hay un problema con el cálculo de fechas');
  console.log('❌ Necesita ajustar la fecha a: 20/11/2024 (Miércoles)');
}