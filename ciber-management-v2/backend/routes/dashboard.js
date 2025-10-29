const express = require('express');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Obtener estadísticas del dashboard
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Estadísticas de ventas del día
    const todaySales = await Sale.find({
      userId,
      saleDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    });

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const todayTransactions = todaySales.length;

    // Estadísticas de ventas del mes
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthSales = await Sale.find({
      userId,
      saleDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'completed'
    });

    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    const monthTransactions = monthSales.length;

    // Estadísticas de gastos del mes
    const monthExpenses = await Expense.find({
      userId,
      expenseDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'approved'
    });

    const monthExpenseTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Producto más vendido del mes
    const productSales = {};
    monthSales.forEach(sale => {
      sale.items.forEach(item => {
        if (productSales[item.productName]) {
          productSales[item.productName] += item.quantity;
        } else {
          productSales[item.productName] = item.quantity;
        }
      });
    });

    const topProduct = Object.keys(productSales).reduce((a, b) => 
      productSales[a] > productSales[b] ? a : b, Object.keys(productSales)[0]
    );

    // Ventas por día de la semana (últimos 7 días)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const daySales = await Sale.find({
        userId,
        saleDate: { $gte: dayStart, $lte: dayEnd },
        status: 'completed'
      });

      const dayRevenue = daySales.reduce((sum, sale) => sum + sale.total, 0);

      last7Days.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue,
        transactions: daySales.length
      });
    }

    // Gastos por categoría del mes
    const expensesByCategory = {};
    monthExpenses.forEach(expense => {
      if (expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] += expense.amount;
      } else {
        expensesByCategory[expense.category] = expense.amount;
      }
    });

    res.json({
      success: true,
      data: {
        today: {
          revenue: todayRevenue,
          transactions: todayTransactions
        },
        month: {
          revenue: monthRevenue,
          transactions: monthTransactions,
          expenses: monthExpenseTotal,
          profit: monthRevenue - monthExpenseTotal
        },
        topProduct: topProduct || 'N/A',
        last7Days,
        expensesByCategory
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/dashboard/recent-sales
// @desc    Obtener ventas recientes
// @access  Private
router.get('/recent-sales', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const recentSales = await Sale.find({
      userId,
      status: 'completed'
    })
    .sort({ saleDate: -1 })
    .limit(limit)
    .populate('userId', 'username');

    res.json({
      success: true,
      data: recentSales
    });

  } catch (error) {
    console.error('Error obteniendo ventas recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/dashboard/recent-expenses
// @desc    Obtener gastos recientes
// @access  Private
router.get('/recent-expenses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const recentExpenses = await Expense.find({
      userId,
      status: 'approved'
    })
    .sort({ expenseDate: -1 })
    .limit(limit)
    .populate('userId', 'username');

    res.json({
      success: true,
      data: recentExpenses
    });

  } catch (error) {
    console.error('Error obteniendo gastos recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
