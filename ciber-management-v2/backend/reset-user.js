require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const resetUser = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Eliminar usuario existente
    await User.deleteOne({ username: 'jordy' });
    console.log('🗑️ Usuario anterior eliminado');

    // Crear nuevo usuario con credenciales conocidas
    const newUser = new User({
      username: 'admin',
      email: 'admin@multiciber.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    await newUser.save();
    console.log('🎉 Usuario administrador creado exitosamente!');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('📧 Email: admin@multiciber.com');

  } catch (error) {
    console.error('❌ Error al resetear usuario:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

resetUser();
