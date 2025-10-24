# 🔔 Sistema de Notificaciones de Documentos

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de notificaciones de documentos que se integra con el Header del sistema. El sistema monitorea automáticamente documentos vencidos, por vencer, y cursos vencidos, proporcionando alertas visuales y un modal interactivo para gestionar las notificaciones.

## 🎯 Funcionalidades Implementadas

### 1. **Tipos de Notificaciones de Documentos**
- **📄 Documentos Vencidos**: Documentos que ya han expirado
- **⏰ Documentos por Vencer**: Documentos que vencen en 30, 15 o 7 días
- **📋 Documentos Faltantes**: Personal sin documentación completa
- **🔄 Documentos Renovados**: Confirmación de renovaciones

### 1.2. **Tipos de Notificaciones de Programación**
- **⚠️ Sin Programación**: Personal sin programación asignada para la semana actual
- **📅 Programación Incompleta**: Personal con menos de 3 días asignados
- **⏰ Próxima a Vencer**: Personal sin programación para la próxima semana
- **🚫 Conflicto de Programación**: Personal asignado a múltiples lugares (futuro)

### 2. **Sistema de Prioridades**

#### **Para Documentos:**
- **🔴 Alta**: Documentos vencidos o que vencen en ≤7 días
- **🟡 Media**: Documentos que vencen en 8-15 días
- **🔵 Baja**: Documentos que vencen en 16-30 días

#### **Para Programación:**
- **🔴 Alta**: Personal sin programación asignada
- **🟡 Media**: Programación incompleta o próxima a vencer
- **🔵 Baja**: Programación con pocos días asignados

### 3. **Características del Modal**
- **Filtros**: Por prioridad y estado (leídas/no leídas)
- **Acciones**: Marcar como leída, navegar a documento
- **Navegación Inteligente**: Botones de acción navegan directamente a documentos de la persona
- **Estadísticas**: Contador total, no leídas, alta prioridad
- **Diseño Responsivo**: Adaptable a diferentes tamaños de pantalla

## 🏗️ Arquitectura Técnica

### **Archivos Creados/Modificados**

#### 1. **Tipos e Interfaces** (`src/types/index.ts`)
```typescript
interface NotificacionDocumento {
  id: string;
  tipo: 'documento_por_vencer' | 'documento_vencido' | 'documento_faltante' | 'documento_renovado';
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  mensaje: string;
  personal_id: string;
  personal_nombre?: string;
  documento_id?: number;
  documento_nombre?: string;
  fecha_vencimiento?: string;
  dias_restantes?: number;
  leida: boolean;
  fecha_creacion: string;
  accion_requerida?: string;
  url_accion?: string;
}
```

#### 2. **Hook de Notificaciones** (`src/hooks/useNotificaciones.ts`)
- **Integración**: Combina datos de `useDocumentosVencidos`, `useDocumentosPorVencer`, `useCursosVencidos`
- **Generación Automática**: Crea notificaciones basadas en los datos existentes
- **Gestión de Estado**: Maneja notificaciones eliminadas con persistencia en localStorage
- **Persistencia**: Las notificaciones eliminadas se guardan en localStorage y persisten entre sesiones
- **Eliminación Permanente**: Las notificaciones "leídas" se eliminan permanentemente del sistema
- **Utilidades**: Funciones para colores, iconos y formateo
- **Debug**: Función para restaurar notificaciones eliminadas (botón Restaurar en el modal)

#### 3. **Modal de Notificaciones** (`src/components/common/NotificacionesModal.tsx`)
- **Interfaz Completa**: Header, filtros, lista de notificaciones, footer
- **Interactividad**: Botones de acción, marcar como leída
- **Filtros Dinámicos**: Por prioridad y estado
- **Navegación Inteligente**: Botones de acción navegan a documentos de la persona
- **Estados de Carga**: Indicadores de loading y estados vacíos
- **Z-Index Alto**: `z-[9999]` para aparecer por encima de todos los elementos
- **Centrado Perfecto**: Modal centrado en pantalla con padding responsivo
- **Múltiples Formas de Cerrar**: Botón X, click fuera del modal, tecla Escape
- **Prevención de Scroll**: Bloquea el scroll del body cuando está abierto

