import twilio from 'twilio';
import logger from './logger';

/**
 * Servicio de Twilio para enviar notificaciones por WhatsApp
 */

/**
 * Verifica si Twilio está configurado correctamente
 * @returns {boolean}
 */
export function isTwilioConfigured() {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  );
}

// Inicializar cliente de Twilio solo si está configurado
let twilioClient = null;

if (isTwilioConfigured()) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    logger.info('Cliente de Twilio inicializado correctamente', {
      accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 4) + '...',
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
    });
  } catch (error) {
    logger.error('Error al inicializar cliente de Twilio:', error);
  }
} else {
  logger.warn('Twilio no está configurado. Las notificaciones de WhatsApp estarán deshabilitadas.', {
    hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasWhatsAppNumber: !!process.env.TWILIO_WHATSAPP_NUMBER
  });
}

/**
 * Formatea un número de teléfono a formato E.164 (requerido por Twilio)
 * @param {string} phoneNumber - Número de teléfono en cualquier formato
 * @returns {string|null} - Número en formato E.164 o null si es inválido
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remover todos los caracteres que no sean dígitos o +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Si no empieza con +, asumir código de país de El Salvador (+503)
  if (!cleaned.startsWith('+')) {
    // Si empieza con 0, removerlo
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // Agregar código de país de El Salvador
    cleaned = '+503' + cleaned;
  }
  
  // Validar que tenga al menos 10 dígitos (código de país + número)
  if (cleaned.length < 10) {
    return null;
  }
  
  return cleaned;
}

/**
 * Envía un mensaje de WhatsApp usando Twilio
 * @param {string} to - Número de teléfono destino en formato E.164 (ej: +50371234567)
 * @param {string} message - Mensaje a enviar
 * @param {Object} options - Opciones adicionales
 *   - useTemplate: boolean - Si usar plantilla de contenido (default: false)
 *   - contentVariables: object - Variables para la plantilla
 * @returns {Promise<Object>} - Resultado del envío
 */
/**
 * Envía un mensaje de WhatsApp con archivo adjunto (media)
 * @param {string} to - Número de teléfono destino
 * @param {string} message - Mensaje de texto (opcional)
 * @param {string|string[]} mediaUrl - URL o array de URLs del archivo
 * @returns {Promise<Object>}
 */
