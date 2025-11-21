import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import Expense from '@/lib/models/Expense';

// @desc    Obtener un gasto específico
export async function GET(req, { params }) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;

    const expense = await Expense.findOne({
      _id: id,
      createdBy: userId
    }).populate('createdBy', 'username');

    if (!expense) {
      return NextResponse.json({ success: false, message: 'Gasto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: expense
    });

  } catch (error) {
    console.error('Error obteniendo gasto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Actualizar un gasto
export async function PUT(req, { params }) {
  await dbConnect();
  
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;
    const body = await req.json();

    const expense = await Expense.findOne({
      _id: id,
      createdBy: userId
    });

    if (!expense) {
      return NextResponse.json({ success: false, message: 'Gasto no encontrado' }, { status: 404 });
    }

    // Actualizar campos permitidos
    const allowedUpdates = [
      'category', 'description', 'amount', 'vendor', 
      'paymentMethod', 'receipt', 'status', 'notes',
      'isRecurring', 'recurringPeriod', 'nextDueDate'
    ];
    
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        expense[field] = body[field];
      }
    });

    await expense.save();

    return NextResponse.json({
      success: true,
      message: 'Gasto actualizado exitosamente',
      data: expense
    });

  } catch (error) {
    console.error('Error actualizando gasto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Eliminar un gasto
export async function DELETE(req, { params }) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;

    const expense = await Expense.findOneAndDelete({
      _id: id,
      createdBy: userId
    });

    if (!expense) {
      return NextResponse.json({ success: false, message: 'Gasto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Gasto eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando gasto:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
