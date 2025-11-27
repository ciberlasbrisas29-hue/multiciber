const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Referencia a la venta o gasto
  referenceType: {
    type: String,
    enum: ['sale', 'expense'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'referenceType'
  },
  // Monto del abono
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'El monto debe ser mayor a 0']
  },
  // Método de pago
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'check', 'other'],
    required: true
  },
  // Información adicional
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  // Usuario que registró el pago
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Fecha del pago
  paymentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
paymentSchema.index({ referenceType: 1, referenceId: 1 });
paymentSchema.index({ createdBy: 1, createdAt: -1 });
paymentSchema.index({ paymentDate: -1 });

// Método para obtener datos públicos
paymentSchema.methods.getPublicData = function() {
  const paymentObject = this.toObject();
  delete paymentObject.createdBy;
  return paymentObject;
};

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