#### 4. **Sistema de Navegación Global** (`src/components/layout/Layout.tsx`)
- **Listener Global**: Escucha eventos de navegación desde cualquier página
- **Detección de Página**: Identifica si ya estamos en la página de Personal
- **Navegación Automática**: Navega a Personal si estamos en otra página
- **Re-disparo de Eventos**: Re-dispara el evento después de la navegación
- **Integración con Router**: Usa React Router para navegación programática

#### 5. **Hook de Navegación** (`src/hooks/useNavegacionDocumentos.ts`)
- **Navegación Centralizada**: Función única para navegar a documentos
- **Reutilizable**: Puede ser usado desde cualquier componente
- **Eventos Personalizados**: Dispara eventos del navegador para comunicación
- **Debug Completo**: Logs detallados para seguimiento de navegación

#### 6. **Header Actualizado** (`src/components/layout/Header.tsx`)
- **Contador Dinámico**: Badge rojo con número de notificaciones no leídas
- **Interactividad**: Click para abrir modal
- **Integración**: Importa y usa el hook y modal de notificaciones

## 🔄 Flujo de Funcionamiento

### **1. Generación de Notificaciones**
```typescript
// El hook useNotificaciones combina datos de múltiples fuentes:
const { data: documentosVencidos } = useDocumentosVencidos();
const { data: documentosPorVencer } = useDocumentosPorVencer();
const { data: cursosVencidos } = useCursosVencidos();

// Genera notificaciones automáticamente
const notificaciones = generarNotificaciones();
```

### **2. Visualización en Header**
```typescript
// Contador dinámico que se actualiza automáticamente
const { notificacionesNoLeidas } = useNotificaciones();

// Badge que solo aparece si hay notificaciones
{notificacionesNoLeidas > 0 && (
  <span className="badge">
    {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
  </span>
)}
```

### **3. Modal Interactivo**
- **Apertura**: Click en el icono de campana
- **Filtros**: Usuario puede filtrar por prioridad y estado
- **Acciones**: Marcar como leída, navegar a documento
- **Cierre**: Botón X o click fuera del modal

## 📊 Datos Monitoreados

### **Documentos Vencidos**
- **Fuente**: `useDocumentosVencidos()`
- **Prioridad**: Alta (rojo)
- **Acción**: "Renovar documento"
- **URL**: `/personal/{rut}/documentos`

### **Documentos por Vencer**
- **Fuente**: `useDocumentosPorVencer()`
- **Prioridad**: 
  - Alta: ≤7 días
  - Media: 8-15 días
  - Baja: 16-30 días
- **Acción**: "Revisar documento"

### **Cursos Vencidos**
- **Fuente**: `useCursosVencidos()`
- **Prioridad**: Alta (rojo)
- **Acción**: "Renovar curso"
- **URL**: `/personal/{id}/cursos`

## 🎨 Diseño y UX

### **Colores por Prioridad**
- **Alta**: `bg-red-100 text-red-800 border-red-200`
- **Media**: `bg-yellow-100 text-yellow-800 border-yellow-200`
- **Baja**: `bg-blue-100 text-blue-800 border-blue-200`

### **Iconos por Tipo**
- **Documento Vencido**: ⚠️ (AlertTriangle)
- **Documento por Vencer**: ⏰ (Clock)
- **Documento Faltante**: 📋 (FileText)
- **Documento Renovado**: ✅ (CheckCircle)

### **Estados Visuales**
- **No Leída**: Punto azul + fondo azul claro
- **Leída**: Icono verde de check
- **Cargando**: Spinner animado
- **Vacío**: Icono de campana + mensaje explicativo

