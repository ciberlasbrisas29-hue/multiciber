const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// @route   GET /api/products
// @desc    Obtener todos los productos
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, isActive } = req.query;
    
    // Construir filtros
    const filters = { createdBy: req.user.id };
    
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) {
      filters.$text = { $search: search };
    }

    const products = await Product.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-createdBy');

    const total = await Product.countDocuments(filters);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Obtener un producto por ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).select('-createdBy');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/products
// @desc    Crear un nuevo producto
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      cost,
      category,
      stock,
      minStock,
      unit,
      barcode,
      image,
      tags
    } = req.body;

    // Validar campos requeridos
    if (!name || !price || !cost || !category || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    // Verificar si el código de barras ya existe
    if (barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'El código de barras ya está en uso'
        });
      }
    }

    const product = new Product({
      name,
      description,
      price,
      cost,
      category,
      stock: stock || 0,
      minStock: minStock || 0,
      unit,
      barcode,
      image,
      tags: tags || [],
      createdBy: req.user.id
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: product.getPublicData(),
      message: 'Producto creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Actualizar un producto
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar código de barras único si se está actualizando
    if (req.body.barcode && req.body.barcode !== product.barcode) {
      const existingProduct = await Product.findOne({ 
        barcode: req.body.barcode,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'El código de barras ya está en uso'
        });
      }
    }

    // Actualizar campos
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });

    await product.save();

    res.json({
      success: true,
      data: product.getPublicData(),
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Eliminar un producto
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // En lugar de eliminar, marcar como inactivo
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/products/stats/overview
// @desc    Obtener estadísticas de productos
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Product.aggregate([
      { $match: { createdBy: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $lte: ['$stock', '$minStock'] },
                1,
                0
              ]
            }
          },
          totalValue: {
            $sum: { $multiply: ['$stock', '$price'] }
          },
          totalCost: {
            $sum: { $multiply: ['$stock', '$cost'] }
          }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      { $match: { createdBy: mongoose.Types.ObjectId(req.user.id), isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          totalValue: 0,
          totalCost: 0
        },
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
