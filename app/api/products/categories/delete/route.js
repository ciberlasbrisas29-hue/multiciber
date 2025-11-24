export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

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
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Falta el campo requerido: category' },
        { status: 400 }
      );
    }

    // Verificar si hay productos asociados a esta categoría
    const productsCount = await Product.countDocuments({
      createdBy: new mongoose.Types.ObjectId(userId),
      category: category,
      isActive: true
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No se puede eliminar la categoría "${category}" porque tiene ${productsCount} producto${productsCount > 1 ? 's' : ''} asociado${productsCount > 1 ? 's' : ''}.`,
          productsCount
        },
        { status: 400 }
      );
    }

    // Si no hay productos, la categoría se eliminará automáticamente
    // porque las categorías se generan dinámicamente desde los productos
    // No hay una tabla separada de categorías

    return NextResponse.json({
      success: true,
      message: 'La categoría puede ser eliminada (no tiene productos asociados)',
      data: {
        category,
        productsCount: 0
      }
    });

  } catch (error) {
    console.error('Error verificando eliminación de categoría:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

