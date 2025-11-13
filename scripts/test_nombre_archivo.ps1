# Test script to verify whether backend honors 'nombre_archivo_destino'
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\test_nombre_archivo.ps1

param(
    [string]$rut
)

$base = 'http://localhost:3000/api'
# If RUT not provided as parameter, prompt the user
if (-not $rut -or $rut.Trim().Length -eq 0) {
    $rut = Read-Host 'Ingrese RUT a probar (ej: 12.345.678-9)'
}

Write-Host "Base URL: $base"
Write-Host "RUT usado: $rut"
Write-Host ""

# 1) GET documentos/persona/:rut
Write-Host "[1] GET /documentos/persona/$rut"
try {
    $resp = Invoke-RestMethod -Uri "$base/documentos/persona/$rut" -Method Get -ErrorAction Stop
    Write-Host "--> OK: recibida respuesta. Inspectando campos relevantes..."
    # Mostrar si existe documentos_locales_split
    if ($resp.data.documentos_locales_split) {
        Write-Host "  documentos_locales_split detectado."
        $dSplit = $resp.data.documentos_locales_split
        $docsCount = ($dSplit.documentos | Measure-Object).Count
        $cursosCount = ($dSplit.cursos_certificaciones | Measure-Object).Count
        Write-Host "    documentos: $docsCount, cursos_certificaciones: $cursosCount"
    } else {
        Write-Host "  documentos_locales_split NO detectado. Fallback con documentos_locales:"
        $legacyCount = ($resp.data.documentos_locales | Measure-Object).Count
        Write-Host "    documentos_locales (legacy) count: $legacyCount"
    }
} catch {
    Write-Host "--> ERROR al consultar GET /documentos/persona/:rut:`n$_"
}

Write-Host ""

# 2) POST /documentos/registrar-existente (JSON) - intenta enviar nombre_archivo_destino
Write-Host "[2] POST /documentos/registrar-existente (JSON) con nombre_archivo_destino"
# Build a payload matching the backend expectations: top-level rut_persona, nombre_archivo, ruta_local, nombre_archivo_destino
$payload = @{
    rut_persona = $rut
    nombre_documento = 'Prueba desde script'
    nombre_archivo = 'testfile.txt'
    ruta_local = 'drive://path/to/testfile.txt'
    nombre_archivo_destino = 'prueba_script_registrar.txt'
    tipo_documento = 'certificado_curso'
}
try {
    $resp2 = Invoke-RestMethod -Uri "$base/documentos/registrar-existente" -Method Post -Body ($payload | ConvertTo-Json -Depth 5) -ContentType 'application/json' -ErrorAction Stop
    Write-Host "--> OK: respuesta recibida del endpoint registrar-existente"
    Write-Host ($resp2 | ConvertTo-Json -Depth 5)
    if ($resp2.data.nombre_archivo_guardado) { Write-Host "  nombre_archivo_guardado: $($resp2.data.nombre_archivo_guardado)" }
    if ($resp2.data.finalName) { Write-Host "  finalName: $($resp2.data.finalName)" }
} catch {
    Write-Host "--> ERROR en POST /documentos/registrar-existente:`n$($_.Exception.Message)"
    if ($_.Exception.Response) { Write-Host ($_.Exception.Response.Content.ReadAsStringAsync().Result) }
}

Write-Host ""

# 3) POST /documentos (multipart/form-data) - upload de un archivo local de prueba
Write-Host "[3] POST /documentos (multipart/form-data) con nombre_archivo_destino"
$testFile = Join-Path $PSScriptRoot 'testfile.txt'
if (-Not (Test-Path $testFile)) {
    Write-Host "  Archivo de prueba no existe. Creando $testFile"
    "Contenido de prueba - $(Get-Date)" | Out-File -FilePath $testFile -Encoding utf8
}

try {
    # Use .NET HttpClient + MultipartFormDataContent for PowerShell 5.1 compatibility
    $handler = New-Object System.Net.Http.HttpClientHandler
    $client = New-Object System.Net.Http.HttpClient($handler)

    $multipart = New-Object System.Net.Http.MultipartFormDataContent

    # Add string fields
    $multipart.Add((New-Object System.Net.Http.StringContent($rut)), 'rut_persona')
    $multipart.Add((New-Object System.Net.Http.StringContent('Prueba upload script')), 'nombre_documento')
    $multipart.Add((New-Object System.Net.Http.StringContent('prueba_upload_script.txt')), 'nombre_archivo_destino')
    $multipart.Add((New-Object System.Net.Http.StringContent('certificado_curso')), 'tipo_documento')

    # Add file
    $fs = [System.IO.File]::OpenRead($testFile)
    $fileContent = New-Object System.Net.Http.StreamContent($fs)
    $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/octet-stream')
    $multipart.Add($fileContent, 'archivo', [System.IO.Path]::GetFileName($testFile))

    $uri = [System.Uri]::new("$base/documentos")
    $response = $client.PostAsync($uri, $multipart).Result
    $body = $response.Content.ReadAsStringAsync().Result
    if ($response.IsSuccessStatusCode) {
        Write-Host "--> OK: respuesta recibida del upload"
        try { $parsed = $body | ConvertFrom-Json; Write-Host ($parsed | ConvertTo-Json -Depth 5) } catch { Write-Host $body }
        if ($parsed.data) {
            if ($parsed.data.finalName) { Write-Host "  finalName: $($parsed.data.finalName)" }
            if ($parsed.data.nombre_archivo_guardado) { Write-Host "  nombre_archivo_guardado: $($parsed.data.nombre_archivo_guardado)" }
        }
    } else {
        Write-Host "--> ERROR en POST /documentos (upload) - status: $($response.StatusCode)"
        Write-Host $body
    }
    $fs.Dispose()
    $client.Dispose()
} catch {
    Write-Host "--> ERROR en POST /documentos (upload):`n$($_.Exception.Message)"
}

Write-Host "\nPruebas finalizadas. Revisa los logs anteriores para ver si el backend devolvió nombre final (finalName / nombre_archivo_guardado). Si no lo hizo, entonces probablemente el backend no está aplicando el nombre solicitado."