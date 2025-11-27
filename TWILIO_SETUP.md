# Configuración de Twilio para Notificaciones WhatsApp

## 📱 ¿Qué es Twilio?

Twilio es una plataforma de comunicaciones que permite enviar mensajes de WhatsApp, SMS, llamadas y más a través de APIs.

## 🚀 Configuración Rápida

### 1. Crear cuenta en Twilio

1. Ve a [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Regístrate con tu email (cuenta gratuita disponible con créditos de prueba)
3. Verifica tu email y número de teléfono

### 2. Configurar WhatsApp Sandbox (Para Pruebas)

1. Ve al [Twilio Console](https://console.twilio.com/)
2. Navega a **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Sigue las instrucciones para unirte al Sandbox:
   - Envía el código que te proporciona Twilio a su número de WhatsApp
   - Una vez unido, podrás recibir mensajes del Sandbox

### 3. Obtener Credenciales

En el Dashboard de Twilio, encontrarás:
- **Account SID**: En la página principal del Dashboard
- **Auth Token**: Haz clic en "Show" para verlo (solo se muestra una vez)
- **WhatsApp Number**: `whatsapp:+14155238886` (Sandbox) o tu número verificado

### 4. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# Twilio (Opcional - para notificaciones WhatsApp)
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**⚠️ SEGURIDAD CRÍTICA**: 
- **NUNCA** pongas tus credenciales reales en este archivo de documentación
- Las credenciales deben ir **SOLO** en `.env.local` (que está en `.gitignore`)
- Si accidentalmente subiste credenciales a Git, **cámbialas inmediatamente** en Twilio Console

**⚠️ IMPORTANTE**: 
- Nunca subas el archivo `.env.local` a Git
- El Auth Token solo se muestra una vez - guárdalo de forma segura
- Para producción, necesitarás un número de WhatsApp verificado (no solo el Sandbox)

### 5. Para Vercel (Producción)

Si estás usando Vercel, agrega las variables de entorno en:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las 3 variables:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER`
4. Haz redeploy del proyecto

## 📝 Funcionalidades Implementadas

### Notificaciones Disponibles

1. **Notificación de Stock Bajo**
   - Se envía cuando hay productos con stock crítico o bajo
   - Incluye lista de productos afectados

2. **Notificación de Venta Completada**
   - Se envía al cliente cuando se completa una venta
   - Incluye detalles de la venta, productos, total, etc.
   - También se puede enviar al administrador

3. **Recordatorio de Deuda**
   - Se envía a clientes con deudas pendientes
   - Incluye monto total, pagado y saldo pendiente

4. **Mensaje Personalizado**
   - Permite enviar cualquier mensaje personalizado

## 🔧 Uso de la API

### Enviar Notificación de Stock Bajo

```javascript
const response = await fetch('/api/notifications/whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'low_stock',
    phoneNumber: '+50371234567',
    data: {
      products: [
        {
          name: 'Producto 1',
          stock: 2,
          minStock: 10,
          severity: 'critical'
        }
      ]
    }
  })
});
```

### Enviar Notificación de Venta

```javascript
const response = await fetch('/api/notifications/whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'sale',
    phoneNumber: '+50371234567',
    data: {
      sale: {
        saleNumber: 'V-000001',
        total: 150.00,
        items: [...],
        // ... otros datos de la venta
      },
      toCustomer: true // true para cliente, false para admin
    }
  })
});
```

### Enviar Recordatorio de Deuda

```javascript
const response = await fetch('/api/notifications/whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'debt',
    phoneNumber: '+50371234567',
    data: {
      debt: {
        saleNumber: 'V-000001',
        total: 200.00,
        paidAmount: 50.00,
        debtAmount: 150.00
      }
    }
  })
});
```

### Enviar Mensaje Personalizado

```javascript
const response = await fetch('/api/notifications/whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'custom',
    phoneNumber: '+50371234567',
    data: {
      message: 'Tu mensaje personalizado aquí'
    }
  })
});
```

### Verificar Configuración

```javascript
const response = await fetch('/api/notifications/whatsapp');
const data = await response.json();
console.log(data.configured); // true o false
```

## 🔄 Integración Automática

### Notificaciones en Ventas

Las notificaciones de venta se envían automáticamente cuando:
- Se crea una nueva venta
- El cliente tiene un número de teléfono registrado
- Twilio está configurado correctamente

**Nota**: Si Twilio no está configurado o falla el envío, la venta se procesa normalmente (no bloqueante).

## 📊 Formato de Números de Teléfono

El sistema acepta números en varios formatos y los convierte automáticamente a formato E.164:

- `71234567` → `+50371234567`
- `071234567` → `+50371234567`
- `+50371234567` → `+50371234567` (ya está en formato correcto)

**Código de país por defecto**: +503 (El Salvador)

## 💰 Costos

### Sandbox (Pruebas)
- **Gratis** para desarrollo y pruebas
- Limitado a números verificados en el Sandbox
- Mensajes de prueba ilimitados

### Producción
- **$0.005 USD por mensaje** (aproximadamente)
- Necesitas un número de WhatsApp verificado
- Requiere aprobación de Twilio para números de producción

## 🆘 Solución de Problemas

### Error: "Twilio no está configurado"
- Verifica que las 3 variables de entorno estén configuradas
- Asegúrate de copiar las credenciales completas sin espacios

### Error: "Invalid phone number"
- Verifica que el número esté en formato correcto
- Asegúrate de incluir el código de país (+503 para El Salvador)

### Error: "Message failed to send"
- Verifica que el número destino esté unido al Sandbox (para pruebas)
- Para producción, verifica que el número esté verificado en Twilio
- Revisa los logs del servidor para más detalles

### No recibo mensajes
- Verifica que el número destino esté unido al Sandbox de Twilio
- Para producción, necesitas un número de WhatsApp Business verificado
- Revisa la consola de Twilio para ver el estado de los mensajes

## 📚 Documentación Adicional

- [Documentación oficial de Twilio](https://www.twilio.com/docs)
- [Guía de WhatsApp con Twilio](https://www.twilio.com/docs/whatsapp)
- [Twilio Console](https://console.twilio.com/)

## 🎯 Próximos Pasos

1. **Configurar Sandbox** para pruebas
2. **Probar notificaciones** usando el endpoint `/api/notifications/whatsapp`
3. **Solicitar número verificado** cuando estés listo para producción
4. **Configurar webhooks** para recibir respuestas de WhatsApp (opcional)

---

**Nota**: Las notificaciones de WhatsApp son opcionales. El sistema funciona perfectamente sin ellas, pero añaden un valor significativo para mantener a los clientes informados.

