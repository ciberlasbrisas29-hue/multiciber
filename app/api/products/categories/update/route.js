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
    const { categoryId, displayName, color, icon } = body;

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

    // Actualizar campos si se proporcionan
    if (displayName !== undefined) category.displayName = displayName.trim();
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;

    await category.save();

    logger.info('Categoría actualizada exitosamente', { categoryId: category._id });

    return NextResponse.json({
      success: true,
      data: category.getPublicData(),
      message: 'Categoría actualizada exitosamente'
    });

  } catch (error) {
    logger.error('Error actualizando categoría:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

