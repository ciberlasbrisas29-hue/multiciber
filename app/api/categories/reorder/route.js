import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/lib/models/Category';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import logger from '@/lib/logger';

// @desc    Reordenar categorías
export async function POST(req) {
  await dbConnect();

  try {
    const userId = await verifyAuth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { categoryOrders } = await req.json();

    if (!categoryOrders || !Array.isArray(categoryOrders)) {
      return NextResponse.json(
        { success: false, message: 'Se requiere un array de categoryOrders' },
        { status: 400 }
      );
    }

    // Actualizar el orden de cada categoría
    const updatePromises = categoryOrders.map(({ categoryId, order }) => {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return Promise.resolve(null);
      }

      return Category.updateOne(
        {
          _id: new mongoose.Types.ObjectId(categoryId),
          createdBy: userId
        },
        {
          $set: { order: order }
        }
      );
    });

    await Promise.all(updatePromises);

    logger.info('Categorías reordenadas exitosamente', { userId, count: categoryOrders.length });

    return NextResponse.json({
      success: true,
      message: 'Categorías reordenadas exitosamente'
    });

  } catch (error) {
    logger.error('Error al reordenar categorías:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

