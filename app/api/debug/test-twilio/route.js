import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/twilio';
import logger from '@/lib/logger';

/**
 * Endpoint de prueba para Twilio (solo desarrollo)
 * POST /api/debug/test-twilio
 */
export async function POST(req) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, message: 'Este endpoint solo está disponible en desarrollo' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, message: 'phoneNumber y message son requeridos' },
        { status: 400 }
      );
    }

    logger.info('Iniciando prueba de Twilio', {
      phoneNumber,
      messageLength: message.length,
      from: process.env.TWILIO_WHATSAPP_NUMBER
    });

    const result = await sendWhatsAppMessage(phoneNumber, message);

    logger.info('Resultado de prueba de Twilio', {
      success: result.success,
      error: result.error,
      data: result.data
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      error: result.error,
      data: result.data,
      debug: {
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 4) + '...',
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN
      }
    });

  } catch (error) {
    logger.error('Error en prueba de Twilio:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Error al procesar la solicitud',
        error: error.code || 'UNKNOWN_ERROR',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

