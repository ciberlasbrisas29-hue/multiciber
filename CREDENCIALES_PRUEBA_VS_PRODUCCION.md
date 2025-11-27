# 🔐 Credenciales de Prueba vs Producción - Aclaración

## ⚠️ Confusión Común

Hay una diferencia importante entre:
- **Credenciales de Prueba (Test Credentials)**: NO funcionan con el Sandbox
- **Credenciales de Producción (Live Credentials)**: SÍ funcionan con el Sandbox

## 📋 Explicación

### Credenciales de Prueba (Test Credentials)
- **Ubicación**: Twilio Console → Test Credentials
- **Propósito**: Para probar la API REST sin usar créditos
- **Limitación**: **NO funcionan con el Sandbox de WhatsApp**
- **Uso**: Solo para pruebas de API básicas

### Credenciales de Producción (Live Credentials)
- **Ubicación**: Twilio Console → Dashboard (página principal)
- **Propósito**: Para usar servicios reales de Twilio
- **Funcionan con**: Sandbox de WhatsApp, SMS, llamadas, etc.
- **Costo**: Usan créditos de tu cuenta (pero el Sandbox es gratis)

## ✅ Para el Sandbox de WhatsApp

**Necesitas usar credenciales de PRODUCCIÓN**, incluso si estás en modo de prueba.

### ¿Por qué?

El Sandbox de WhatsApp es un servicio real de Twilio, aunque sea para pruebas. Por lo tanto:
- ✅ Usa credenciales de **producción**
- ✅ El Sandbox es **gratis** (no consume créditos)
- ✅ Puedes probar sin costo
- ❌ Las credenciales de prueba **NO funcionan**

## 🎯 Solución

### Paso 1: Obtener Credenciales de Producción

1. **Ve a Twilio Console**: https://console.twilio.com
2. **En el Dashboard principal** (página de inicio), busca:
   - **Account SID** (no "Test Account SID")
   - **Auth Token** (no "Test Auth Token")
3. **Haz clic en "Show"** para ver el Auth Token
4. **Copia ambas credenciales**

### Paso 2: Actualizar .env.local

```env
# Credenciales de PRODUCCIÓN (necesarias para el Sandbox)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_de_produccion
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_CONTENT_SID=HXb5b62575e6e4ff6129ad7c8efe1f983e
```

### Paso 3: Reiniciar el Servidor

1. **Detén el servidor** (Ctrl+C)
2. **Reinicia**: `npm run dev`
3. **Prueba enviar un mensaje**

## 💰 ¿Cuánto Cuesta?

**El Sandbox de WhatsApp es GRATIS:**
- No consume créditos
- Mensajes ilimitados (dentro de la ventana de 24 horas)
- Solo para números unidos al Sandbox

**Solo pagarás cuando:**
- Salgas del Sandbox
- Uses un número de WhatsApp verificado en producción
- Envíes mensajes fuera de la ventana de 24 horas (con plantillas aprobadas)

## 🔒 Seguridad

**Las credenciales de producción son seguras para usar:**
- El Sandbox no consume créditos
- Puedes limitar el uso en Twilio Console
- Puedes regenerar el Auth Token cuando quieras

## 📋 Resumen

| Tipo | Funciona con Sandbox | Consume Créditos | Uso |
|------|---------------------|------------------|-----|
| **Credenciales de Prueba** | ❌ NO | ❌ NO | Solo API básica |
| **Credenciales de Producción** | ✅ SÍ | ❌ NO (Sandbox gratis) | Sandbox, SMS, etc. |

## ✅ Conclusión

**Para el Sandbox de WhatsApp, necesitas credenciales de PRODUCCIÓN**, pero:
- ✅ El Sandbox es **gratis**
- ✅ No consume créditos
- ✅ Es seguro usarlo
- ✅ Puedes probar sin costo

---

**Próximo paso**: Obtén las credenciales de producción del Dashboard y actualiza `.env.local`. El error 63015 debería desaparecer.

