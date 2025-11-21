require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const User = require('../lib/models/User');

const initDatabase = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/multiciber');
    console.log('✅ Conectado a MongoDB exitosamente');

    // Verificar si ya existe un usuario admin
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  El usuario admin ya existe');
      console.log('👤 Username:', existingAdmin.username);
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('✅ Activo:', existingAdmin.isActive ? 'Sí' : 'No');
      console.log('\n💡 Puedes usar estas credenciales:');
      console.log('   Usuario: admin');
      console.log('   Contraseña: admin123');
      return;
    }

    // Crear usuario administrador
    console.log('🔨 Creando usuario administrador...');
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@multiciber.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    
    console.log('🎉 Usuario administrador creado exitosamente!');
    console.log('=====================================');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('📧 Email: admin@multiciber.com');
    console.log('🛡️  Role: admin');
    console.log('✅ Estado: Activo');
    console.log('=====================================');
    console.log('\n🚀 Ahora puedes iniciar sesión en la aplicación!');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    
    if (error.code === 11000) {
      console.log('💡 El usuario ya existe. Usa las credenciales existentes.');
    } else if (error.message.includes('MONGODB_URI')) {
      console.log('💡 Asegúrate de configurar MONGODB_URI en tu archivo .env.local');
    } else {
      console.log('💡 Verifica tu conexión a MongoDB y las variables de entorno.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;