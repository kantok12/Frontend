<!-- Migrated from `documentos/PROJECT_OVERVIEW.md` -->

# Proyecto: Frontend — Sistema de Gestión de Personal

Este documento ofrece una visión completa del estado actual del repositorio frontend, su estructura, flujos relevantes (documentos y cursos), cambios recientes y pasos de verificación. Está pensado para que cualquier agente o desarrollador nuevo (o una IA en un nuevo chat) entienda rápidamente cómo funciona el frontend y cómo se integra con el backend de documentos.

Fecha: 2025-11-10

---

## Resumen del proyecto

Repositorio: sistema-gestion-personal-frontend

Stack principal: React + TypeScript, TailwindCSS, react-query (@tanstack/react-query), Axios.

Propósito: UI para gestionar personal, programaciones, documentos y cursos/certificados. El frontend consume una API REST (backend separado) que provee datos de personas, documentos, cursos y operaciones de subida/registro de archivos.

---

## Estado actual (resumen ejecutable)

- El frontend fue actualizado para soportar un nuevo contrato parcial del backend: `documentos_locales_split` (separación entre `documentos` y `cursos_certificaciones`). Hay fallback para el formato legacy `documentos_locales`.
- Se añadió soporte para que el frontend envíe un campo `nombre_archivo_destino` al subir o al registrar un documento existente; el backend puede respetar (o no) ese nombre final.
- Se añadió lógica de deduplicación (demostrada y aplicada en frontend) para evitar mostrar duplicados cuando el backend añade sufijos tipo `_TIMESTAMP` al nombre final.
- Se creó un script de pruebas Node (`scripts/test_nombre_archivo_node.js`) y un archivo de prueba (`scripts/testfile_node.txt`) para verificar endpoints de documentos.
- Un archivo demo de rutas (`routes/documentos.js`) fue añadido inicialmente para pruebas, pero fue eliminado del frontend para evitar confusión — el backend real está en otro repositorio/ubicación.

---

## Estructura relevante del repo (rutas y archivos clave)

- `src/` — código React/TS

  - `src/hooks/useDocumentos.ts` — hooks para obtener, subir y registrar documentos. Contiene `createDocumentoFormData` y hooks `useUploadDocumento` y `useRegisterDocumentoExistente`.
  - `src/services/api.ts` — cliente central para llamadas al backend (axios wrappers).
  - `src/components/personal/PendientesRegistroModal.tsx` — modal para seleccionar archivos pendientes (ahora normaliza nombres con sufijos timestamp para evitar duplicados visibles).
  - `src/components/personal/SubirDocumentoModal.tsx`, `CursoModal.tsx`, `DocumentModal.tsx` — UIs relacionadas con subida/registro de documentos y cursos.
  - `src/pages/CalendarioPage.tsx` — página principal con integraciones relacionadas.

- `scripts/` — utilidades y pruebas locales

  - `scripts/test_nombre_archivo_node.js` — script Node que realiza: GET /documentos/persona/:rut, POST /documentos/registrar-existente (JSON), POST /documentos (multipart) y muestra resultados.
  - `scripts/testfile_node.txt` — archivo de prueba para el upload.

- `documentos/PROJECT_OVERVIEW.md` — (este archivo) descripción y guía.

---

## Contratos API importantes (resumen)

- GET /api/documentos/persona/:rut

  - Respuesta esperada (alto nivel): { success: true, data: { persona, documentos: [...], documentos_locales: [...], documentos_locales_split: { documentos: [...], cursos_certificaciones: [...] } }, pagination }
  - Nota: frontend prefiere `documentos_locales_split` si está presente; si no, genera split localmente.

- POST /api/documentos (multipart/form-data)

  - Campos relevantes: archivo (file), rut_persona, nombre_documento, tipo_documento, nombre_archivo_destino (opcional), descripcion, fecha_emision, fecha_vencimiento, etc.
  - Respuesta esperada: incluir el/los documento(s) guardado(s). Es ideal que el backend devuelva explícitamente `nombre_archivo_guardado` o que el `documentos` devuelto tenga `nombre_archivo` con el nombre final.

