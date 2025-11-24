import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import logger from '@/lib/logger';

// @desc    Obtener una categoría por ID
export async function GET(req, { params }) {
  await dbConnect();

  try {
    const userId = await verifyAuth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de categoría inválido' },
        { status: 400 }
      );
    }

    const category = await Category.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Obtener conteo de productos
    const count = await Product.countDocuments({
      createdBy: userId,
      category: category.name,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      data: {
        ...category.getPublicData(),
        count: count
      }
    });

  } catch (error) {
    logger.error('Error al obtener categoría:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// @desc    Actualizar una categoría
export async function PUT(req, { params }) {
  await dbConnect();

  try {
    const userId = await verifyAuth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de categoría inválido' },
        { status: 400 }
      );
    }

    const category = await Category.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const { displayName, color, icon, name } = await req.json();

    // Si se está cambiando el nombre, actualizar todos los productos asociados
    if (name && name !== category.name) {
      const normalizedName = name.toLowerCase().trim().replace(/\s+/g, '-');
      
      // Verificar que no exista otra categoría con ese nombre
      const existingCategory = await Category.findOne({
        name: normalizedName,
        createdBy: userId,
        _id: { $ne: new mongoose.Types.ObjectId(id) }
      });

      if (existingCategory) {
        return NextResponse.json(
          { success: false, message: 'Ya existe otra categoría con ese nombre' },
          { status: 400 }
        );
      }

      // Actualizar todos los productos que usan esta categoría
      await Product.updateMany(
        {
          createdBy: userId,
          category: category.name
        },
        {
          $set: { category: normalizedName }
        }
      );

      category.name = normalizedName;
    }

    // Actualizar otros campos
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
    logger.error('Error al actualizar categoría:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// @desc    Eliminar una categoría
export async function DELETE(req, { params }) {
  await dbConnect();

  try {
    const userId = await verifyAuth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de categoría inválido' },
        { status: 400 }
      );
    }

    const category = await Category.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: userId
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay productos asociados
    const productsCount = await Product.countDocuments({
      createdBy: userId,
      category: category.name,
      isActive: true
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No se puede eliminar la categoría porque tiene ${productsCount} producto${productsCount > 1 ? 's' : ''} asociado${productsCount > 1 ? 's' : ''}`,
          productsCount: productsCount
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
    logger.error('Error al eliminar categoría:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

