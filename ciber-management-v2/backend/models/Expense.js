const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [200, 'La descripción no puede exceder 200 caracteres']
  },
  amount: {
    type: Number,
    required: [true, 'El monto es requerido'],
    min: [0.01, 'El monto debe ser mayor a 0']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: [
      'renta', 'servicios', 'salarios', 'equipos', 
      'mantenimiento', 'suministros', 'marketing', 
      'transporte', 'otros'
    ]
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [100, 'La subcategoría no puede exceder 100 caracteres']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'check'],
    required: true
  },
  vendor: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'El nombre del proveedor no puede exceder 100 caracteres']
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
  receipt: {
    number: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      trim: true
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function() {
      return this.isRecurring;
    }
  },
  nextDueDate: {
    type: Date,
    required: function() {
      return this.isRecurring;
    }
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'paid'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
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
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware para generar número de gasto
expenseSchema.pre('save', async function(next) {
  if (this.isNew && !this.expenseNumber) {
    const count = await this.constructor.countDocuments();
    this.expenseNumber = `G-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Índices
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ createdAt: -1 });
expenseSchema.index({ description: 'text', 'vendor.name': 'text' });

// Método para obtener datos públicos
expenseSchema.methods.getPublicData = function() {
  const expenseObject = this.toObject();
  delete expenseObject.createdBy;
  return expenseObject;
};

// Método estático para obtener gastos por período
expenseSchema.statics.getExpensesByPeriod = function(startDate, endDate, userId) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    },
    createdBy: userId
  }).sort({ createdAt: -1 });
};

// Método estático para obtener total de gastos por categoría
expenseSchema.statics.getExpensesByCategory = function(startDate, endDate, userId) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        createdBy: mongoose.Types.ObjectId(userId),
        status: 'paid'
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

module.exports = mongoose.model('Expense', expenseSchema);