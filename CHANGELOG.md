# 📋 Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-01-15

### ✨ Added
- **Integración Personal Disponible**: Formulario "Nuevo Personal" ahora utiliza el endpoint `/api/personal-disponible`
- **Búsqueda Inteligente**: Implementado debounce de 300ms en búsquedas para mejor performance
- **Extracción de Nombres Mejorada**: Algoritmo inteligente para extraer nombres y apellidos del backend
- **Configuración VS Code**: Extensiones recomendadas y configuraciones para mejor DX
- **Documentación Completa**: README.md profesional con guías de instalación y contribución
- **Scripts NPM Mejorados**: Scripts adicionales para linting, formatting y testing
- **Variables de Entorno**: Configuración ejemplo con `.env.example`

### 🔧 Changed
- **Hook usePersonal**: Migrado de `createPersonal` a `createPersonalDisponible`
- **Configuración Query**: Reducido `staleTime` a 30 segundos para búsquedas más responsive
- **PersonalForm**: Mapeo automático de datos a formato `CreatePersonalDisponibleData`
- **Validación de Tipos**: Mejorado tipado con interfaces más específicas

### 🐛 Fixed
- **Tipos TypeScript**: Eliminación de imports no utilizados
- **Búsqueda en Tiempo Real**: Corrección de re-renders innecesarios
- **Endpoints API**: Uso correcto del endpoint personal-disponible
- **Adaptación de Datos**: Manejo robusto de nombres y apellidos desde el backend

### 📚 Documentation
- README.md completo con arquitectura, instalación y uso
- CONTRIBUTING.md con guías de contribución
- CHANGELOG.md para seguimiento de versiones
- Configuraciones de VS Code para mejor DX

## [1.1.0] - 2024-01-10

### ✨ Added
- **Selector de Estados Dinámico**: Reemplazado checkbox por selector completo
- **Gestión de Cursos**: Modal para agregar/editar cursos del personal
- **Estados API**: Integración con endpoint de estados disponibles
- **Validaciones Mejoradas**: Formularios con validación en tiempo real

### 🔧 Changed
- **PersonalDetailModal**: Modo vista/edición mejorado
- **Estados**: Sistema dinámico en lugar de valores fijos
- **UI/UX**: Mejoras en diseño responsive

### 🐛 Fixed
- **Performance**: Optimización de queries y re-renders
- **Navegación**: Corrección de rutas protegidas
- **Formularios**: Validaciones más robustas

## [1.0.0] - 2024-01-05

### ✨ Added
- **Arquitectura Base**: React 18 + TypeScript + Tailwind CSS
- **Sistema de Autenticación**: Login/register con gestión de sesiones
- **Gestión de Personal**: CRUD completo para empleados
- **Dashboard**: Vista general con estadísticas
- **Rutas Protegidas**: Sistema de navegación seguro
- **Estado Global**: Zustand para manejo de estado
- **Data Fetching**: React Query para server state
- **Formularios**: React Hook Form con validaciones Zod

### 🛠️ Technical Stack
- React 18.2.0
- TypeScript 4.9.5
- Tailwind CSS 3.3.0
- React Router 6
- React Query 4.36.1
- Zustand 4.4.7
- React Hook Form 7.48.2
- Zod 3.22.4

### 📱 Features
- **Responsive Design**: Optimizado para móviles y desktop
- **Dark Mode Ready**: Preparado para tema oscuro
- **Accessibility**: Básicos de accesibilidad implementados
- **Performance**: Lazy loading y optimizaciones

---

## Tipos de Cambios

- **✨ Added** - Nueva funcionalidad
- **🔧 Changed** - Cambios en funcionalidad existente
- **🗑️ Deprecated** - Funcionalidad que será removida
- **🚫 Removed** - Funcionalidad removida
- **🐛 Fixed** - Corrección de bugs
- **🔒 Security** - Mejoras de seguridad
- **📚 Documentation** - Solo cambios en documentación
- **🎨 Style** - Cambios de formato, espacios en blanco, etc.
- **♻️ Refactor** - Refactorización de código
- **⚡ Performance** - Mejoras de rendimiento
- **🧪 Test** - Adición o corrección de tests

## Versionado

Este proyecto sigue [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Nueva funcionalidad compatible con versiones anteriores
- **PATCH** (0.0.X): Correcciones de bugs compatibles

## Links

- [Unreleased]: Comparar con última versión
- [1.2.0]: Comparar con 1.1.0
- [1.1.0]: Comparar con 1.0.0
- [1.0.0]: Primera versión estable
