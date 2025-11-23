export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';
import Expense from '@/lib/models/Expense';
import Product from '@/lib/models/Product';
import mongoose from 'mongoose';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  await dbConnect();

  try {
    const userIdObj = await verifyAuth();

    if (!userIdObj) {
      console.error('GET /api/dashboard/stats: No autorizado.');
      return NextResponse.json(
        { success: false, message: 'No autorizado: Token inválido o ausente' },
        { status: 401 }
      );
    }

    console.log(`GET /api/dashboard/stats: Recuperando estadísticas para el usuario: ${userIdObj}`);

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    console.log('Debug Date Range (Local):', {
      serverTime: today.toString(),
      startOfDay: startOfDay.toString(),
      endOfDay: endOfDay.toString()
    });
    console.log('Debug Date Range (ISO):', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Run queries in parallel
    // Para ventas: incluir tanto pagadas como deudas, pero calcular ingresos solo con lo pagado
    const [
      todaySales,
      monthSales,
      monthExpenses,
      salesLast7Days,
      expensesByCategory,
      productCount,
    ] = await Promise.all([
      // Ventas del día: incluir todas las ventas (pagadas y con deuda)
      Sale.find({ createdBy: userIdObj, createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      // Ventas del mes: incluir todas las ventas (pagadas y con deuda)
      Sale.find({ createdBy: userIdObj, createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      Expense.find({ createdBy: userIdObj, createdAt: { $gte: startOfMonth, $lte: endOfMonth }, status: 'paid' }),
      Sale.aggregate([
        { $match: { createdBy: userIdObj, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            // Sumar solo lo pagado: si está completamente pagada, sumar total; si tiene deuda, sumar paidAmount
            revenue: { 
              $sum: {
                $cond: [
                  { $eq: ['$status', 'paid'] },
                  '$total',
                  { $ifNull: ['$paidAmount', 0] }
                ]
              }
            },
            transactions: { $sum: 1 },
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Expense.aggregate([
        { $match: { createdBy: userIdObj, createdAt: { $gte: startOfMonth, $lte: endOfMonth }, status: 'paid' } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          }
        }
      ]),
      Product.countDocuments({ createdBy: userIdObj, isActive: true }),
    ]);

    // Process results
    // Para calcular ingresos: si la venta está completamente pagada, sumar total; si tiene deuda, sumar solo paidAmount
    const todayRevenue = todaySales.reduce((sum, sale) => {
      if (sale.status === 'paid') {
        return sum + sale.total;
      } else {
        // Si tiene deuda, sumar solo lo pagado
        return sum + (sale.paidAmount || 0);
      }
    }, 0);
    const todayTransactions = todaySales.length;

    const monthRevenue = monthSales.reduce((sum, sale) => {
      if (sale.status === 'paid') {
        return sum + sale.total;
      } else {
        // Si tiene deuda, sumar solo lo pagado
        return sum + (sale.paidAmount || 0);
      }
    }, 0);
    const monthTransactions = monthSales.length;
    const monthExpenseTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthProfit = monthRevenue - monthExpenseTotal;

    console.log(`GET /api/dashboard/stats: Resumen del día - Ingresos: ${todayRevenue.toFixed(2)}, Transacciones: ${todayTransactions}`);
    console.log(`GET /api/dashboard/stats: Resumen del mes - Ingresos: ${monthRevenue.toFixed(2)}, Gastos: ${monthExpenseTotal.toFixed(2)}, Ganancia: ${monthProfit.toFixed(2)}`);
    console.log(`GET /api/dashboard/stats: Total de productos activos: ${productCount}`);

    const productSales = {};
    monthSales.forEach(sale => {
      sale.items.forEach(item => {
        productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity;
      });
    });
    const topProduct = Object.keys(productSales).length > 0 ?
      Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b, null) :
      null;

    const expensesByCategoryMap = expensesByCategory.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {});

    return NextResponse.json({
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
          profit: monthProfit,
        },
        topProduct: topProduct || 'N/A',
        last7Days: salesLast7Days,
        expensesByCategory: expensesByCategoryMap,
        productCount: productCount,
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
