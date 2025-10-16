@echo off
echo 📝 Verificando tipos de TypeScript...
npx tsc --noEmit
if %errorlevel% neq 0 (
    echo ❌ Error en verificación de tipos de TypeScript
    exit /b 1
)

echo 🔧 Ejecutando ESLint...
npx eslint src --ext .ts,.tsx
if %errorlevel% neq 0 (
    echo ❌ Error en ESLint
    exit /b 1
)

echo ✅ Todas las verificaciones pasaron correctamente!
exit /b 0
