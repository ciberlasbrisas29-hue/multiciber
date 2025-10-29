# 🏪 Multiciber Las Brisas - Sistema de Gestión

Sistema de gestión completo para cibercafé desarrollado con Node.js, React y MongoDB.

## 🚀 Características

- **Dashboard Responsivo** - Diseño móvil y web
- **Gestión de Ventas** - Venta de productos y venta libre
- **Control de Inventario** - Productos y stock
- **Balance Financiero** - Ingresos y egresos
- **Sistema de Deudas** - Por cobrar y por pagar
- **Autenticación Segura** - JWT y encriptación

## 🛠️ Tecnologías

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- JWT Authentication
- Bcryptjs

### Hosting
- Vercel (Frontend + Backend)
- MongoDB Atlas (Base de datos)

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de MongoDB Atlas
- Cuenta de Vercel

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/ciber-management-v2.git
cd ciber-management-v2
```

2. **Instalar dependencias del backend**
```bash
cd backend
npm install
```

3. **Instalar dependencias del frontend**
```bash
cd ../frontend
npm install
```

4. **Configurar variables de entorno**
```bash
# Backend
cp backend/config.env.example backend/config.env
# Editar backend/config.env con tus credenciales

# Frontend
cp frontend/.env.example frontend/.env.local
# Editar frontend/.env.local con tu URL de API
```

5. **Ejecutar en desarrollo**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 Despliegue en Vercel

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/ciber-management-v2.git
git push -u origin main
```

### 2. Conectar con Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con GitHub
3. Importa tu repositorio
4. Configura las variables de entorno
5. Despliega

## 🔧 Variables de Entorno

### Backend (config.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRE=7d
```

### Frontend (.env.local)
```
VITE_API_URL=https://tu-app.vercel.app/api
```

## 📱 Uso

1. **Acceder al sistema**: `https://tu-app.vercel.app`
2. **Credenciales por defecto**:
   - Usuario: `admin`
   - Contraseña: `admin123`

## 🎨 Diseño

- **Mobile First** - Optimizado para móviles
- **Responsive** - Adaptable a todas las pantallas
- **Material Design** - Interfaz moderna y limpia
- **Tema Personalizado** - Colores corporativos

## 📊 Funcionalidades

### Dashboard
- Resumen de ventas del día
- Accesos rápidos
- Estadísticas en tiempo real

### Ventas
- Venta de productos del inventario
- Venta libre (sin productos)
- Múltiples métodos de pago
- Sistema de descuentos

### Inventario
- Gestión de productos
- Control de stock
- Categorización
- Códigos de barras

### Balance
- Ingresos y egresos
- Reportes por fecha
- Exportación de datos

### Deudas
- Deudas por cobrar
- Deudas por pagar
- Seguimiento de pagos

## 🔒 Seguridad

- Autenticación JWT
- Encriptación de contraseñas
- Validación de datos
- CORS configurado
- Variables de entorno seguras

## 📈 Roadmap

- [ ] Reportes PDF
- [ ] Notificaciones push
- [ ] App móvil nativa
- [ ] Integración con impresoras
- [ ] Sistema de backup automático

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Desarrollado por

**Multiciber Las Brisas**
- Email: admin@multiciber.com
- Website: https://multiciber.vercel.app

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!