## 🚀 Próximas Mejoras Sugeridas

### **Fase 2: Notificaciones de Programación**
- Programación incompleta
- Conflictos de horarios
- Cambios de última hora

### **Fase 3: Notificaciones de Personal**
- Nuevo personal registrado
- Cambios de estado
- Documentación incompleta

### **Mejoras Técnicas**
- **Backend Integration**: Endpoints reales para notificaciones
- **Real-time Updates**: WebSockets para actualizaciones en tiempo real
- **Persistencia**: Base de datos para notificaciones leídas
- **Configuración**: Panel para configurar tipos de notificaciones

## ✅ Estado de Implementación

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **Tipos e Interfaces** | ✅ **COMPLETO** | Definidos en `src/types/index.ts` |
| **Hook useNotificaciones** | ✅ **COMPLETO** | Lógica de negocio implementada |
| **Modal de Notificaciones** | ✅ **COMPLETO** | Interfaz completa y funcional |
| **Header Actualizado** | ✅ **COMPLETO** | Contador dinámico y modal integrado |
| **Integración con Datos** | ✅ **COMPLETO** | Conectado con hooks existentes |

## 🎯 Resultado Final

El sistema de notificaciones está **100% funcional** y listo para usar. Los usuarios pueden:

1. **Ver el contador** de notificaciones no leídas en el Header
2. **Hacer click** en la campana para abrir el modal
3. **Filtrar** notificaciones por prioridad y estado
4. **Hacer click en "Renovar Documento"** para navegar automáticamente a los documentos de la persona
5. **Marcar como leídas** las notificaciones (se eliminan permanentemente)
6. **Ver estadísticas** en tiempo real

## 🔗 **Sistema de Navegación Implementado**

### **Navegación Inteligente**
- **Botón "Renovar Documento"**: Navega automáticamente a la página de Personal
- **Apertura Automática**: Abre el modal de detalles de la persona correspondiente
- **Búsqueda Inteligente**: Encuentra la persona por ID o RUT
- **Eventos Personalizados**: Usa eventos del navegador para comunicación entre componentes

### **Flujo de Navegación Global**
1. **Usuario hace click** en "Renovar Documento" en una notificación
2. **Sistema cierra** el modal de notificaciones
3. **Sistema detecta** la página actual (Dashboard, Programación, Servicios, etc.)
4. **Si no está en Personal**: Navega automáticamente a `/personal`
5. **Sistema re-dispara** el evento después de la navegación
6. **Sistema busca** la persona por ID o RUT en los datos actuales
7. **Si no encuentra** la persona, aplica filtro de búsqueda automáticamente
8. **Sistema busca** nuevamente con el filtro aplicado
9. **Sistema abre** automáticamente el modal de detalles de la persona
10. **Usuario puede** ver y gestionar los documentos directamente

### **Flujo de Navegación Local (desde Personal)**
1. **Usuario hace click** en "Renovar Documento" en una notificación
2. **Sistema cierra** el modal de notificaciones
3. **Sistema detecta** que ya está en `/personal`
4. **Sistema busca** la persona por ID o RUT en los datos actuales
5. **Si no encuentra** la persona, aplica filtro de búsqueda automáticamente
6. **Sistema busca** nuevamente con el filtro aplicado
7. **Sistema abre** automáticamente el modal de detalles de la persona
8. **Usuario puede** ver y gestionar los documentos directamente

### **Búsqueda Inteligente**
- **Búsqueda Inicial**: Busca en los datos actualmente cargados
- **Búsqueda Automática**: Si no encuentra, aplica filtro de búsqueda por RUT
- **Búsqueda Normalizada**: Compara RUTs con y sin puntos/guiones
- **Manejo de Paginación**: Funciona independientemente de la página actual

