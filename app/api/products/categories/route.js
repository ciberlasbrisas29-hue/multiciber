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

    // Definir todas las categorías posibles (del enum del modelo)
    const allCategories = [
      'accesorios-gaming',
      'almacenamiento',
      'conectividad',
      'accesorios-trabajo',
      'dispositivos-captura',
      'mantenimiento',
      'otros'
    ];

    // Obtener categorías con conteo de productos
    const categoriesWithProducts = await Product.aggregate([
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
      }
    ]);

    // Crear un mapa de categorías con productos para acceso rápido
    const categoryMap = new Map();
    categoriesWithProducts.forEach(cat => {
      categoryMap.set(cat._id, {
        count: cat.count,
        image: cat.sampleImage || null
      });
    });

    // Combinar todas las categorías con sus datos (o valores por defecto si no tienen productos)
    const formattedCategories = allCategories.map(categoryName => {
      const categoryData = categoryMap.get(categoryName) || { count: 0, image: null };
      const defaultDisplayName = categoryName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      return {
        name: categoryName,
        displayName: defaultDisplayName, // El nombre personalizado se maneja en el frontend
        count: categoryData.count,
        image: categoryData.image
      };
    });

    // Ordenar: primero las que tienen productos (por cantidad descendente), luego las vacías
    formattedCategories.sort((a, b) => {
      if (a.count > 0 && b.count > 0) {
        return b.count - a.count; // Orden descendente por cantidad
      }
      if (a.count > 0) return -1; // Las con productos primero
      if (b.count > 0) return 1;
      return a.name.localeCompare(b.name); // Las vacías ordenadas alfabéticamente
    });

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

