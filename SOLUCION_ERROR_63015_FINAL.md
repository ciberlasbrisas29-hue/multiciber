# 🔴 Solución Error 63015 - Número No Unido al Sandbox

## Problema Identificado

El error **63015** significa que el número destino (`+50374937859`) **NO está unido al Sandbox de Twilio**.

Aunque los mensajes funcionen desde Twilio Console, esto puede deberse a:
- El número se desvinculó del Sandbox
- La sesión del Sandbox expiró
- El número nunca se unió correctamente

## ✅ Solución: Unir el Número al Sandbox

### Paso 1: Obtener el Código de Unión

1. Ve a **Twilio Console**: https://console.twilio.com
2. Navega a: **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Busca el **código de unión** (join code)
   - Ejemplo: `join abc-123-xyz`
   - O simplemente el código: `abc-123-xyz`

### Paso 2: Enviar el Código desde WhatsApp

1. Abre **WhatsApp** en tu teléfono (`+50374937859`)
2. Envía un mensaje al número: **+1 415 523 8886**
3. Envía exactamente: `join [código]`
   - Ejemplo: Si el código es `abc-123-xyz`, envía: `join abc-123-xyz`
   - O simplemente: `abc-123-xyz` (depende de tu Sandbox)

### Paso 3: Verificar Confirmación

Deberías recibir un mensaje de confirmación de Twilio que dice algo como:
> "You are now connected to the Twilio WhatsApp Sandbox..."

### Paso 4: Probar de Nuevo

1. Espera 1-2 minutos después de unirte
2. Intenta enviar un mensaje desde la aplicación
3. El mensaje debería llegar correctamente

## 🔍 Verificar Estado del Sandbox

Puedes verificar si tu número está unido:

1. Ve a Twilio Console → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Busca la sección "Sandbox participants" o "Números unidos"
3. Deberías ver tu número `+50374937859` en la lista

## ⚠️ Notas Importantes

1. **El código de unión puede cambiar**: Si no funciona, verifica el código actual en Twilio Console
2. **Sesión expira**: Si no envías mensajes por un tiempo, el Sandbox puede desvincular tu número
3. **Solo números unidos**: El Sandbox solo permite enviar mensajes a números que se han unido explícitamente
4. **Ventana de 24 horas**: Después de que un usuario te envía un mensaje, puedes responderle por 24 horas sin necesidad de que esté unido

## 🎯 Próximos Pasos

Después de unir tu número:

1. Reinicia el servidor (si es necesario)
2. Intenta enviar un mensaje desde la aplicación
3. Verifica los logs del servidor
4. El mensaje debería llegar correctamente

## 📞 Número del Sandbox

- **WhatsApp**: +1 415 523 8886
- **Formato para enviar**: `whatsapp:+14155238886`

## 🔧 Si el Problema Persiste

1. Verifica que el código de unión sea el correcto
2. Asegúrate de enviar el mensaje desde el número correcto (`+50374937859`)
3. Espera 2-3 minutos después de unirte
4. Intenta enviar un mensaje desde Twilio Console primero para verificar
5. Revisa los logs de Twilio Console para ver si hay más detalles del error

