# Formulario en Cadena de Servicios - Implementación Completa

## 📋 Resumen de Cambios

Se ha modificado el formulario de programación para funcionar en cadena: primero seleccionar cartera, luego cliente (opcional), y finalmente nodo (opcional). Esto crea un flujo más lógico y organizado siguiendo la jerarquía natural de los servicios.

## 🎯 Funcionalidades Implementadas

### **1. Formulario en Cadena**
- **Paso 1**: Selección obligatoria de Cartera
- **Paso 2**: Selección opcional de Cliente (solo si hay cartera seleccionada)
- **Paso 3**: Selección opcional de Nodo (solo si hay cliente seleccionado)
- **Validación**: No se puede avanzar sin completar el paso anterior

### **2. Lógica de Dependencias**
- **Cartera → Cliente**: Al seleccionar cartera, se habilitan los clientes de esa cartera
- **Cliente → Nodo**: Al seleccionar cliente, se habilitan los nodos de ese cliente
- **Limpieza automática**: Al cambiar un nivel superior, se limpian los niveles inferiores

## 📁 Archivos Modificados

### **`src/components/programacion/ProgramacionCalendarioModal.tsx`**

#### **Interfaz Asignacion Actualizada**
```typescript
interface Asignacion {
  id?: string;
  personalId: string;
  carteraId: number;        // ✅ Obligatorio
  clienteId?: number;       // ✅ Opcional
  nodoId?: number;          // ✅ Opcional
  dia: string;
  horaInicio: string;
  horaFin: string;
  observaciones?: string;
}
```

#### **Funciones de Filtrado**
```typescript
// Obtener clientes de una cartera específica
const getClientesByCartera = (carteraId: number) => {
  return clientes.filter(c => c.cartera_id === carteraId);
};

// Obtener nodos de un cliente específico
const getNodosByCliente = (clienteId: number) => {
  return nodos.filter(n => n.cliente_id === clienteId);
};
```

#### **Manejo de Cambios en Cadena**
```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  
  if (name === 'carteraId') {
    // Al cambiar cartera, limpiar cliente y nodo
    setNuevaAsignacion(prev => ({
      ...prev,
      carteraId: parseInt(value),
      clienteId: undefined,
      nodoId: undefined
    }));
  } else if (name === 'clienteId') {
    // Al cambiar cliente, limpiar nodo
    setNuevaAsignacion(prev => ({
      ...prev,
      clienteId: value ? parseInt(value) : undefined,
      nodoId: undefined
    }));
  } else {
    setNuevaAsignacion(prev => ({
      ...prev,
      [name]: value
    }));
  }
};
```

## 🎨 Diseño y UX

### **Formulario en Cadena**
```typescript
{/* Cartera - Obligatorio */}
<select
  name="carteraId"
  value={nuevaAsignacion.carteraId}
  onChange={handleInputChange}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>
  <option value={0}>Seleccionar cartera...</option>
  {carteras.map((cartera) => (
    <option key={cartera.id} value={cartera.id}>
      {cartera.nombre || cartera.name}
    </option>
  ))}
</select>

{/* Cliente - Opcional, habilitado solo si hay cartera */}
<select
  name="clienteId"
  value={nuevaAsignacion.clienteId || ''}
  onChange={handleInputChange}
  disabled={!nuevaAsignacion.carteraId}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
>
  <option value="">Seleccionar cliente (opcional)...</option>
  {nuevaAsignacion.carteraId && getClientesByCartera(nuevaAsignacion.carteraId).map((cliente) => (
    <option key={cliente.id} value={cliente.id}>
      {cliente.nombre}
    </option>
  ))}
</select>

{/* Nodo - Opcional, habilitado solo si hay cliente */}
<select
  name="nodoId"
  value={nuevaAsignacion.nodoId || ''}
  onChange={handleInputChange}
  disabled={!nuevaAsignacion.clienteId}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
>
  <option value="">Seleccionar nodo (opcional)...</option>
  {nuevaAsignacion.clienteId && getNodosByCliente(nuevaAsignacion.clienteId).map((nodo) => (
    <option key={nodo.id} value={nodo.id}>
      {nodo.nombre}
    </option>
  ))}
</select>
```

### **Visualización en Calendario**
```typescript
<div className="space-y-1">
  <div className="flex items-center">
    <Building2 className="h-4 w-4 mr-1 text-blue-500" />
    <span className="text-sm text-gray-600">
      {getNombreCartera(asignacion.carteraId)}
    </span>
  </div>
  {asignacion.clienteId && (
    <div className="flex items-center">
      <Users className="h-4 w-4 mr-1 text-green-500" />
      <span className="text-sm text-gray-600">
        {getNombreCliente(asignacion.clienteId)}
      </span>
    </div>
  )}
  {asignacion.nodoId && (
    <div className="flex items-center">
      <MapPin className="h-4 w-4 mr-1 text-orange-500" />
      <span className="text-sm text-gray-600">
        {getNombreNodo(asignacion.nodoId)}
      </span>
    </div>
  )}
</div>
```

