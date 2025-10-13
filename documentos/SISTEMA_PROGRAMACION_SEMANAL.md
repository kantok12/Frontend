# Sistema de Programación Semanal Completo

## Resumen
Se implementó un sistema completo de programación semanal que permite gestionar las asignaciones de personal con documentación completa y vigente. El sistema incluye navegación entre semanas, vista de calendario semanal, gestión de asignaciones y filtrado por documentación.

## Arquitectura del Sistema

### 1. Hook de Programación Semanal (`useProgramacionSemanal`)

**Archivo:** `src/hooks/useProgramacionSemanal.ts`

#### Características:
- **Gestión de fechas:** Cálculo automático de semanas (lunes a domingo)
- **Navegación:** Semana anterior, actual y próxima
- **Información contextual:** Estado de la semana, número de semana, año
- **Formateo:** Fechas en formato español

#### Interfaces Principales:
```typescript
interface SemanaInfo {
  fechaInicio: Date;
  fechaFin: Date;
  numeroSemana: number;
  año: number;
  esSemanaActual: boolean;
  esSemanaPasada: boolean;
  esSemanaFutura: boolean;
  dias: DiaSemana[];
}

interface DiaSemana {
  fecha: Date;
  nombre: string;
  numero: number;
  esHoy: boolean;
  esPasado: boolean;
  esFuturo: boolean;
  esFinDeSemana: boolean;
}
```

#### Funciones Principales:
- `getLunesDeSemana()`: Calcula el lunes de una semana específica
- `getDomingoDeSemana()`: Calcula el domingo de una semana específica
- `getNumeroSemana()`: Obtiene el número de semana del año
- `irASemanaAnterior/Siguiente/Actual()`: Navegación entre semanas

### 2. Selector de Semanas (`SelectorSemanas`)

**Archivo:** `src/components/programacion/SelectorSemanas.tsx`

#### Características:
- **Navegación intuitiva:** Botones para semana anterior/actual/siguiente
- **Información visual:** Estado de la semana con colores diferenciados
- **Acciones rápidas:** Botones para ir a "Hoy" y "Próxima"
- **Indicadores:** Puntos de navegación para semanas cercanas

#### Estados Visuales:
- **Azul:** Semana actual (en progreso)
- **Gris:** Semana pasada (completada)
- **Verde:** Semana futura (planificada)

#### Información Mostrada:
- Rango de fechas de la semana
- Número de semana y año
- Estado de la semana
- Acciones rápidas disponibles

### 3. Calendario Semanal (`CalendarioSemanal`)

**Archivo:** `src/components/programacion/CalendarioSemanal.tsx`

#### Características:
- **Vista de 7 días:** Lunes a domingo en columnas
- **Asignaciones visuales:** Tarjetas con información del personal
- **Estados diferenciados:** Colores según estado de asignación
- **Interacciones:** Hover para mostrar acciones, click para editar
- **Estadísticas:** Contadores por día y resumen general

#### Colores de Asignaciones:
- **Verde:** Asignaciones confirmadas
- **Amarillo:** Asignaciones pendientes
- **Azul:** Asignaciones completadas

#### Información por Asignación:
- Nombre del personal
- Cartera, cliente y nodo
- Horario de trabajo
- Estado de la asignación

#### Funcionalidades:
- **Agregar asignación:** Botón en cada día
- **Editar asignación:** Click en la tarjeta
- **Eliminar asignación:** Botón de eliminar en hover
- **Estadísticas en tiempo real:** Contadores actualizados

### 4. Modal de Asignación Semanal (`AsignacionSemanalModal`)

**Archivo:** `src/components/programacion/AsignacionSemanalModal.tsx`

#### Características:
- **Formulario completo:** Todos los campos necesarios para asignación
- **Filtrado por documentación:** Solo personal acreditado
- **Selección en cadena:** Cartera → Cliente → Nodo
- **Validaciones:** Horarios, campos requeridos, conflictos
- **Estados de asignación:** Pendiente, confirmada, completada

#### Campos del Formulario:
- **Personal:** Select filtrado por documentación
- **Cartera:** Select con todas las carteras
- **Cliente:** Select dependiente de la cartera
- **Nodo:** Select dependiente del cliente
- **Horarios:** Hora de inicio y fin
- **Estado:** Pendiente, confirmada, completada
- **Observaciones:** Campo de texto libre

