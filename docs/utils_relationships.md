# Mapa de relaciones — `src/utils`

Este documento mapea cada archivo bajo `src/utils/` a los lugares donde se importa en el repo, junto a una breve descripción, observaciones y recomendaciones. Está pensado como insumo para el futuro proceso de estabilización y pruebas.

---

## `helpers.ts`

- Descripción: utilidades generales (formateos, RUT, debounce/throttle, validaciones de archivos, paginación, etc.).
- Importado en:
  - `src/hooks/useDocumentos.ts` (usa `validateFile`, `formatBytes`).
- Observaciones y riesgos:
  - Contiene lógica crítica (RUT, validaciones) que debería tener tests.
  - `debounce` usa `NodeJS.Timeout` (incompatible con entorno DOM/TS config), `throttle` no inicializa `inThrottle`.
  - `generateId` no es crypto-safe.
- Recomendaciones rápidas:
  - Corregir tipos de timeout y `inThrottle`; añadir tests unitarios; extraer reglas de archivo a `FILE_CONFIG`.

---

## `rut.ts`

- Descripción: funciones para normalizar RUT y generar variantes (`normalizeRut`, `generateRutVariants`).
- Importado en:
  - `src/__tests__/rut.normalize.test.ts`
  - `src/hooks/useMatchPrerequisitos.ts` (usa `generateRutVariants`)
- Observaciones y riesgos:
  - Buen módulo de utilidad para normalizar RUTs usados en matching.
  - Asegurar consistencia entre `rut.ts` y `helpers.validateRut` (duplicación funcional potencial).
- Recomendaciones:
  - Consolidar validación/normalización en un único módulo (evitar duplicidad entre `helpers.ts` y `rut.ts`).
  - Añadir tests de variantes generadas y su compatibilidad con endpoints backend.

---

## `documentFolders.ts`

- Descripción: decide carpeta destino para uploads (`mapTipoDocumentoToFolder`) y etiqueta de carpeta (`folderLabel`).
- Importado en:
  - `src/hooks/useDocumentos.ts`
  - `src/pages/MultiUploadPage.tsx`
- Observaciones y riesgos:
  - Lógica basada en keyset y contains; añadir centralización con servidor si hay mutabilidad de tipos.
- Recomendaciones:
  - Documentar mapeos y mantener sincronizado con backend. Considerar obtener lista de tipos desde API si existe.

---

## `format.ts`

- Descripción: utilidades para filenames y cálculos de días (`truncateFilename`, `daysUntilNumber`, `daysUntilText`).
- Importado en: (no se encontraron imports explícitos en la búsqueda actual aparte de usos locales)
- Observaciones:
  - Contiene funciones parecidas a otras en `formatters.tsx`; hay duplicación potencial.
- Recomendación:
  - Consolidar funciones de fecha/filename en un único lugar (`format` vs `formatters`) para evitar inconsistencias.

---

## `formatters.tsx`

- Descripción: formateadores UI (nombre, RUT, edad, fecha, iconos y colores para documentos). Exporta componentes/funciones UI-friendly.
- Importado en:
  - `src/pages/PersonalPage.tsx` (`formatRUT`)
- Observaciones:
  - Incluye `console.error` y `try/catch` en `getAge` (aceptable). Evitar duplicación de `formatDate`/`daysUntil` con `format.ts`.
- Recomendaciones:
  - Unificar utilidades de formato y evitar múltiples implementaciones del mismo comportamiento.

---

## `display.ts`

- Descripción: pequeña helper `displayValue` para mostrar valores con excepciones por RUT.
- Importado en:
  - `src/pages/PersonalPage.tsx`
- Observaciones:
  - Contiene lógica específica (lista `suppressRuts`) que puede crecer; considerar externalizar o parametrizar.
- Recomendaciones:
  - Documentar por qué existen esos RUTs suprimidos y considerar configurarlos vía entorno o backend.

---

## `pdfExporter.ts`

- Descripción: exporta planificación semanal a PDF mediante `html2canvas` + `jspdf` y tiene fallback a HTML.
- Importado en:
  - `src/components/programacion/ProgramacionSemanalCompleta.tsx`
- Observaciones y riesgos:
  - Archivo con logs de depuración (`console.log`) intensivos; buena idea para debug pero ruidoso en producción.
  - Import dinámico de `jspdf` y `html2canvas` — correcto para reducir bundle, pero requiere que consumidores manejen errores.
- Recomendaciones:
  - Reducir logs o usar un `logger` que permita silenciar en producción.
  - Añadir pruebas end-to-end manuales para validación visual del PDF; documentar limitaciones (CORS, imágenes remotas).

---

## `constants.ts`

- Descripción: configuración estática (API_CONFIG, ROUTES, PAGINATION_CONFIG, ERROR_MESSAGES, COLORS, etc.).
- Importado en: (no detectado por la búsqueda actual; probablemente usado en varias partes del proyecto — recomendar búsqueda adicional para confirmar)
- Observaciones:
  - Buen lugar centralizado para constantes.
  - Asegurar que valores sensibles no se expongan y que `API_CONFIG.BASE_URL` se sobreescriba por variables de entorno.
- Recomendaciones:
  - Ejecutar una búsqueda amplia para listar todos los consumidores de `constants.ts` y documentar dependencias.

---

## Observaciones generales y siguientes pasos sugeridos

- Detecté duplicación funcional entre `helpers.ts`, `rut.ts`, `format.ts` y `formatters.tsx` (fechas, RUT, truncamiento). Consolidar reducirá bugs y pruebas necesarias.
- `helpers.ts` contiene funciones críticas que ya documentamos en `docs/utils_helpers_observaciones.md` (observaciones técnicas y recomendaciones rápidas).
- Varios módulos cargan dependencias dinámicas (`pdfExporter.ts`) o usan heurísticas para compatibilidad con el backend (ver `documentFolders.ts` y `rut` variants).

Siguientes pasos sugeridos (puedo ejecutarlos):

- Ejecutar búsquedas adicionales para hallar todos los imports de `constants.ts` y `helpers.ts` (para completar el mapa).
- Proponer (y aplicar si autorizás) cambios concretos: unificar validación/normalización de RUT, corregir tipado de `debounce`, inicializar `inThrottle`, y reducir logs en `pdfExporter.ts`.
- Generar tests unitarios para `helpers` y `rut`.

---

_Este documento fue generado automáticamente tras leer `src/utils/_`y buscar importaciones en`src/\*_`. Si querés, procedo a: (A) buscar todos los usos de `constants.ts`y`helpers.ts`, (B) aplicar las correcciones rápidas en `helpers.ts`y agregar tests iniciales, o (C) continuar con el análisis de`src/hooks/` (recomendado). Indica la opción._
