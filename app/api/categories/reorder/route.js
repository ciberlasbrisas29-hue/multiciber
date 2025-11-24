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

    // Validar que todos los categoryId sean válidos
    const validOrders = categoryOrders.filter(({ categoryId, order }) => {
      if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        logger.warn('CategoryId inválido ignorado', { categoryId });
        return false;
      }
      if (typeof order !== 'number' || order < 0) {
        logger.warn('Order inválido ignorado', { categoryId, order });
        return false;
      }
      return true;
    });

    if (validOrders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionaron órdenes válidos' },
        { status: 400 }
      );
    }

    // Actualizar el orden de cada categoría
    const updatePromises = validOrders.map(({ categoryId, order }) => {
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

    const results = await Promise.all(updatePromises);
    const modifiedCount = results.reduce((sum, result) => sum + (result.modifiedCount || 0), 0);

    // Verificar que se guardaron correctamente
    const updatedCategories = await Category.find({
      createdBy: userId,
      isActive: true
    }).select('_id name displayName order').sort({ order: 1 });

    logger.info('Categorías reordenadas exitosamente', { 
      userId, 
      total: validOrders.length,
      modified: modifiedCount,
      orders: updatedCategories.map(c => ({ name: c.name, order: c.order }))
    });

    return NextResponse.json({
      success: true,
      message: 'Categorías reordenadas exitosamente',
      data: {
        updated: modifiedCount,
        total: validOrders.length
      }
    });

  } catch (error) {
    logger.error('Error al reordenar categorías:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

