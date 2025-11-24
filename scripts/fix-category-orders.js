/**
 * Script para asignar orden a categorías que no lo tienen
 * Ejecutar: node scripts/fix-category-orders.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const Category = require('../lib/models/Category');
const User = require('../lib/models/User');

async function fixCategoryOrders() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los usuarios
    const users = await User.find({});
    console.log(`📊 Encontrados ${users.length} usuario(s)`);

    if (users.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos.');
      process.exit(0);
    }

    // Para cada usuario, asignar orden a categorías que no lo tienen
    for (const user of users) {
      console.log(`\n👤 Procesando usuario: ${user.username} (${user._id})`);

      // Obtener todas las categorías del usuario
      const categories = await Category.find({
        createdBy: user._id,
        isActive: true
      });

      let updated = 0;
      let maxOrder = -1;

      // Primero, encontrar el máximo order existente
      for (const cat of categories) {
        if (cat.order !== undefined && cat.order !== null) {
          maxOrder = Math.max(maxOrder, cat.order);
        }
      }

      // Asignar order a las categorías que no lo tienen
      for (const cat of categories) {
        if (cat.order === undefined || cat.order === null) {
          maxOrder++;
          cat.order = maxOrder;
          await cat.save();
          console.log(`   ✅ Categoría "${cat.displayName}" actualizada con order: ${maxOrder}`);
          updated++;
        }
      }

      console.log(`   📈 Resumen: ${updated} categorías actualizadas`);
    }

    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  }
}

// Ejecutar
fixCategoryOrders();