async function sendWhatsAppMedia(to, message, mediaUrl) {
  if (!isTwilioConfigured()) {
    logger.warn('Twilio no está configurado. No se puede enviar mensaje de WhatsApp.');
    return {
      success: false,
      message: 'Twilio no está configurado',
      error: 'TWILIO_NOT_CONFIGURED'
    };
  }

  if (!twilioClient) {
    return {
      success: false,
      message: 'Cliente de Twilio no inicializado',
      error: 'TWILIO_CLIENT_ERROR'
    };
  }

  try {
    const formattedTo = formatPhoneNumber(to);
    if (!formattedTo) {
      return {
        success: false,
        message: 'Número de teléfono inválido',
        error: 'INVALID_PHONE_NUMBER'
      };
    }

    let from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    from = from.trim();
    
    if (!from.startsWith('whatsapp:')) {
      if (from.startsWith('+')) {
        from = 'whatsapp:' + from;
      } else {
        from = 'whatsapp:+' + from.replace(/[^\d]/g, '');
      }
    }

    const messageOptions = {
      from: from,
      to: `whatsapp:${formattedTo}`,
      mediaUrl: Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl]
    };

    if (message && message.trim().length > 0) {
      messageOptions.body = message.trim();
    }

    // Validar que las URLs de media sean HTTPS y accesibles
    const mediaUrls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    for (const url of mediaUrls) {
      if (!url.startsWith('https://')) {
        logger.error('URL de media no es HTTPS', { url });
        return {
          success: false,
          message: 'La URL del archivo debe ser HTTPS',
          error: 'INVALID_MEDIA_URL_PROTOCOL'
        };
      }
    }

    logger.info('Enviando mensaje multimedia de WhatsApp', {
      from: messageOptions.from,
      to: messageOptions.to,
      mediaUrl: messageOptions.mediaUrl,
      hasBody: !!messageOptions.body,
      mediaUrlCount: mediaUrls.length
    });

    const result = await twilioClient.messages.create(messageOptions);

    logger.info('Mensaje multimedia de WhatsApp enviado exitosamente', {
      messageSid: result.sid,
      status: result.status,
      to: formattedTo
    });

    return {
      success: true,
      message: 'Mensaje con archivo adjunto enviado exitosamente',
      data: {
        sid: result.sid,
        status: result.status,
        to: formattedTo
      }
    };
  } catch (error) {
    logger.error('Error enviando mensaje multimedia de WhatsApp:', {
      error: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
      errorCode: error.errorCode,
      errorMessage: error.errorMessage,
      mediaUrl: mediaUrl
    });

    // Mensajes de error más descriptivos para errores comunes de media
    let userMessage = error.message || 'Error al enviar mensaje multimedia';
    
    if (error.code === 21620) {
      userMessage = 'Error 21620: URL de archivo inválida. La URL debe ser HTTPS y accesible públicamente.';
    } else if (error.code === 63019) {
      userMessage = 'Error 63019: No se pudo descargar el archivo. Verifica que la URL sea accesible y el archivo no exceda 5MB.';
    } else if (error.status === 400) {
      userMessage = `Error de Twilio: ${error.message}`;
    }

    return {
      success: false,
      message: userMessage,
      error: error.code || 'MEDIA_SEND_ERROR',
      errorCode: error.errorCode,
      errorMessage: error.errorMessage,
      errorDetails: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo
      } : undefined
    };
  }
}

