# RECUPERACIÓN Y RECREACIÓN - Página /personal

Propósito

Este documento contiene todo lo necesario para recrear el comportamiento actual de la página `http://localhost:3001/personal` y los componentes relacionados en el frontend, en caso de que los archivos fuente se pierdan. Incluye:

- Lista de archivos modificados y su propósito.
- Fragmentos de implementación clave (helpers y decisiones de UX).
- Pasos para reconstruir desde cero (dependencias, scripts, verificación).
- Notas sobre interacciones con el backend que son necesarias para el correcto funcionamiento.

IMPORTANTE: Este README se diseñó para restaurar el estado actual del frontend tal como está en la rama `main` en la fecha del documento.

---

## Archivos modificados / relevantes

Estas son las rutas y una breve explicación de por qué son importantes para mantener la funcionalidad completa de `/personal` (subir/visualizar/descargar/eliminar documentos, perfil, cursos):

- `src/components/personal/PersonalDetailModal.tsx`
  - Modal principal que muestra la información detallada de un trabajador.
  - Maneja: visualización de datos personales, imagen de perfil (upload/delete), cursos, documentos de cursos y personales, descarga y borrado (incluye lógica de deduplicación para documentos).
  - Contiene helpers: `normalizeName`, `downloadFile`, manejo de `imageUrl` y `handleRemoveImage` que usa `apiService.deleteProfileImage`.

- `src/pages/EstadoDocumentacionPage.tsx`
  - Vista global que lista todos los documentos del personal con filtros y exportación a Excel.
  - Implementa deduplicación por filename normalizado + `tipo_documento` y aplica búsqueda/ordenamiento sobre la lista deduplicada.

- `src/hooks/useDocumentos.ts` y `src/hooks/useDocumentosByPersona.ts` (o variantes)
  - Hooks que interactúan con las APIs: listar, subir, descargar y eliminar documentos.
  - El frontend depende de `deleteDocumentoAndDrive` para borrar tanto el registro como el archivo remoto.

- `src/services/api.ts`
  - Cliente central para llamadas al backend. Contiene métodos como `uploadDocumento`, `createCurso`, `deleteDocumentoAndDrive`, `deleteProfileImage`, etc.
  - Importante: centraliza headers, manejo de tokens y paths base.

- `src/components/personal/SubirDocumentoModal.tsx`, `CourseDocumentModal.tsx`, `EditDocumentModal.tsx`, `CursoModal.tsx`
  - Modales auxiliares para subir/editar documentos y cursos. Mantienen la UX para el flujo completo.

- `src/types/index.ts`
  - Tipos y contratos (Documentos, Curso, Personal). Asegurar que los tipos `Documento` y `CreateCursoData` incluyan los campos `nombre_archivo_destino` y `archivo` según las modificaciones recientes.

- `docs/INSTRUCTIVO_PRUEBAS_FRONTEND.md`
  - Documento adicional con scripts y ejemplos de pruebas para subir/registrar archivos en el backend.

---

## Fragmentos clave y reglas de negocio (reconstruir si se pierde el código)

A continuación se muestran los fragmentos esenciales que deberás recrear tal cual para mantener el comportamiento actual.

1) Normalización y deduplicación de nombres (helper)

```ts
// normalizeName/normalizeName equivalente
const normalizeName = (name?: string) => {
  if (!name) return '';
  let s = name.toLowerCase().trim();
  s = s.replace(/[\\-_]+/g, ' ');
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/[_\s-]{1,}(\d{9,})$/g, '').trim();
  return s;
};
```

Regla: la deduplicación clave es `normalizeName(nombre_archivo|nombre_original|nombre_documento) + '::' + tipo_documento`.

2) Lógica de borrado en lote (cuando hay duplicados)

- Buscar en la respuesta cruda del backend (array `documentos`) coincidencias por nombre normalizado + tipo.
- Si se encuentran >1 coincidencia preguntar al usuario si desea borrar todas.
- Ejecutar `Promise.all` de `deleteDocumentoAndDrive({ id, driveFileId })` y refrescar la lista.

3) Descarga de documentos

- Si `drive_file_id` está presente, abrir en Google Drive (`https://drive.google.com/file/d/{drive_file_id}/view`).
- De lo contrario usar `downloadDocumento` que devuelve `{ blob, filename }`, crear URL y forzar descarga con `a.download`.
- Manejar errores HTTP (403, 404, 500) con mensajes claros.

