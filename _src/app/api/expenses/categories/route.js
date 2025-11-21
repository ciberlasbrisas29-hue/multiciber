import { NextResponse } from 'next/server';
import Expense from '@/lib/models/Expense';

// @desc    Obtener categorías de gastos
export async function GET(req) {
  // Las categorías se pueden obtener del enum del modelo
  const categories = Expense.schema.path('category').enumValues;

  return NextResponse.json({
    success: true,
    data: categories
  });
}
