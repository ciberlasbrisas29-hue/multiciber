require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdminUser = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un usuario admin
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  El usuario admin ya existe');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Username:', existingAdmin.username);
      console.log('🔑 Para cambiar la contraseña, elimina el usuario y vuelve a crearlo');
      return;
    }

    // Crear usuario administrador
    const adminUser = new User({
      username: 'admin',
      email: 'admin@multiciber.com',
      password: 'admin123', // Se encriptará automáticamente
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log('🎉 Usuario administrador creado exitosamente!');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('📧 Email: admin@multiciber.com');

  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

createAdminUser();
