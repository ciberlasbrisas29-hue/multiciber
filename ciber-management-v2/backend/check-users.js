require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUsers = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los usuarios
    const users = await User.find({}).select('username email role isActive createdAt');
    
    console.log('\n📋 Usuarios en la base de datos:');
    console.log('=====================================');
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. Usuario:`);
        console.log(`   👤 Username: ${user.username}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Role: ${user.role}`);
        console.log(`   ✅ Activo: ${user.isActive ? 'Sí' : 'No'}`);
        console.log(`   📅 Creado: ${user.createdAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

checkUsers();
