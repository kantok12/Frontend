# Observaciones técnicas y riesgos — `src/utils/helpers.ts`

## Observaciones técnicas y riesgos

- Posible bug en `validateRut`: el bucle actual interpreta partes de la cadena como enteros completos en vez de iterar dígito por dígito; esto puede devolver un dígito verificador incorrecto en ciertos RUT (ej. con `K`).
- Tipado de `debounce`: usa `NodeJS.Timeout`, lo que puede producir inconsistencias en un entorno browser/TypeScript; en front-end conviene usar `number | undefined` o `ReturnType<typeof setTimeout>`.
- `throttle` deja `inThrottle` sin inicializar (`let inThrottle: boolean;`), lo que depende de `undefined` como falsy; es frágil y menos claro.
- `generateId` usa `Math.random()` y puede colisionar; suficiente para claves UI temporales, pero no para IDs persistentes ni indexados.
- `validateFileType` depende solo de `file.type` (MIME), que no siempre es fiable en navegadores o archivos subidos; debería tener fallback por extensión.
- Falta de tests unitarios: utilidades críticas (RUT, validaciones de archivo, `formatBytes`, `debounce`/`throttle`) no tienen cobertura visible, por lo que cambios pueden introducir regresiones.
- Duplicación de reglas: validaciones de archivos y límites de tamaño deberían consumirse desde `src/config/api.ts` (`FILE_CONFIG`) para evitar desincronización.
- Internacionalización implícita: funciones usan `es-CL` (correcto para este dominio), pero conviene documentarlo si se requieren otros locales.

## Recomendaciones concretas (rápidas)

- Corregir y testear `validateRut`: iterar dígito a dígito (algoritmo estándar del módulo 11) y añadir suite de tests con casos típicos y bordes (incluyendo `K`).
- Cambiar tipos de timeout en `debounce`: usar `let timeout: number | undefined` y `window.clearTimeout(timeout)` para compatibilidad TS + browser.
- Inicializar `inThrottle` en `throttle` con `let inThrottle = false;` y añadir pruebas de comportamiento (calls/intervalo).
- Documentar el propósito de `generateId` o reemplazar por `crypto.randomUUID()` cuando sea necesario un id fuerte.
- En `validateFileType`, añadir fallback por extensión (`filename.split('.').pop()`) y normalizar tipos aceptados desde `FILE_CONFIG`.
- Extraer reglas de archivo (tipos y límites) hacia `src/config/api.ts` si no está ya centralizado; consumir esa configuración desde utilidades y componentes.
- Añadir tests unitarios para `formatBytes`, `validateFile`, `formatRut`, `validateRut`, `debounce` y `throttle`.
- Añadir un pequeño `src/utils/README.md` describiendo el alcance de estas utilidades y recomendaciones de uso (ej. `generateId` sólo para claves temporales).
- Remover logs de depuración en producción y centralizar nivel de logging (uso de una pequeña utilidad `logger` que silencia `console` en producción).

---

> Nota: este documento corresponde al análisis de `src/utils/helpers.ts`. Si querés, aplico automáticamente las correcciones sugeridas (por ejemplo: inicializar `inThrottle`, tipar `debounce`, y corregir `validateRut`) y agrego tests; indicame si preferís que haga los cambios ahora.
