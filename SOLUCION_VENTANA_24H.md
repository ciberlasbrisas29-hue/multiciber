# 🔴 Solución Error 63015 - Ventana de 24 Horas

## Problema Identificado

El error **63015** puede ocurrir incluso cuando el número está unido al Sandbox. Esto se debe a la **ventana de 24 horas** de WhatsApp.

## ⏰ Ventana de 24 Horas de WhatsApp

WhatsApp tiene una política de "ventana de 24 horas":
- Puedes enviar mensajes **gratis** dentro de las 24 horas después de que el usuario te envió un mensaje
- Fuera de esa ventana, solo puedes enviar mensajes usando **plantillas aprobadas** (que requieren verificación)

## 🔍 En el Sandbox de Twilio

El Sandbox tiene restricciones adicionales:
- **Solo puedes enviar mensajes fuera de la ventana de 24 horas si el usuario te envió un mensaje primero**
- Si el usuario solo se unió al Sandbox pero nunca te envió un mensaje, **no puedes iniciar la conversación**

## ✅ Solución

### Paso 1: Enviar Mensaje desde el Usuario

El número destino (`+50374937859`) debe enviar un mensaje primero a Twilio:

1. Abre WhatsApp en el teléfono `+50374937859`
2. Envía un mensaje cualquiera a: **+1 415 523 8886**
   - Ejemplo: "Hola" o "Prueba"
   - Esto abre la ventana de 24 horas

### Paso 2: Enviar Mensaje desde la Aplicación

Después de que el usuario envíe el mensaje:

1. Espera 10-30 segundos
2. Intenta enviar un mensaje desde la aplicación
3. El mensaje debería llegar correctamente

### Paso 3: Mantener la Ventana Abierta

Para mantener la ventana de 24 horas abierta:
- El usuario puede enviar mensajes periódicamente
- O puedes configurar respuestas automáticas cuando el usuario envía mensajes

## 📋 Verificación

Para verificar si la ventana está abierta:

1. Ve a Twilio Console → **Messaging** → **Logs**
2. Busca mensajes entrantes (inbound) del número `+50374937859`
3. Si hay mensajes entrantes recientes, la ventana está abierta

## 🎯 Alternativa: Usar Plantillas Aprobadas

Si necesitas enviar mensajes fuera de la ventana de 24 horas sin que el usuario envíe primero:

1. Solicita un **número de WhatsApp verificado** en Twilio (no Sandbox)
2. Crea **plantillas de mensaje aprobadas** en Twilio
3. Usa esas plantillas para enviar mensajes

**Nota**: Esto requiere pasar del Sandbox a producción y tiene costos asociados.

## ⚠️ Notas Importantes

1. **La ventana se cierra después de 24 horas** de inactividad
2. **Cada vez que el usuario envía un mensaje**, la ventana se renueva por 24 horas más
3. **En el Sandbox**, esta restricción es más estricta que en producción
4. **Para producción**, necesitas un número verificado y plantillas aprobadas

## 🔧 Próximos Pasos

1. Pide al usuario que envíe un mensaje a `+14155238886`
2. Espera 10-30 segundos
3. Intenta enviar un mensaje desde la aplicación
4. El mensaje debería llegar correctamente

---

**Resumen**: El número está unido al Sandbox, pero necesitas que el usuario envíe un mensaje primero para abrir la ventana de 24 horas. Después de eso, podrás enviarle mensajes durante 24 horas.

