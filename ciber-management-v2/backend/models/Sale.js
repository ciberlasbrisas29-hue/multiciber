const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'La cantidad debe ser mayor a 0']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'El precio unitario no puede ser negativo']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'El precio total no puede ser negativo']
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['product', 'free'],
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'debt'],
    required: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'El subtotal no puede ser negativo']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'El descuento no puede ser negativo']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'amount'],
    default: 'amount'
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'El total no puede ser negativo']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'other'],
    required: true
  },
  client: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  },
  concept: {
    type: String,
    trim: true,
    maxlength: [200, 'El concepto no puede exceder 200 caracteres']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  // Para ventas de deuda
  debtAmount: {
    type: Number,
    default: 0,
    min: [0, 'El monto de deuda no puede ser negativo']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'El monto pagado no puede ser negativo']
  },
  // Para ventas libres
  freeSaleAmount: {
    type: Number,
    min: [0, 'El monto de venta libre no puede ser negativo']
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
saleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware para generar número de venta
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.saleNumber) {
    const count = await this.constructor.countDocuments();
    this.saleNumber = `V-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Índices
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ paymentMethod: 1 });
saleSchema.index({ createdBy: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ 'client.name': 'text', concept: 'text' });

// Método para calcular total pendiente de pago
saleSchema.methods.getPendingAmount = function() {
  if (this.status === 'paid') return 0;
  return this.total - this.paidAmount;
};

// Método para verificar si está completamente pagada
saleSchema.methods.isFullyPaid = function() {
  return this.status === 'paid' || this.paidAmount >= this.total;
};

// Método para agregar pago
saleSchema.methods.addPayment = function(amount) {
  this.paidAmount += amount;
  if (this.paidAmount >= this.total) {
    this.status = 'paid';
  }
  return this.save();
};

// Método para obtener datos públicos
saleSchema.methods.getPublicData = function() {
  const saleObject = this.toObject();
  delete saleObject.createdBy;
  return saleObject;
};

module.exports = mongoose.model('Sale', saleSchema);