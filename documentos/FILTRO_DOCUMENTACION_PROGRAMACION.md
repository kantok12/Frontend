# Filtro de Documentación para Programación

## Resumen
Se implementó un sistema de filtrado que restringe el personal disponible para programación basándose en su documentación de acreditación. Solo el personal con documentación personal completa y vigente puede ser asignado a servicios.

## Funcionalidades Implementadas

### 1. Hook de Personal con Documentación (`usePersonalConDocumentacion`)

**Archivo:** `src/hooks/usePersonalConDocumentacion.ts`

#### Características:
- **Filtrado automático:** Solo retorna personal con documentación completa y vigente
- **Verificación de documentos requeridos:** Valida que tenga todos los documentos necesarios
- **Verificación de vigencia:** Excluye personal con documentos vencidos o por vencer
- **Logging detallado:** Proporciona información de debug sobre el proceso de filtrado

#### Documentos Requeridos:
```typescript
const DOCUMENTOS_REQUERIDOS = [
  'certificado_curso',
  'certificado_medico', 
  'licencia_conducir',
  'certificado_seguridad'
];
```

#### Estados de Documentación:
- **Completa y vigente:** Personal disponible para programación
- **Faltan documentos:** Personal excluido por documentos faltantes
- **Documentos vencidos:** Personal excluido por documentos expirados
- **Documentos por vencer:** Personal excluido por documentos próximos a vencer

### 2. Modal de Programación Actualizado

**Archivo:** `src/components/programacion/ProgramacionCalendarioModal.tsx`

#### Mejoras Implementadas:

##### A. Información Visual
- **Banner informativo:** Muestra el estado de documentación del personal
- **Contador dinámico:** Indica cuántas personas están disponibles vs. total
- **Advertencias:** Alerta cuando no hay personal disponible

##### B. Filtrado de Personal
- **Select filtrado:** Solo muestra personal con documentación completa
- **Estados de carga:** Indica cuando se están cargando los datos
- **Mensajes informativos:** Explica por qué no hay opciones disponibles

##### C. Validaciones
- **Botones deshabilitados:** Cuando no hay personal disponible
- **Prevención de asignaciones:** No permite crear asignaciones sin personal válido

## Flujo de Verificación

### 1. Obtención de Datos
```typescript
// Obtener todos los personal
const { data: personalData } = usePersonalList(1, 1000, '');

// Obtener todos los documentos
const { todosDocumentos } = useAllDocumentos();
```

### 2. Verificación por Persona
```typescript
const verificarDocumentacionCompleta = (rut: string, todosDocumentos: any[]) => {
  // 1. Verificar documentos requeridos
  // 2. Verificar vigencia de documentos
  // 3. Retornar estado de acreditación
};
```

### 3. Filtrado Final
```typescript
const personalFiltrado = personalList.filter((persona: any) => {
  const verificacion = verificarDocumentacionCompleta(persona.rut, documentosList);
  return verificacion.tieneDocumentacionCompleta;
});
```

## Interfaz de Usuario

### Banner Informativo
```jsx
<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex items-center">
    <Shield className="h-5 w-5 text-blue-600 mr-2" />
    <div>
      <h4 className="text-sm font-medium text-blue-800">
        Personal con Documentación Completa
      </h4>
      <p className="text-xs text-blue-600 mt-1">
        Solo se muestra personal con documentación personal completa y vigente
      </p>
      <p className="text-xs text-blue-600">
        Disponibles: {cantidadConDocumentacion} de {totalPersonal} personas
      </p>
    </div>
  </div>
</div>
```

### Advertencia de No Disponibilidad
```jsx
{!isLoadingPersonalConDocumentacion && cantidadConDocumentacion === 0 && (
  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="flex items-center">
      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
      <div>
        <h4 className="text-sm font-medium text-yellow-800">
          No hay personal disponible para programación
        </h4>
        <p className="text-xs text-yellow-600 mt-1">
          Todos los personal deben tener documentación completa y vigente para ser asignados a servicios.
        </p>
      </div>
    </div>
  </div>
)}
```

