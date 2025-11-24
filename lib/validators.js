/**
 * Validadores usando Zod para validación de esquemas
 */
import { z } from 'zod';
import { ValidationError } from './errors';

// Validación de usuario
export const userLoginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const userRegisterSchema = z.object({
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos'),
  email: z.string()
    .email('Por favor ingresa un email válido')
    .toLowerCase(),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
});

// Validación de productos
export const productSchema = z.object({
  name: z.string()
    .min(1, 'El nombre del producto es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .default(''),
  price: z.number()
    .positive('El precio debe ser mayor a 0')
    .finite(),
  cost: z.number()
    .positive('El costo debe ser mayor a 0')
    .finite(),
  category: z.string()
    .min(1, 'La categoría es requerida')
    .trim()
    .toLowerCase(),
  stock: z.number()
    .min(0, 'El stock no puede ser negativo')
    .default(0),
  minStock: z.number()
    .min(0, 'El stock mínimo no puede ser negativo')
    .default(0),
  unit: z.enum(['unidades', 'piezas', 'metros', 'pulgadas', 'gb', 'tb'], {
    errorMap: () => ({ message: 'Unidad inválida' })
  }),
  barcode: z.string().trim().optional().nullable(),
  tags: z.array(z.string().trim()).default([]),
  isActive: z.boolean().default(true),
});

// Validación de ventas
export const saleItemSchema = z.object({
  product: z.string().min(1, 'El producto es requerido'),
  productName: z.string().min(1, 'El nombre del producto es requerido'),
  quantity: z.number()
    .positive('La cantidad debe ser mayor a 0')
    .finite(),
  unitPrice: z.number()
    .min(0, 'El precio unitario no puede ser negativo')
    .finite(),
  totalPrice: z.number()
    .min(0, 'El precio total no puede ser negativo')
    .finite(),
});

export const saleSchema = z.object({
  type: z.enum(['product', 'free']),
  status: z.enum(['paid', 'debt']),
  items: z.array(saleItemSchema).optional().default([]),
  subtotal: z.number()
    .min(0, 'El subtotal no puede ser negativo')
    .finite(),
  discount: z.number()
    .min(0, 'El descuento no puede ser negativo')
    .default(0),
  discountType: z.enum(['percentage', 'amount']).default('amount'),
  total: z.number()
    .min(0, 'El total no puede ser negativo')
    .finite(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'other']),
  client: z.object({
    name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().email().trim().optional(),
  }).optional(),
  concept: z.string()
    .max(200, 'El concepto no puede exceder 200 caracteres')
    .trim()
    .optional(),
  notes: z.string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .trim()
    .optional(),
  debtAmount: z.number()
    .min(0, 'El monto de deuda no puede ser negativo')
    .default(0),
  paidAmount: z.number()
    .min(0, 'El monto pagado no puede ser negativo')
    .default(0),
  freeSaleAmount: z.number()
    .min(0, 'El monto de venta libre no puede ser negativo')
    .optional(),
});

// Validación de gastos
export const expenseSchema = z.object({
  description: z.string()
    .min(1, 'La descripción es requerida')
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .trim(),
  amount: z.number()
    .positive('El monto debe ser mayor a 0')
    .finite(),
  category: z.string()
    .min(1, 'La categoría es requerida')
    .trim(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'other']),
  notes: z.string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .trim()
    .optional(),
});

/**
 * Valida datos contra un esquema de Zod
 */
export function validate(schema, data) {
  try {
    return {
      success: true,
      data: schema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      throw new ValidationError('Error de validación', errors);
    }
    throw error;
  }
}

