const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la categoría es requerido'],
    trim: true,
    unique: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'El nombre solo puede contener letras minúsculas, números y guiones']
  },
  displayName: {
    type: String,
    required: [true, 'El nombre para mostrar es requerido'],
    trim: true,
    maxlength: [50, 'El nombre para mostrar no puede exceder 50 caracteres']
  },
  color: {
    type: String,
    required: [true, 'El color es requerido'],
    match: [/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (ej: #a855f7)'],
    default: '#6b7280'
  },
  icon: {
    type: String,
    trim: true,
    default: 'Package' // Nombre del icono de lucide-react
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
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
categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices
categorySchema.index({ name: 1 });
categorySchema.index({ createdBy: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ createdBy: 1, order: 1 });

// Método para obtener datos públicos
categorySchema.methods.getPublicData = function() {
  const categoryObject = this.toObject();
  delete categoryObject.createdBy;
  delete categoryObject.__v;
  return categoryObject;
};

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);

