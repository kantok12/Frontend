# 🎨 PROMPT PARA DESARROLLO DEL FRONTEND - Sistema de Gestión de Personal

## 📋 CONTEXTO DEL PROYECTO

Necesitas desarrollar un **frontend completo** para un sistema de gestión de personal que ya tiene un backend funcional. El backend está construido con **Node.js/Express** y utiliza **Supabase** como base de datos.

## 🏗️ ARQUITECTURA DEL BACKEND (YA IMPLEMENTADO)

### Tecnologías del Backend:
- **Node.js/Express** - Servidor API REST
- **Supabase** - Base de datos PostgreSQL + autenticación
- **JWT** - Autenticación y autorización
- **Bcryptjs** - Encriptación de contraseñas
- **Express-validator** - Validación de datos
- **Helmet** - Seguridad
- **CORS** - Cross-origin resource sharing

### Base URL del Backend:
```
http://localhost:3000
```

## 📚 DOCUMENTACIÓN COMPLETA DE LA API

### 🔐 Autenticación
La API utiliza **JWT Bearer Token** para autenticación. Para rutas protegidas, incluir en headers:
```
Authorization: Bearer <token-jwt>
```

### 📋 Endpoints Disponibles:

#### 🔑 Autenticación (`/api/auth`)
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Renovar token

#### 👥 Personal (`/api/personal`)
- `GET /api/personal` - Lista con paginación y filtros
- `GET /api/personal/:id` - Obtener por ID
- `POST /api/personal` - Crear nuevo
- `PUT /api/personal/:id` - Actualizar
- `DELETE /api/personal/:id` - Eliminar
- `GET /api/personal/:id/disponibilidad` - Obtener disponibilidad
- `PUT /api/personal/:id/disponibilidad` - Actualizar disponibilidad

#### 🏢 Empresas (`/api/empresas`)
- `GET /api/empresas` - Lista con paginación y filtros
- `GET /api/empresas/:id` - Obtener por ID
- `POST /api/empresas` - Crear nueva
- `PUT /api/empresas/:id` - Actualizar
- `DELETE /api/empresas/:id` - Eliminar
- `GET /api/empresas/:id/personal` - Personal de la empresa

#### 🛠️ Servicios (`/api/servicios`)
- `GET /api/servicios` - Lista con paginación y filtros
- `GET /api/servicios/:id` - Obtener por ID
- `POST /api/servicios` - Crear nuevo
- `PUT /api/servicios/:id` - Actualizar
- `DELETE /api/servicios/:id` - Eliminar
- `GET /api/servicios/:id/personal` - Personal del servicio
- `GET /api/servicios/stats/estadisticas` - Estadísticas

#### 🏥 Utilidades
- `GET /api/health` - Health check
- `GET /` - Información de la API

## 🎯 REQUERIMIENTOS DEL FRONTEND

### 🛠️ Tecnologías Recomendadas:
- **React.js** o **Vue.js** (preferiblemente React)
- **TypeScript** (opcional pero recomendado)
- **Tailwind CSS** o **Material-UI** para estilos
- **Axios** o **Fetch API** para llamadas HTTP
- **React Router** para navegación
- **React Query** o **SWR** para manejo de estado del servidor
- **Zustand** o **Redux Toolkit** para estado global

### 📱 Funcionalidades Requeridas:

#### 1. 🔐 Sistema de Autenticación
- **Página de Login** con email y contraseña
- **Página de Registro** con validaciones
- **Protección de rutas** (solo usuarios autenticados)
- **Manejo de tokens JWT** (almacenamiento, renovación automática)
- **Logout** con limpieza de datos
- **Persistencia de sesión** (localStorage/sessionStorage)

#### 2. 👥 Gestión de Personal
- **Lista de personal** con paginación
- **Búsqueda y filtros** (por nombre, cargo, empresa, servicio)
- **Vista detallada** de cada personal
- **Formulario de creación** con validaciones
- **Formulario de edición** con datos precargados
- **Eliminación** con confirmación
- **Gestión de disponibilidad** (horarios, días)

#### 3. 🏢 Gestión de Empresas
- **Lista de empresas** con paginación
- **Búsqueda y filtros** (por nombre, RUT)
- **Vista detallada** de cada empresa
- **Formulario de creación** con validaciones
- **Formulario de edición** con datos precargados
- **Eliminación** con confirmación
- **Vista del personal asociado** a cada empresa

#### 4. 🛠️ Gestión de Servicios
- **Lista de servicios** con paginación
- **Búsqueda y filtros** (por nombre, descripción)
- **Vista detallada** de cada servicio
- **Formulario de creación** con validaciones
- **Formulario de edición** con datos precargados
- **Eliminación** con confirmación
- **Vista del personal asociado** a cada servicio
- **Dashboard con estadísticas** (precios, servicios populares)

#### 5. 📊 Dashboard Principal
- **Resumen general** del sistema
- **Estadísticas** (total personal, empresas, servicios)
- **Gráficos** (distribución por empresa, servicios más populares)
- **Accesos rápidos** a funcionalidades principales

### 🎨 Diseño y UX:

#### Estilo Visual:
- **Diseño moderno y profesional**
- **Paleta de colores** azul/verde corporativa
- **Responsive design** (móvil, tablet, desktop)
- **Iconos intuitivos** (FontAwesome, Heroicons, etc.)
- **Animaciones suaves** para transiciones

