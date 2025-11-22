import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BusinessSettings from '@/lib/models/BusinessSettings';
import { verifyAuth } from '@/lib/auth';

// @desc    Obtener configuración del negocio
export async function GET(req) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    let settings = await BusinessSettings.findOne({ userId });

    // Si no existe, crear una configuración por defecto
    if (!settings) {
      settings = new BusinessSettings({
        userId,
        currency: 'USD',
        currencySymbol: '$',
        paymentMethods: [
          { name: 'Efectivo', isActive: true, icon: 'cash' },
          { name: 'Tarjeta', isActive: true, icon: 'credit-card' },
          { name: 'Transferencia', isActive: true, icon: 'bank' }
        ]
      });
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      data: settings.getPublicData()
    });

  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

// @desc    Actualizar configuración del negocio
export async function PUT(req) {
  await dbConnect();

  try {
    const userId = await verifyAuth();
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessName,
      businessDescription,
      businessAddress,
      businessPhone,
      businessEmail,
      businessLogo,
      currency,
      currencySymbol,
      paymentMethods
    } = body;

    // Buscar o crear configuración
    let settings = await BusinessSettings.findOne({ userId });

    if (!settings) {
      settings = new BusinessSettings({ userId });
    }

    // Actualizar campos del perfil del negocio
    if (businessName !== undefined) settings.businessName = businessName?.trim() || '';
    if (businessDescription !== undefined) settings.businessDescription = businessDescription?.trim() || '';
    if (businessAddress !== undefined) settings.businessAddress = businessAddress?.trim() || '';
    if (businessPhone !== undefined) settings.businessPhone = businessPhone?.trim() || '';
    if (businessEmail !== undefined) settings.businessEmail = businessEmail?.trim().toLowerCase() || '';
    if (businessLogo !== undefined) settings.businessLogo = businessLogo?.trim() || '';

    // Actualizar configuración financiera
    if (currency !== undefined) {
      settings.currency = currency;
      // Actualizar símbolo según moneda si no se proporciona
      if (!currencySymbol) {
        const currencySymbols = {
          'USD': '$',
          'EUR': '€'
        };
        settings.currencySymbol = currencySymbols[currency] || '$';
      }
    }
    if (currencySymbol !== undefined) settings.currencySymbol = currencySymbol;
    if (paymentMethods !== undefined && Array.isArray(paymentMethods)) {
      settings.paymentMethods = paymentMethods;
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      data: settings.getPublicData(),
      message: 'Configuración actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