### Select de Personal Filtrado
```jsx
<select
  name="personalId"
  value={nuevaAsignacion.personalId}
  onChange={handleInputChange}
  disabled={isLoadingPersonalConDocumentacion}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
>
  <option value="">
    {isLoadingPersonalConDocumentacion 
      ? 'Cargando personal con documentación...' 
      : cantidadConDocumentacion === 0
        ? 'No hay personal con documentación completa'
        : `Seleccionar personal (${cantidadConDocumentacion} disponibles)...`
    }
  </option>
  {personalConDocumentacion.map((persona) => (
    <option key={persona.id} value={persona.id}>
      {persona.nombre} {persona.apellido} - {persona.rut}
    </option>
  ))}
</select>
```

## Logging y Debug

### Información de Debug
```typescript
console.log('🔍 Verificando documentación para', personalList.length, 'personas');
console.log('📋 Total de documentos disponibles:', documentosList.length);

// Por cada persona
console.log(`✅ ${persona.nombre} ${persona.apellido} (${persona.rut}): ${verificacion.razon}`);
console.log(`❌ ${persona.nombre} ${persona.apellido} (${persona.rut}): ${verificacion.razon}`);

console.log(`📊 Personal con documentación completa: ${personalFiltrado.length} de ${personalList.length}`);
```

## Beneficios

### 1. Cumplimiento Normativo
- **Acreditación garantizada:** Solo personal con documentación válida
- **Trazabilidad:** Registro de quién puede ser asignado y por qué
- **Auditoría:** Información clara sobre el estado de documentación

### 2. Experiencia de Usuario
- **Interfaz clara:** Información visual sobre disponibilidad
- **Prevención de errores:** No permite asignaciones inválidas
- **Feedback inmediato:** Muestra el estado de documentación en tiempo real

### 3. Gestión Operativa
- **Eficiencia:** Filtrado automático reduce tiempo de búsqueda
- **Confiabilidad:** Elimina asignaciones de personal no acreditado
- **Monitoreo:** Visibilidad del estado general de documentación

## Configuración

### Documentos Requeridos
Los documentos requeridos se pueden modificar en el archivo `usePersonalConDocumentacion.ts`:

```typescript
const DOCUMENTOS_REQUERIDOS = [
  'certificado_curso',      // Certificado de curso
  'certificado_medico',     // Certificado médico
  'licencia_conducir',      // Licencia de conducir
  'certificado_seguridad'   // Certificado de seguridad
];
```

### Políticas de Vigencia
- **Documentos vencidos:** Excluidos automáticamente
- **Documentos por vencer:** Excluidos (configurable)
- **Documentos sin fecha:** Tratados según política específica

## Consideraciones Técnicas

### Rendimiento
- **Caché:** Los datos se cachean por 5 minutos
- **Filtrado eficiente:** Se realiza en memoria después de cargar datos
- **Lazy loading:** Solo se ejecuta cuando el modal está abierto

### Escalabilidad
- **Paginación:** Soporte para grandes volúmenes de personal
- **Optimización:** Filtrado se realiza una vez por sesión
- **Memoria:** Uso eficiente de memoria con filtrado temprano

## Próximas Mejoras

### 1. Configuración Dinámica
- **Panel de administración:** Para configurar documentos requeridos
- **Políticas personalizables:** Diferentes reglas por tipo de servicio
- **Excepciones:** Manejo de casos especiales

### 2. Notificaciones
- **Alertas proactivas:** Notificar cuando documentos están por vencer
- **Recordatorios:** Sistema de notificaciones para renovación
- **Reportes:** Generación de reportes de estado de documentación

### 3. Integración Avanzada
- **API de terceros:** Integración con sistemas de acreditación externos
- **Sincronización:** Actualización automática de estados
- **Validación en tiempo real:** Verificación continua de vigencia
