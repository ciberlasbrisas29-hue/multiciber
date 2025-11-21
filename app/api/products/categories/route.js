export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
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

    // Obtener categorías con conteo de productos
    const categories = await Product.aggregate([
      {
        $match: {
          createdBy: userId,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          // Obtener una imagen de ejemplo de la categoría
          sampleImage: { $first: '$image' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Formatear las categorías
    const formattedCategories = categories.map(cat => ({
      name: cat._id,
      displayName: cat._id?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sin categoría',
      count: cat.count,
      image: cat.sampleImage || null
    }));

    return NextResponse.json({
      success: true,
      data: formattedCategories
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

