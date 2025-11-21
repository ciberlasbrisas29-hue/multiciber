import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';

// @desc    Obtener todas las ventas
export async function GET(req) {
  await dbConnect();
  
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters = { createdBy: userId };
    
    if (status) filters.status = status;
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'username');

    const total = await Sale.countDocuments(filters);

    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Crear nueva venta
export async function POST(req) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const body = await req.json();

    const { items, type, status, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Debe incluir al menos un item' }, { status: 400 });
    }
     if (!type || !status || !paymentMethod) {
      return NextResponse.json({ success: false, message: 'Faltan campos requeridos (type, status, paymentMethod)' }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const total = subtotal - (body.discount || 0);

    const sale = new Sale({
      ...body,
      subtotal,
      total,
      createdBy: userId,
    });

    await sale.save();

    return NextResponse.json({
      success: true,
      message: 'Venta creada exitosamente',
      data: sale
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando venta:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
