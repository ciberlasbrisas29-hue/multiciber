import { NextResponse } from 'next/server';
import twilio from 'twilio';
import logger from '@/lib/logger';

/**
 * Endpoint para verificar el estado de un mensaje de Twilio
 * GET /api/debug/check-message-status?sid=SMxxxxx
 * 
 * ⚠️ SOLO PARA DESARROLLO
 */
export async function GET(req) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, message: 'Este endpoint solo está disponible en desarrollo' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const messageSid = searchParams.get('sid');

    if (!messageSid) {
      return NextResponse.json(
        { success: false, message: 'SID del mensaje requerido (ej: ?sid=SMxxxxx)' },
        { status: 400 }
      );
    }

    // Verificar configuración
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'Twilio no está configurado' },
        { status: 500 }
      );
    }

    // Crear cliente de Twilio
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Obtener información del mensaje
    const message = await client.messages(messageSid).fetch();

    logger.info('Estado del mensaje verificado', {
      sid: messageSid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    });

    return NextResponse.json({
      success: true,
      message: {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        numSegments: message.numSegments,
        price: message.price,
        priceUnit: message.priceUnit
      }
    });

  } catch (error) {
    logger.error('Error verificando estado del mensaje:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Error al verificar el estado del mensaje',
        error: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

