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
    const slug = searchParams.get('slug');
    const userId = searchParams.get('userId'); // Mantener compatibilidad
    
    let settings;
    let ownerId;
    
    // Buscar por slug (nuevo método) o por userId (compatibilidad)
    if (slug) {
      settings = await BusinessSettings.findOne({ catalogSlug: slug.toLowerCase() }).lean();
      if (!settings) {
        return NextResponse.json({ success: false, message: 'Catálogo no encontrado' }, { status: 404 });
      }
      ownerId = settings.userId;
    } else if (userId) {
      // Compatibilidad con el método antiguo
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ success: false, message: 'ID de usuario inválido' }, { status: 400 });
      }
      ownerId = new mongoose.Types.ObjectId(userId);
      settings = await BusinessSettings.findOne({ userId: ownerId }).lean();
    } else {
      return NextResponse.json({ success: false, message: 'Slug o ID de usuario requerido' }, { status: 400 });
    }
    
    // Obtener solo productos disponibles (stock > 0 y activos)
    const products = await Product.find({
      createdBy: ownerId,
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
          whatsappPhone: settings?.whatsappPhone || '',
          slug: settings?.catalogSlug || ''
        },
        products: products
      }
    });

  } catch (error) {
    console.error('Error obteniendo catálogo público:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
