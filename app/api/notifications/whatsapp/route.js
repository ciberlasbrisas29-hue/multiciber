import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { 
  sendWhatsAppMessage, 
  sendLowStockNotification, 
  sendSaleNotification, 
  sendDebtReminder,
  sendDailyReport
} from '@/lib/twilio';
import { getAdvancedReportData } from '@/lib/reports';
import logger from '@/lib/logger';

/**
 * Endpoint para enviar notificaciones por WhatsApp
 * POST /api/notifications/whatsapp
 */

export async function POST(req) {
  try {
    // Verificar autenticación
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, phoneNumber, data } = body;

    // Validar campos requeridos
    if (!type || !phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Tipo de notificación y número de teléfono son requeridos' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'low_stock':
        // Notificación de stock bajo
        if (!data || !data.products) {
          return NextResponse.json(
            { success: false, message: 'Datos de productos requeridos' },
            { status: 400 }
          );
        }
        result = await sendLowStockNotification(phoneNumber, data.products);
        break;

      case 'sale':
        // Notificación de venta
        if (!data || !data.sale) {
          return NextResponse.json(
            { success: false, message: 'Datos de venta requeridos' },
            { status: 400 }
          );
        }
        result = await sendSaleNotification(
          phoneNumber, 
          data.sale, 
          data.toCustomer || false
        );
        break;

      case 'debt':
        // Recordatorio de deuda
        if (!data || !data.debt) {
          return NextResponse.json(
            { success: false, message: 'Datos de deuda requeridos' },
            { status: 400 }
          );
        }
        result = await sendDebtReminder(phoneNumber, data.debt);
        break;

      case 'custom':
        // Mensaje personalizado
        if (!data || !data.message) {
          return NextResponse.json(
            { success: false, message: 'Mensaje requerido' },
            { status: 400 }
          );
        }
        // Intentar usar plantilla si está disponible (para evitar error 63015 en Sandbox)
        const useTemplate = data.useTemplate || false;
        const contentVariables = data.contentVariables || null;
        result = await sendWhatsAppMessage(phoneNumber, data.message, {
          useTemplate,
          contentVariables
        });
        break;

      case 'daily_report':
        // Reporte avanzado del día
        const period = data?.period || 'today';
        
        try {
          // Obtener datos del reporte directamente
          const reportData = await getAdvancedReportData(userId, period);
          
          // Agregar userId al reportData para que sendDailyReport pueda usarlo
          reportData.userId = userId;
          
          // Enviar el reporte por WhatsApp
          result = await sendDailyReport(phoneNumber, period, reportData);
        } catch (reportError) {
          logger.error('Error obteniendo reporte para WhatsApp:', reportError);
          result = {
            success: false,
            message: 'Error al obtener datos del reporte'
          };
        }
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Tipo de notificación no válido' },
          { status: 400 }
        );
    }

    if (result.success) {
      logger.info('Notificación de WhatsApp enviada exitosamente', {
        type,
        phoneNumber,
        userId
      });
    } else {
      logger.warn('Error al enviar notificación de WhatsApp', {
        type,
        phoneNumber,
        error: result.message,
        userId
      });
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });

  } catch (error) {
    logger.error('Error en endpoint de notificaciones WhatsApp:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Error al procesar la solicitud' 
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para verificar si Twilio está configurado
 * GET /api/notifications/whatsapp
 */
export async function GET(req) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar directamente las variables de entorno
    const isConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
    );
    
    return NextResponse.json({
      success: true,
      configured: isConfigured,
      debug: process.env.NODE_ENV === 'development' ? {
        hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasWhatsAppNumber: !!process.env.TWILIO_WHATSAPP_NUMBER,
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'NO CONFIGURADO'
      } : undefined,
      message: isConfigured 
        ? 'Twilio está configurado correctamente' 
        : 'Twilio no está configurado. Configura las variables de entorno para habilitar notificaciones.'
    });

  } catch (error) {
    logger.error('Error verificando configuración de Twilio:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        configured: false,
        message: error.message || 'Error al verificar configuración' 
      },
      { status: 500 }
    );
  }
}