- POST /api/documentos/registrar-existente (JSON)
  - Campos relevantes: rut_persona, nombre_archivo, ruta_local, tipo_documento, nombre_archivo_destino (opcional)
  - Nota: este endpoint puede fallar si `ruta_local` no es accesible desde el servidor. En ese caso, usar upload multipart o ajustar backend para copiar desde Drive.

---

## Flujos de documento (cómo funcionan hoy)

1. Subida por UI (multipart)

   - Frontend crea FormData mediante `createDocumentoFormData` y añade `nombre_archivo_destino` con el valor de `nombre_documento` por defecto.
   - Backend recibe el multipart, almacena el archivo y registra en DB; puede renombrar para evitar colisiones (por ejemplo añadiendo `_TIMESTAMP` al nombre).
   - Frontend invalida cache (`react-query`) y vuelve a consultar GET persona para refrescar la lista.

2. Registrar existente (archivo ya en Drive/local)

   - Frontend llama `registerExistingDocument` con `ruta_local` y otros campos.
   - Backend debe validar que la ruta existe o tener integración con Drive para copiar/registrar el archivo. Si el backend no puede acceder a la ruta, retornará error (404 o similar).

3. Deduplicación / coincidencia de nombres
   - Problema observado: backend suele añadir sufijos timestamp al guardar, por lo que la copia local (sin sufijo) queda listada como duplicada en la UI.
   - Solución aplicada en frontend: normalizar nombres quitando sufijos `_\d+` antes de comparar `nombre_archivo` para determinar si ya está registrado.
   - Mejor práctica: backend debe devolver `nombre_archivo_guardado` y el frontend debe usar ese valor canónico y/o solicitar al backend que marque/elimine la copia local.

---

## Pruebas y verificación (cómo reproducir lo que hicimos)

1. Ejecutar comprobación de tipos (local):

   - npm run type-check

2. Ejecutar script de prueba Node (requiere backend en `http://localhost:3000` o ajustar `API_BASE` env):

   - node ./scripts/test_nombre_archivo_node.js 20011078-1
   - El script hace GET persona, intenta registrar existente y luego sube un archivo (multipart). Observa respuestas para `nombre_archivo` o `nombre_archivo_guardado`.

3. Verificar UI (si el dev server está corriendo):
   - npm run dev
   - Abrir la app y comprobar en la modal `PendientesRegistroModal` que no aparecen duplicados cuando el backend añade sufijos timestamp.

---

## Cambios realizados por este agente (lista para revisión)

- Frontend

  - `src/hooks/useDocumentos.ts` — añadida inclusión de `nombre_archivo_destino` en FormData.
  - `src/components/personal/PendientesRegistroModal.tsx` — comparación de nombres normalizada (quita sufijos timestamp) para ocultar duplicados.
  - `scripts/test_nombre_archivo_node.js` y `scripts/testfile_node.txt` añadidos para pruebas.

- Temporal / demo (removido del frontend)
  - `routes/documentos.js` — se añadió inicialmente como demo y luego se eliminó del frontend porque el backend real vive en otro repo.

---

## Recomendaciones / próximos pasos

1. Backend: implementar / garantizar que upload/registrar-existente devuelvan `nombre_archivo_guardado` en la respuesta. Esto hace el flujo inmutable y robusto.
2. Backend: si se quiere soportar `registrar-existente` con rutas de Drive, implementar un adaptador que copie el archivo o que acepte identificadores de Drive en lugar de rutas locales.
3. Frontend: tras upload/registro, leer `nombre_archivo_guardado` y usarlo como canonical name; además, refrescar GET persona y, si procede, pedir al backend que marque o mueva/elimine la copia local.
4. Normalizar RUT en un middleware común en backend para evitar inconsistencias (ya se usa `translate(rut,'.','')` en varios lugares, conviene unificar).

---

## Contacto/Notas:

- Última ejecución de pruebas: 2025-11-10 — se comprobó que el backend acepta `nombre_archivo_destino` en upload y cambia el nombre final añadiendo sufijo timestamp; el frontend ahora es tolerante a eso.