## 🔧 Funcionalidades Técnicas

### **Validación Actualizada**
- **Cartera obligatoria**: Debe seleccionarse una cartera
- **Cliente opcional**: Puede omitirse si no es necesario
- **Nodo opcional**: Solo disponible si hay cliente seleccionado
- **Conflictos de horario**: Mantiene la validación existente

### **Estados y Dependencias**
- **Habilitación condicional**: Los campos se habilitan según las selecciones anteriores
- **Limpieza automática**: Al cambiar un nivel superior, se limpian los inferiores
- **Filtrado dinámico**: Las opciones se filtran según la selección anterior

### **Funciones de Nombres**
```typescript
const getNombreCartera = (carteraId: number) => {
  const cartera = carteras.find(c => c.id === carteraId);
  return cartera?.nombre || cartera?.name || 'Desconocido';
};

const getNombreCliente = (clienteId: number) => {
  const cliente = clientes.find(c => c.id === clienteId);
  return cliente?.nombre || 'Desconocido';
};

const getNombreNodo = (nodoId: number) => {
  const nodo = nodos.find(n => n.id === nodoId);
  return nodo?.nombre || 'Desconocido';
};
```

## 🎯 Flujo de Usuario

### **1. Selección de Cartera**
- **Obligatorio**: Debe seleccionarse una cartera
- **Efecto**: Habilita la selección de clientes
- **Limpieza**: Limpia cliente y nodo si estaban seleccionados

### **2. Selección de Cliente**
- **Opcional**: Puede omitirse si la asignación es solo a nivel de cartera
- **Filtrado**: Solo muestra clientes de la cartera seleccionada
- **Efecto**: Habilita la selección de nodos
- **Limpieza**: Limpia nodo si estaba seleccionado

### **3. Selección de Nodo**
- **Opcional**: Solo disponible si hay cliente seleccionado
- **Filtrado**: Solo muestra nodos del cliente seleccionado
- **Específico**: Permite asignación a nivel de nodo específico

### **4. Visualización**
- **Jerárquica**: Muestra cartera → cliente → nodo en orden
- **Condicional**: Solo muestra los niveles seleccionados
- **Iconografía**: Iconos distintivos para cada nivel

## 📱 Responsive Design

### **Formulario**
- **Mobile**: Campos apilados verticalmente
- **Tablet**: Grid de 2 columnas
- **Desktop**: Grid de 3 columnas

### **Estados Deshabilitados**
- **Visual**: Fondo gris y cursor no permitido
- **Funcional**: No se puede interactuar con campos deshabilitados
- **Claro**: Indica claramente qué campos están disponibles

## 🚀 Ventajas del Nuevo Diseño

### **1. Flujo Lógico**
- **Jerarquía natural**: Cartera → Cliente → Nodo
- **Progresivo**: Cada paso habilita el siguiente
- **Intuitivo**: Sigue la estructura organizacional

### **2. Flexibilidad**
- **Asignación a cartera**: Solo seleccionar cartera
- **Asignación a cliente**: Cartera + Cliente
- **Asignación a nodo**: Cartera + Cliente + Nodo

### **3. Validación Inteligente**
- **Dependencias**: No permite selecciones inválidas
- **Limpieza automática**: Evita inconsistencias
- **Feedback visual**: Estados claros de habilitación

### **4. Experiencia de Usuario**
- **Progresivo**: Guía al usuario paso a paso
- **Flexible**: Permite diferentes niveles de especificidad
- **Claro**: Visualización jerárquica de las asignaciones

## ✅ Estado Actual

- ✅ **Formulario en cadena**: Cartera → Cliente → Nodo
- ✅ **Validación de dependencias**: Campos habilitados condicionalmente
- ✅ **Limpieza automática**: Al cambiar niveles superiores
- ✅ **Filtrado dinámico**: Opciones filtradas por selección anterior
- ✅ **Visualización jerárquica**: Muestra la cadena completa en el calendario
- ✅ **Estados deshabilitados**: Campos claramente deshabilitados
- ✅ **Responsive**: Adaptado a diferentes pantallas

## 🎯 Resultado Final

Los usuarios ahora pueden:
1. **Seleccionar Cartera**: Paso obligatorio que habilita el siguiente
2. **Seleccionar Cliente**: Opcional, filtrado por cartera
3. **Seleccionar Nodo**: Opcional, filtrado por cliente
4. **Ver Jerarquía**: Visualización clara de la cadena completa
5. **Flexibilidad**: Asignar a diferentes niveles según necesidad
6. **Validación**: Sistema previene selecciones inválidas
7. **Experiencia Fluida**: Flujo lógico y progresivo

El formulario ahora sigue una lógica jerárquica clara y proporciona una experiencia de usuario más intuitiva y organizada! 🎉
