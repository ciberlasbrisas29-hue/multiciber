import { NextResponse } from 'next/server';
import twilio from 'twilio';
import logger from '@/lib/logger';

/**
 * Endpoint para probar envío de mensaje simple directamente
 * GET /api/debug/test-simple-message?phoneNumber=+50374937859&message=Hola
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber') || '+50374937859';
    const message = searchParams.get('message') || 'Prueba desde API directa';

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json({
        success: false,
        message: 'Twilio no está configurado'
      }, { status: 500 });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Formatear número "from"
    let from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    from = from.trim();
    if (!from.startsWith('whatsapp:')) {
      if (from.startsWith('+')) {
        from = 'whatsapp:' + from;
      } else {
        from = 'whatsapp:+' + from.replace(/[^\d]/g, '');
      }
    }

    // Formatear número "to"
    let to = phoneNumber.replace(/[^\d+]/g, '');
    if (!to.startsWith('+')) {
      to = '+503' + to.replace(/^503/, '');
    }
    to = `whatsapp:${to}`;

    logger.info('Probando mensaje simple directo', {
      from,
      to,
      message,
      fromRaw: process.env.TWILIO_WHATSAPP_NUMBER
    });

    // Intentar enviar mensaje simple
    try {
      const result = await client.messages.create({
        from: from,
        to: to,
        body: message
      });

      logger.info('Mensaje simple enviado', {
        sid: result.sid,
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage
      });

      return NextResponse.json({
        success: true,
        message: 'Mensaje enviado',
        data: {
          sid: result.sid,
          status: result.status,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          from,
          to
        }
      });

    } catch (error) {
      logger.error('Error enviando mensaje simple', {
        error: error.message,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo
      });

      return NextResponse.json({
        success: false,
        message: error.message,
        error: {
          code: error.code,
          status: error.status,
          moreInfo: error.moreInfo
        },
        from,
        to
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Error en endpoint de prueba:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Error al procesar la solicitud'
    }, { status: 500 });
  }
}