### **Navegación Global**
- **Desde Cualquier Página**: Funciona desde Dashboard, Programación, Servicios, etc.
- **Navegación Automática**: Detecta la página actual y navega a Personal si es necesario
- **Listener Global**: Sistema de eventos que funciona en toda la aplicación
- **Re-disparo Inteligente**: Re-dispara el evento después de la navegación
- **Transiciones Modernas**: Overlay de carga con animaciones suaves y feedback visual

## 🎨 **Mejoras Visuales Implementadas**

### **Transiciones Modernas**
- **Overlay de Navegación**: Pantalla de carga elegante con gradiente azul
- **Animaciones Suaves**: Fade in/out con efectos de escala
- **Feedback Visual**: Spinner animado y mensajes informativos
- **Timing Optimizado**: Transiciones de 300-400ms para fluidez

### **Animaciones CSS**
```css
@keyframes fadeInScale {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes slideInUp {
  0% { opacity: 0; transform: translateY(30px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

### **Experiencia de Usuario**
- **Feedback Inmediato**: El usuario ve inmediatamente que algo está pasando
- **Transición Fluida**: No hay saltos bruscos entre páginas
- **Carga Progresiva**: El modal aparece suavemente después de la navegación
- **Diseño Consistente**: Mantiene la identidad visual del sistema

## 📅 **SISTEMA DE NOTIFICACIONES DE PROGRAMACIÓN**

### **Funcionalidades Implementadas**

#### **1. Detección Automática**
- **Personal Sin Programación**: Detecta personal sin programación para la semana actual
- **Programación Incompleta**: Identifica personal con menos de 3 días asignados
- **Próxima a Vencer**: Alerta sobre personal sin programación para la próxima semana

#### **2. Interfaz de Usuario**
- **Icono Calendar**: Botón separado en el Header con badge verde
- **Modal Dedicado**: Interfaz específica para notificaciones de programación
- **Filtros Avanzados**: Por prioridad y tipo de notificación
- **Acciones Directas**: Navegación a página de programación

#### **3. Navegación Inteligente**
- **URLs Específicas**: Navega directamente a la programación del personal
- **Parámetros de Búsqueda**: Incluye RUT y semana en la URL
- **Fallback**: Navegación a página general de programación si falla

### **Implementación Técnica**

#### **Hook Principal: `useNotificacionesProgramacion`**
```typescript
// Detección de semanas
const semanaActual = getSemanaActual();
const proximaSemana = getProximaSemana();

// Obtención de datos
const { programacion: programacionActual } = useProgramacionSemanal(0, semanaActual);
const { programacion: programacionProxima } = useProgramacionSemanal(0, proximaSemana);
const { data: personalData } = usePersonalList(1, 1000, '');
```

#### **Tipos de Notificaciones Generadas**
1. **Sin Programación**: Personal sin asignación para semana actual
2. **Programación Incompleta**: Menos de 3 días asignados
3. **Próxima a Vencer**: Sin programación para próxima semana

#### **Persistencia de Estado**
- **LocalStorage**: Notificaciones eliminadas se guardan localmente
- **Estado Reactivo**: Actualización automática cuando cambian los datos
- **Limpieza Automática**: Restauración de notificaciones para testing

### **Integración con Header**

#### **Dos Iconos Separados**
- **🔔 Bell (Rojo)**: Notificaciones de documentos
- **📅 Calendar (Verde)**: Notificaciones de programación

#### **Contadores Independientes**
- **Total General**: Suma de ambos tipos de notificaciones
- **Contadores Específicos**: Badges separados por tipo

### **Flujo de Usuario**

1. **Usuario ve badge verde** en icono Calendar
2. **Click en Calendar** → Abre modal de programación
3. **Ve notificaciones** de programación pendientes
4. **Click en acción** → Navega a programación específica
5. **Marca como leída** → Notificación se elimina permanentemente

El sistema se integra perfectamente con la arquitectura existente y utiliza los datos ya disponibles en el sistema.
