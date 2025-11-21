# Configuración de Variables de Entorno

Este documento describe las variables de entorno necesarias para ejecutar la aplicación.

## Variables Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos MongoDB
MONGODB_URI=mongodb://localhost:27017/multiciber

# JWT Configuration
JWT_SECRET=tu-secret-key-super-segura-de-al-menos-32-caracteres-aqui
JWT_EXPIRE=7d

# Environment
NODE_ENV=development
```

## Descripción de Variables

### MONGODB_URI
- **Requerido**: Sí
- **Descripción**: URI de conexión a MongoDB
- **Ejemplo**: `mongodb://localhost:27017/multiciber` o `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

### JWT_SECRET
- **Requerido**: Sí
- **Descripción**: Clave secreta para firmar tokens JWT
- **Recomendación**: Debe tener al menos 32 caracteres y ser aleatoria
- **Generación**: Puedes generar una con `openssl rand -base64 32`

### JWT_EXPIRE
- **Requerido**: No (por defecto: `7d`)
- **Descripción**: Tiempo de expiración de los tokens JWT
- **Formato**: Número seguido de unidad (ej: `7d`, `24h`, `3600s`)

### NODE_ENV
- **Requerido**: No (por defecto: `development`)
- **Descripción**: Entorno de ejecución
- **Valores**: `development`, `production`, `test`

### NEXT_PUBLIC_API_URL (Opcional)
- **Requerido**: No
- **Descripción**: URL base de la API (solo necesario si la API está en otro servidor)
- **Por defecto**: `/api`

## Seguridad

⚠️ **IMPORTANTE**: 
- Nunca commitees el archivo `.env.local` al repositorio
- En producción, usa variables de entorno del servidor o un servicio de gestión de secretos
- El `JWT_SECRET` debe ser único y secreto para cada entorno

