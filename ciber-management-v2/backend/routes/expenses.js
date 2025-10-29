const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/expenses
// @desc    Obtener todos los gastos del usuario
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filtros opcionales
    const filters = { userId };
    
    if (req.query.category) {
      filters.category = req.query.category;
    }
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filters.expenseDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const expenses = await Expense.find(filters)
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username');

    const total = await Expense.countDocuments(filters);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo gastos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Obtener un gasto específico
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('userId', 'username');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    res.json({
      success: true,
      data: expense
    });

  } catch (error) {
    console.error('Error obteniendo gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/expenses
// @desc    Crear nuevo gasto
// @access  Private
router.post('/', [
  authenticateToken,
  body('category')
    .isIn(['rent', 'utilities', 'supplies', 'equipment', 'maintenance', 'internet', 'electricity', 'water', 'phone', 'insurance', 'other'])
    .withMessage('Categoría inválida'),
  body('description')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ max: 200 })
    .withMessage('La descripción no puede exceder 200 caracteres'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser un número mayor a 0'),
  body('expenseDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha inválida'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'transfer', 'check'])
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
      category,
      description,
      amount,
      vendor,
      paymentMethod = 'cash',
      receiptNumber,
      isRecurring = false,
      recurringFrequency,
      expenseDate = new Date()
    } = req.body;

    // Crear nuevo gasto
    const expense = new Expense({
      userId: req.user._id,
      category,
      description,
      amount,
      vendor,
      paymentMethod,
      receiptNumber,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      expenseDate
    });

    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Gasto creado exitosamente',
      data: expense
    });

  } catch (error) {
    console.error('Error creando gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Actualizar un gasto
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Estado inválido')
], async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    // Actualizar campos permitidos
    const allowedUpdates = [
      'category', 'description', 'amount', 'vendor', 
      'paymentMethod', 'receiptNumber', 'status', 'expenseDate'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    await expense.save();

    res.json({
      success: true,
      message: 'Gasto actualizado exitosamente',
      data: expense
    });

  } catch (error) {
    console.error('Error actualizando gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Eliminar un gasto
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Gasto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/expenses/categories
// @desc    Obtener categorías de gastos
// @access  Private
router.get('/categories', authenticateToken, (req, res) => {
  const categories = [
    { value: 'rent', label: 'Renta' },
    { value: 'utilities', label: 'Servicios Públicos' },
    { value: 'supplies', label: 'Suministros' },
    { value: 'equipment', label: 'Equipos' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'internet', label: 'Internet' },
    { value: 'electricity', label: 'Electricidad' },
    { value: 'water', label: 'Agua' },
    { value: 'phone', label: 'Teléfono' },
    { value: 'insurance', label: 'Seguros' },
    { value: 'other', label: 'Otros' }
  ];

  res.json({
    success: true,
    data: categories
  });
});

module.exports = router;