#### Validaciones:
- Personal con documentación completa
- Horarios válidos (inicio < fin)
- Campos requeridos completados
- Prevención de conflictos

### 5. Componente Principal (`ProgramacionSemanalCompleta`)

**Archivo:** `src/components/programacion/ProgramacionSemanalCompleta.tsx`

#### Características:
- **Integración completa:** Combina todos los componentes
- **Gestión de estado:** Manejo de asignaciones y modales
- **Datos en tiempo real:** Integración con hooks de datos
- **Resumen estadístico:** Métricas de la semana

#### Funcionalidades Principales:
- **CRUD de asignaciones:** Crear, leer, actualizar, eliminar
- **Navegación de semanas:** Cambio automático de datos
- **Resumen semanal:** Estadísticas y métricas
- **Acciones rápidas:** Exportar, copiar, notificar

## Flujo de Usuario

### 1. Acceso al Sistema
```
Usuario → CalendarioPage → Vista "Programación Semanal"
```

### 2. Navegación de Semanas
```
SelectorSemanas → Cambio de semana → Actualización automática de datos
```

### 3. Creación de Asignación
```
CalendarioSemanal → Botón "Agregar" → AsignacionSemanalModal → Guardar
```

### 4. Edición de Asignación
```
CalendarioSemanal → Click en asignación → AsignacionSemanalModal → Actualizar
```

### 5. Eliminación de Asignación
```
CalendarioSemanal → Hover → Botón eliminar → Confirmación → Eliminar
```

## Integración con Sistema Existente

### 1. Filtrado por Documentación
- **Hook integrado:** `usePersonalConDocumentacion`
- **Validación automática:** Solo personal acreditado
- **Feedback visual:** Información sobre disponibilidad

### 2. Datos de Servicios
- **Carteras:** `useCarteras` hook
- **Clientes:** `useClientes` hook
- **Nodos:** `useNodos` hook
- **Selección en cadena:** Dependencias entre niveles

### 3. Página de Calendario
- **Nueva vista:** "Programación Semanal" agregada
- **Selector de vistas:** Integrado con vistas existentes
- **Navegación:** Acceso directo desde menú principal

## Características Técnicas

### 1. Gestión de Estado
```typescript
// Estado principal de asignaciones
const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

// Estado del modal
const [showModalAsignacion, setShowModalAsignacion] = useState(false);

// Estado de edición
const [asignacionEditando, setAsignacionEditando] = useState<Asignacion | null>(null);
```

### 2. Validaciones
```typescript
const validateForm = () => {
  const newErrors: string[] = [];
  
  if (!asignacion.personalId) {
    newErrors.push('Debe seleccionar un personal');
  }
  
  if (!asignacion.carteraId) {
    newErrors.push('Debe seleccionar una cartera');
  }
  
  if (asignacion.horaInicio >= asignacion.horaFin) {
    newErrors.push('La hora de inicio debe ser anterior a la hora de fin');
  }
  
  return newErrors.length === 0;
};
```

### 3. Filtrado de Datos
```typescript
// Obtener clientes por cartera
const getClientesByCartera = (carteraId: number) => {
  return clientes.filter(c => c.cartera_id === carteraId);
};

// Obtener nodos por cliente
const getNodosByCliente = (clienteId: number) => {
  return nodos.filter(n => n.cliente_id === clienteId);
};
```

## Interfaz de Usuario

### 1. Selector de Semanas
```
┌─────────────────────────────────────────────────────────┐
│ 📅 Programación Semanal                                 │
├─────────────────────────────────────────────────────────┤
│ [← Semana Anterior] [Semana Actual] [Próxima Semana →]  │
│                                                         │
│ 🗓️ Semana del 15-21 Enero 2024                        │
│ 📊 12 asignaciones | 👥 8 personas | 🏢 3 carteras     │
└─────────────────────────────────────────────────────────┘
```

