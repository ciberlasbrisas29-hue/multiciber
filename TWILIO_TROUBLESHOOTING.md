# Solución de Problemas - Twilio WhatsApp

## ❌ El mensaje no llega a mi WhatsApp

### Problema más común: Número no unido al Sandbox

Si estás usando el **Sandbox de Twilio** (número `+14155238886`), el número destino **DEBE estar unido al Sandbox** antes de recibir mensajes.

#### Cómo unir tu número al Sandbox:

1. Ve al [Twilio Console](https://console.twilio.com/)
2. Navega a **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Verás un código como: `join [código-aleatorio]`
4. Envía ese código exacto (ej: `join abc-xyz`) desde tu WhatsApp al número: **+1 415 523 8886**
5. Twilio te responderá confirmando que te uniste al Sandbox
6. **Ahora sí** podrás recibir mensajes

### Verificar si el mensaje se envió correctamente

1. **Revisa la consola del servidor** (donde corre `npm run dev`)
   - Busca mensajes que digan "Mensaje de WhatsApp enviado exitosamente"
   - Si hay errores, aparecerán en rojo

2. **Revisa la consola del navegador** (F12 → Console)
   - Busca mensajes que digan "✅ Mensaje enviado" o "❌ Error enviando mensaje"

3. **Revisa el Dashboard de Twilio**
   - Ve a [Twilio Console](https://console.twilio.com/) → **Monitor** → **Logs** → **Messaging**
   - Verás el estado de cada mensaje enviado

### Errores comunes y soluciones

#### Error 21608: "Unable to create record"
- **Causa**: El número destino no está unido al Sandbox
- **Solución**: Sigue los pasos arriba para unir tu número

#### Error 21211: "Invalid 'To' Phone Number"
- **Causa**: El formato del número es incorrecto
- **Solución**: Usa formato E.164: `+50374937859` o `74937859` (se formatea automáticamente)

#### Error 21610: "Unsubscribed recipient"
- **Causa**: El número se desuscribió del Sandbox o nunca se unió
- **Solución**: Vuelve a unir el número al Sandbox

#### El mensaje dice "enviado" pero no llega
- **Causa 1**: El número no está unido al Sandbox
- **Causa 2**: WhatsApp tiene restricciones de entrega
- **Solución**: 
  1. Verifica en Twilio Console el estado del mensaje
  2. Asegúrate de que el número esté unido al Sandbox
  3. Espera unos minutos (a veces hay delay)

### Para producción (número verificado)

Si tienes un **número de WhatsApp verificado** (no Sandbox):
- No necesitas unir números al Sandbox
- Puedes enviar a cualquier número (con restricciones de Twilio)
- El costo es aproximadamente $0.005 USD por mensaje

### Verificar configuración

Ejecuta en la terminal:
```bash
npm run check-twilio
```

Esto verificará que las variables de entorno estén configuradas correctamente.

### Debug avanzado

Visita en el navegador (solo desarrollo):
```
http://localhost:3000/api/debug/twilio-env
```

Esto mostrará qué variables detecta el servidor.

---

## 📞 ¿Necesitas ayuda?

1. Revisa los logs del servidor
2. Revisa los logs en Twilio Console
3. Verifica que el número esté unido al Sandbox
4. Prueba con un mensaje simple primero

