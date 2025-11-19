param(
    [string]$ApiBase = "http://localhost:3000/api",
    [int]$ClienteId = 1,
    [string]$Rut = '16924504-5',
    [string]$Token = ''
)

function Invoke-Safe {
    param(
        [string]$Uri,
        [string]$Method = 'Get'
    )
    try {
        $headers = @{}
        if ($Token -and $Token.Length -gt 0) { $headers['Authorization'] = "Bearer $Token" }
        Write-Host "-> $Method $Uri"
        $resp = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $headers -ErrorAction Stop
        Write-Host ($resp | ConvertTo-Json -Depth 6)
    } catch {
        $err = $_.Exception
        if ($err.Response -and $err.Response.StatusCode) {
            Write-Host "ERROR: HTTP $($err.Response.StatusCode.value__) -> $($err.Message)"
        } else {
            Write-Host "ERROR: $($_.Exception.Message)"
        }
    }
}

Write-Host "Testing prerrequisitos integration against $ApiBase for cliente $ClienteId and rut $Rut"

Invoke-Safe -Uri "$ApiBase/health"
Write-Host "\nChecking cliente prerrequisitos"
Invoke-Safe -Uri "$ApiBase/prerequisitos/clientes/$ClienteId"
Write-Host "\nChecking individual match (GET)"
Invoke-Safe -Uri "$ApiBase/prerequisitos/clientes/$ClienteId/match?rut=$Rut"
Write-Host "\nChecking alternative match path /clientes/:id/match"
Invoke-Safe -Uri "$ApiBase/clientes/$ClienteId/match?rut=$Rut"
Write-Host "\nChecking documentos by persona"
Invoke-Safe -Uri "$ApiBase/documentos/persona/$Rut"

Write-Host "\nDone. If any GET /match returned 404, backend match endpoints are missing and frontend will use local fallback if implemented."
