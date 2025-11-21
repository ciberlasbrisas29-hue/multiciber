import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User'; // Import User to verify createdBy

// @desc    Obtener todos los productos
export async function GET(req) {
  await dbConnect();
  
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const filters = { createdBy: userId };
    
    if (category) filters.category = category;
    if (isActive !== null) filters.isActive = isActive === 'true';
    if (search) {
      filters.$text = { $search: search };
    }

    const products = await Product.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-createdBy');

    const total = await Product.countDocuments(filters);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Crear un nuevo producto
export async function POST(req) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const body = await req.json();

    const {
      name,
      price,
      cost,
      category,
      unit,
      barcode,
    } = body;

    if (!name || !price || !cost || !category || !unit) {
      return NextResponse.json({ success: false, message: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return NextResponse.json({ success: false, message: 'El código de barras ya está en uso' }, { status: 400 });
      }
    }

    const product = new Product({
      ...body,
      createdBy: userId
    });

    await product.save();

    return NextResponse.json({
      success: true,
      data: product.getPublicData(),
      message: 'Producto creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
