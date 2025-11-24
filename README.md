# Multiciber - Sistema de Gestión de Negocio

Sistema de gestión completo para negocios tipo cibercafé/tienda de tecnología, construido con Next.js 16, React 19, MongoDB y Capacitor para Android. Proporciona una solución integral para la gestión de inventario, ventas, clientes, proveedores, gastos, deudas y reportes financieros.

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Modelos de Datos](#-modelos-de-datos)
- [API Endpoints](#-api-endpoints)
- [Funcionalidades Detalladas](#-funcionalidades-detalladas)
- [Scripts Disponibles](#-scripts-disponibles)
- [Configuración de Android](#-configuración-de-android)
- [Despliegue](#-despliegue)
- [Seguridad](#-seguridad)
- [Contribuir](#-contribuir)

## 🚀 Características Principales

### 📦 Gestión de Inventario
- **Control completo de productos** con categorías, stock, códigos de barras
- **Categorías predefinidas**: Accesorios Gaming, Almacenamiento, Conectividad, Accesorios de Trabajo, Dispositivos de Captura, Mantenimiento, Otros
- **Gestión de stock mínimo** con alertas automáticas de productos con bajo inventario
- **Unidades de medida**: Unidades, Piezas, Metros, Pulgadas, GB, TB
- **Códigos de barras** únicos por producto
- **Imágenes de productos** con imagen por defecto
- **Tags/Etiquetas** para búsqueda y organización
- **Búsqueda avanzada** por nombre, categoría o código de barras
- **Escáner de códigos de barras** integrado usando la cámara del dispositivo
- **Edición rápida** de productos desde el inventario

### 💰 Sistema de Ventas (POS)
- **Ventas de productos**: Registro de ventas con múltiples productos
- **Ventas libres**: Registro de ventas sin productos específicos (servicios, tiempo de uso, etc.)
- **Múltiples métodos de pago**: Efectivo, Tarjeta, Transferencia bancaria, Cheque, Otro
- **Sistema de descuentos**: Porcentaje o monto fijo
- **Gestión de clientes**: Asociación de clientes a las ventas
- **Números de venta** únicos y secuenciales
- **Notas y conceptos** para cada venta
- **Cálculo automático** de subtotales, descuentos y totales
- **Actualización automática de stock** al realizar ventas
- **Historial completo** de ventas con filtros por fecha, método de pago, estado

### 💳 Gestión de Deudas
- **Ventas a crédito**: Registro de ventas con pago diferido
- **Pagos parciales (Abonos)**: Seguimiento de pagos parciales sobre deudas
- **Cálculo automático** de saldo pendiente
- **Historial de pagos** por deuda
- **Gestión por cliente**: Visualización de todas las deudas de un cliente
- **Estados de deuda**: Pendiente, Pagada, Cancelada
- **Notificaciones** de deudas pendientes

### 📊 Control de Gastos
- **Registro de gastos** con categorías predefinidas:
  - Renta, Servicios, Salarios, Equipos
  - Mantenimiento, Suministros, Marketing
  - Transporte, Otros
- **Gastos recurrentes**: Configuración de gastos periódicos (diario, semanal, mensual, anual)
- **Múltiples métodos de pago**: Efectivo, Tarjeta, Transferencia, Cheque
- **Gestión de proveedores**: Asociación de proveedores a los gastos
- **Comprobantes**: Número de recibo e imagen de comprobante
- **Estados**: Pendiente, Pagado, Cancelado
- **Filtros avanzados**: Por categoría, estado, fecha, proveedor

### 📈 Dashboard y Reportes
- **Dashboard principal** con estadísticas en tiempo real:
  - Ventas del día, mes y año
  - Gastos del día, mes y año
  - Balance (ganancias/pérdidas)
  - Transacciones recientes
- **Reportes Avanzados**:
  - Resumen financiero por período (día, semana, mes, año, personalizado)
  - Tendencia semanal de ventas (últimos 7 días)
  - Análisis de métodos de pago (gráfico circular)
  - Producto estrella (mayor ingresos)
  - Producto de mayor rotación (más unidades vendidas)
  - Cálculo de margen bruto (ingresos - costos estimados - gastos)
  - Ticket promedio
  - Total de transacciones
  - Incluye: ventas pagadas, ventas con deuda, abonos, ventas libres, egresos
- **Balance Financiero**:
  - Ingresos vs Egresos por período
  - Desglose por categorías
  - Gráficos de tendencias
  - Filtros por período (día, semana, mes, año, personalizado)

### 👥 Gestión de Clientes
- **Base de datos de clientes** con información completa:
  - Nombre, teléfono, email, dirección
  - Notas y observaciones
  - Estado activo/inactivo
- **Historial de compras** por cliente
- **Deudas pendientes** por cliente
- **Búsqueda y filtrado** de clientes

### 🏢 Gestión de Proveedores
- **Base de datos de proveedores** con información de contacto
- **Asociación con gastos** y productos
- **Búsqueda y filtrado** de proveedores

### 🔐 Autenticación y Seguridad
- **Sistema de login/registro** con JWT
- **Cookies httpOnly** para mayor seguridad
- **Roles de usuario**: Admin, Empleado
- **Sesiones persistentes** con expiración configurable
- **Protección de rutas** con middleware de autenticación
- **Validación de datos** con Zod en frontend y backend

### 📱 Aplicación Móvil (Android)
- **Aplicación nativa Android** usando Capacitor
- **PWA (Progressive Web App -  Aplicación Web Progresiva)** compatible
- **Iconos adaptativos** para Android
- **Permisos de cámara y galería** para escaneo de códigos de barras e imágenes
- **Configuración de red segura** para conexiones HTTPS
- **Navegación optimizada** para móviles

### 🎨 Interfaz de Usuario
- **Diseño responsive** optimizado para móviles y desktop
- **Tema moderno** con gradientes morado/índigo
- **Navegación inferior** para móviles
- **Navegación superior** para desktop
- **Componentes reutilizables** y modulares
- **Notificaciones** en tiempo real
- **Alertas de stock bajo** visibles en el inventario
- **Modales y formularios** intuitivos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 16.0.3** - Framework React con App Router
- **React 19.2.0** - Biblioteca de UI
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 4** - Framework de utilidades CSS
- **Lucide React** - Iconos modernos
- **Recharts** - Gráficos y visualizaciones
- **date-fns** - Manipulación de fechas
- **@zxing/library** - Escaneo de códigos de barras
- **html2canvas & html-to-image** - Generación de imágenes
- **jsPDF & jspdf-autotable** - Generación de PDFs
- **react-qr-code & qrcode.react** - Generación de códigos QR

### Backend
- **Next.js API Routes** - Endpoints del servidor
- **MongoDB** - Base de datos NoSQL
- **Mongoose 8.20.0** - ODM para MongoDB
- **JWT (jsonwebtoken & jose)** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **Zod 4.1.12** - Validación de esquemas
- **Axios** - Cliente HTTP
- **CORS** - Configuración CORS

### Móvil
- **Capacitor 7.4.4** - Runtime nativo
- **@capacitor/android** - Plugin de Android

### Desarrollo
- **ESLint** - Linter de código
- **Sharp** - Procesamiento de imágenes
- **dotenv** - Variables de entorno

### Otros
- **Twilio** - Integración de SMS (opcional)

## 📋 Requisitos Previos

- **Node.js** 18 o superior
- **MongoDB** (local o remoto como MongoDB Atlas)
- **npm**, **yarn**, **pnpm** o **bun**
- **Android Studio** (para desarrollo Android)
- **Java JDK** 11 o superior (para Android)

## 🔧 Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd multiciber
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/multiciber
# O para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/multiciber

# Autenticación JWT
JWT_SECRET=tu-secret-key-super-segura-de-al-menos-32-caracteres
JWT_EXPIRE=7d

# Entorno
NODE_ENV=development

# Twilio (opcional, para SMS)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=tu_numero_twilio
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 5. Crear Usuario Administrador

La primera vez que uses la aplicación, regístrate desde la página de login. El primer usuario será automáticamente asignado como administrador.

## ⚙️ Configuración

### Configuración de MongoDB

1. **MongoDB Local**:
   - Instala MongoDB en tu sistema
   - Inicia el servicio de MongoDB
   - Usa la URI: `mongodb://localhost:27017/multiciber`

2. **MongoDB Atlas** (Recomendado para producción):
   - Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Crea un cluster gratuito
   - Obtén la cadena de conexión
   - Reemplaza `<password>` y `<dbname>` en la URI

### Configuración de Capacitor

El archivo `capacitor.config.ts` está configurado para apuntar a la URL de producción en Vercel. Para desarrollo local, puedes modificar la URL del servidor:

```typescript
server: {
  url: 'http://localhost:3000', // Para desarrollo
  cleartext: false,
  androidScheme: 'https'
}
```

## 🏗️ Estructura del Proyecto

```
multiciber/
├── app/                          # Rutas y páginas de Next.js (App Router)
│   ├── (dashboard)/              # Rutas protegidas del dashboard
│   │   ├── balance/              # Página de balance financiero
│   │   │   └── debt/              # Gestión de deudas
│   │   ├── clients/              # Gestión de clientes
│   │   ├── debts/                # Lista de deudas
│   │   ├── expenses/              # Gestión de gastos
│   │   ├── inventory/            # Gestión de inventario
│   │   ├── products/             # Productos
│   │   ├── reports/              # Reportes avanzados
│   │   ├── sales/                # Sistema de ventas
│   │   ├── settings/             # Configuración
│   │   ├── suppliers/            # Gestión de proveedores
│   │   ├── ventas/               # Historial de ventas
│   │   ├── layout.tsx            # Layout del dashboard
│   │   └── page.tsx               # Página principal (Dashboard)
│   ├── api/                      # API Routes (Backend)
│   │   ├── auth/                 # Autenticación (login, register, logout, me)
│   │   ├── balance/              # Balance financiero
│   │   ├── catalog/              # Catálogo público
│   │   ├── clients/               # CRUD de clientes
│   │   ├── dashboard/            # Estadísticas del dashboard
│   │   ├── expenses/             # CRUD de gastos
│   │   ├── products/             # CRUD de productos
│   │   ├── reports/              # Reportes avanzados
│   │   ├── sales/                # CRUD de ventas
│   │   ├── settings/             # Configuración del negocio
│   │   └── suppliers/            # CRUD de proveedores
│   ├── catalog/                  # Catálogo público (sin autenticación)
│   ├── login/                    # Página de login
│   ├── layout.tsx                # Layout raíz
│   ├── page.tsx                  # Página de inicio
│   └── globals.css               # Estilos globales
├── android/                      # Proyecto Android nativo (Capacitor)
│   └── app/src/main/
│       ├── AndroidManifest.xml   # Configuración de Android
│       └── res/                  # Recursos de Android (iconos, etc.)
├── components/                    # Componentes React reutilizables
│   ├── BarcodeScanner.tsx        # Escáner de códigos de barras
│   ├── BottomNavbar.tsx          # Navegación inferior (móvil)
│   ├── CategoryPickerModal.tsx   # Selector de categorías
│   ├── ClientPickerModal.tsx     # Selector de clientes
│   ├── DashboardLayout.tsx       # Layout del dashboard
│   ├── DatePickerModal.tsx       # Selector de fechas
│   ├── Header.tsx                # Header principal
│   ├── LowStockAlert.tsx         # Alertas de stock bajo
│   ├── MobileLayout.tsx          # Layout móvil
│   ├── NotificationsDropdown.tsx # Dropdown de notificaciones
│   ├── ProductQuickEditModal.tsx # Edición rápida de productos
│   ├── RouteGuard.tsx            # Protección de rutas
│   ├── SaleTypeModal.tsx         # Modal de tipo de venta
│   ├── ShareCatalogModal.tsx     # Compartir catálogo
│   ├── SupplierPickerModal.tsx   # Selector de proveedores
│   └── Toast.tsx                 # Notificaciones toast
├── contexts/                      # Contextos de React
│   └── AuthContext.tsx           # Contexto de autenticación
├── lib/                           # Utilidades y helpers
│   ├── models/                    # Modelos de Mongoose
│   │   ├── BusinessSettings.js   # Configuración del negocio
│   │   ├── Client.js             # Modelo de cliente
│   │   ├── Expense.js             # Modelo de gasto
│   │   ├── Product.js             # Modelo de producto
│   │   ├── Sale.js                # Modelo de venta
│   │   ├── Supplier.js            # Modelo de proveedor
│   │   └── User.js                 # Modelo de usuario
│   ├── auth.js                    # Utilidades de autenticación
│   ├── db.js                      # Conexión a MongoDB
│   ├── errors.js                  # Manejo de errores
│   ├── logger.js                  # Sistema de logging
│   ├── middleware.js              # Middleware de autenticación
│   └── validators.js              # Validación con Zod
├── public/                        # Archivos estáticos
│   ├── assets/                    # Imágenes y recursos
│   └── manifest.json              # Manifest PWA
├── scripts/                       # Scripts de automatización
│   ├── generate-android-icons.js  # Generación de iconos Android
│   └── generate-icons-better.js   # Generación de iconos PWA
├── services/                      # Servicios de API del cliente
│   └── api.ts                     # Cliente HTTP centralizado
├── capacitor.config.ts            # Configuración de Capacitor
├── next.config.js                 # Configuración de Next.js
├── package.json                   # Dependencias y scripts
├── tailwind.config.js             # Configuración de Tailwind
└── tsconfig.json                  # Configuración de TypeScript
```

## 📊 Modelos de Datos

### User (Usuario)
```javascript
{
  username: String (único, requerido)
  email: String (único, requerido)
  password: String (encriptado con bcrypt)
  role: 'admin' | 'employee'
  isActive: Boolean
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}
```

### Product (Producto)
```javascript
{
  name: String (requerido)
  description: String
  price: Number (requerido, >= 0)
  cost: Number (requerido, >= 0)
  category: String (enum: categorías predefinidas)
  stock: Number (default: 0, >= 0)
  minStock: Number (default: 0, >= 0)
  unit: String (enum: unidades de medida)
  barcode: String (único, opcional)
  image: String (URL de imagen)
  tags: [String]
  isActive: Boolean
  createdBy: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

### Sale (Venta)
```javascript
{
  saleNumber: String (único)
  type: 'product' | 'free'
  status: 'paid' | 'debt'
  items: [{
    product: ObjectId (ref: Product)
    productName: String
    quantity: Number
    unitPrice: Number
    totalPrice: Number
  }]
  subtotal: Number
  discount: Number
  discountType: 'percentage' | 'amount'
  total: Number
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check' | 'other'
  client: {
    name: String
    phone: String
    email: String
  }
  concept: String
  notes: String
  debtAmount: Number (para ventas a crédito)
  paidAmount: Number (para pagos parciales)
  freeSaleAmount: Number (para ventas libres)
  createdBy: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

### Expense (Gasto)
```javascript
{
  expenseNumber: String (único, opcional)
  description: String (requerido)
  amount: Number (requerido, > 0)
  category: String (enum: categorías predefinidas)
  subcategory: String
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check'
  vendor: {
    name: String
    phone: String
    email: String
  }
  receipt: {
    number: String
    image: String
  }
  isRecurring: Boolean
  recurringPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly'
  nextDueDate: Date
  status: 'pending' | 'paid' | 'cancelled'
  expenseDate: Date
  notes: String
  createdBy: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

### Client (Cliente)
```javascript
{
  name: String (requerido)
  phone: String
  email: String
  address: String
  notes: String
  isActive: Boolean
  createdBy: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

### Supplier (Proveedor)
```javascript
{
  name: String (requerido)
  phone: String
  email: String
  address: String
  notes: String
  isActive: Boolean
  createdBy: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

### BusinessSettings (Configuración del Negocio)
```javascript
{
  businessName: String
  businessPhone: String
  businessEmail: String
  businessAddress: String
  taxId: String
  logo: String
  currency: String
  timezone: String
  createdBy: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Autenticación

#### `POST /api/auth/register`
Registrar nuevo usuario
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### `POST /api/auth/login`
Iniciar sesión
```json
{
  "email": "string",
  "password": "string"
}
```

#### `POST /api/auth/logout`
Cerrar sesión

#### `GET /api/auth/me`
Obtener información del usuario actual

### Productos

#### `GET /api/products`
Obtener productos (con paginación y filtros)
- Query params: `page`, `limit`, `category`, `search`, `isActive`

#### `POST /api/products`
Crear nuevo producto
```json
{
  "name": "string",
  "price": "number",
  "cost": "number",
  "category": "string",
  "unit": "string",
  "stock": "number",
  "minStock": "number",
  "barcode": "string",
  "description": "string",
  "tags": ["string"]
}
```

#### `GET /api/products/[id]`
Obtener producto por ID

#### `PUT /api/products/[id]`
Actualizar producto

#### `DELETE /api/products/[id]`
Eliminar producto

#### `GET /api/products/categories`
Obtener categorías disponibles

#### `GET /api/products/low-stock`
Obtener productos con stock bajo

#### `GET /api/products/stats/overview`
Obtener estadísticas de productos

### Ventas

#### `GET /api/sales`
Obtener ventas (con paginación y filtros)
- Query params: `page`, `limit`, `status`, `type`, `startDate`, `endDate`

#### `POST /api/sales`
Crear nueva venta
```json
{
  "type": "product" | "free",
  "status": "paid" | "debt",
  "items": [...],
  "paymentMethod": "string",
  "total": "number",
  "client": {...},
  "concept": "string",
  "discount": "number",
  "discountType": "percentage" | "amount"
}
```

#### `GET /api/sales/[id]`
Obtener venta por ID

#### `PUT /api/sales/[id]`
Actualizar venta

### Gastos

#### `GET /api/expenses`
Obtener gastos (con paginación y filtros)
- Query params: `page`, `limit`, `category`, `status`, `startDate`, `endDate`

#### `POST /api/expenses`
Crear nuevo gasto
```json
{
  "description": "string",
  "amount": "number",
  "category": "string",
  "paymentMethod": "string",
  "vendor": {...},
  "expenseDate": "date",
  "status": "paid" | "pending"
}
```

#### `GET /api/expenses/[id]`
Obtener gasto por ID

#### `PUT /api/expenses/[id]`
Actualizar gasto

#### `DELETE /api/expenses/[id]`
Eliminar gasto

#### `GET /api/expenses/categories`
Obtener categorías de gastos

### Clientes

#### `GET /api/clients`
Obtener clientes (con paginación y filtros)

#### `POST /api/clients`
Crear nuevo cliente

#### `GET /api/clients/[id]`
Obtener cliente por ID

#### `PUT /api/clients/[id]`
Actualizar cliente

#### `DELETE /api/clients/[id]`
Eliminar cliente

#### `GET /api/clients/[id]/debts`
Obtener deudas de un cliente

### Proveedores

#### `GET /api/suppliers`
Obtener proveedores

#### `POST /api/suppliers`
Crear nuevo proveedor

#### `GET /api/suppliers/[id]`
Obtener proveedor por ID

#### `PUT /api/suppliers/[id]`
Actualizar proveedor

#### `DELETE /api/suppliers/[id]`
Eliminar proveedor

### Dashboard

#### `GET /api/dashboard/stats`
Obtener estadísticas del dashboard
- Retorna: ventas del día/mes/año, gastos, balance, etc.

#### `GET /api/dashboard/recent-sales`
Obtener ventas recientes

#### `GET /api/dashboard/recent-expenses`
Obtener gastos recientes

### Balance

#### `GET /api/balance`
Obtener balance financiero
- Query params: `period` (day, week, month, year, custom), `startDate`, `endDate`

### Reportes

#### `GET /api/reports/advanced`
Obtener reportes avanzados
- Query params: `period` (day, week, month, year, custom), `startDate`, `endDate`
- Retorna: resumen financiero, tendencias, métodos de pago, productos estrella, etc.

### Catálogo Público

#### `GET /api/catalog/public`
Obtener catálogo público (sin autenticación)
- Query params: `userId`

### Configuración

#### `GET /api/settings`
Obtener configuración del negocio

#### `PUT /api/settings`
Actualizar configuración del negocio

## 🎯 Funcionalidades Detalladas

### Sistema de Ventas (POS)

1. **Venta de Productos**:
   - Selección de productos desde el inventario
   - Búsqueda por nombre o código de barras
   - Escaneo de códigos de barras con la cámara
   - Cantidad editable por producto
   - Cálculo automático de subtotales
   - Aplicación de descuentos (porcentaje o monto)
   - Selección de método de pago
   - Asociación opcional de cliente
   - Notas y conceptos

2. **Venta Libre**:
   - Registro de ventas sin productos específicos
   - Útil para servicios, tiempo de uso, reparaciones, etc.
   - Monto personalizable
   - Método de pago y cliente opcional

3. **Ventas a Crédito**:
   - Registro de ventas con pago diferido
   - Cálculo automático de deuda pendiente
   - Seguimiento de pagos parciales (abonos)
   - Historial completo de pagos

### Gestión de Inventario

1. **Productos**:
   - CRUD completo de productos
   - Categorización automática
   - Control de stock en tiempo real
   - Alertas de stock bajo
   - Códigos de barras únicos
   - Imágenes de productos
   - Búsqueda avanzada

2. **Stock**:
   - Actualización automática al realizar ventas
   - Stock mínimo configurable
   - Alertas visuales de productos con bajo stock
   - Historial de movimientos

### Reportes y Análisis

1. **Dashboard Principal**:
   - Métricas en tiempo real
   - Gráficos de tendencias
   - Transacciones recientes
   - Balance general

2. **Reportes Avanzados**:
   - Análisis por período personalizable
   - Tendencia semanal de ventas
   - Distribución de métodos de pago
   - Productos más vendidos (por ingresos y cantidad)
   - Cálculo de rentabilidad (margen bruto)
   - Ticket promedio

3. **Balance Financiero**:
   - Ingresos vs Egresos
   - Desglose por categorías
   - Filtros por período
   - Gráficos interactivos

### Gestión de Deudas

1. **Registro de Deudas**:
   - Automático al crear venta a crédito
   - Asociación con cliente
   - Monto total y saldo pendiente

2. **Pagos Parciales (Abonos)**:
   - Registro de pagos parciales
   - Actualización automática del saldo
   - Historial de pagos
   - Fecha y método de pago

3. **Seguimiento**:
   - Lista de todas las deudas
   - Filtros por cliente, estado, fecha
   - Notificaciones de deudas pendientes

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo en http://localhost:3000

# Producción
npm run build            # Construye la aplicación para producción
npm run start            # Inicia el servidor de producción

# Calidad de código
npm run lint             # Ejecuta ESLint

# Iconos
npm run generate-icons   # Genera iconos PWA
npm run generate-android-icons  # Genera iconos Android desde logo.png

# Capacitor (Android)
npm run cap:sync         # Sincroniza código web con proyecto Android
npm run cap:open         # Abre proyecto en Android Studio
npm run cap:build        # Construye y sincroniza (build + sync)
```

## 📱 Configuración de Android

### Requisitos

1. **Android Studio** instalado
2. **Java JDK** 11 o superior
3. **Android SDK** configurado

### Generar Iconos de Android

1. Coloca tu logo en `public/assets/images/logo.png`
2. Ejecuta:
```bash
npm run generate-android-icons
```
3. Esto generará iconos en todas las densidades (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)

### Sincronizar con Android

```bash
# Después de hacer cambios en el código
npm run build
npm run cap:sync
```

### Abrir en Android Studio

```bash
npm run cap:open
```

### Permisos Configurados

El `AndroidManifest.xml` incluye los siguientes permisos:

- **Red**: `INTERNET`, `ACCESS_NETWORK_STATE`
- **Cámara**: `CAMERA` (para escaneo de códigos de barras)
- **Almacenamiento**: 
  - `READ_MEDIA_IMAGES` (Android 13+)
  - `READ_MEDIA_VIDEO` (Android 13+)
  - `READ_EXTERNAL_STORAGE` (Android 12 y anteriores)
  - `WRITE_EXTERNAL_STORAGE` (Android 10 y anteriores)
  - `READ_MEDIA_VISUAL_USER_SELECTED` (para selección de imágenes)

### Configuración de Red Segura

El archivo `network_security_config.xml` está configurado para:
- Permitir conexiones HTTPS
- Confiar en certificados del sistema y del usuario
- Incluir dominio de Vercel (`*.vercel.app`)

### Construir APK

1. Abre el proyecto en Android Studio
2. Ve a `Build > Build Bundle(s) / APK(s) > Build APK(s)`
3. El APK se generará en `android/app/build/outputs/apk/`

## 🚀 Despliegue

### Vercel (Recomendado)

1. **Conectar Repositorio**:
   - Ve a [Vercel](https://vercel.com)
   - Importa tu repositorio de GitHub/GitLab/Bitbucket

2. **Configurar Variables de Entorno**:
   - En el dashboard de Vercel, ve a Settings > Environment Variables
   - Agrega todas las variables de `.env.local`:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `JWT_EXPIRE`
     - `NODE_ENV=production`

3. **Desplegar**:
   - Vercel detectará automáticamente Next.js
   - Cada push a la rama principal desplegará automáticamente

4. **Actualizar Capacitor**:
   - Después del despliegue, actualiza `capacitor.config.ts` con la URL de Vercel
   - Ejecuta `npm run cap:sync` y reconstruye el APK

### Otras Plataformas

#### Netlify
- Similar a Vercel, con soporte para Next.js
- Configura variables de entorno en el dashboard

#### Servidor Propio
1. Construye la aplicación:
```bash
npm run build
```

2. Inicia el servidor:
```bash
npm run start
```

3. Usa un proceso manager como PM2:
```bash
npm install -g pm2
pm2 start npm --name "multiciber" -- start
```

### Variables de Entorno en Producción

Asegúrate de configurar:
- `MONGODB_URI` - URI de MongoDB (Atlas recomendado)
- `JWT_SECRET` - Clave secreta fuerte (mínimo 32 caracteres)
- `JWT_EXPIRE` - Tiempo de expiración (ej: `7d`)
- `NODE_ENV=production`

## 🔐 Seguridad

### Implementaciones de Seguridad

1. **Autenticación**:
   - JWT tokens almacenados en cookies httpOnly
   - Contraseñas encriptadas con bcrypt (12 rounds)
   - Verificación de tokens en cada request protegido
   - Expiración configurable de sesiones

2. **Validación**:
   - Validación de datos con Zod en frontend y backend
   - Sanitización de inputs
   - Validación de tipos y rangos

3. **Autorización**:
   - Middleware de autenticación en todas las rutas protegidas
   - Verificación de propiedad de recursos (cada usuario solo accede a sus datos)
   - Roles de usuario (admin, employee)

4. **Base de Datos**:
   - Índices para mejorar rendimiento y seguridad
   - Validación a nivel de esquema con Mongoose
   - Prevención de inyección NoSQL

5. **Red**:
   - HTTPS obligatorio en producción
   - Configuración de CORS
   - Network Security Config en Android

6. **Logging**:
   - Sistema de logging estructurado
   - Registro de errores y actividades importantes
   - No se registran contraseñas ni datos sensibles

### Mejores Prácticas

- ✅ Nunca commitees archivos `.env` o `.env.local`
- ✅ Usa contraseñas fuertes para JWT_SECRET
- ✅ Mantén las dependencias actualizadas
- ✅ Usa HTTPS en producción
- ✅ Configura MongoDB con autenticación
- ✅ Limita el acceso a la base de datos por IP (MongoDB Atlas)

## 🐛 Solución de Problemas

### Error de Conexión a MongoDB

```bash
# Verifica que MongoDB esté corriendo
# Local:
mongod

# Verifica la URI en .env.local
MONGODB_URI=mongodb://localhost:27017/multiciber
```

### Error de Autenticación

- Verifica que `JWT_SECRET` esté configurado
- Limpia las cookies del navegador
- Verifica que el usuario exista en la base de datos

### Problemas con Android

1. **Error de sincronización**:
```bash
npm run build
npm run cap:sync
```

2. **Iconos no aparecen**:
```bash
npm run generate-android-icons
npm run cap:sync
```

3. **Error de red en Android**:
- Verifica `network_security_config.xml`
- Verifica que la URL en `capacitor.config.ts` sea correcta
- Verifica permisos de internet en `AndroidManifest.xml`

## 📚 Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Mongoose Documentation](https://mongoosejs.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue las convenciones de código existentes
- Agrega tests si es posible
- Actualiza la documentación según sea necesario
- Asegúrate de que el código pase el linter

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

## 📞 Soporte

Para soporte, abre un issue en el repositorio o contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para negocios tipo cibercafé y tiendas de tecnología**
