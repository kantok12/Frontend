# 🏢 Sistema de Gestión de Personal — Frontend

Frontend React + TypeScript para la aplicación de gestión de personal.

**Resumen rápido**
- Stack: React 18 + TypeScript + Tailwind CSS
- Gestor de datos: React Query (@tanstack/react-query)
- State local ligero: Zustand
- Peticiones HTTP: Axios (centralizado en `src/services/api.ts`)

## 🚀 Instalación Rápida

### Windows
```bash
# Ejecutar instalador automático
install.bat
```

### Linux/Mac
```bash
# Hacer ejecutable y ejecutar
chmod +x install.sh
./install.sh
```

### Instalación Manual
```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/sistema-gestion-personal-frontend.git
cd sistema-gestion-personal-frontend

# 2. Instalar dependencias
npm install

# 3. Verificar entorno
npm run check-env

# 4. Iniciar desarrollo
npm start
```

## ✨ Características

- **⚛️ React 18** con TypeScript para desarrollo type-safe
- **🎨 Tailwind CSS** para estilos modernos y responsivos
- **🛣️ React Router** para navegación SPA
- **🐻 Zustand** para manejo de estado ligero
- **🔄 React Query** para gestión de datos del servidor
- **📝 React Hook Form** con validación Zod
- **🌐 Axios** para peticiones HTTP
- **🔧 ESLint + Prettier** para código consistente
- **🧪 Jest** para testing
- **📱 Responsive Design** para todos los dispositivos

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia servidor de desarrollo (puerto 3001) |
| `npm run start-network` | Inicia servidor accesible desde red |
| `npm run build` | Construye aplicación para producción |
| `npm test` | Ejecuta tests |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Corrige errores de ESLint automáticamente |
| `npm run format` | Formatea código con Prettier |
| `npm run type-check` | Verifica tipos de TypeScript |
| `npm run check-env` | Verifica configuración del entorno |
| `npm run verify` | Verifica entorno, tipos y linting |
| `npm run clean` | Limpia instalación y reinstala dependencias |

## 📁 Estructura del Proyecto

```
sistema-gestion-personal-frontend/
├── 📁 .vscode/              # Configuración VS Code
├── 📁 public/               # Archivos estáticos
├── 📁 src/                  # Código fuente
│   ├── 📁 components/       # Componentes reutilizables
│   │   ├── 📁 common/       # Componentes comunes
│   │   ├── 📁 dashboard/    # Componentes del dashboard
│   │   ├── 📁 layout/       # Componentes de layout
│   │   └── 📁 personal/     # Componentes específicos
│   ├── 📁 config/           # Configuraciones
│   ├── 📁 hooks/            # Custom hooks
│   ├── 📁 pages/            # Páginas de la aplicación
│   ├── 📁 services/         # Servicios API
│   ├── 📁 store/            # Estado global (Zustand)
│   ├── 📁 types/            # Tipos TypeScript
│   └── 📁 utils/            # Utilidades
├── 📄 .nvmrc                # Versión de Node.js
├── 📄 .npmrc                # Configuración de npm
├── 📄 install.bat           # Instalador Windows
├── 📄 install.sh            # Instalador Unix/Linux/Mac
├── 📄 check-environment.js  # Verificador de entorno
└── 📄 INSTALACION.md        # Guía detallada de instalación
```

## 🔧 Configuración del Entorno

### Requisitos Mínimos
- **Node.js**: >= 18.0.0 (recomendado: 18.19.0)
- **npm**: >= 8.0.0
- **Git**: Última versión

### Verificar Instalación
```bash
# Verificar versión de Node.js
node --version

# Verificar versión de npm
npm --version

# Verificar entorno completo
npm run check-env
```

## 🌐 Desarrollo

### Iniciar en Modo Desarrollo
```bash
npm start
```
La aplicación estará disponible en `http://localhost:3001`

### Desarrollo en Red
```bash
npm run start-network
```
La aplicación estará disponible en `http://[TU_IP]:3001`

### Construir para Producción
```bash
npm run build
```
Los archivos de producción se generarán en la carpeta `build/`

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests en modo CI
npm run test:ci
```

## 📝 Linting y Formateo

```bash
# Verificar código con ESLint
npm run lint

# Corregir errores automáticamente
npm run lint:fix

# Formatear código con Prettier
npm run format

# Verificar formato sin cambiar archivos
npm run format:check
```

## 🚨 Solución de Problemas

### Problemas Comunes

1. **Error de PowerShell**: Ejecutar como administrador:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Conflictos de dependencias**: Limpiar e instalar:
   ```bash
   npm run clean
   ```

3. **Puerto en uso**: Cambiar puerto:
   ```bash
   set PORT=3002 && npm start
   ```

Para más información, consulta [INSTALACION.md](INSTALACION.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Lee [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- 📧 Email: soporte@empresa.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/sistema-gestion-personal-frontend/issues)
- 📖 Documentación: [INSTALACION.md](INSTALACION.md)

---

**Desarrollado con ❤️ por el equipo de desarrollo**