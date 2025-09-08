# 📋 Guía de Instalación - Sistema de Gestión de Personal

Esta guía te ayudará a instalar y configurar el proyecto en cualquier entorno, evitando los problemas comunes de dependencias.

## 🚀 Instalación Rápida

### Windows
```bash
# Ejecutar el instalador automático
install.bat
```

### Linux/Mac
```bash
# Hacer ejecutable y ejecutar
chmod +x install.sh
./install.sh
```

## 📋 Requisitos del Sistema

### Versiones Requeridas
- **Node.js**: >= 18.0.0 (recomendado: 18.19.0)
- **npm**: >= 8.0.0
- **Git**: Última versión

### Verificar Versiones
```bash
node --version
npm --version
git --version
```

## 🔧 Instalación Manual

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/sistema-gestion-personal-frontend.git
cd sistema-gestion-personal-frontend
```

### 2. Instalar Dependencias
```bash
# Opción 1: Instalación estándar
npm install

# Opción 2: Si hay conflictos de dependencias
npm install --legacy-peer-deps

# Opción 3: Forzar instalación (último recurso)
npm install --force
```

### 3. Iniciar el Proyecto
```bash
# Desarrollo local
npm start

# Desarrollo en red (para acceso desde otros dispositivos)
npm run start-network
```

## 🛠️ Solución de Problemas

### Error: PowerShell Script Execution
**Problema**: `PSSecurityException` al ejecutar `npm`

**Solución**:
```powershell
# Ejecutar PowerShell como administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: ERESOLVE Dependency Conflicts
**Problema**: Conflictos de versiones de TypeScript

**Solución**:
```bash
# Limpiar caché e instalar
npm cache clean --force
npm install --legacy-peer-deps
```

### Error: Node.js No Encontrado
**Problema**: Node.js no está instalado o no está en PATH

**Solución**:
1. Descargar Node.js desde [nodejs.org](https://nodejs.org/)
2. Instalar versión LTS (18.x o superior)
3. Reiniciar terminal/IDE

### Error: Permisos en Linux/Mac
**Problema**: Permisos insuficientes para instalar paquetes

**Solución**:
```bash
# Configurar npm para usar directorio local
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## 🔄 Comandos Útiles

### Limpieza Completa
```bash
# Windows
npm run clean

# Linux/Mac
rm -rf node_modules package-lock.json
npm install
```

### Verificar Instalación
```bash
# Verificar dependencias instaladas
npm list --depth=0

# Verificar tipos de TypeScript
npm run type-check

# Ejecutar tests
npm test
```

### Desarrollo
```bash
# Iniciar en modo desarrollo
npm start

# Iniciar en red (acceso desde otros dispositivos)
npm run start-network

# Construir para producción
npm run build

# Analizar bundle
npm run build:analyze
```

## 🌐 Configuración de Red

### Acceso desde Otros Dispositivos
```bash
# Iniciar servidor en red
npm run start-network

# El servidor estará disponible en:
# http://[TU_IP]:3001
```

### Encontrar tu IP
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

## 📁 Estructura del Proyecto

```
sistema-gestion-personal-frontend/
├── .nvmrc                 # Versión de Node.js
├── .npmrc                 # Configuración de npm
├── install.bat            # Instalador Windows
├── install.sh             # Instalador Unix/Linux/Mac
├── package.json           # Dependencias y scripts
├── package-lock.json      # Versiones exactas
├── tsconfig.json          # Configuración TypeScript
├── tailwind.config.js     # Configuración Tailwind
├── src/                   # Código fuente
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas de la aplicación
│   ├── hooks/            # Custom hooks
│   ├── services/         # Servicios API
│   └── types/            # Tipos TypeScript
└── public/               # Archivos estáticos
```

## 🔧 Configuración Avanzada

### Variables de Entorno
Crear archivo `.env.local`:
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
```

### Configuración de Proxy
El proyecto está configurado para hacer proxy a `http://localhost:3000` (backend).

### Configuración de TypeScript
- Target: ES5
- Strict mode: Habilitado
- JSX: React JSX
- Base URL: `src`

## 🚨 Problemas Conocidos y Soluciones

### 1. Conflictos de Versiones de TypeScript
**Causa**: Diferentes paquetes requieren versiones incompatibles de TypeScript.

**Solución**: El proyecto usa `overrides` y `resolutions` para forzar TypeScript 5.3.3.

### 2. Problemas de CORS
**Causa**: El backend no está configurado para aceptar requests del frontend.

**Solución**: Verificar configuración CORS en el backend.

### 3. Puerto en Uso
**Causa**: El puerto 3001 ya está siendo usado por otra aplicación.

**Solución**:
```bash
# Cambiar puerto
set PORT=3002 && npm start
```

## 📞 Soporte

Si encuentras problemas no cubiertos en esta guía:

1. Revisa los logs de error en la consola
2. Verifica que todas las dependencias estén instaladas
3. Consulta los issues en GitHub
4. Contacta al equipo de desarrollo

## 📝 Notas Adicionales

- El proyecto usa **React 18** con **TypeScript 5.3.3**
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Zustand** para manejo de estado
- **React Query** para gestión de datos del servidor

---

**Última actualización**: $(date)
**Versión del proyecto**: 1.2.0
