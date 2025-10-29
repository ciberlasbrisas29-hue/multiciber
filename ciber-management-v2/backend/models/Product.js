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
    enum: ['internet', 'impresion', 'copia', 'escaneo', 'otros']
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
    enum: ['minutos', 'horas', 'hojas', 'unidades', 'mb', 'gb']
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
    trim: true
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

module.exports = mongoose.model('Product', productSchema);
