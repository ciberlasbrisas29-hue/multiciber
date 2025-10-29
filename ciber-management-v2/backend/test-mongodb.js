const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const testConnection = async () => {
  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    console.log('📍 Host:', process.env.MONGODB_URI?.split('@')[1]?.split('/')[0] || 'No configurado');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB conectado exitosamente!');
    console.log('🏠 Host:', conn.connection.host);
    console.log('📊 Base de datos:', conn.connection.name);
    console.log('🔗 Estado:', conn.connection.readyState === 1 ? 'Conectado' : 'Desconectado');
    
    // Crear una colección de prueba
    const testCollection = conn.connection.db.collection('test');
    await testCollection.insertOne({ 
      message: 'Conexión exitosa', 
      timestamp: new Date() 
    });
    console.log('📝 Colección de prueba creada');
    
    // Limpiar colección de prueba
    await testCollection.deleteMany({});
    console.log('🧹 Colección de prueba limpiada');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que MONGODB_URI esté configurado correctamente');
    console.log('2. Asegúrate de que la IP esté en la whitelist');
    console.log('3. Verifica que el usuario y contraseña sean correctos');
    console.log('4. Revisa que el cluster esté activo');
    process.exit(1);
  }
};

testConnection();
