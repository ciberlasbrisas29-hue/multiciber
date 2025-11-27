# Solución: Mensajes en "queued" pero no llegan

## Problema
Los mensajes se envían correctamente (status "queued") pero no llegan al WhatsApp del usuario.

## Posibles Causas y Soluciones

### 1. Verificar el estado real del mensaje en Twilio

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Monitor → Logs → Messaging
3. Busca el SID del mensaje (ej: `SMISc6fe91b18c282e83690115f115b25`)
4. Verifica el estado:
   - **"queued"** = En cola (puede tardar unos minutos)
   - **"sent"** = Enviado a WhatsApp
   - **"delivered"** = Entregado al dispositivo
   - **"failed"** = Falló (verás el motivo)

### 2. Verificar que el número esté realmente activo

Aunque tu número aparece en "Sandbox Participants", verifica:

1. Ve a Messaging → Try it out → Send a WhatsApp message
2. En la sección "Sandbox Participants", verifica que `+50374937859` esté listado
3. Si no está, envía de nuevo el código "join [código]" al `+1 415 523 8886`

### 3. Verificar el formato del número "from"

El número debe ser exactamente: `whatsapp:+14155238886` (sin espacios)

Verifica en `.env.local`:
```env
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**NO debe tener espacios:**
- ❌ `whatsapp: +14155238886` (con espacio)
- ❌ `whatsapp:+1 415 523 8886` (con espacios)
- ✅ `whatsapp:+14155238886` (correcto)

### 4. Esperar unos minutos

A veces hay delay en la entrega. Espera 2-5 minutos y verifica:
- Tu WhatsApp
- Los logs de Twilio Console

### 5. Verificar logs del servidor

En la terminal donde corre `npm run dev`, busca:
- `"Mensaje de WhatsApp enviado exitosamente"`
- `"Error al enviar mensaje de WhatsApp"`

Si hay errores, aparecerán ahí.

### 6. Probar desde Twilio Console directamente

1. Ve a Messaging → Try it out → Send a WhatsApp message
2. En "Send a WhatsApp message", ingresa:
   - To: `whatsapp:+50374937859`
   - Message: "Prueba desde Twilio Console"
3. Haz clic en "Send Message"
4. Verifica si este mensaje sí llega

Si este mensaje SÍ llega pero los de tu app NO, el problema está en la configuración de tu app.

### 7. Verificar cuenta de Twilio

Si estás en cuenta Trial:
- Verifica que tengas créditos disponibles
- Algunas funciones pueden estar limitadas

### 8. Verificar restricciones de WhatsApp

WhatsApp puede tener restricciones:
- Límite de mensajes por hora
- Restricciones geográficas
- Políticas de spam

## Debug Avanzado

### Verificar respuesta completa de Twilio

Abre la consola del navegador (F12) y ejecuta:

```javascript
fetch('/api/debug/test-twilio', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+50374937859',
    message: 'Prueba de debug'
  })
}).then(r => r.json()).then(console.log)
```

Esto mostrará la respuesta completa de Twilio.

## Próximos Pasos

1. **Verifica el estado del mensaje en Twilio Console** usando el SID
2. **Prueba enviar desde Twilio Console directamente**
3. **Revisa los logs del servidor** para ver si hay errores
4. **Verifica el formato del número "from"** en `.env.local`

Si después de estos pasos el problema persiste, comparte:
- El estado del mensaje en Twilio Console
- Los logs del servidor
- Si el mensaje desde Twilio Console sí llega

