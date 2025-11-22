const mongoose = require('mongoose');

const businessSettingsSchema = new mongoose.Schema({
  // Perfil del Negocio
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'El nombre del negocio no puede exceder 100 caracteres']
  },
  businessDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  businessAddress: {
    type: String,
    trim: true,
    maxlength: [200, 'La dirección no puede exceder 200 caracteres']
  },
  businessPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'El teléfono no puede exceder 20 caracteres']
  },
  businessEmail: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [100, 'El email no puede exceder 100 caracteres']
  },
  businessLogo: {
    type: String,
    trim: true
  },
  
  // Configuración Financiera
  currency: {
    type: String,
    enum: ['USD', 'EUR'],
    default: 'USD'
  },
  currencySymbol: {
    type: String,
    default: '$'
  },
  paymentMethods: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    icon: {
      type: String,
      default: 'credit-card'
    }
  }],
  
  // Relación con el usuario (un negocio por usuario)
  userId: {
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
businessSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índice único por usuario
businessSettingsSchema.index({ userId: 1 }, { unique: true });

// Método para obtener datos públicos
businessSettingsSchema.methods.getPublicData = function() {
  return {
    _id: this._id,
    businessName: this.businessName,
    businessDescription: this.businessDescription,
    businessAddress: this.businessAddress,
    businessPhone: this.businessPhone,
    businessEmail: this.businessEmail,
    businessLogo: this.businessLogo,
    currency: this.currency,
    currencySymbol: this.currencySymbol,
    paymentMethods: this.paymentMethods,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', businessSettingsSchema);

