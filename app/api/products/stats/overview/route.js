import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import mongoose from 'mongoose';

// @desc    Obtener estadísticas de productos
export async function GET(req) {
  await dbConnect();
  
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');

    const stats = await Product.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
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
      { $match: { createdBy: new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return NextResponse.json({
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
    console.error('Error al obtener estadísticas de productos:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
