# Solución Error 63015 - Twilio WhatsApp Sandbox

## 🔴 Problema

El error **63015** ocurre cuando intentamos enviar mensajes simples (`body`) desde nuestra aplicación, pero en Twilio Console funciona perfectamente usando plantillas de contenido (`contentSid`).

## ✅ Solución: Crear Plantilla Genérica en Twilio

El Sandbox de Twilio puede rechazar mensajes simples. La solución es crear una plantilla genérica que acepte cualquier mensaje como variable.

### Pasos:

1. **Ve a Twilio Console:**
   - https://console.twilio.com/us1/develop/sms/content-template-builder

2. **Crea una nueva plantilla:**
   - Haz clic en "Create new template"
   - Nombre: "Mensaje Genérico" o "Generic Message"
   - Tipo: "Text"
   - Contenido: `{{1}}`
   - Guarda la plantilla

3. **Obtén el Content SID:**
   - Después de crear la plantilla, copia el **Content SID** (empieza con `HX...`)

4. **Actualiza `.env.local`:**
   ```env
   TWILIO_CONTENT_SID=HXtu_content_sid_aqui
   ```

5. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

## 🔧 Solución Temporal: Usar Plantilla en el Código

Si ya tienes una plantilla configurada, puedes forzar su uso desde el panel de prueba:

1. En el panel de prueba, cuando envíes un mensaje personalizado, el código ahora intentará usar la plantilla si está configurada.

2. O puedes modificar el componente para que siempre use la plantilla cuando esté disponible.

## 📋 Verificación

Después de configurar la plantilla:

1. Reinicia el servidor
2. Intenta enviar un mensaje desde el panel de prueba
3. Verifica los logs del servidor para ver si está usando la plantilla
4. El mensaje debería llegar correctamente

## 🎯 Nota Importante

- Las plantillas en el Sandbox pueden tener restricciones
- Para producción, necesitarás un número de WhatsApp verificado
- El Sandbox solo permite mensajes a números unidos al Sandbox

