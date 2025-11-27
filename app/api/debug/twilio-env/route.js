import { NextResponse } from 'next/server';

/**
 * Endpoint de debug para verificar variables de entorno de Twilio
 * GET /api/debug/twilio-env
 * 
 * ⚠️ SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
 */
export async function GET(req) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, message: 'Este endpoint solo está disponible en desarrollo' },
      { status: 403 }
    );
  }

  const twilioVars = {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID 
      ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 4)}...${process.env.TWILIO_ACCOUNT_SID.substring(process.env.TWILIO_ACCOUNT_SID.length - 4)}`
      : 'NO CONFIGURADO',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN 
      ? `${process.env.TWILIO_AUTH_TOKEN.substring(0, 4)}...${process.env.TWILIO_AUTH_TOKEN.substring(process.env.TWILIO_AUTH_TOKEN.length - 4)}`
      : 'NO CONFIGURADO',
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || 'NO CONFIGURADO',
  };

  const isConfigured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  );

  return NextResponse.json({
    success: true,
    configured: isConfigured,
    variables: twilioVars,
    nodeEnv: process.env.NODE_ENV,
    message: isConfigured 
      ? 'Twilio está configurado correctamente' 
      : 'Faltan variables de Twilio en process.env'
  });
}

