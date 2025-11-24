export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import logger from '@/lib/logger';

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

    const body = await req.json();
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Falta el campo requerido: categoryId' },
        { status: 400 }
      );
    }

    // Buscar la categoría
    const category = await Category.findOne({
      _id: new mongoose.Types.ObjectId(categoryId),
      createdBy: userId
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay productos asociados a esta categoría
    const productsCount = await Product.countDocuments({
      createdBy: userId,
      category: category.name,
      isActive: true
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No se puede eliminar la categoría porque tiene ${productsCount} producto${productsCount > 1 ? 's' : ''} asociado${productsCount > 1 ? 's' : ''}.`,
          productsCount
        },
        { status: 400 }
      );
    }

    // Marcar como inactiva (soft delete)
    category.isActive = false;
    await category.save();

    logger.info('Categoría eliminada exitosamente', { categoryId: category._id });

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error) {
    logger.error('Error eliminando categoría:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

