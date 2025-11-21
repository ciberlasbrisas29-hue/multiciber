import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import Expense from '@/lib/models/Expense';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.id);

    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Helper function to get date range
function getDateRange(period) {
  const now = new Date();
  // Use local time for day boundaries
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = startOfDay;
      endDate = endOfDay;
      break;
    case 'yesterday':
      const yesterday = new Date(startOfDay);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = yesterday;
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      break;
    case 'week':
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay()); // Sunday as start
      startDate = startOfWeek;
      endDate = endOfDay;
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default:
      // Last 30 days
      startDate = new Date(startOfDay);
      startDate.setDate(startDate.getDate() - 30);
      endDate = endOfDay;
  }

  return { startDate, endDate };
}

export async function GET(req) {
  await dbConnect();

  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let dateRange;

    if (startDateParam && endDateParam) {
      dateRange = {
        startDate: new Date(startDateParam),
        endDate: new Date(endDateParam)
      };
    } else {
      dateRange = getDateRange(period);
    }

    console.log('Calculating balance for period:', period, dateRange);

    // 1. Total de ventas y ganancias
    const salesData = await Sale.aggregate([
      {
        $match: {
          createdBy: user._id,
          createdAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalPaidSales: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'paid'] },
                '$total',
                '$paidAmount'
              ]
            }
          },
          totalDebts: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'debt'] },
                { $subtract: ['$total', '$paidAmount'] },
                0
              ]
            }
          },
          totalTransactions: { $sum: 1 },
          averageTicket: { $avg: '$total' }
        }
      }
    ]);

    // 2. Finanzas por día (Ventas vs Costos)
    const dailyFinancials = await Sale.aggregate([
      {
        $match: {
          createdBy: user._id,
          createdAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            saleId: '$_id'
          },
          saleTotal: { $first: '$total' },
          saleCost: {
            $sum: {
              $multiply: [
                '$items.quantity',
                { $ifNull: [{ $arrayElemAt: ['$productInfo.cost', 0] }, 0] }
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          },
          totalSales: { $sum: '$saleTotal' },
          totalCost: { $sum: '$saleCost' },
          totalTransactions: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // 3. Productos más vendidos
    const topProducts = await Sale.aggregate([
      {
        $match: {
          createdBy: user._id,
          createdAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          averagePrice: { $avg: '$items.unitPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // 4. Ventas por método de pago
    const paymentMethods = await Sale.aggregate([
      {
        $match: {
          createdBy: user._id,
          createdAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 5. Calcular ganancias estimadas (necesitamos el costo de productos)
    const profitData = await Sale.aggregate([
      {
        $match: {
          createdBy: user._id,
          createdAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          },
          status: 'paid'
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.totalPrice' },
          estimatedCost: {
            $sum: {
              $multiply: [
                '$items.quantity',
                { $ifNull: [{ $arrayElemAt: ['$productInfo.cost', 0] }, 0] }
              ]
            }
          }
        }
      }
    ]);

    // 6. Tendencia semanal
    const weeklyTrend = await Sale.aggregate([
      {
        $match: {
          createdBy: user._id,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // 7. Gastos Operativos
    const expensesData = await Expense.aggregate([
      {
        $match: {
          createdBy: user._id,
          createdAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Procesar datos
    const summary = salesData[0] || {
      totalSales: 0,
      totalPaidSales: 0,
      totalDebts: 0,
      totalTransactions: 0,
      averageTicket: 0
    };

    const profit = profitData[0] || {
      totalRevenue: 0,
      estimatedCost: 0
    };

    const expenses = expensesData[0] || {
      totalExpenses: 0,
      count: 0
    };

    const grossProfit = profit.totalRevenue - profit.estimatedCost;
    const netProfit = grossProfit - expenses.totalExpenses;
    const profitMargin = profit.totalRevenue > 0 ? (netProfit / profit.totalRevenue) * 100 : 0;

    // Formatear datos para gráficas
    const chartData = dailyFinancials.map(day => ({
      date: `${day._id.day}/${day._id.month}`,
      sales: day.totalSales,
      cost: day.totalCost,
      profit: day.totalSales - day.totalCost,
      transactions: day.totalTransactions
    }));

    const paymentChartData = paymentMethods.map(method => ({
      method: method._id === 'cash' ? 'Efectivo' :
        method._id === 'card' ? 'Tarjeta' :
          method._id === 'transfer' ? 'Transferencia' : 'Otro',
      total: method.total,
      count: method.count
    }));

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weeklyChartData = weekDays.map((day, index) => {
      const dayData = weeklyTrend.find(d => d._id === index + 1);
      return {
        day,
        sales: dayData?.total || 0,
        transactions: dayData?.count || 0
      };
    });

    const response = {
      success: true,
      data: {
        period: period,
        dateRange: dateRange,
        summary: {
          totalSales: summary.totalSales,
          totalPaidSales: summary.totalPaidSales,
          totalDebts: summary.totalDebts,
          totalTransactions: summary.totalTransactions,
          averageTicket: summary.averageTicket,
          grossProfit: grossProfit,
          totalExpenses: expenses.totalExpenses,
          netProfit: netProfit,
          profitMargin: profitMargin,
          totalRevenue: profit.totalRevenue,
          estimatedCost: profit.estimatedCost
        },
        charts: {
          dailySales: chartData,
          paymentMethods: paymentChartData,
          weeklyTrend: weeklyChartData,
          topProducts: topProducts.slice(0, 5)
        },
        topProducts: topProducts,
        paymentMethods: paymentMethods
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error calculating balance:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}