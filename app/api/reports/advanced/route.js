export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import Expense from '@/lib/models/Expense';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  await dbConnect();

  try {
    const userId = await verifyAuth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today'; // today, yesterday, week, month

    // Calcular rango de fechas según el período
    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        break;
      case 'week':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        startDate = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    }

    // 1. Resumen financiero diario
    // Incluir TODAS las ventas (paid y debt) y usar updatedAt para considerar abonos recientes
    const sales = await Sale.find({
      createdBy: userId,
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { updatedAt: { $gte: startDate, $lte: endDate } }
      ]
    }).populate('items.product');

    // Calcular ingresos reales:
    // - Para ventas pagadas completamente: usar total
    // - Para ventas con deuda: usar paidAmount (lo que realmente se recibió)
    // - Para ventas libres: usar freeSaleAmount o total
    const totalSales = sales.reduce((sum, sale) => {
      if (sale.status === 'paid') {
        // Venta completamente pagada
        return sum + sale.total;
      } else if (sale.status === 'debt') {
        // Venta con deuda: solo contar lo pagado (abonos)
        return sum + (sale.paidAmount || 0);
      }
      return sum;
    }, 0);

    // Contar todas las transacciones (incluyendo ventas libres)
    const totalTransactions = sales.length;
    const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Obtener egresos/gastos del período
    const expenses = await Expense.find({
      createdBy: userId,
      expenseDate: { $gte: startDate, $lte: endDate },
      status: 'paid'
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calcular margen bruto (simplificado: ingresos - costos estimados - egresos)
    const estimatedCost = sales.reduce((sum, sale) => {
      const saleAmount = sale.status === 'paid' ? sale.total : (sale.paidAmount || 0);
      if (sale.items && sale.items.length > 0) {
        // Estimación: 60% del total como costo (ajustable)
        return sum + (saleAmount * 0.6);
      }
      return sum + (saleAmount * 0.5); // Para ventas libres, estimar 50%
    }, 0);
    
    // Rentabilidad = Ingresos - Costos estimados - Egresos
    const grossProfit = totalSales - estimatedCost - totalExpenses;

    // 2. Tendencia semanal (últimos 7 días)
    // Usar updatedAt para considerar abonos recientes
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyTrend = await Sale.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
          $or: [
            { createdAt: { $gte: sevenDaysAgo } },
            { updatedAt: { $gte: sevenDaysAgo } }
          ]
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: { 
                $cond: [
                  { $gte: ['$updatedAt', sevenDaysAgo] },
                  '$updatedAt',
                  '$createdAt'
                ]
              }
            } 
          },
          revenue: { 
            $sum: {
              $cond: [
                { $eq: ['$status', 'paid'] },
                '$total',
                { $ifNull: ['$paidAmount', 0] }
              ]
            }
          },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Formatear datos para el gráfico
    const weeklyChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = weeklyTrend.find(d => d._id === dateStr);
      weeklyChartData.push({
        date: dateStr,
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        revenue: dayData?.revenue || 0,
        transactions: dayData?.transactions || 0
      });
    }

    // 3. Métodos de pago (gráfico circular)
    // Incluir todas las ventas y usar paidAmount para ventas con deuda
    const paymentMethods = await Sale.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
          $or: [
            { createdAt: { $gte: startDate, $lte: endDate } },
            { updatedAt: { $gte: startDate, $lte: endDate } }
          ]
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { 
            $sum: {
              $cond: [
                { $eq: ['$status', 'paid'] },
                '$total',
                { $ifNull: ['$paidAmount', 0] }
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalPaymentAmount = paymentMethods.reduce((sum, pm) => sum + pm.total, 0);
    const paymentChartData = paymentMethods.map(pm => {
      const methodName = pm._id === 'cash' ? 'Efectivo' :
                        pm._id === 'card' ? 'Tarjeta' :
                        pm._id === 'transfer' ? 'Transferencia' : 'Otro';
      return {
        name: methodName,
        value: pm.total,
        count: pm.count,
        percentage: totalPaymentAmount > 0 ? (pm.total / totalPaymentAmount * 100) : 0
      };
    });

    // 4. Rendimiento de inventario
    // Producto estrella (más ingresos) - incluir todas las ventas de productos
    const topProductsByRevenue = await Sale.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
          $or: [
            { createdAt: { $gte: startDate, $lte: endDate } },
            { updatedAt: { $gte: startDate, $lte: endDate } }
          ],
          type: 'product',
          // Incluir ventas pagadas completamente y ventas con deuda (solo si tienen items)
          items: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalRevenue: { $sum: '$items.totalPrice' },
          totalQuantity: { $sum: '$items.quantity' },
          productName: { $first: '$items.productName' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 1 }
    ]);

    // Producto de mayor rotación (más unidades vendidas)
    const topProductsByQuantity = await Sale.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
          $or: [
            { createdAt: { $gte: startDate, $lte: endDate } },
            { updatedAt: { $gte: startDate, $lte: endDate } }
          ],
          type: 'product',
          // Incluir ventas pagadas completamente y ventas con deuda (solo si tienen items)
          items: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalRevenue: { $sum: '$items.totalPrice' },
          totalQuantity: { $sum: '$items.quantity' },
          productName: { $first: '$items.productName' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 1 }
    ]);

    // Obtener detalles del producto estrella
    let starProduct = null;
    if (topProductsByRevenue.length > 0) {
      const productId = topProductsByRevenue[0]._id;
      if (productId) {
        starProduct = await Product.findById(productId);
      }
      if (!starProduct && topProductsByRevenue[0].productName) {
        starProduct = {
          name: topProductsByRevenue[0].productName,
          image: null
        };
      }
    }

    // Obtener detalles del producto de mayor rotación
    let topRotationProduct = null;
    if (topProductsByQuantity.length > 0) {
      const productId = topProductsByQuantity[0]._id;
      if (productId) {
        topRotationProduct = await Product.findById(productId);
      }
      if (!topRotationProduct && topProductsByQuantity[0].productName) {
        topRotationProduct = {
          name: topProductsByQuantity[0].productName,
          image: null
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        summary: {
          totalSales,
          grossProfit,
          averageTicket,
          totalTransactions,
          totalExpenses // Agregar egresos al resumen
        },
        weeklyTrend: weeklyChartData,
        paymentMethods: paymentChartData,
        inventory: {
          starProduct: starProduct ? {
            id: starProduct._id?.toString() || null,
            name: starProduct.name || topProductsByRevenue[0]?.productName || 'N/A',
            image: starProduct.image || null,
            revenue: topProductsByRevenue[0]?.totalRevenue || 0
          } : null,
          topRotationProduct: topRotationProduct ? {
            id: topRotationProduct._id?.toString() || null,
            name: topRotationProduct.name || topProductsByQuantity[0]?.productName || 'N/A',
            image: topRotationProduct.image || null,
            quantity: topProductsByQuantity[0]?.totalQuantity || 0
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo reportes avanzados:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

