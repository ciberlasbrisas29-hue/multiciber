const mongoose = require('mongoose');

// Función para generar slug único
function generateSlug(name) {
  // Convertir a minúsculas, remover acentos, reemplazar espacios por guiones
  const baseSlug = (name || 'tienda')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno solo
    .replace(/^-|-$/g, '') // Remover guiones al inicio/final
    .substring(0, 30); // Limitar longitud
  
  // Generar ID corto aleatorio (6 caracteres hexadecimales)
  const shortId = Math.random().toString(16).substring(2, 8);
  
  return `${baseSlug}-${shortId}`;
}

const businessSettingsSchema = new mongoose.Schema({
  // Slug único para el catálogo público (ej: "mi-tienda-a3f2b1")
  catalogSlug: {
    type: String,
    unique: true,
    sparse: true, // Permite múltiples nulls
    trim: true,
    lowercase: true,
    index: true
  },
  
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
  whatsappPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'El número de WhatsApp no puede exceder 20 caracteres']
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

// Middleware para actualizar updatedAt y generar slug
businessSettingsSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Generar slug si no existe (verificación explícita)
  const needsSlug = !this.catalogSlug || this.catalogSlug === '' || this.catalogSlug === null || this.catalogSlug === undefined;
  const nameChanged = this.isModified('businessName');
  
  if (needsSlug || nameChanged) {
    const name = this.businessName || 'tienda';
    let slug = generateSlug(name);
    
    // Verificar unicidad del slug usando el modelo directamente
    let existingSlug = await mongoose.model('BusinessSettings').findOne({ 
      catalogSlug: slug, 
      _id: { $ne: this._id } 
    });
    
    // Si el slug ya existe, regenerar hasta encontrar uno único
    let attempts = 0;
    while (existingSlug && attempts < 5) {
      slug = generateSlug(name);
      existingSlug = await mongoose.model('BusinessSettings').findOne({ 
        catalogSlug: slug, 
        _id: { $ne: this._id } 
      });
      attempts++;
    }
    
    this.catalogSlug = slug;
    console.log('✅ Slug generado:', slug);
  }
  
  next();
});

// Índice único por usuario
businessSettingsSchema.index({ userId: 1 }, { unique: true });

// Método para obtener datos públicos
businessSettingsSchema.methods.getPublicData = function() {
  return {
    _id: this._id,
    catalogSlug: this.catalogSlug,
    businessName: this.businessName,
    businessDescription: this.businessDescription,
    businessAddress: this.businessAddress,
    businessPhone: this.businessPhone,
    whatsappPhone: this.whatsappPhone,
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

