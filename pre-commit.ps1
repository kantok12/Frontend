# Script de pre-commit para Windows PowerShell
Write-Host "📝 Verificando tipos de TypeScript..." -ForegroundColor Blue

try {
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en verificación de tipos de TypeScript" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error ejecutando TypeScript check: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Ejecutando ESLint..." -ForegroundColor Blue

try {
    npx eslint src --ext .ts,.tsx
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en ESLint" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error ejecutando ESLint: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Todas las verificaciones pasaron correctamente!" -ForegroundColor Green
exit 0