export async function sendWhatsAppMessage(to, message, options = {}) {
  // Si hay mediaUrl, enviar como mensaje multimedia
  if (options.mediaUrl) {
    return await sendWhatsAppMedia(to, message, options.mediaUrl);
  }
  
  if (!isTwilioConfigured()) {
    logger.warn('Twilio no está configurado. No se puede enviar mensaje de WhatsApp.');
    return {
      success: false,
      message: 'Twilio no está configurado',
      error: 'TWILIO_NOT_CONFIGURED'
    };
  }

  if (!twilioClient) {
    return {
      success: false,
      message: 'Cliente de Twilio no inicializado',
      error: 'TWILIO_CLIENT_ERROR'
    };
  }

  try {
    // Formatear número de teléfono
    const formattedTo = formatPhoneNumber(to);
    if (!formattedTo) {
      return {
        success: false,
        message: 'Número de teléfono inválido',
        error: 'INVALID_PHONE_NUMBER'
      };
    }

    // Número de WhatsApp de Twilio (Sandbox o número verificado)
    // Asegurar que el formato sea correcto (sin espacios, con prefijo whatsapp:)
    let from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    from = from.trim(); // Remover espacios
    
    // Si no tiene el prefijo whatsapp:, agregarlo
    if (!from.startsWith('whatsapp:')) {
      if (from.startsWith('+')) {
        from = 'whatsapp:' + from;
      } else {
        from = 'whatsapp:+' + from.replace(/[^\d]/g, '');
      }
    }
    
    logger.info('Enviando mensaje de WhatsApp', {
      to: formattedTo,
      from,
      messageLength: message.length,
      rawFrom: process.env.TWILIO_WHATSAPP_NUMBER
    });

    // Enviar mensaje
    // El Sandbox de Twilio puede tener restricciones con mensajes simples
    // Usar el mismo formato que funciona en Twilio Console
    const messageOptions = {
      from: from,
      to: `whatsapp:${formattedTo}`
    };

    // IMPORTANTE: El error 63015 generalmente ocurre cuando el Sandbox rechaza mensajes simples
    // El Sandbox puede tener restricciones con mensajes simples fuera de la ventana de 24 horas
    // Si tenemos una plantilla configurada, intentar usarla primero para evitar el error 63015
    if (options.useTemplate && process.env.TWILIO_CONTENT_SID) {
      // Usar plantilla de contenido (como en Twilio Console)
      messageOptions.contentSid = process.env.TWILIO_CONTENT_SID;
      if (options.contentVariables) {
        messageOptions.contentVariables = typeof options.contentVariables === 'string' 
          ? options.contentVariables 
          : JSON.stringify(options.contentVariables);
      }
      // No usar body si usamos plantilla
    } else {
      // Usar mensaje simple con body
      // Validar que el mensaje no esté vacío
      if (!message || message.trim().length === 0) {
        return {
          success: false,
          message: 'El mensaje no puede estar vacío',
          error: 'EMPTY_MESSAGE'
        };
      }
      messageOptions.body = message.trim();
    }

    logger.info('Enviando mensaje de WhatsApp', {
      from: messageOptions.from,
      to: messageOptions.to,
      messageLength: message.length,
      usingTemplate: !!messageOptions.contentSid,
      hasBody: !!messageOptions.body,
      options: messageOptions
    });

    const result = await twilioClient.messages.create(messageOptions);

    logger.info('Mensaje de WhatsApp enviado exitosamente', {
      messageSid: result.sid,
      status: result.status,
      to: formattedTo,
      from: from,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      dateCreated: result.dateCreated,
      dateSent: result.dateSent,
      dateUpdated: result.dateUpdated
    });

    return {
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: {
        sid: result.sid,
        status: result.status,
        to: formattedTo,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        dateCreated: result.dateCreated
      }
    };

  } catch (error) {
    logger.error('Error al enviar mensaje de WhatsApp:', {
      error: error.message,
      code: error.code,
      status: error.status,
      to,
      moreInfo: error.moreInfo
    });

    // Mensajes de error más descriptivos
    let userMessage = error.message || 'Error al enviar mensaje';
    
    // Errores comunes de Twilio
    if (error.code === 21211) {
      userMessage = 'Número de teléfono inválido. Verifica el formato del número.';
    } else if (error.code === 21608) {
      userMessage = 'El número destino no está unido al Sandbox de Twilio. Envía "join [código]" al número del Sandbox primero.';
    } else if (error.code === 21610) {
      userMessage = 'No puedes enviar mensajes a este número. Asegúrate de que esté unido al Sandbox.';
    } else if (error.code === 63015) {
      userMessage = 'Error 63015: No se puede enviar mensaje fuera de la ventana de 24 horas. En el Sandbox, el número destino debe enviar un mensaje primero a Twilio (+14155238886) para que puedas responderle. Después de que envíe un mensaje, podrás enviarle mensajes durante 24 horas.';
    } else if (error.status === 400) {
      userMessage = `Error de Twilio: ${error.message}`;
    }

    return {
      success: false,
      message: userMessage,
      error: error.code || error.status || 'UNKNOWN_ERROR',
      errorDetails: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo
      } : undefined
    };
  }
}

/**
 * Envía notificación de stock bajo por WhatsApp
 * @param {string} phoneNumber - Número de teléfono del administrador
 * @param {Array} products - Lista de productos con stock bajo
 * @returns {Promise<Object>}
 */
