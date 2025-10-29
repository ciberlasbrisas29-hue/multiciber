const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/sales
// @desc    Obtener todas las ventas del usuario
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filtros opcionales
    const filters = { userId };
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filters.saleDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const sales = await Sale.find(filters)
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username');

    const total = await Sale.countDocuments(filters);

    res.json({
      success: true,
      data: {
        sales,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/sales/:id
// @desc    Obtener una venta específica
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('userId', 'username');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      data: sale
    });

  } catch (error) {
    console.error('Error obteniendo venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/sales
// @desc    Crear nueva venta
// @access  Private
router.post('/', [
  authenticateToken,
  body('customerName')
    .notEmpty()
    .withMessage('El nombre del cliente es requerido')
    .isLength({ max: 100 })
    .withMessage('El nombre del cliente no puede exceder 100 caracteres'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un item'),
  body('items.*.productName')
    .notEmpty()
    .withMessage('El nombre del producto es requerido'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero mayor a 0'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser un número mayor o igual a 0'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'transfer', 'other'])
    .withMessage('Método de pago inválido')
], async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const {
      customerName,
      customerPhone,
      items,
      tax = 0,
      discount = 0,
      paymentMethod = 'cash',
      notes
    } = req.body;

    // Calcular totales para cada item
    const itemsWithTotals = items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    }));

    // Calcular subtotal
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);

    // Crear nueva venta
    const sale = new Sale({
      userId: req.user._id,
      customerName,
      customerPhone,
      items: itemsWithTotals,
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount,
      paymentMethod,
      notes,
      saleDate: new Date()
    });

    await sale.save();

    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      data: sale
    });

  } catch (error) {
    console.error('Error creando venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/sales/:id
// @desc    Actualizar una venta
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('status')
    .optional()
    .isIn(['completed', 'pending', 'cancelled'])
    .withMessage('Estado inválido')
], async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Actualizar campos permitidos
    const allowedUpdates = ['status', 'notes'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        sale[field] = req.body[field];
      }
    });

    await sale.save();

    res.json({
      success: true,
      message: 'Venta actualizada exitosamente',
      data: sale
    });

  } catch (error) {
    console.error('Error actualizando venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/sales/:id
// @desc    Eliminar una venta
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const sale = await Sale.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Venta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
