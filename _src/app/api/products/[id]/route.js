import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';

// @desc    Obtener un producto por ID
export async function GET(req, { params }) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;

    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    }).select('-createdBy');

    if (!product) {
      return NextResponse.json({ success: false, message: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Actualizar un producto
export async function PUT(req, { params }) {
  await dbConnect();
  
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;
    const body = await req.json();

    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Producto no encontrado' }, { status: 404 });
    }

    if (body.barcode && body.barcode !== product.barcode) {
      const existingProduct = await Product.findOne({ 
        barcode: body.barcode,
        _id: { $ne: id }
      });
      if (existingProduct) {
        return NextResponse.json({ success: false, message: 'El código de barras ya está en uso' }, { status: 400 });
      }
    }

    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        product[key] = body[key];
      }
    });

    await product.save();

    return NextResponse.json({
      success: true,
      data: product.getPublicData(),
      message: 'Producto actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Eliminar un producto
export async function DELETE(req, { params }) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;

    const product = await Product.findOne({
      _id: id,
      createdBy: userId
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Producto no encontrado' }, { status: 404 });
    }

    product.isActive = false;
    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Producto desactivado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
