import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import Expense from '@/lib/models/Expense';

export async function GET(req) {
  await dbConnect();

  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const recentExpenses = await Expense.find({
      createdBy: userId,
      status: 'paid'
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'username');

    return NextResponse.json({
      success: true,
      data: recentExpenses
    });

  } catch (error) {
    console.error('Error obteniendo gastos recientes:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
