Scripts: how to run the document tests

This README explains how to run the Node test script that exercises the document endpoints used by the frontend: GET /api/documentos/persona/:rut, POST /api/documentos/registrar-existente, and POST /api/documentos (multipart upload).

Location:
- scripts/test_nombre_archivo_node.js — Node script that runs the three tests.
- scripts/testfile_node.txt — small test file used by the upload test.

Prerequisites:
- Node.js (>= 14) installed.
- Backend API available at http://localhost:3000 by default. Set API_BASE to override.
- From repo root: npm install

Quick setup (PowerShell):

    # from repo root
    npm install

    # Optional: run type-check
    npm run type-check

    # Run the test script (replace RUT as needed)
    node .\scripts\test_nombre_archivo_node.js 20011078-1

Using a different API base (PowerShell):

    $env:API_BASE = 'http://my-backend-host:3000/api'
    node .\scripts\test_nombre_archivo_node.js 20011078-1

Or in bash:

    API_BASE='http://my-backend-host:3000/api' node ./scripts/test_nombre_archivo_node.js 20011078-1

What the script does:
- GET /api/documentos/persona/:rut — prints the response (persona, documentos, documentos_locales, documentos_locales_split).
- POST /api/documentos/registrar-existente (JSON) — attempts to register an existing file using ruta_local. May return 404 if ruta_local is not accessible from the server.
- POST /api/documentos (multipart) — uploads scripts/testfile_node.txt and passes nombre_archivo_destino. Check response for nombre_archivo or nombre_archivo_guardado.

Expected outputs:
- Successful upload: JSON with data.documentos including id, nombre_archivo, nombre_original.
- If backend renames files to avoid collisions, nombre_archivo may include a timestamp suffix (e.g. archivo_1762797176088.txt).
- registrar-existente 404 means server can't access ruta_local; use upload or make ruta_local accessible.

Tips:
- After upload, re-run GET /api/documentos/persona/:rut to see the document in the DB.
- The frontend normalizes names by stripping trailing _\d+ timestamp suffixes when comparing, to avoid showing duplicate pending files.

Troubleshooting:
- ECONNREFUSED — backend not running at default host/port. Start backend or set API_BASE.
- MODULE_NOT_FOUND: form-data — run npm install form-data.
- 404 registrar-existente — ruta_local inaccessible (server filesystem). Use upload or add Drive-copy logic in backend.

Where to look in code:
- src/hooks/useDocumentos.ts — FormData builder and hooks for upload/registration.
- src/components/personal/PendientesRegistroModal.tsx — name-normalization to hide duplicates.

If you want a PowerShell wrapper or colored output, tell me which shell you prefer and I can add it.