export async function sendLowStockNotification(phoneNumber, products) {
  if (!products || products.length === 0) {
    return {
      success: false,
      message: 'No hay productos con stock bajo'
    };
  }

  const criticalProducts = products.filter(p => p.severity === 'critical');
  const warningProducts = products.filter(p => p.severity === 'warning');

  let message = '🚨 *ALERTA DE STOCK BAJO*\n\n';
  
  if (criticalProducts.length > 0) {
    message += `*⚠️ PRODUCTOS CRÍTICOS (${criticalProducts.length}):*\n`;
    criticalProducts.forEach((product, index) => {
      message += `${index + 1}. ${product.name}\n`;
      message += `   Stock: ${product.stock} | Mínimo: ${product.minStock}\n\n`;
    });
  }

  if (warningProducts.length > 0) {
    message += `*⚠️ PRODUCTOS CON STOCK BAJO (${warningProducts.length}):*\n`;
    warningProducts.slice(0, 5).forEach((product, index) => {
      message += `${index + 1}. ${product.name}\n`;
      message += `   Stock: ${product.stock} | Mínimo: ${product.minStock}\n\n`;
    });
    if (warningProducts.length > 5) {
      message += `... y ${warningProducts.length - 5} más.\n\n`;
    }
  }

  message += 'Por favor, revisa el inventario y reabastece estos productos.';

  return await sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Envía notificación de venta completada por WhatsApp
 * @param {string} phoneNumber - Número de teléfono del cliente o administrador
 * @param {Object} sale - Objeto de venta
 * @param {boolean} toCustomer - Si es true, envía al cliente; si es false, al administrador
 * @returns {Promise<Object>}
 */
export async function sendSaleNotification(phoneNumber, sale, toCustomer = false) {
  if (!sale) {
    return {
      success: false,
      message: 'Datos de venta no proporcionados'
    };
  }

  let message = '';

  if (toCustomer) {
    // Mensaje para el cliente
    message = `✅ *VENTA COMPLETADA*\n\n`;
    message += `Número de venta: ${sale.saleNumber || 'N/A'}\n`;
    message += `Fecha: ${new Date(sale.createdAt).toLocaleDateString('es-SV')}\n\n`;
    
    if (sale.items && sale.items.length > 0) {
      message += `*Productos:*\n`;
      sale.items.forEach((item, index) => {
        message += `${index + 1}. ${item.productName || item.name} - ${item.quantity}x $${item.unitPrice?.toFixed(2) || item.price?.toFixed(2)}\n`;
      });
      message += `\n`;
    }
    
    message += `Subtotal: $${sale.subtotal?.toFixed(2) || '0.00'}\n`;
    if (sale.discount > 0) {
      message += `Descuento: $${sale.discount.toFixed(2)}\n`;
    }
    message += `*Total: $${sale.total?.toFixed(2) || '0.00'}*\n\n`;
    message += `Método de pago: ${getPaymentMethodName(sale.paymentMethod)}\n`;
    
    if (sale.status === 'debt') {
      message += `\n⚠️ *Venta a crédito*\n`;
      message += `Saldo pendiente: $${(sale.debtAmount || sale.total - (sale.paidAmount || 0)).toFixed(2)}\n`;
    }
    
    message += `\n¡Gracias por tu compra! 🎉`;
  } else {
    // Mensaje para el administrador
    message = `💰 *NUEVA VENTA REGISTRADA*\n\n`;
    message += `Número: ${sale.saleNumber || 'N/A'}\n`;
    message += `Tipo: ${sale.type === 'free' ? 'Venta libre' : 'Venta de productos'}\n`;
    message += `Total: $${sale.total?.toFixed(2) || '0.00'}\n`;
    message += `Método: ${getPaymentMethodName(sale.paymentMethod)}\n`;
    message += `Estado: ${sale.status === 'paid' ? 'Pagada' : 'A crédito'}\n`;
    
    if (sale.client?.name) {
      message += `Cliente: ${sale.client.name}\n`;
    }
    
    message += `\nFecha: ${new Date(sale.createdAt).toLocaleString('es-SV')}`;
  }

  return await sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Envía notificación de deuda pendiente por WhatsApp
 * @param {string} phoneNumber - Número de teléfono del cliente
 * @param {Object} debt - Información de la deuda
 * @returns {Promise<Object>}
 */
export async function sendDebtReminder(phoneNumber, debt) {
  if (!debt) {
    return {
      success: false,
      message: 'Datos de deuda no proporcionados'
    };
  }

  const message = `📋 *RECORDATORIO DE DEUDA*\n\n` +
    `Tienes una deuda pendiente:\n\n` +
    `Número de venta: ${debt.saleNumber || 'N/A'}\n` +
    `Monto total: $${debt.total?.toFixed(2) || '0.00'}\n` +
    `Pagado: $${(debt.paidAmount || 0).toFixed(2)}\n` +
    `*Saldo pendiente: $${(debt.debtAmount || debt.total - (debt.paidAmount || 0)).toFixed(2)}*\n\n` +
    `Fecha de venta: ${new Date(debt.createdAt).toLocaleDateString('es-SV')}\n\n` +
    `Por favor, acércate a realizar el pago. ¡Gracias!`;

  return await sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Convierte el código de método de pago a nombre legible
 * @param {string} method - Código del método de pago
 * @returns {string}
 */
function getPaymentMethodName(method) {
  const methods = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    check: 'Cheque',
    other: 'Otro'
  };
  return methods[method] || method;
}

/**
 * Formatea el reporte avanzado del día en texto para WhatsApp
 * @param {Object} reportData - Datos del reporte avanzado
 * @returns {string} - Mensaje formateado para WhatsApp
 */
function formatDailyReport(reportData) {
  const { summary, paymentMethods, inventory, weeklyTrend, period } = reportData;
  
  // Formatear fecha según el período
  const today = new Date();
  let dateLabel = '';
  switch (period) {
    case 'today':
      dateLabel = 'Hoy';
      break;
    case 'yesterday':
      dateLabel = 'Ayer';
      break;
    case 'week':
      dateLabel = 'Últimos 7 días';
      break;
    case 'month':
      dateLabel = 'Este mes';
      break;
    default:
      dateLabel = 'Hoy';
  }

  let message = `📊 *REPORTE AVANZADO - ${dateLabel.toUpperCase()}*\n\n`;
  
  // Resumen financiero
  message += `💰 *RESUMEN FINANCIERO*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💵 Ingresos: $${summary.totalSales.toFixed(2)}\n`;
  message += `📉 Gastos: $${summary.totalExpenses.toFixed(2)}\n`;
  message += `📈 Ganancia Neta: $${summary.grossProfit.toFixed(2)}\n`;
  message += `🛒 Transacciones: ${summary.totalTransactions}\n`;
  message += `🎫 Ticket Promedio: $${summary.averageTicket.toFixed(2)}\n\n`;
  
  // Métodos de pago
  if (paymentMethods && paymentMethods.length > 0) {
    message += `💳 *MÉTODOS DE PAGO*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    paymentMethods.forEach(pm => {
      message += `• ${pm.name}: $${pm.value.toFixed(2)} (${pm.count} ventas)\n`;
    });
    message += `\n`;
  }
  
  // Productos destacados
  if (inventory) {
    message += `⭐ *PRODUCTOS DESTACADOS*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (inventory.starProduct) {
      message += `🏆 Producto Estrella:\n`;
      message += `   ${inventory.starProduct.name}\n`;
      message += `   Ingresos: $${inventory.starProduct.revenue.toFixed(2)}\n\n`;
    }
    
    if (inventory.topRotationProduct) {
      message += `🔄 Mayor Rotación:\n`;
      message += `   ${inventory.topRotationProduct.name}\n`;
      message += `   Unidades: ${inventory.topRotationProduct.quantity}\n\n`;
    }
  }
  
  // Tendencia semanal (últimos 3 días si es reporte del día)
  if (weeklyTrend && weeklyTrend.length > 0 && period === 'today') {
    message += `📈 *TENDENCIA (Últimos 3 días)*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    const last3Days = weeklyTrend.slice(-3);
    last3Days.forEach(day => {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
      message += `• ${dayName}: $${day.revenue.toFixed(2)} (${day.transactions} ventas)\n`;
    });
    message += `\n`;
  }
  
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📅 Generado: ${new Date().toLocaleString('es-ES')}\n`;
  
  return message;
}

/**
 * Envía el reporte avanzado del día por WhatsApp como PDF
 * @param {string} phoneNumber - Número de teléfono destino
 * @param {string} period - Período del reporte (today, yesterday, week, month)
 * @param {Object} reportData - Datos del reporte (debe proporcionarse desde el endpoint)
 * @returns {Promise<Object>}
 */
export async function sendDailyReport(phoneNumber, period = 'today', reportData = null) {
  try {
    if (!reportData) {
      return {
        success: false,
        message: 'Datos del reporte no proporcionados'
      };
    }
    
    // Importar funciones necesarias
    const { generateReportPDF } = await import('@/lib/pdf-generator');
    const { uploadPDFToCloudinary } = await import('@/lib/cloudinary');
    
    // Generar PDF
    logger.info('Generando PDF del reporte avanzado...');
    const pdfBuffer = await generateReportPDF(reportData, period);
    
    // Verificar tamaño del archivo (máximo 5MB para WhatsApp)
    const pdfSize = pdfBuffer.length;
    if (pdfSize > 5 * 1024 * 1024) {
      logger.warn('PDF excede el límite de 5MB para WhatsApp', {
        bytes: pdfSize,
        mb: (pdfSize / (1024 * 1024)).toFixed(2)
      });
      return {
        success: false,
        message: 'El PDF es demasiado grande (máximo 5MB)',
        error: 'PDF_TOO_LARGE'
      };
    }
    
    // Debido a problemas con Cloudinary (archivos bloqueados), usar endpoint del servidor
    // Esto es más confiable y no depende de la configuración de Cloudinary
    
    // Determinar la URL base del servidor
    // Prioridad 1: baseUrl desde reportData (obtenido de la request - más confiable)
    let baseUrl = reportData?.baseUrl;
    
    // Prioridad 2: VERCEL_URL (disponible automáticamente en Vercel)
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    // Prioridad 3: NEXT_PUBLIC_API_URL (si está configurada explícitamente)
    else if (!baseUrl && process.env.NEXT_PUBLIC_API_URL) {
      baseUrl = process.env.NEXT_PUBLIC_API_URL;
    }
    // Prioridad 4: VERCEL_BRANCH_URL (para preview deployments)
    else if (!baseUrl && process.env.VERCEL_BRANCH_URL) {
      baseUrl = `https://${process.env.VERCEL_BRANCH_URL}`;
    }
    // Prioridad 5: NEXT_PUBLIC_APP_URL
    else if (!baseUrl && process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    // Último recurso: localhost (solo para desarrollo)
    else if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
      logger.warn('Usando localhost como baseUrl. Esto no funcionará para Twilio en producción.');
    }
    
    // Validar que baseUrl sea una URL absoluta válida
    if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
      logger.error('baseUrl no es una URL absoluta válida', { 
        baseUrl,
        reportDataBaseUrl: reportData?.baseUrl,
        vercelUrl: process.env.VERCEL_URL,
        nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL,
        vercelBranchUrl: process.env.VERCEL_BRANCH_URL
      });
      
      // Si aún no tenemos una URL válida, intentar usar VERCEL_URL directamente
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
        logger.info('URL reconstruida desde VERCEL_URL', { baseUrl });
      } else {
        logger.error('No se pudo determinar la URL del servidor', {
          hasReportDataBaseUrl: !!reportData?.baseUrl,
          hasVercelUrl: !!process.env.VERCEL_URL,
          hasNextPublicApiUrl: !!process.env.NEXT_PUBLIC_API_URL
        });
        return {
          success: false,
          message: 'No se pudo determinar la URL del servidor. Configura NEXT_PUBLIC_API_URL en Vercel con el valor: https://multiciber-fzio.vercel.app',
          error: 'MISSING_BASE_URL'
        };
      }
    }
    
    // Asegurar que la URL base no termine con /
    baseUrl = baseUrl.replace(/\/$/, '');
    
    // Asegurar que la URL sea HTTPS (requerido por Twilio)
    // Excepto para localhost en desarrollo
    if (baseUrl.startsWith('http://') && !baseUrl.includes('localhost')) {
      baseUrl = baseUrl.replace('http://', 'https://');
      logger.warn('URL cambiada a HTTPS para compatibilidad con Twilio', { baseUrl });
    }
    
    // Obtener userId desde reportData si está disponible
    const userId = reportData.userId || 'default';
    
    // Generar un ID único para el reporte
    const reportId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    
    // Validar que baseUrl sea una URL absoluta válida
    if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
      logger.error('baseUrl no es una URL absoluta válida', { 
        baseUrl,
        vercelUrl: process.env.VERCEL_URL,
        nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL,
        vercelBranchUrl: process.env.VERCEL_BRANCH_URL
      });
      
      // Intentar construir la URL desde VERCEL_URL si está disponible
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
        logger.info('URL reconstruida desde VERCEL_URL', { baseUrl });
      } else {
        // Último intento: usar la URL de Vercel directamente (hardcodeada como fallback)
        // Esto es necesario porque VERCEL_URL puede no estar disponible en el runtime
        const vercelUrl = 'https://multiciber-fzio.vercel.app';
        logger.warn('Usando URL de Vercel hardcodeada como fallback', { vercelUrl });
        baseUrl = vercelUrl;
      }
    }
    
    // Construir la URL completa del PDF
    const pdfPath = `/api/reports/pdf/${reportId}?period=${period}&userId=${userId}`;
    const pdfUrl = `${baseUrl}${pdfPath}`;
    
    // Validar que la URL final sea correcta
    if (!pdfUrl.startsWith('https://')) {
      logger.error('URL del PDF no es HTTPS después de construir', { pdfUrl, baseUrl });
      return {
        success: false,
        message: 'Error al generar URL del PDF. La URL debe ser HTTPS.',
        error: 'INVALID_PDF_URL'
      };
    }
    
    logger.info('Usando endpoint del servidor para PDF', {
      url: pdfUrl,
      baseUrl: baseUrl,
      reportId: reportId,
      userId: userId,
      isHttps: pdfUrl.startsWith('https://'),
      envVercelUrl: process.env.VERCEL_URL,
      envNextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL,
      envVercelBranchUrl: process.env.VERCEL_BRANCH_URL
    });
    
    // Verificar que la URL sea HTTPS (requerido por Twilio)
    if (!pdfUrl.startsWith('https://')) {
      logger.error('La URL del PDF no es HTTPS. Twilio requiere HTTPS.', { 
        pdfUrl,
        baseUrl,
        vercelUrl: process.env.VERCEL_URL,
        nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL
      });
      return {
        success: false,
        message: 'La URL del PDF debe ser HTTPS para Twilio',
        error: 'INVALID_URL_PROTOCOL'
      };
    }
    
    // Mensaje de texto acompañando el PDF
    const periodLabels = {
      today: 'Hoy',
      yesterday: 'Ayer',
      week: 'Últimos 7 días',
      month: 'Este mes'
    };
    const periodLabel = periodLabels[period] || 'Hoy';
    const message = `📊 *Reporte Avanzado - ${periodLabel}*\n\nAquí está tu reporte avanzado en formato PDF.`;
    
    // Enviar por WhatsApp con el PDF adjunto
    logger.info('Enviando PDF por WhatsApp', {
      url: pdfUrl,
      size: pdfSize
    });
    
    return await sendWhatsAppMessage(phoneNumber, message, {
      mediaUrl: pdfUrl
    });
    
  } catch (error) {
    logger.error('Error enviando reporte diario por WhatsApp:', error);
    return {
      success: false,
      message: error.message || 'Error al enviar reporte',
      error: 'REPORT_SEND_ERROR'
    };
  }
}

export default {
  sendWhatsAppMessage,
  sendLowStockNotification,
  sendSaleNotification,
  sendDebtReminder,
  sendDailyReport,
  formatPhoneNumber,
  isTwilioConfigured
};

