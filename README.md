# Multiciber - Sistema de Gestión de Negocio

Sistema de gestión completo para negocios tipo cibercafé/tienda de tecnología, construido con Next.js 16 y MongoDB.

## 🚀 Características

- **Gestión de Inventario**: Control completo de productos con categorías, stock, códigos de barras
- **Sistema de Ventas**: Registro de ventas con productos o ventas libres, múltiples métodos de pago
- **Gestión de Deudas**: Seguimiento de ventas a crédito y pagos parciales
- **Control de Gastos**: Registro y categorización de gastos
- **Dashboard**: Estadísticas en tiempo real, balance, reportes
- **Autenticación Segura**: Sistema de login/registro con JWT y cookies httpOnly
- **Aplicación Móvil**: Configurado con Capacitor para Android

## 📋 Requisitos Previos

- Node.js 18+ 
- MongoDB (local o remoto)
- npm, yarn, pnpm o bun

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd multiciber-next
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
Crea un archivo `.env.local` en la raíz del proyecto. Ver `ENV_SETUP.md` para más detalles.

```env
MONGODB_URI=mongodb://localhost:27017/multiciber
JWT_SECRET=tu-secret-key-super-segura-de-al-menos-32-caracteres
JWT_EXPIRE=7d
NODE_ENV=development
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏗️ Estructura del Proyecto

```
multiciber-next/
├── app/                    # Rutas y páginas de Next.js
│   ├── (dashboard)/        # Rutas protegidas del dashboard
│   ├── api/               # API Routes
│   └── login/             # Página de login
├── components/            # Componentes React reutilizables
├── contexts/              # Contextos de React (Auth, etc.)
├── lib/                   # Utilidades y helpers
│   ├── db.js             # Conexión a MongoDB
│   ├── auth.js           # Utilidades de autenticación
│   ├── errors.js         # Manejo de errores
│   ├── logger.js         # Sistema de logging
│   ├── validators.js     # Validación con Zod
│   └── middleware.js     # Middleware de autenticación/autorización
├── services/             # Servicios de API del cliente
└── public/               # Archivos estáticos
```

## 🔐 Seguridad

- ✅ Autenticación con JWT y cookies httpOnly
- ✅ Validación de datos con Zod
- ✅ Manejo centralizado de errores
- ✅ Middleware de autorización por roles
- ✅ Variables de entorno validadas
- ✅ Logging estructurado

## 📚 Documentación Adicional

- `ENV_SETUP.md` - Configuración de variables de entorno
- `lib/middleware-example.js` - Ejemplos de uso del middleware

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT, bcryptjs
- **Validación**: Zod
- **Móvil**: Capacitor (Android)

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🚀 Despliegue

### Vercel (Recomendado)

La forma más fácil de desplegar es usar [Vercel](https://vercel.com):

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. ¡Despliega!

### Otras Plataformas

Consulta la [documentación de Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para otras opciones de despliegue.

## 📄 Licencia

Este proyecto es privado.

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.
