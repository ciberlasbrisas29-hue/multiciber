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

    // Incluir todas las ventas (de productos y libres) tanto pagadas como deudas
    // Para los últimos movimientos, mostramos todas las ventas recientes
    // Ordenar por updatedAt para que los abonos recientes aparezcan primero
    const recentSales = await Sale.find({
      createdBy: userId
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('createdBy', 'username')
    .populate('items.product', 'name image')
    .lean();

    console.log(`GET /api/dashboard/recent-sales: Encontradas ${recentSales.length} ventas recientes para el usuario ${userId}`);
    if (recentSales.length > 0) {
      console.log(`GET /api/dashboard/recent-sales: Ventas encontradas:`, recentSales.map(s => ({ 
        id: s._id, 
        type: s.type, 
        status: s.status, 
        total: s.total, 
        concept: s.concept,
        client: s.client?.name,
        saleNumber: s.saleNumber 
      })));
    }

    return NextResponse.json({
      success: true,
      data: recentSales
    });

  } catch (error) {
    console.error('Error obteniendo ventas recientes:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
