const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  cost: {
    type: Number,
    required: [true, 'El costo es requerido'],
    min: [0, 'El costo no puede ser negativo']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    trim: true,
    lowercase: true,
    // Validación personalizada: verificar que la categoría exista en la colección Category
    validate: {
      validator: async function(value) {
        // Esta validación se hace en el API, no aquí
        // Solo validamos que sea un string no vacío
        return typeof value === 'string' && value.trim().length > 0;
      },
      message: 'La categoría debe ser un texto válido'
    }
    // Ya no usamos enum, las categorías se validan contra la colección Category en el API
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'El stock no puede ser negativo']
  },
  minStock: {
    type: Number,
    default: 0,
    min: [0, 'El stock mínimo no puede ser negativo']
  },
  unit: {
    type: String,
    required: [true, 'La unidad es requerida'],
    enum: ['unidades', 'piezas', 'metros', 'pulgadas', 'gb', 'tb']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true, // Permite múltiples valores null
    trim: true
  },
  image: {
    type: String,
    trim: true,
    default: '/assets/images/products/default-product.jpg'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar updatedAt
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para mejorar rendimiento
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdBy: 1 });

// Método para calcular ganancia
productSchema.methods.getProfit = function() {
  return this.price - this.cost;
};

// Método para verificar si está en stock bajo
productSchema.methods.isLowStock = function() {
  return this.stock <= this.minStock;
};

// Método para obtener datos públicos
productSchema.methods.getPublicData = function() {
  const productObject = this.toObject();
  delete productObject.createdBy;
  return productObject;
};

// Forzar la recarga del modelo para evitar caché con enum
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}
module.exports = mongoose.model('Product', productSchema);
