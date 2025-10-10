# Nuevos Endpoints Integrados al Sistema

## Resumen
Se han integrado exitosamente los siguientes endpoints al sistema frontend:

### Mínimo Personal
- `GET /api/servicios/minimo-personal`
- `POST /api/servicios/minimo-personal`
- `GET /api/servicios/minimo-personal/:id`
- `PUT /api/servicios/minimo-personal/:id`
- `DELETE /api/servicios/minimo-personal/:id`
- `GET /api/servicios/minimo-personal/:id/calcular`

### Acuerdos
- `GET /api/servicios/acuerdos`
- `POST /api/servicios/acuerdos`
- `GET /api/servicios/acuerdos/:id`
- `PUT /api/servicios/acuerdos/:id`
- `DELETE /api/servicios/acuerdos/:id`
- `GET /api/servicios/acuerdos/vencer`
- `POST /api/servicios/acuerdos/:id/activar`
- `POST /api/servicios/acuerdos/:id/desactivar`

## Archivos Modificados/Creados

### 1. Tipos TypeScript (`src/types/index.ts`)
Se agregaron las siguientes interfaces:

#### Mínimo Personal
- `MinimoPersonal`: Estructura principal del mínimo personal
- `CreateMinimoPersonalData`: Datos para crear mínimo personal
- `UpdateMinimoPersonalData`: Datos para actualizar mínimo personal
- `MinimoPersonalCalculo`: Resultado del cálculo de mínimo personal

#### Acuerdos
- `Acuerdo`: Estructura principal del acuerdo
- `CreateAcuerdoData`: Datos para crear acuerdo
- `UpdateAcuerdoData`: Datos para actualizar acuerdo
- `AcuerdoVencer`: Acuerdos próximos a vencer

### 2. Servicios API (`src/services/api.ts`)
Se agregaron métodos para todos los endpoints:

#### Mínimo Personal
- `getMinimoPersonal()`: Obtener lista con filtros
- `createMinimoPersonal()`: Crear nuevo mínimo personal
- `getMinimoPersonalById()`: Obtener por ID
- `updateMinimoPersonal()`: Actualizar mínimo personal
- `deleteMinimoPersonal()`: Eliminar mínimo personal
- `calcularMinimoPersonal()`: Calcular cumplimiento

#### Acuerdos
- `getAcuerdos()`: Obtener lista con filtros
- `createAcuerdo()`: Crear nuevo acuerdo
- `getAcuerdoById()`: Obtener por ID
- `updateAcuerdo()`: Actualizar acuerdo
- `deleteAcuerdo()`: Eliminar acuerdo
- `getAcuerdosVencer()`: Obtener acuerdos próximos a vencer
- `activarAcuerdo()`: Activar acuerdo
- `desactivarAcuerdo()`: Desactivar acuerdo

### 3. Hooks React Query

#### `src/hooks/useMinimoPersonal.ts`
- `useMinimoPersonal()`: Hook para obtener lista
- `useMinimoPersonalById()`: Hook para obtener por ID
- `useCreateMinimoPersonal()`: Hook para crear
- `useUpdateMinimoPersonal()`: Hook para actualizar
- `useDeleteMinimoPersonal()`: Hook para eliminar
- `useCalcularMinimoPersonal()`: Hook para calcular
- `useRecalcularMinimoPersonal()`: Hook para recalcular
- `useMinimoPersonalDashboard()`: Hook combinado para dashboard

#### `src/hooks/useAcuerdos.ts`
- `useAcuerdos()`: Hook para obtener lista
- `useAcuerdoById()`: Hook para obtener por ID
- `useCreateAcuerdo()`: Hook para crear
- `useUpdateAcuerdo()`: Hook para actualizar
- `useDeleteAcuerdo()`: Hook para eliminar
- `useAcuerdosVencer()`: Hook para acuerdos próximos a vencer
- `useActivarAcuerdo()`: Hook para activar
- `useDesactivarAcuerdo()`: Hook para desactivar
- `useAcuerdosDashboard()`: Hook combinado para dashboard
- `useAcuerdosStats()`: Hook para estadísticas

