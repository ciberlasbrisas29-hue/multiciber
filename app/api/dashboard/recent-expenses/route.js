import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/lib/models/Expense';
import User from '@/lib/models/User'; // Necesario para populate
import { verifyAuth } from '@/lib/auth';

// Registrar modelos para evitar errores de cold start en Vercel
const _dependencies = { User };

// Forzar que esta ruta sea dinámica y no se cachee
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const recentExpenses = await Expense.find({
      createdBy: userId,
      status: 'paid'
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'username')
    .lean();

    // Crear respuesta con headers anti-caché
    const response = NextResponse.json({
      success: true,
      data: recentExpenses
    });
    
    // Headers para evitar cualquier tipo de caché
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;

  } catch (error) {
    console.error('Error obteniendo gastos recientes:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
