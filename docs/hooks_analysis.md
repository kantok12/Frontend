# Análisis — `src/hooks`

Este documento resume el análisis de los hooks principales leídos: `useDocumentos`, `useAllDocumentos`, `useMatchPrerequisitos`, `useAuth`, `usePersonal`, `useCarteras`.

Para cada hook incluyo: propósito, dependencias (imports), observaciones técnicas y riesgos, y recomendaciones rápidas.

---

## `useDocumentos.ts`

- Propósito: gestión completa de flujos de documentos (lectura por filtros, lectura por persona, subida, registro de documentos existentes, eliminación, descarga y tipos).
- Dependencias: `apiService` (`src/services/api.ts`), utilidades desde `src/utils/helpers` (`validateFile`, `formatBytes`), `FILE_CONFIG` de `src/config/api.ts`, `mapTipoDocumentoToFolder` desde `src/utils/documentFolders`.
- Observaciones y riesgos:
  - Mucha lógica defensiva para normalizar respuestas del backend (soporta múltiples shapes). Esto indica contrato backend frágil o evolutivo.
  - Uso extensivo de `console.log` / `console.warn` / `console.error` para debugging. Útil en desarrollo pero ruidoso en producción.
  - Validaciones de archivos duplican reglas que también pueden existir en `config/api.ts` o `constants.ts`; posible desincronización.
  - Extractores de `nombre_archivo` manejan varias formas de respuesta — idealmente backend debería estandarizar.
  - `validateFileForBackend` y `getFileTypeFromExtension` implementan reglas de tipos y límites; hay que mantenerlos sincronizados con la configuración del backend.
- Recomendaciones rápidas:
  - Centralizar y documentar el contrato de la API para `uploadDocumento` y `registerExistingDocument` (campos esperados y nombres de archivo retornados).
  - Reemplazar logs por un `logger` con niveles configurables; desactivar en producción.
  - Añadir tests unitarios para `createDocumentoFormData`, `validateFileForBackend` y flujos de extracción de `nombre_archivo` con mocks de respuestas.

---

## `useAllDocumentos.ts`

- Propósito: agrega y normaliza listas combinadas de documentos vencidos y por vencer, enriqueciendo con datos de `usePersonalList`.
- Dependencias: `apiService`, `usePersonalList` (del mismo archivo `usePersonal.ts`).
- Observaciones y riesgos:
  - Funciona en memoria para combinar y deduplicar, lo cual es correcto para reportes pero podría crecer en memoria si las listas son muy grandes.
  - Usa `usePersonalList` solicitando hasta 1000 items — potencialmente insuficiente o excesivo según tamaño real de la tabla.
- Recomendaciones rápidas:
  - Considerar paginar también o limitar la carga cuando la base de personal sea muy grande.
  - Añadir manejo explícito cuando `personalData` falte o sea inconsistente.

---

## `useMatchPrerequisitos.ts`

- Propósito: realizar matching en batch de prerrequisitos por cliente y RUTs; expone query y mutation.
- Dependencias: `apiService`, `generateRutVariants` (`src/utils/rut.ts`).
- Observaciones y riesgos:
  - Se generan variantes de RUT (sin/ con puntos) para maximizar coincidencias — esto sugiere endpoints que no normalizan RUTs.
  - `apiService.matchPrerequisitosClienteBatch` tiene fallbacks (vimos en `api.ts`) a endpoints por RUT; importante para resiliencia pero aumenta complejidad.
- Recomendaciones rápidas:
  - Pactar con backend un contrato único para RUT (por ejemplo: siempre sin puntos y con DV) y remover la necesidad de variantes.
  - Testear la función con distintos formatos de respuesta backend (matchesAll, faltantes, data wrappers) para evitar roturas.

---

## `useAuth.ts`

- Propósito: maneja login, registro, logout y sincronización con `authStore` (Zustand). Usa React Query para llamadas a `apiService`.
- Dependencias: `apiService`, `useAuthStore` (`src/store/authStore.ts`), `react-router`.
- Observaciones y riesgos:
  - Asume varias formas de respuesta del backend (a veces `response.user` y `response.token`, otras `response.success` y `response.data`) y hace logs detallados.
  - Es responsable de guardar `token` en `localStorage` y setear estado global (correcto pero revisar seguridad/expiry).
  - `currentUser` query está definido con `enabled:false` y no se usa automáticamente; revisar si se espera prefetch.
- Recomendaciones rápidas:
  - Estandarizar respuesta de autenticación en backend o adaptar `apiService` a envolver/normalizar respuestas antes de retornarlas al hook.
  - Añadir manejo de expiración de token y refresh automático (si backend lo soporta), y tests para flujos de error.

---

## `usePersonal.ts`

- Propósito: múltiples hooks para CRUD de personal, adaptación de estructura backend → frontend (`adaptPersonalData`), disponibilidad y utilidades de creación/actualización.
- Dependencias: `apiService`.
- Observaciones y riesgos:
  - `adaptPersonalData` contiene muchas heurísticas para extraer nombre y otros campos (varias estrategias). Esto es flexible pero frágil y complejo de mantener.
  - Abundante logging para entender formas de datos del backend — sugiere falta de contrato estable.
  - Uso de `console.log` en producción puede filtrar datos sensibles (evitar logs con PII). Hay que sanitizar o quitar estos logs.
  - Emitir `CustomEvent('personalUpdated')` es aceptable pero requiere consumidores documentados; buscar dónde se usa.
- Recomendaciones rápidas:
  - Intentar negociar y documentar un formato estable de `personal` desde backend para simplificar `adaptPersonalData`.
  - Reducir heurísticas o encapsularlas en funciones con tests unitarios por estrategia.
  - Sanitizar logs y evitar imprimir PII en entornos no controlados.

---

## `useCarteras.ts`

- Propósito: hooks para leer carteras y clientes por cartera.
- Dependencias: `apiService`.
- Observaciones y riesgos:
  - Straightforward; pocas transformaciones locales.
  - Buen uso de `staleTime` para cache.
- Recomendaciones rápidas:
  - Añadir pruebas de integración contra endpoints mockeados para asegurar shape de `getClientesByCartera`.

---

## Conclusiones y siguientes pasos

- Observación global: muchos hooks implementan lógica defensiva y heurísticas para lidiar con respuestas backend inconsistentes. Esto funciona pero aumenta deuda técnica.
- Recomendación de alto nivel: priorizar la estabilización del contrato API (campos y shapes) y encapsular la normalización en `apiService` en lugar de replicarla en múltiples hooks.
- Siguientes acciones que puedo ejecutar ahora:
  1. Buscar y listar todos los lugares que usan `useMatchPrerequisitos`, `useDocumentos` y `usePersonal` para evaluar el impacto del refactor.
  2. Aplicar cambios concretos y seguros en pequeños pasos (ej. reemplazar `console.log` masivos por `logger`, añadir test skeletons para `helpers` y `rut`).
  3. Continuar analizando el resto de hooks y las páginas principales (`src/pages`) y componentes (`src/components/programacion`, `calendario`).

---

Documento generado tras leer: `src/hooks/useDocumentos.ts`, `src/hooks/useAllDocumentos.ts`, `src/hooks/useMatchPrerequisitos.ts`, `src/hooks/useAuth.ts`, `src/hooks/usePersonal.ts`, `src/hooks/useCarteras.ts`.

¿Queres que (A) busque todas las referencias de los hooks mencionados en el repo, (B) aplique cambios seguros (ej. reemplazar logs por `logger` y sanitizar algunos `console.log`), o (C) continúe con análisis de `src/pages`? Indica la opción y procedo.
