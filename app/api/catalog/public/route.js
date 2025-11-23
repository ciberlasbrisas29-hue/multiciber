import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import BusinessSettings from '@/lib/models/BusinessSettings';
import mongoose from 'mongoose';

// Endpoint público para obtener el catálogo de productos disponibles
export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'ID de usuario requerido' }, { status: 400 });
    }

    // Validar que userId es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: 'ID de usuario inválido' }, { status: 400 });
    }

    // Obtener configuración del negocio
    const settings = await BusinessSettings.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
    
    // Obtener solo productos disponibles (stock > 0 y activos)
    const products = await Product.find({
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true,
      stock: { $gt: 0 }
    })
    .select('name description price category stock unit image barcode')
    .sort({ category: 1, name: 1 })
    .lean();

    return NextResponse.json({
      success: true,
      data: {
        business: {
          name: settings?.businessName || 'Negocio',
          description: settings?.businessDescription || '',
          logo: settings?.businessLogo || '',
          whatsappPhone: settings?.whatsappPhone || ''
        },
        products: products
      }
    });

  } catch (error) {
    console.error('Error obteniendo catálogo público:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
