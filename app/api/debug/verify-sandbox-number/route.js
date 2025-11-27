import { NextResponse } from 'next/server';
import twilio from 'twilio';
import logger from '@/lib/logger';

/**
 * Endpoint para verificar el formato exacto del número en el Sandbox
 * GET /api/debug/verify-sandbox-number?phoneNumber=+50374937859
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber') || '+50374937859';

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json({
        success: false,
        message: 'Twilio no está configurado'
      }, { status: 500 });
    }

    // Formatear número de diferentes maneras
    const formats = {
      original: phoneNumber,
      e164: phoneNumber.replace(/[^\d+]/g, ''),
      withWhatsAppPrefix: `whatsapp:${phoneNumber.replace(/[^\d+]/g, '')}`,
      withoutPlus: phoneNumber.replace(/[^\d]/g, ''),
      withCountryCode: phoneNumber.startsWith('+') ? phoneNumber : `+503${phoneNumber.replace(/[^\d]/g, '')}`
    };

    // Intentar diferentes formatos
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    let from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    from = from.trim();
    if (!from.startsWith('whatsapp:')) {
      if (from.startsWith('+')) {
        from = 'whatsapp:' + from;
      } else {
        from = 'whatsapp:+' + from.replace(/[^\d]/g, '');
      }
    }

    logger.info('Verificando formatos de número', {
      phoneNumber,
      formats,
      from
    });

    return NextResponse.json({
      success: true,
      message: 'Formatos de número generados',
      data: {
        original: phoneNumber,
        formats: {
          ...formats,
          recommended: `whatsapp:${formats.e164}`
        },
        from: from,
        instructions: [
          'Verifica en Twilio Console → Messaging → Try it out → Send a WhatsApp message',
          'Busca la sección "Sandbox participants" o "Números unidos"',
          'Compara el formato exacto del número que aparece ahí con los formatos arriba',
          'El número debe coincidir EXACTAMENTE (incluyendo el prefijo + y el código de país)'
        ],
        note: 'El error 63015 puede ocurrir si el formato del número no coincide exactamente con el que está unido al Sandbox'
      }
    });

  } catch (error) {
    logger.error('Error verificando formato de número:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Error al procesar la solicitud'
    }, { status: 500 });
  }
}

