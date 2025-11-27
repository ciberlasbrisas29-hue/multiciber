# 🔴 Solución Error 63015 - Formato del Número

## Problema Identificado

El error **63015** persiste incluso después de:
- ✅ El número está unido al Sandbox
- ✅ La ventana de 24 horas está abierta
- ✅ El mensaje se encola correctamente

Esto sugiere que el **formato del número** no coincide exactamente con el que está unido al Sandbox.

## 🔍 Verificación Necesaria

### Paso 1: Verificar el Formato en Twilio Console

1. Ve a **Twilio Console**: https://console.twilio.com
2. Navega a: **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Busca la sección **"Sandbox participants"** o **"Números unidos"**
4. **Copia el formato EXACTO** del número que aparece ahí
   - Ejemplo: `+50374937859`
   - O: `50374937859`
   - O: `whatsapp:+50374937859`

### Paso 2: Comparar con Nuestro Formato

Abre esta URL para ver los formatos que estamos usando:
```
http://localhost:3000/api/debug/verify-sandbox-number?phoneNumber=+50374937859
```

### Paso 3: Ajustar el Formato

Si el formato en Twilio Console es diferente, necesitamos ajustar nuestra función `formatPhoneNumber` en `lib/twilio.js`.

## 🔧 Posibles Soluciones

### Solución 1: Verificar Formato Exacto

El número debe coincidir **EXACTAMENTE** con el que está unido al Sandbox:
- Si está unido como `+50374937859`, debemos usar `whatsapp:+50374937859`
- Si está unido como `50374937859`, debemos usar `whatsapp:+50374937859` (agregar +)
- Si está unido como `whatsapp:+50374937859`, debemos usar exactamente eso

### Solución 2: Probar Diferentes Formatos

Si no estás seguro del formato exacto, prueba enviar mensajes con diferentes formatos:
- `+50374937859`
- `50374937859`
- `whatsapp:+50374937859`

### Solución 3: Re-unir el Número

Si el formato no coincide, puedes:
1. Des-unir el número del Sandbox (enviar "stop" a Twilio)
2. Re-unir el número con el formato correcto
3. Probar de nuevo

## 📋 Información que Necesito

Para solucionar esto, necesito que me compartas:

1. **El formato EXACTO del número** que aparece en Twilio Console → Sandbox participants
2. **El formato que estamos usando** (de la URL de verificación)
3. **Si hay alguna diferencia** entre los dos

## 🎯 Próximos Pasos

1. Verifica el formato en Twilio Console
2. Compara con nuestro formato
3. Si hay diferencia, ajusta el código o re-une el número con el formato correcto
4. Prueba de nuevo

---

**Nota**: El error 63015 es muy específico sobre el formato del número. Aunque parezca que el número es correcto, una pequeña diferencia (como un espacio, un guión, o el prefijo +) puede causar el error.