4) Imagen de perfil

- Upload: POST multipart/form-data a `/personal/{rut}/upload`.
- Delete: usar `apiService.deleteProfileImage(rut)` que llama a DELETE `/personal/{rut}/image`.
- Notar: actualmente el backend devuelve un error 500 (`profilesDir is not defined`) en ciertos entornos — esto es una incidencia del backend.

5) Reapertura de modal tras guardar

- Se guarda `sessionStorage.setItem('reopenPersonalModal', rut)` antes de recargar la página para volver a abrir la modal luego del reload.

---

## Pasos para reconstruir desde cero (si perdiéramos todo)

1) Clonar repo y preparar entorno

```powershell
git clone <repo-url> frontend
cd frontend
npm install
npm run type-check
```

2) Ejecutar en desarrollo

```powershell
npm run start
# o npm run dev
```

3) Archivos mínimos a restaurar para `/personal` básico

- `src/components/personal/PersonalDetailModal.tsx`
- `src/pages/EstadoDocumentacionPage.tsx`
- `src/services/api.ts` (cliente central)
- `src/hooks/useDocumentos.ts` / `useDocumentosByPersona.ts`
- `src/components/personal/SubirDocumentoModal.tsx`
- `src/components/personal/CourseDocumentModal.tsx`
- `src/components/personal/EditDocumentModal.tsx`
- `src/components/personal/CursoModal.tsx`
- `src/types/index.ts` (asegurar tipos Documento, Curso, CreateDocumentoData)
- `src/utils/formatters.ts` (helpers como `standardizeName`, `formatRUT`)

4) Configuración backend / contratos que deben existir

- Endpoint POST `/api/documentos` (multipart) que acepte `archivo` y opcional `nombre_archivo_destino`.
- Endpoint GET `/api/documentos/persona/:rut` que retorne `{ success: true, data: { documentos: Documento[] } }`.
- Endpoint DELETE `/api/documentos/:id` o endpoint específico `deleteDocumentoAndDrive` que borre registro y archivo remoto.
- Endpoint POST `/personal/:rut/upload` y DELETE `/personal/:rut/image` para manejar imagenes de perfil.

5) Verificaciones rápidas después de restaurar

- Abrir `http://localhost:3001/personal`, abrir la modal de un trabajador.
- Comprobar que la lista de documentos aparece (no duplicada). Subir un documento y verificar que:
  - Si el backend añade sufijo timestamp, el frontend agrupa por nombre normalizado.
  - Descargar funciona (drive_file_id o endpoint de descarga).
  - Eliminar pregunta por duplicados y borra todas las coincidencias en una sola acción.
- Subir/Eliminar imagen de perfil (verificar estado y mensajes del backend).

---

## Lista de comandos útiles y scripts de prueba

- Type check

```powershell
npm run type-check
```

- Levantar dev server (Windows PowerShell)

```powershell
npm run start
```

- Pruebas rápidas (scripts en la carpeta `scripts/` añadidos durante el desarrollo):
  - `scripts/test_post_curso_debug.js` — simula POST a `/api/cursos` con FormData
  - `scripts/test_post_documento.js` — simula POST a `/api/documentos` con FormData
  - `scripts/get_personal_by_rut.js` — consulta `/api/personal/:rut` y `/api/documentos/persona/:rut`

---

## Notas y recomendaciones

- Backend: coordinar con backend para que devuelva siempre `nombre_original` y `nombre_archivo` de forma consistente, y para implementar `nombre_archivo_destino` en los endpoints que actualmente no lo aceptan.
- Logging: durante el desarrollo usamos logs en consola (`console.log`) en `PersonalDetailModal` y en los scripts de `scripts/` para reproducir comportamientos y errores del backend.
- Mejora futura: centralizar el helper `normalizeName` en `src/utils/string.ts` y reutilizar tanto en la página global como en el modal.

---

## Contacto / pistas para debugging backend

- Error conocido: `DELETE /personal/:rut/image` puede devolver 500 con `profilesDir is not defined` — revisar variable `profilesDir` en backend.
- Si `npm run start` falla localmente con exit code 1, revisa la salida de la consola para ver errores de compilación o dependencias faltantes.

---

Fecha de generación: 2025-11-12
Generado por: instrucciones de recuperación automática (documentar cambios relacionados con `/personal`).
