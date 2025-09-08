@echo off
echo ========================================
echo  INSTALADOR DEL SISTEMA DE GESTION PERSONAL
echo ========================================
echo.

REM Verificar si Node.js está instalado
echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo Versión recomendada: 18.19.0 o superior
    pause
    exit /b 1
)

REM Verificar versión de Node.js
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js detectado: %NODE_VERSION%

REM Verificar si npm está disponible
echo [2/6] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm no está disponible.
    echo Esto puede ser un problema de permisos de PowerShell.
    echo.
    echo SOLUCION: Ejecuta PowerShell como administrador y ejecuta:
    echo Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    echo.
    pause
    exit /b 1
)

REM Limpiar instalación anterior si existe
echo [3/6] Limpiando instalación anterior...
if exist node_modules (
    echo Eliminando node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Eliminando package-lock.json...
    del package-lock.json
)

REM Configurar npm
echo [4/6] Configurando npm...
npm config set registry https://registry.npmjs.org/
npm config set save-exact true
npm config set package-lock true

REM Instalar dependencias
echo [5/6] Instalando dependencias...
echo Esto puede tomar varios minutos...
npm install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo.
    echo ERROR durante la instalación de dependencias.
    echo Intentando con --force...
    npm install --force
    if %errorlevel% neq 0 (
        echo.
        echo ERROR CRITICO: No se pudieron instalar las dependencias.
        echo Posibles soluciones:
        echo 1. Verificar conexión a internet
        echo 2. Limpiar caché de npm: npm cache clean --force
        echo 3. Usar una versión diferente de Node.js
        echo.
        pause
        exit /b 1
    )
)

REM Verificar instalación
echo [6/6] Verificando instalación...
npm list --depth=0 >nul 2>&1
if %errorlevel% neq 0 (
    echo ADVERTENCIA: Algunas dependencias pueden tener problemas.
    echo El proyecto debería funcionar, pero revisa los warnings.
) else (
    echo ¡Instalación completada exitosamente!
)

echo.
echo ========================================
echo  INSTALACION COMPLETADA
echo ========================================
echo.
echo Para iniciar el proyecto:
echo   npm start
echo.
echo Para desarrollo en red:
echo   npm run start-network
echo.
echo Para más información, consulta README_INSTALACION.md
echo.
pause