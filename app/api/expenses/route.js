import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Expense from '@/lib/models/Expense';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.log('No se encontró token de autenticación.');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('Usuario no encontrado para el token dado.');
    }
    return user;
  } catch (error) {
    console.error('Error verificando token en getUserFromToken:', error);
    return null;
  }
}

// @desc    Obtener todos los gastos
export async function GET(req) {
  await dbConnect();
  
  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters = { createdBy: user._id };
    
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
      .populate('createdBy', 'username')
      .lean();

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
    const user = await getUserFromToken(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const body = await req.json();

    const { description, amount, category, paymentMethod } = body;

    if (!description || !amount || !category || !paymentMethod) {
      return NextResponse.json({ success: false, message: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Generar número de gasto si no existe
    let expenseNumber = body.expenseNumber;
    if (!expenseNumber) {
      try {
        const count = await Expense.countDocuments();
        expenseNumber = `G-${String(count + 1).padStart(6, '0')}`;
      } catch (error) {
        // Si hay error, usar timestamp como fallback
        expenseNumber = `G-${Date.now().toString().slice(-6)}`;
      }
    }

    const expense = new Expense({
      ...body,
      expenseNumber,
      createdBy: user._id,
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
