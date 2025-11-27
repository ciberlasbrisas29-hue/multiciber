# Solución Error 63015 - Twilio WhatsApp Sandbox

## 🔴 Problema Identificado

El error **63015** ocurre cuando intentamos enviar mensajes simples (`body`) desde nuestra aplicación, pero en Twilio Console funciona perfectamente usando plantillas de contenido (`contentSid`).

## ✅ Solución Temporal

Para mensajes personalizados en el Sandbox, tenemos dos opciones:

### Opción 1: Usar mensajes simples (actual)
El código actual usa `body` para mensajes simples. Esto debería funcionar, pero el error 63015 sugiere que hay alguna restricción.

### Opción 2: Crear una plantilla genérica
Para el Sandbox, puedes crear una plantilla de contenido genérica que acepte cualquier mensaje.

## 🔧 Pasos para Solucionar

### 1. Verificar los logs del servidor

En la terminal donde corre `npm run dev`, busca:
- `"Enviando mensaje de WhatsApp"` - debería mostrar el `from` y `to`
- `"Mensaje de WhatsApp enviado exitosamente"` o `"Error al enviar mensaje"`

**Comparte exactamente qué aparece en esos logs cuando envías un mensaje.**

### 2. Comparar con Twilio Console

En Twilio Console, cuando funciona, estás usando:
```javascript
contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e'
contentVariables: '{"1":"12/1","2":"3pm"}'
```

En nuestra app, estamos usando:
```javascript
body: 'Tu mensaje aquí'
```

### 3. Posible solución: Crear plantilla genérica

Si el problema persiste, necesitamos crear una plantilla de contenido genérica en Twilio:

1. Ve a Twilio Console → Messaging → Content Template Builder
2. Crea una nueva plantilla con solo texto: `{{1}}`
3. Usa esa plantilla para mensajes personalizados

## 📋 Información que Necesito

Para diagnosticar correctamente, necesito:

1. **Logs del servidor** cuando envías un mensaje (copia y pega exactamente lo que aparece)
2. **Consola del navegador** (F12) - qué aparece después de enviar
3. **¿El número "from" en los logs es exactamente `whatsapp:+14155238886`?** (sin espacios, con el prefijo)

## 🎯 Próximos Pasos

Una vez que tenga los logs, podré identificar la diferencia exacta entre lo que funciona en Console y lo que falla en la app.