#### Componentes UI:
- **Navbar** con navegación y perfil de usuario
- **Sidebar** con menú de opciones
- **Tablas** con paginación y filtros
- **Formularios** con validación en tiempo real
- **Modales** para confirmaciones
- **Cards** para mostrar información
- **Loading states** y **error handling**
- **Toast notifications** para feedback

#### Navegación:
- **Rutas protegidas** por autenticación
- **Breadcrumbs** para navegación
- **Menú hamburguesa** para móviles
- **Búsqueda global** (opcional)

### 📋 Estructura de Datos:

#### Personal:
```typescript
interface Personal {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  fecha_nacimiento: string;
  cargo: string;
  empresa_id: string;
  servicio_id: string;
  activo: boolean;
  ubicacion?: Ubicacion;
  contacto?: Contacto;
  contacto_emergencia?: ContactoEmergencia;
  formacion?: Formacion;
  licencias?: Licencia[];
  condicion_salud?: CondicionSalud;
  disponibilidad?: Disponibilidad;
}
```

#### Empresa:
```typescript
interface Empresa {
  id: string;
  nombre: string;
  rut_empresa: string;
  direccion: string;
  email?: string;
  telefono?: string;
}
```

#### Servicio:
```typescript
interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_horas?: number;
  activo: boolean;
}
```

### 🔧 Funcionalidades Técnicas:

#### Manejo de Estado:
- **Estado global** para autenticación
- **Estado local** para formularios
- **Cache de datos** para optimización
- **Sincronización** con el servidor

#### Validaciones:
- **Validación en frontend** antes de enviar
- **Validación en tiempo real** en formularios
- **Manejo de errores** del servidor
- **Feedback visual** para el usuario

#### Optimización:
- **Lazy loading** de componentes
- **Debounce** en búsquedas
- **Paginación** eficiente
- **Cache** de respuestas API

### 📱 Responsive Design:
- **Mobile-first** approach
- **Breakpoints**: 320px, 768px, 1024px, 1440px
- **Touch-friendly** en móviles
- **Accesibilidad** (ARIA labels, keyboard navigation)

## 🚀 ENTREGABLES ESPERADOS:

### 1. 📁 Estructura del Proyecto:
```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── personal/
│   │   ├── empresas/
│   │   ├── servicios/
│   │   ├── common/
│   │   └── layout/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── types/
│   ├── styles/
│   └── App.tsx
├── package.json
├── tsconfig.json
└── README.md
```

### 2. 📦 Dependencias Principales:
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "@tanstack/react-query": "^4.x",
    "zustand": "^4.x",
    "tailwindcss": "^3.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x"
  }
}
```

### 3. 🎯 Funcionalidades Clave:
- ✅ **Autenticación completa** (login, registro, logout)
- ✅ **CRUD completo** para Personal, Empresas y Servicios
- ✅ **Búsqueda y filtros** avanzados
- ✅ **Paginación** en todas las listas
- ✅ **Formularios** con validación
- ✅ **Dashboard** con estadísticas
- ✅ **Responsive design**
- ✅ **Manejo de errores**
- ✅ **Loading states**

### 4. 📚 Documentación:
- **README.md** con instrucciones de instalación
- **Comentarios** en código importante
- **Guía de uso** de componentes
- **Ejemplos** de integración con la API

## 🔗 INTEGRACIÓN CON EL BACKEND:

### Configuración de la API:
```typescript
// services/api.ts
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Ejemplo de Hook para Personal:
```typescript
// hooks/usePersonal.ts
export const usePersonal = (page = 1, limit = 10, search = '', filtro = '') => {
  return useQuery({
    queryKey: ['personal', page, limit, search, filtro],
    queryFn: () => api.get(`/personal?page=${page}&limit=${limit}&search=${search}&filtro=${filtro}`),
  });
};
```

## 🎨 INSPIRACIÓN DE DISEÑO:

### Referencias Visuales:
- **Material Design** de Google
- **Ant Design** de Alibaba
- **Chakra UI** para componentes
- **Dribbble** para inspiración de dashboards

### Paleta de Colores Sugerida:
```css
:root {
  --primary: #2563eb;     /* Azul principal */
  --primary-dark: #1d4ed8;
  --secondary: #059669;   /* Verde secundario */
  --accent: #f59e0b;      /* Naranja acento */
  --success: #10b981;     /* Verde éxito */
  --warning: #f59e0b;     /* Amarillo advertencia */
  --error: #ef4444;       /* Rojo error */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-900: #111827;
}
```

## 📝 NOTAS IMPORTANTES:

1. **Priorizar la funcionalidad** sobre el diseño inicial
2. **Implementar manejo de errores** robusto
3. **Usar TypeScript** para mejor mantenibilidad
4. **Seguir principios de UX** (feedback inmediato, estados claros)
5. **Optimizar para rendimiento** (lazy loading, memoización)
6. **Documentar el código** adecuadamente
7. **Probar en diferentes dispositivos** y navegadores

## 🎯 CRITERIOS DE ÉXITO:

- ✅ **Funcionalidad completa** de todas las operaciones CRUD
- ✅ **Autenticación** funcionando correctamente
- ✅ **Responsive design** en todos los dispositivos
- ✅ **UX intuitiva** y fácil de usar
- ✅ **Código limpio** y bien estructurado
- ✅ **Manejo de errores** apropiado
- ✅ **Performance** optimizada

---

**¡IMPORTANTE!** Este frontend debe integrarse perfectamente con el backend ya existente. Todas las llamadas a la API deben seguir exactamente la documentación proporcionada en `API_ENDPOINTS.md`.

**¿Listo para crear un frontend increíble? ¡Adelante! 🚀**
