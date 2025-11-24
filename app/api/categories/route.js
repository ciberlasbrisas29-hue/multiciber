import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { verifyAuth } from '@/lib/auth';
import logger from '@/lib/logger';

// @desc    Obtener todas las categorías del usuario
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

    // Obtener todas las categorías activas del usuario
    // Ordenar primero por order, luego por displayName
    const categories = await Category.find({
      createdBy: userId,
      isActive: true
    }).sort({ order: 1, displayName: 1 });

    // Obtener conteo de productos por categoría
    const categoriesWithCount = await Promise.all(
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
          _id: category._id,
          name: category.name,
          displayName: category.displayName,
          color: category.color,
          icon: category.icon,
          count: count,
          image: sampleProduct?.image || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: categoriesWithCount
    });

  } catch (error) {
    logger.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// @desc    Crear una nueva categoría
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

    const { name, displayName, color, icon } = await req.json();

    // Validaciones
    if (!name || !displayName || !color) {
      return NextResponse.json(
        { success: false, message: 'Faltan campos requeridos: name, displayName, color' },
        { status: 400 }
      );
    }

    // Normalizar el nombre (lowercase, sin espacios)
    const normalizedName = name.toLowerCase().trim().replace(/\s+/g, '-');

    // Verificar si ya existe una categoría con ese nombre
    const existingCategory = await Category.findOne({
      name: normalizedName,
      createdBy: userId
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }

    // Obtener el siguiente orden disponible
    const maxOrderCategory = await Category.findOne({
      createdBy: userId,
      isActive: true
    }).sort({ order: -1 });

    const nextOrder = maxOrderCategory ? (maxOrderCategory.order || 0) + 1 : 0;

    // Crear la categoría
    const category = new Category({
      name: normalizedName,
      displayName: displayName.trim(),
      color: color,
      icon: icon || 'Package',
      order: nextOrder,
      createdBy: userId
    });

    await category.save();

    logger.info('Categoría creada exitosamente', { categoryId: category._id, name: category.name });

    return NextResponse.json({
      success: true,
      data: category.getPublicData(),
      message: 'Categoría creada exitosamente'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error al crear categoría:', error);
    
    // Manejar errores de validación de MongoDB
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, message: 'Error de validación', errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

