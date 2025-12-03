# Carpeta `docs` — Propósito y uso

Esta carpeta almacena documentación de proyecto destinada a ser leída por el equipo (especificaciones, manuales operativos, notas de arquitectura, etc.). Actualmente la carpeta está vacía; este archivo explica la convención y cómo organizar nuevo contenido.

Propósito
- Mantener documentos legibles en Markdown que describan decisiones arquitectónicas, endpoints, operaciones y procedimientos operativos.

Estructura recomendada
- `docs/overview.md` — resumen del proyecto y su arquitectura.
- `docs/api/` — especificaciones de API (uno o más archivos por servicio o endpoint).
- `docs/operacion/` — instrucciones operativas (deploy, configuración de red, permisos de unidades montadas).
- `docs/requisitos/` — requisitos funcionales o listas de verificación.

Convenciones
- Usa `kebab-case` o `snake_case` en nombres de archivo, por ejemplo `project-overview.md` o `api_belray.md`.
- Incluye metadatos simples al inicio cuando sea útil (por ejemplo `# Título` y una línea con `Fecha:`).
- Mantén los documentos enfocados y evita duplicar información que ya está en `documentos/`.

Flujo sugerido
- Crear una rama `docs/<tema>` para cambios extensos en la documentación y abrir un PR para revisión.
- Si la doc es operativa o sensible, añade una referencia en el README del repo y comunica en el canal del equipo.

Notas
- Actualmente no hay archivos en `docs/`. Si quieres, puedo:
  - generar un `docs/overview.md` inicial basado en el README del repo, o
  - mover algunos archivos relevantes desde `documentos/` a `docs/` (propongo hacerlo sólo si confirmas). 
