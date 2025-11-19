# Integración Frontend: Subir y mostrar foto de perfil

Este documento describe cómo implementar en el frontend la funcionalidad de subir y mostrar la foto de perfil del usuario que está autenticado en la empresa.

## Endpoints relevantes
- Subida (grabar en uploads): `POST /api/profile-photos/{rut}/upload` (multipart/form-data, campo `file`)
- Alternativa de subida (ruta personal): `POST /api/personal/{rut}/upload` (usa Drive share)
- Obtener metadata / URL pública: `GET /api/profile-photos/{rut}/image` -> devuelve `{ profile_image_url }`
- Descargar la imagen: `GET /api/profile-photos/{rut}/image/download` (devuelve el stream de la imagen)
- Endpoint conveniencia para usuario autenticado: `GET /api/users/me/photo` (requiere Bearer token) — devuelve `photo_url` y `company`

> Nota: Los endpoints `profile-photos` no requieren autenticación por diseño en el backend actual; `GET /api/users/me/photo` sí requiere token.

---

## Flujo en el Frontend (resumen)
1. El usuario inicia sesión y obtienes el token JWT.
2. Para subir su foto, envía un `multipart/form-data` con el archivo al endpoint `POST /api/profile-photos/{rut}/upload`.
3. Después de una subida exitosa, el backend devuelve `profile_image_url` (o puedes obtenerlo desde `GET /api/profile-photos/{rut}/image`).
4. Para mostrar la foto en la UI, usa la `photo_url` devuelta o el endpoint de descarga en un `<img src="...">`.

---

## Ejemplo de frontend (HTML + JavaScript básico)

Copia este fragmento dentro de una página protegida por autenticación:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Subir Foto de Perfil</title>
</head>
<body>
  <h3>Subir y mostrar foto de perfil</h3>
  <div>
    <label>RUT del usuario (ej: 12.345.678-9):</label>
    <input id="rut" value="12.345.678-9" />
  </div>
  <div>
    <input type="file" id="fileInput" accept="image/*" />
    <button id="uploadBtn">Subir foto</button>
  </div>
  <div>
    <button id="refreshBtn">Refrescar foto</button>
  </div>
  <div>
    <img id="profileImg" src="" alt="Foto de perfil" style="max-width:200px; max-height:200px; display:block;"/>
  </div>

  <script>
    const uploadBtn = document.getElementById('uploadBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const fileInput = document.getElementById('fileInput');
    const rutInput = document.getElementById('rut');
    const profileImg = document.getElementById('profileImg');

    // Si tu frontend usa autenticación, ajusta para incluir Authorization: Bearer <TOKEN>
    const AUTH_TOKEN = window.localStorage.getItem('token') || null; // ejemplo

    uploadBtn.addEventListener('click', async () => {
      const rut = rutInput.value.trim();
      if (!rut) return alert('Proporciona un RUT');
      if (!fileInput.files || fileInput.files.length === 0) return alert('Selecciona una imagen');

      const file = fileInput.files[0];
      const form = new FormData();
      form.append('file', file);

      try {
        const res = await fetch(`/api/profile-photos/${encodeURIComponent(rut)}/upload`, {
          method: 'POST',
          headers: AUTH_TOKEN ? { 'Authorization': 'Bearer ' + AUTH_TOKEN } : {},
          body: form
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error subiendo imagen');

        alert('Subida exitosa');
        const url = data.data.profile_image_url;
        if (url) profileImg.src = url + '?_=' + Date.now(); // cache-bust
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });

    refreshBtn.addEventListener('click', async () => {
      const rut = rutInput.value.trim();
      if (!rut) return alert('Proporciona un RUT');
      try {
        const res = await fetch(`/api/profile-photos/${encodeURIComponent(rut)}/image`, {
          method: 'GET'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'No se encontró imagen');
        profileImg.src = data.data.profile_image_url + '?_=' + Date.now();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  </script>
</body>
</html>
```

---

## Pruebas automatizadas (CLI)
A continuación se muestran comandos de PowerShell y curl que puedes ejecutar para validar la integración.

### 1) Crear una imagen de prueba y subirla (PowerShell)
```powershell
# Desde la carpeta del repo
New-Item -ItemType Directory -Force -Path tmp
$base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
[IO.File]::WriteAllBytes('tmp\sample.png',[Convert]::FromBase64String($base64))
# Subir con curl (Windows incluye curl en versiones recientes)
curl -v -F "file=@tmp/sample.png" "http://localhost:3000/api/profile-photos/12.345.678-9/upload"
```

### 2) Obtener URL pública (PowerShell)
```powershell
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/profile-photos/12.345.678-9/image' | ConvertTo-Json -Depth 6
```

### 3) Descargar la imagen subida (PowerShell)
```powershell
curl "http://localhost:3000/api/profile-photos/12.345.678-9/image/download" -o tmp\downloaded.png
```

### 4) Usar `GET /api/users/me/photo` (requiere token)
```powershell
# Asumiendo que tienes el token en $env:MY_TOKEN
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/users/me/photo' -Headers @{ Authorization = "Bearer $env:MY_TOKEN" } | ConvertTo-Json -Depth 6
```

---

## Consideraciones de seguridad y UX
- Validar tamaño y tipo de imagen en frontend y backend (backend ya valida tipos y tamaño).
- Proteger endpoints de subida si no deseas que cualquier persona suba imágenes (usar `authenticateToken`).
- Si deseas usar Drive compartido (`G:/...`), usa el endpoint `POST /api/personal/{rut}/upload` que copia a la ruta corporativa.
- Agregar thumbnails y optimización de imágenes en el servidor para mejorar rendimiento.

---

Si quieres, puedo:
- Ejecutar ahora las pruebas de subida y descarga desde el entorno (crear imagen de prueba, subirla y descargarla) y pegar la salida aquí.
- Cambiar el endpoint para que redirija (302) a la imagen cuando se llame a `/api/users/me/photo` (útil para usar la URL directamente en una etiqueta `<img>`).

