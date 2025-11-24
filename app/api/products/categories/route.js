export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { verifyAuth } from '@/lib/auth';
import logger from '@/lib/logger';

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

    // Obtener todas las categorías activas del usuario desde la BD
    // Ordenar primero por order (ascendente), luego por displayName
    const categories = await Category.find({
      createdBy: userId,
      isActive: true
    }).sort({ order: 1, displayName: 1 });

    // Obtener conteo de productos y imagen de ejemplo para cada categoría
    const categoriesWithData = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({
          createdBy: userId,
          category: category.name,
          isActive: true
        });

        // Obtener una imagen de ejemplo
        const sampleProduct = await Product.findOne({
          createdBy: userId,
          category: category.name,
          isActive: true
        }).select('image').limit(1);

        return {
          _id: category._id.toString(),
          name: category.name,
          displayName: category.displayName,
          count: count,
          image: sampleProduct?.image || null,
          color: category.color,
          icon: category.icon,
          order: category.order || 0
        };
      })
    );

    // Mantener el orden guardado (ya viene ordenado por order desde la BD)
    // No reordenar aquí para respetar el orden personalizado del usuario

    return NextResponse.json({
      success: true,
      data: categoriesWithData
    });

  } catch (error) {
    logger.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

