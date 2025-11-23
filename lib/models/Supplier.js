const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del proveedor es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'El teléfono no puede exceder 20 caracteres']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [100, 'El email no puede exceder 100 caracteres'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'La dirección no puede exceder 200 caracteres']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  isActive: {
    type: Boolean,
    default: true
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
supplierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para mejorar rendimiento
supplierSchema.index({ name: 'text', 'notes': 'text' });
supplierSchema.index({ createdBy: 1 });
supplierSchema.index({ isActive: 1 });

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;