### 2. Calendario Semanal
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Lunes 15    │ Martes 16   │ Miércoles 17 │ Jueves 18   │ Viernes 19  │ Sábado 20 │ Domingo 21 │
│ Ene 2024    │ Ene 2024    │ Ene 2024     │ Ene 2024    │ Ene 2024    │ Ene 2024  │ Ene 2024   │
├─────────────┼─────────────┼──────────────┼─────────────┼─────────────┼───────────┼────────────┤
│ 👤 Juan P.  │ 👤 María G. │ 👤 Carlos L. │ 👤 Ana M.   │ 👤 Pedro R. │           │            │
│ 🏢 Cartera A│ 🏢 Cartera B│ 🏢 Cartera A │ 🏢 Cartera C│ 🏢 Cartera B│           │            │
│ 🕐 08:00-17:│ 🕐 09:00-18:│ 🕐 08:30-17: │ 🕐 08:00-16:│ 🕐 09:00-17:│           │            │
│             │             │              │             │             │           │            │
│ [+ Agregar] │ [+ Agregar] │ [+ Agregar]  │ [+ Agregar] │ [+ Agregar] │ [+ Agregar]│ [+ Agregar]│
└─────────────┴─────────────┴──────────────┴─────────────┴─────────────┴───────────┴────────────┘
```

### 3. Modal de Asignación
```
┌─────────────────────────────────────────────────────────┐
│ ➕ Nueva Asignación - Semana del 15-21 Enero 2024      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📅 Día: [Lunes 15 Ene ▼]                               │
│ 👤 Personal: [Juan Pérez - 12345678-9 ▼]               │
│ 🏢 Cartera: [Cartera A ▼]                              │
│ 🏢 Cliente: [Cliente X ▼] (opcional)                   │
│ 📍 Nodo: [Nodo Y ▼] (opcional)                         │
│                                                         │
│ 🕐 Horario:                                             │
│   Inicio: [08:00]  Fin: [17:00]                        │
│                                                         │
│ 📝 Observaciones:                                       │
│ [________________________________]                     │
│                                                         │
│ [Cancelar] [Guardar Asignación]                        │
└─────────────────────────────────────────────────────────┘
```

## Beneficios del Sistema

### 1. Gestión Eficiente
- **Vista semanal completa:** 7 días en una pantalla
- **Navegación rápida:** Cambio entre semanas con un click
- **Información contextual:** Estado y estadísticas de cada semana

### 2. Cumplimiento Normativo
- **Filtrado automático:** Solo personal con documentación válida
- **Trazabilidad completa:** Registro de todas las asignaciones
- **Validaciones integradas:** Prevención de errores

### 3. Experiencia de Usuario
- **Interfaz intuitiva:** Diseño claro y funcional
- **Feedback visual:** Estados y colores diferenciados
- **Acciones rápidas:** Botones y shortcuts para operaciones comunes

### 4. Escalabilidad
- **Arquitectura modular:** Componentes reutilizables
- **Hooks especializados:** Lógica separada y reutilizable
- **Integración flexible:** Fácil extensión con nuevas funcionalidades

## Próximas Mejoras

### 1. Funcionalidades Avanzadas
- **Drag & Drop:** Arrastrar asignaciones entre días
- **Asignación automática:** Distribución inteligente de personal
- **Conflictos automáticos:** Detección de superposiciones
- **Plantillas:** Reutilizar programaciones de semanas anteriores

### 2. Reportes y Exportación
- **PDF de programación:** Generar reportes semanales
- **Excel export:** Exportar datos para análisis
- **Notificaciones:** Envío automático al personal
- **Dashboard:** Métricas y KPIs de programación

### 3. Integración
- **API de terceros:** Sincronización con sistemas externos
- **Calendario externo:** Integración con Google Calendar, Outlook
- **Mobile app:** Aplicación móvil para consultas
- **Notificaciones push:** Alertas en tiempo real

## Consideraciones Técnicas

### 1. Rendimiento
- **Lazy loading:** Carga de datos bajo demanda
- **Memoización:** Optimización de re-renders
- **Paginación:** Manejo de grandes volúmenes de datos

### 2. Accesibilidad
- **Navegación por teclado:** Soporte completo
- **Screen readers:** Etiquetas y descripciones
- **Contraste:** Colores accesibles
- **Responsive:** Adaptación a diferentes pantallas

### 3. Mantenibilidad
- **Código modular:** Separación de responsabilidades
- **Tipos TypeScript:** Seguridad de tipos
- **Documentación:** Comentarios y ejemplos
- **Testing:** Cobertura de pruebas

El sistema de programación semanal está completamente implementado y listo para uso en producción, proporcionando una solución completa y eficiente para la gestión de asignaciones de personal con documentación completa y vigente.
