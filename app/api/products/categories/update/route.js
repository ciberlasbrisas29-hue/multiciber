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
    const { oldCategory, newCategory, newDisplayName } = body;

    if (!oldCategory || !newCategory) {
      return NextResponse.json(
        { success: false, message: 'Faltan campos requeridos: oldCategory, newCategory' },
        { status: 400 }
      );
    }

    // Verificar que existan productos con la categoría antigua
    const productsCount = await Product.countDocuments({
      createdBy: new mongoose.Types.ObjectId(userId),
      category: oldCategory
    });

    if (productsCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No se encontraron productos con esta categoría' },
        { status: 404 }
      );
    }

    // Actualizar todos los productos con la nueva categoría
    const updateResult = await Product.updateMany(
      {
        createdBy: new mongoose.Types.ObjectId(userId),
        category: oldCategory
      },
      {
        $set: {
          category: newCategory
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Categoría actualizada exitosamente. ${updateResult.modifiedCount} producto(s) actualizado(s).`,
      data: {
        oldCategory,
        newCategory,
        productsUpdated: updateResult.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

