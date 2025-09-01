# 🎨 Sistema de Gestión de Personal - Frontend

Un frontend moderno y completo para el sistema de gestión de personal, construido con React, TypeScript y Tailwind CSS.

## 🚀 Características

### ✅ Funcionalidades Implementadas
- **🔐 Autenticación completa** (login, registro, logout)
- **📊 Dashboard interactivo** con estadísticas en tiempo real
- **🎨 Diseño responsive** (móvil, tablet, desktop)
- **⚡ Interfaz moderna** con animaciones suaves
- **🛡️ Protección de rutas** con autenticación
- **📱 Navegación móvil** con sidebar colapsable
- **🎯 UX intuitiva** con feedback visual

### 🛠️ Tecnologías Utilizadas
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **React Router** - Navegación
- **React Query** - Manejo de estado del servidor
- **Zustand** - Estado global
- **React Hook Form** - Formularios
- **Zod** - Validación de esquemas
- **Lucide React** - Iconos
- **Axios** - Cliente HTTP

## 📦 Instalación

### Prerrequisitos
- Node.js 16+ 
- npm o yarn
- Backend del sistema funcionando en `http://localhost:3000`

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd sistema-gestion-personal-frontend
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env en la raíz del proyecto
REACT_APP_API_URL=http://localhost:3000/api
```

4. **Iniciar el servidor de desarrollo**
```bash
npm start
# o
yarn start
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── common/         # Componentes básicos (Button, Input, Modal, etc.)
│   └── layout/         # Componentes de layout (Sidebar, Header, Layout)
├── hooks/              # Hooks personalizados
│   ├── useAuth.ts      # Hook de autenticación
│   ├── usePersonal.ts  # Hook para gestión de personal
│   ├── useEmpresas.ts  # Hook para gestión de empresas
│   ├── useServicios.ts # Hook para gestión de servicios
│   └── useDashboard.ts # Hook para estadísticas del dashboard
├── pages/              # Páginas de la aplicación
│   ├── auth/           # Páginas de autenticación
│   └── DashboardPage.tsx
├── services/           # Servicios de API
│   └── api.ts          # Cliente HTTP y métodos de API
├── store/              # Estado global
│   └── authStore.ts    # Store de autenticación con Zustand
├── types/              # Definiciones de tipos TypeScript
│   └── index.ts        # Interfaces principales
├── App.tsx             # Componente principal
└── index.tsx           # Punto de entrada
```

## 🔧 Configuración

### Variables de Entorno
```env
REACT_APP_API_URL=http://localhost:3000/api
```

### Configuración de Tailwind
El proyecto incluye una configuración personalizada de Tailwind CSS con:
- Paleta de colores corporativa (azul/verde)
- Componentes predefinidos
- Animaciones personalizadas
- Responsive design

## 📱 Uso de la Aplicación

### 🔐 Autenticación
1. **Registro**: Crear una nueva cuenta en `/register`
2. **Login**: Iniciar sesión en `/login`
3. **Logout**: Cerrar sesión desde el sidebar

### 📊 Dashboard
- **Estadísticas en tiempo real** del sistema
- **Accesos rápidos** a funcionalidades principales
- **Estado del sistema** y actividad reciente

### 🎨 Navegación
- **Sidebar responsive** con navegación principal
- **Header** con información del usuario
- **Breadcrumbs** para navegación contextual

## 🔌 Integración con el Backend

### Endpoints Utilizados
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `GET /api/personal` - Listar personal
- `GET /api/empresas` - Listar empresas
- `GET /api/servicios` - Listar servicios

### Autenticación
- **JWT Bearer Token** en headers
- **Interceptores automáticos** para agregar token
- **Renovación automática** de tokens
- **Redirección** en caso de token expirado

## 🎨 Diseño y UX

### Paleta de Colores
```css
--primary: #2563eb     /* Azul principal */
--secondary: #059669   /* Verde secundario */
--accent: #f59e0b      /* Naranja acento */
--success: #10b981     /* Verde éxito */
--error: #ef4444       /* Rojo error */
```

### Componentes UI
- **Botones** con variantes (primary, secondary, outline, danger)
- **Inputs** con validación y estados de error
- **Modales** con backdrop y teclas de escape
- **Loading spinners** con animaciones
- **Cards** con hover effects

### Responsive Design
- **Mobile-first** approach
- **Breakpoints**: 320px, 768px, 1024px, 1440px
- **Sidebar colapsable** en móviles
- **Touch-friendly** en dispositivos táctiles

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm start          # Iniciar servidor de desarrollo
npm run build      # Construir para producción
npm test           # Ejecutar tests
npm run eject      # Eject de Create React App
```

## 📋 Próximas Funcionalidades

### 🔄 En Desarrollo
- [ ] **Gestión completa de Personal** (CRUD)
- [ ] **Gestión completa de Empresas** (CRUD)
- [ ] **Gestión completa de Servicios** (CRUD)
- [ ] **Búsqueda y filtros avanzados**
- [ ] **Paginación** en todas las listas
- [ ] **Formularios** con validación completa
- [ ] **Gráficos** y estadísticas avanzadas

### 🎯 Roadmap
- [ ] **Notificaciones** en tiempo real
- [ ] **Exportación** de datos (PDF, Excel)
- [ ] **Importación** masiva de datos
- [ ] **Reportes** personalizados
- [ ] **Dashboard** personalizable
- [ ] **Temas** claro/oscuro
- [ ] **Multiidioma** (ES/EN)

## 🐛 Solución de Problemas

### Error de Conexión al Backend
```bash
# Verificar que el backend esté corriendo
curl http://localhost:3000/api/health

# Verificar configuración de CORS en el backend
```

### Error de Dependencias
```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de TypeScript
```bash
# Verificar tipos
npm run type-check

# Reinstalar tipos
npm install @types/react @types/react-dom
```

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crear** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: soporte@empresa.com
- **Documentación**: [docs.empresa.com](https://docs.empresa.com)
- **Issues**: [GitHub Issues](https://github.com/empresa/sistema-gestion-personal/issues)

---

**¡Gracias por usar nuestro Sistema de Gestión de Personal! 🎉**
