import { NextResponse } from 'next/server';
import twilio from 'twilio';
import logger from '@/lib/logger';

/**
 * Endpoint para verificar el estado del Sandbox de Twilio
 * GET /api/debug/verify-sandbox?phoneNumber=+50374937859
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        message: 'Número de teléfono requerido'
      }, { status: 400 });
    }

    // Verificar configuración de Twilio
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

    // Obtener información del Sandbox
    try {
      // Intentar obtener información del Sandbox
      // Nota: La API de Twilio no tiene un endpoint directo para verificar números unidos
      // Pero podemos intentar enviar un mensaje de prueba y ver el error específico
      
      const sandboxInfo = {
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
        phoneNumber: phoneNumber,
        formattedPhone: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
        e164Format: phoneNumber.replace(/[^\d+]/g, '')
      };

      // Verificar formato del número
      const formattedTo = phoneNumber.replace(/[^\d+]/g, '');
      if (!formattedTo.startsWith('+')) {
        sandboxInfo.formattedPhone = `+${formattedTo}`;
      }

      logger.info('Verificando Sandbox de Twilio', sandboxInfo);

      return NextResponse.json({
        success: true,
        data: {
          ...sandboxInfo,
          instructions: [
            'Para unir tu número al Sandbox:',
            '1. Envía "join [código]" al número de WhatsApp de Twilio Sandbox',
            '2. El código está en tu consola de Twilio → Messaging → Try it out → Send a WhatsApp message',
            '3. Ejemplo: Si el código es "abc123", envía "join abc123" a whatsapp:+14155238886',
            '4. Deberías recibir una confirmación de Twilio'
          ],
          sandboxNumber: 'whatsapp:+14155238886',
          note: 'El error 63015 generalmente significa que el número no está unido al Sandbox. Verifica que hayas enviado el código de unión correctamente.'
        }
      });

    } catch (error) {
      logger.error('Error verificando Sandbox:', error);
      return NextResponse.json({
        success: false,
        message: error.message,
        error: error.code || 'UNKNOWN_ERROR'
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Error en endpoint de verificación de Sandbox:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Error al procesar la solicitud'
    }, { status: 500 });
  }
}

