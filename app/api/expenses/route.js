import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import Expense from '@/lib/models/Expense';

// @desc    Obtener todos los gastos
export async function GET(req) {
  await dbConnect();
  
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters = { createdBy: userId };
    
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await Expense.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'username');

    const total = await Expense.countDocuments(filters);

    return NextResponse.json({
      success: true,
      data: expenses,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error obteniendo gastos:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Crear nuevo gasto
export async function POST(req) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const body = await req.json();

    const { description, amount, category, paymentMethod } = body;

    if (!description || !amount || !category || !paymentMethod) {
      return NextResponse.json({ success: false, message: 'Faltan campos requeridos' }, { status: 400 });
    }

    const expense = new Expense({
      ...body,
      createdBy: userId,
    });

    await expense.save();

    return NextResponse.json({
      success: true,
      message: 'Gasto creado exitosamente',
      data: expense
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando gasto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