### 4. Re-exportaciones (`src/hooks/useServicios.ts`)
Se agregaron re-exportaciones de todos los nuevos hooks para facilitar su uso.

## Cómo Usar los Nuevos Endpoints

### Ejemplo: Mínimo Personal

```typescript
import { 
  useMinimoPersonal, 
  useCreateMinimoPersonal,
  useCalcularMinimoPersonal 
} from '../hooks/useServicios';

function MinimoPersonalComponent() {
  // Obtener lista de mínimo personal
  const { data: minimoPersonal, isLoading } = useMinimoPersonal({
    cartera_id: 1,
    limit: 10
  });

  // Crear nuevo mínimo personal
  const createMutation = useCreateMinimoPersonal();

  const handleCreate = () => {
    createMutation.mutate({
      servicio_id: 1,
      cartera_id: 1,
      minimo_personal: 5,
      descripcion: 'Mínimo para servicio de limpieza'
    });
  };

  // Calcular cumplimiento
  const { data: calculo } = useCalcularMinimoPersonal(1);

  return (
    <div>
      {/* Renderizar datos */}
    </div>
  );
}
```

### Ejemplo: Acuerdos

```typescript
import { 
  useAcuerdos, 
  useCreateAcuerdo,
  useAcuerdosVencer 
} from '../hooks/useServicios';

function AcuerdosComponent() {
  // Obtener lista de acuerdos
  const { data: acuerdos, isLoading } = useAcuerdos({
    estado: 'activo',
    limit: 10
  });

  // Crear nuevo acuerdo
  const createMutation = useCreateAcuerdo();

  const handleCreate = () => {
    createMutation.mutate({
      nombre: 'Acuerdo de Servicio 2024',
      tipo_acuerdo: 'servicio',
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31',
      condiciones: 'Términos y condiciones...'
    });
  };

  // Obtener acuerdos próximos a vencer
  const { data: acuerdosVencer } = useAcuerdosVencer();

  return (
    <div>
      {/* Renderizar datos */}
    </div>
  );
}
```

## Características Implementadas

### ✅ Funcionalidades Completas
- [x] Tipos TypeScript completos
- [x] Métodos de API para todos los endpoints
- [x] Hooks React Query con cache y invalidación
- [x] Manejo de errores
- [x] Filtros y paginación
- [x] Mutaciones con invalidación automática de cache
- [x] Hooks combinados para dashboards
- [x] Estadísticas calculadas
- [x] Re-exportaciones para fácil importación

### 🔄 Características de React Query
- **Cache inteligente**: Los datos se cachean por 5 minutos
- **Invalidación automática**: Al crear/actualizar/eliminar se invalida el cache
- **Retry automático**: 2 intentos en caso de error
- **Loading states**: Estados de carga manejados automáticamente
- **Error handling**: Manejo de errores integrado

### 📊 Hooks Especializados
- **Dashboard hooks**: Combinan múltiples queries para dashboards
- **Stats hooks**: Calculan estadísticas automáticamente
- **Calculation hooks**: Para operaciones de cálculo específicas

## Próximos Pasos

Para completar la integración, se recomienda:

1. **Crear componentes UI** para gestionar mínimo personal y acuerdos
2. **Agregar rutas** en el router de la aplicación
3. **Integrar en el dashboard** principal
4. **Crear modales** para crear/editar/ver detalles
5. **Agregar validaciones** de formularios
6. **Implementar notificaciones** para acciones exitosas/fallidas

## Notas Técnicas

- Todos los endpoints están configurados para usar la URL base del backend
- Los tipos están completamente tipados para TypeScript
- Los hooks siguen las mejores prácticas de React Query
- El sistema es extensible y fácil de mantener
- Compatible con el sistema de autenticación existente
