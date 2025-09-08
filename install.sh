#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e " INSTALADOR DEL SISTEMA DE GESTION PERSONAL"
echo -e "========================================${NC}"
echo

# Función para mostrar errores
show_error() {
    echo -e "${RED}ERROR: $1${NC}"
    exit 1
}

# Función para mostrar advertencias
show_warning() {
    echo -e "${YELLOW}ADVERTENCIA: $1${NC}"
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}$1${NC}"
}

# Verificar si Node.js está instalado
echo -e "${BLUE}[1/6] Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    show_error "Node.js no está instalado. Por favor instala Node.js desde: https://nodejs.org/"
fi

NODE_VERSION=$(node --version)
echo "Node.js detectado: $NODE_VERSION"

# Verificar versión mínima de Node.js
REQUIRED_VERSION="18.0.0"
if ! node -e "process.exit(process.version.slice(1).split('.').map((n,i)=>parseInt(n)*(1000**(2-i))).reduce((a,b)=>a+b) >= $(echo $REQUIRED_VERSION | cut -d. -f1)*1000000 + $(echo $REQUIRED_VERSION | cut -d. -f2)*1000 + $(echo $REQUIRED_VERSION | cut -d. -f3))" 2>/dev/null; then
    show_warning "Se recomienda Node.js versión $REQUIRED_VERSION o superior. Versión actual: $NODE_VERSION"
fi

# Verificar si npm está disponible
echo -e "${BLUE}[2/6] Verificando npm...${NC}"
if ! command -v npm &> /dev/null; then
    show_error "npm no está disponible. Por favor reinstala Node.js."
fi

NPM_VERSION=$(npm --version)
echo "npm detectado: $NPM_VERSION"

# Limpiar instalación anterior si existe
echo -e "${BLUE}[3/6] Limpiando instalación anterior...${NC}"
if [ -d "node_modules" ]; then
    echo "Eliminando node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "Eliminando package-lock.json..."
    rm -f package-lock.json
fi

# Configurar npm
echo -e "${BLUE}[4/6] Configurando npm...${NC}"
npm config set registry https://registry.npmjs.org/
npm config set save-exact true
npm config set package-lock true

# Limpiar caché de npm si hay problemas
if [ "$1" = "--clean-cache" ]; then
    echo "Limpiando caché de npm..."
    npm cache clean --force
fi

# Instalar dependencias
echo -e "${BLUE}[5/6] Instalando dependencias...${NC}"
echo "Esto puede tomar varios minutos..."

# Intentar instalación normal primero
if ! npm install --legacy-peer-deps; then
    show_warning "Instalación con --legacy-peer-deps falló. Intentando con --force..."
    
    if ! npm install --force; then
        show_warning "Instalación con --force falló. Intentando limpiar caché y reinstalar..."
        
        npm cache clean --force
        if ! npm install --legacy-peer-deps; then
            echo -e "${RED}ERROR CRÍTICO: No se pudieron instalar las dependencias.${NC}"
            echo "Posibles soluciones:"
            echo "1. Verificar conexión a internet"
            echo "2. Ejecutar: npm cache clean --force"
            echo "3. Usar una versión diferente de Node.js"
            echo "4. Ejecutar: ./install.sh --clean-cache"
            exit 1
        fi
    fi
fi

# Verificar instalación
echo -e "${BLUE}[6/6] Verificando instalación...${NC}"
if npm list --depth=0 &> /dev/null; then
    show_success "¡Instalación completada exitosamente!"
else
    show_warning "Algunas dependencias pueden tener problemas. El proyecto debería funcionar, pero revisa los warnings."
fi

echo
echo -e "${BLUE}========================================"
echo -e " INSTALACION COMPLETADA"
echo -e "========================================${NC}"
echo
echo "Para iniciar el proyecto:"
echo -e "  ${GREEN}npm start${NC}"
echo
echo "Para desarrollo en red:"
echo -e "  ${GREEN}npm run start-network${NC}"
echo
echo "Para más información, consulta README_INSTALACION.md"
echo