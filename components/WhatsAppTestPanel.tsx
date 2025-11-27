"use client";

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Phone,
  Package,
  ShoppingCart,
  CreditCard,
  Mail,
  FileText
} from 'lucide-react';
import Toast from './Toast';

interface WhatsAppTestPanelProps {
  className?: string;
}

const WhatsAppTestPanel: React.FC<WhatsAppTestPanelProps> = ({ className = '' }) => {
  const [twilioConfigured, setTwilioConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'custom' | 'low_stock' | 'sale' | 'debt' | 'daily_report'>('custom');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  useEffect(() => {
    checkTwilioConfig();
  }, []);

  const checkTwilioConfig = async () => {
    try {
      setCheckingConfig(true);
      const response = await fetch('/api/notifications/whatsapp');
      const data = await response.json();
      setTwilioConfigured(data.configured || false);
    } catch (error) {
      console.error('Error checking Twilio config:', error);
      setTwilioConfigured(false);
    } finally {
      setCheckingConfig(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const handleSendNotification = async () => {
    // Validar phoneNumber solo si no es tipo 'debt' (que envía a todos los clientes)
    if (notificationType !== 'debt' && !phoneNumber.trim()) {
      showToast('Por favor ingresa un número de teléfono', 'error');
      return;
    }

    if (notificationType === 'custom' && !customMessage.trim()) {
      showToast('Por favor ingresa un mensaje', 'error');
      return;
    }

    setLoading(true);

    try {
      let requestBody: any = {
        type: notificationType,
        data: {}
      };

      // Solo incluir phoneNumber si está presente (no requerido para 'debt')
      if (phoneNumber.trim()) {
        requestBody.phoneNumber = phoneNumber.trim();
      }

      // Preparar datos según el tipo de notificación
      switch (notificationType) {
        case 'custom':
          requestBody.data.message = customMessage;
          // Usar plantilla si está disponible (para evitar error 63015 en Sandbox)
          // Esto permite que el mensaje se envíe usando contentSid como en Twilio Console
          requestBody.data.useTemplate = true;
          requestBody.data.contentVariables = { "1": customMessage };
          break;
        
        case 'low_stock':
          requestBody.data.products = [
            {
              name: 'Mouse Gaming RGB',
              stock: 2,
              minStock: 10,
              severity: 'critical'
            },
            {
              name: 'Teclado Mecánico',
              stock: 5,
              minStock: 8,
              severity: 'warning'
            }
          ];
          break;
        
        case 'sale':
          requestBody.data.sale = {
            saleNumber: 'V-000001',
            total: 150.00,
            subtotal: 150.00,
            items: [
              {
                productName: 'Mouse Gaming',
                quantity: 2,
                unitPrice: 25.00,
                totalPrice: 50.00
              },
              {
                productName: 'Teclado Mecánico',
                quantity: 1,
                unitPrice: 100.00,
                totalPrice: 100.00
              }
            ],
            paymentMethod: 'cash',
            status: 'paid',
            createdAt: new Date().toISOString()
          };
          requestBody.data.toCustomer = true;
          break;
        
        case 'debt':
          // Si hay phoneNumber, enviar a un cliente específico (para pruebas)
          // Si no hay phoneNumber, se enviará a todos los clientes con deudas
          if (phoneNumber.trim()) {
            requestBody.data.debt = {
              saleNumber: 'V-000002',
              concept: 'Teclado gaming',
              total: 200.00,
              paidAmount: 50.00,
              debtAmount: 150.00,
              clientName: 'Cliente de Prueba',
              createdAt: new Date().toISOString()
            };
          }
          // Si no hay phoneNumber, no se incluye data.debt y se enviará a todos
          break;
        
        case 'daily_report':
          // Reporte avanzado del día
          requestBody.data.period = 'today'; // Por defecto, reporte del día actual
          break;
      }

      const response = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        // Mensaje especial para 'debt' cuando se envía a todos los clientes
        if (notificationType === 'debt' && !phoneNumber.trim() && result.sent !== undefined) {
          showToast(`¡Se enviaron ${result.sent} recordatorios exitosamente!${result.failed > 0 ? ` ${result.failed} fallaron.` : ''}`, 'success');
        } else {
          showToast('¡Notificación enviada exitosamente!', 'success');
        }
        setCustomMessage('');
        
        // Mostrar información adicional en consola para debugging
        if (result.data) {
          console.log('✅ Mensaje enviado:', {
            sid: result.data.sid,
            status: result.data.status,
            to: result.data.to
          });
          
          // Verificar estado del mensaje después de 3 segundos
          if (result.data.sid) {
            setTimeout(async () => {
              try {
                const statusResponse = await fetch(`/api/debug/check-message-status?sid=${result.data.sid}`);
                const statusData = await statusResponse.json();
                if (statusData.success) {
                  console.log('📊 Estado del mensaje:', {
                    status: statusData.message.status,
                    errorCode: statusData.message.errorCode,
                    errorMessage: statusData.message.errorMessage,
                    dateSent: statusData.message.dateSent
                  });
                  
                  if (statusData.message.status === 'failed') {
                    showToast(`Mensaje falló: ${statusData.message.errorMessage || statusData.message.errorCode}`, 'error');
                  } else if (statusData.message.status === 'delivered') {
                    showToast('✅ Mensaje entregado exitosamente', 'success');
                  }
                }
              } catch (err) {
                console.error('Error verificando estado:', err);
              }
            }, 3000);
          }
        }
      } else {
        // Mostrar error más detallado
        const errorMsg = result.message || 'Error al enviar notificación';
        const errorCode = result.error || '';
        console.error('❌ Error enviando mensaje:', {
          message: errorMsg,
          error: errorCode,
          fullResponse: result
        });
        showToast(`${errorMsg}${errorCode ? ` (${errorCode})` : ''}`, 'error');
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      showToast('Error al enviar notificación: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl shadow-lg p-6 border border-purple-100 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">Notificaciones WhatsApp</h3>
          <p className="text-sm text-gray-600">Envía notificaciones al cliente</p>
        </div>
      </div>

      {/* Estado de configuración */}
      <div className="mb-6">
        {checkingConfig ? (
          <div className="flex items-center space-x-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Verificando configuración...</span>
          </div>
        ) : twilioConfigured ? (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-200">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Twilio está configurado correctamente</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
            <XCircle className="w-5 h-5" />
            <div className="flex-1">
              <span className="text-sm font-medium block">Twilio no está configurado</span>
              <span className="text-xs text-red-500 mt-1 block">
                Configura las variables de entorno: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
              </span>
            </div>
          </div>
        )}
      </div>

      {twilioConfigured && (
        <>
          {/* Tipo de notificación */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Notificación
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => setNotificationType('custom')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  notificationType === 'custom'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Mail className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-medium">Personalizado</span>
              </button>
              <button
                onClick={() => setNotificationType('low_stock')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  notificationType === 'low_stock'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Package className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-medium">Stock Bajo</span>
              </button>
              <button
                onClick={() => setNotificationType('sale')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  notificationType === 'sale'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <ShoppingCart className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-medium">Venta</span>
              </button>
              <button
                onClick={() => setNotificationType('debt')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  notificationType === 'debt'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-medium">Deuda</span>
              </button>
              <button
                onClick={() => setNotificationType('daily_report')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  notificationType === 'daily_report'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-medium">Reporte del Día</span>
              </button>
            </div>
          </div>

          {/* Número de teléfono (no requerido para 'debt') */}
          {notificationType !== 'debt' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+50371234567 o 71234567"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formato: +50371234567 o 71234567 (se formatea automáticamente)
              </p>
            </div>
          )}

          {/* Mensaje especial para 'debt' */}
          {notificationType === 'debt' && (
            <div className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                📋 Recordatorio de Deuda
              </p>
              <p className="text-xs text-yellow-700">
                Se enviarán recordatorios a <strong>todos los clientes</strong> que tengan deudas pendientes.
                Cada cliente recibirá un mensaje con el detalle de sus deudas (concepto, total, pagado, restante).
              </p>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Teléfono (Opcional - para pruebas a un cliente específico)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Dejar vacío para enviar a todos los clientes"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Si dejas este campo vacío, se enviará a todos los clientes con deudas. Si ingresas un número, se enviará solo a ese cliente (para pruebas).
                </p>
              </div>
            </div>
          )}

          {/* Mensaje personalizado (solo para tipo custom) */}
          {notificationType === 'custom' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Vista previa para otros tipos */}
          {notificationType !== 'custom' && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">Vista Previa:</p>
              <p className="text-sm text-gray-700">
                {notificationType === 'low_stock' && 'Se enviará una notificación con productos de stock bajo (ejemplo).'}
                {notificationType === 'sale' && 'Se enviará una notificación de venta completada (ejemplo).'}
                {notificationType === 'debt' && 'Se enviarán recordatorios a todos los clientes con deudas pendientes, incluyendo concepto, total, monto pagado y deuda restante.'}
                {notificationType === 'daily_report' && 'Se enviará el reporte avanzado del día con resumen financiero, métodos de pago, productos destacados y tendencias.'}
              </p>
            </div>
          )}

          {/* Botón de envío */}
          <button
            onClick={handleSendNotification}
            disabled={loading || (notificationType !== 'debt' && !phoneNumber.trim()) || (notificationType === 'custom' && !customMessage.trim())}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Enviar Notificación</span>
              </>
            )}
          </button>

          {/* Información adicional */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Nota importante:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600">
                  <li>Para pruebas, asegúrate de que el número destino esté unido al Sandbox de Twilio</li>
                  <li>En producción, necesitas un número de WhatsApp verificado</li>
                  <li>Los mensajes de prueba usan datos de ejemplo</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast de notificaciones */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default WhatsAppTestPanel;

