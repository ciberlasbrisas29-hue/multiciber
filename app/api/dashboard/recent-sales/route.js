import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Sale from '@/lib/models/Sale';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const recentSales = await Sale.find({
      createdBy: userId,
      status: 'paid'
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'username');

    return NextResponse.json({
      success: true,
      data: recentSales
    });

  } catch (error) {
    console.error('Error obteniendo ventas recientes:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
