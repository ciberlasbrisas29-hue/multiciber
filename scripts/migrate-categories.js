/**
 * Script de migración para crear las categorías iniciales en MongoDB
 * Ejecutar: node scripts/migrate-categories.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const Category = require('../lib/models/Category');
const User = require('../lib/models/User');

// Categorías por defecto
const defaultCategories = [
  {
    name: 'accesorios-gaming',
    displayName: 'Accesorios Gaming',
    color: '#a855f7',
    icon: 'Package'
  },
  {
    name: 'almacenamiento',
    displayName: 'Almacenamiento',
    color: '#3b82f6',
    icon: 'Package'
  },
  {
    name: 'conectividad',
    displayName: 'Conectividad',
    color: '#6366f1',
    icon: 'Package'
  },
  {
    name: 'accesorios-trabajo',
    displayName: 'Accesorios de Trabajo',
    color: '#10b981',
    icon: 'Package'
  },
  {
    name: 'dispositivos-captura',
    displayName: 'Dispositivos de Captura',
    color: '#ec4899',
    icon: 'Package'
  },
  {
    name: 'mantenimiento',
    displayName: 'Mantenimiento',
    color: '#eab308',
    icon: 'Package'
  },
  {
    name: 'otros',
    displayName: 'Otros',
    color: '#6b7280',
    icon: 'Package'
  }
];

async function migrateCategories() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los usuarios
    const users = await User.find({});
    console.log(`📊 Encontrados ${users.length} usuario(s)`);

    if (users.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos. Crea un usuario primero.');
      process.exit(0);
    }

    // Para cada usuario, crear las categorías por defecto
    for (const user of users) {
      console.log(`\n👤 Procesando usuario: ${user.username} (${user._id})`);

      let created = 0;
      let skipped = 0;

      for (let i = 0; i < defaultCategories.length; i++) {
        const categoryData = defaultCategories[i];
        // Verificar si la categoría ya existe
        const existingCategory = await Category.findOne({
          name: categoryData.name,
          createdBy: user._id
        });

        if (existingCategory) {
          // Si existe pero no tiene order, asignarle uno
          if (existingCategory.order === undefined || existingCategory.order === null) {
            existingCategory.order = i;
            await existingCategory.save();
            console.log(`   🔄 Categoría "${categoryData.displayName}" actualizada con orden ${i}`);
          } else {
            console.log(`   ⏭️  Categoría "${categoryData.displayName}" ya existe, omitiendo...`);
          }
          skipped++;
        } else {
          const category = new Category({
            ...categoryData,
            order: i,
            createdBy: user._id
          });

          await category.save();
          console.log(`   ✅ Categoría "${categoryData.displayName}" creada con orden ${i}`);
          created++;
        }
      }

      console.log(`   📈 Resumen: ${created} creadas, ${skipped} omitidas`);
    }

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateCategories();

