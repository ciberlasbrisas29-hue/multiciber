/**
 * Script para verificar si las variables de Twilio están configuradas
 */

require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_NUMBER'
];

console.log('\n🔍 Verificando configuración de Twilio...\n');

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mostrar solo los primeros y últimos caracteres por seguridad
    const masked = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`✅ ${varName}: ${masked}`);
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADO`);
    allConfigured = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allConfigured) {
  console.log('✅ Todas las variables de Twilio están configuradas');
  console.log('\n💡 Si el servidor ya está corriendo, reinícialo con: npm run dev');
} else {
  console.log('❌ Faltan variables de Twilio');
  console.log('\n📝 Agrega estas variables a tu archivo .env.local:');
  console.log('\nTWILIO_ACCOUNT_SID=tu_account_sid');
  console.log('TWILIO_AUTH_TOKEN=tu_auth_token');
  console.log('TWILIO_WHATSAPP_NUMBER=whatsapp:+12694307836');
  console.log('\n💡 Después de agregarlas, reinicia el servidor con: npm run dev');
}

console.log('\n');

