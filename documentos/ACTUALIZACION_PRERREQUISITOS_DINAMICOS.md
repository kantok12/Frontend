# Actualización: Tipos de Documento Dinámicos Basados en Prerrequisitos

Este documento detalla los cambios realizados en el frontend para que el selector "Tipo de Documento" se actualice dinámicamente basado en los prerrequisitos existentes en el sistema. Además, se especifica el nuevo endpoint que el backend debe proporcionar para soportar esta funcionalidad.

## Resumen de la Funcionalidad

El objetivo es que la lista de opciones en el menú desplegable "Tipo de Documento" del modal para subir archivos (`SubirDocumentoModal.tsx`) no sea estática. En su lugar, debe incluir todos los `tipo_documento` definidos en la tabla de prerrequisitos de **todos los clientes**, además de una lista de tipos base (CV, EPP, etc.).

Esto asegura que si se crea un nuevo prerrequisito (ej: "Certificado de Altura") para cualquier cliente, esta opción aparecerá automáticamente en el selector para que los usuarios puedan clasificar los documentos que suben con ese nuevo tipo.

## Implementación en el Frontend

Para lograr esto, se realizaron los siguientes cambios:

### 1. Nuevo Hook: `useAllPrerrequisitos`

Se ha creado un nuevo hook para obtener una lista completa de todos los prerrequisitos registrados en el sistema.

-   **Archivo:** `src/hooks/useGestionPrerrequisitos.ts`
-   **Función:** Este hook realiza una petición `GET` al nuevo endpoint `/prerrequisitos` y devuelve la lista de todos los prerrequisitos. Los datos se cachean durante 5 minutos para mejorar el rendimiento.

```typescript
// src/hooks/useGestionPrerrequisitos.ts

export const useAllPrerrequisitos = () => {
  return useQuery<Prerrequisito[], Error>(
    ['allPrerrequisitos'],
    async () => {
      const response = await apiService.getPrerrequisitos();
      if (response.success) {
        return response.data;
      }
      throw new Error('No se pudieron obtener los prerrequisitos');
    },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );
};
```

### 2. Modificación del Componente: `SubirDocumentoModal.tsx`

El modal para subir documentos ahora utiliza el hook `useAllPrerrequisitos` para poblar dinámicamente el selector.

-   **Archivo:** `src/components/personal/SubirDocumentoModal.tsx`
-   **Lógica Implementada:**
    1.  Se llama al hook `useAllPrerrequisitos()` para obtener la lista de prerrequisitos.
    2.  Se utiliza `useMemo` para crear una lista consolidada y sin duplicados. Esta lista combina los tipos de documento estáticos (`"cv"`, `"epp"`, etc.) con los tipos dinámicos obtenidos de los prerrequisitos.
    3.  El elemento `<select>` itera sobre esta lista dinámica para renderizar las opciones.

```tsx
// src/components/personal/SubirDocumentoModal.tsx

// ... (importaciones y otros hooks)
import { useAllPrerrequisitos } from '../../hooks/useGestionPrerrequisitos';

const SubirDocumentoModal: React.FC<SubirDocumentoModalProps> = ({ /* ...props */ }) => {
  // ... (estados y otros hooks)
  const { data: prerrequisitos } = useAllPrerrequisitos();

  const tiposDocumentoUnicos = useMemo(() => {
    const tiposEstaticos = ["cv", "epp", "examen_preocupacional", "otro"];
    const tiposDinamicos = prerrequisitos?.map(p => p.tipo_documento.toLowerCase()) || [];
    return Array.from(new Set([...tiposEstaticos, ...tiposDinamicos]));
  }, [prerrequisitos]);

  // ... (resto del componente)

  return (
    // ... (JSX del modal)
    <select
      value={formData.tipo_documento}
      onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
      // ... (clases y otros atributos)
    >
      <option value="">Seleccione un tipo de documento</option>
      {tiposDocumentoUnicos.map(tipo => (
        <option key={tipo} value={tipo}>
          {/* Formatea el texto para que sea legible, ej: "examen_preocupacional" -> "Examen preocupacional" */}
          {tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, ' ')}
        </option>
      ))}
    </select>
    // ... (resto del JSX)
  );
};
```

## Requisitos del Backend

Para que la implementación del frontend funcione correctamente, el backend debe exponer un nuevo endpoint.

### Nuevo Endpoint Requerido

-   **Método:** `GET`
-   **Ruta:** `/api/prerrequisitos`

### Función del Endpoint

Este endpoint debe consultar la tabla `prerrequisitos` y devolver **todos los registros** que contiene, sin filtrar por cliente. El objetivo es obtener una lista global de todos los tipos de documentos que se han definido como prerrequisitos en el sistema.

### Estructura de la Respuesta Esperada

El frontend espera recibir una respuesta JSON con la siguiente estructura, que es consistente con el formato `ApiResponse` utilizado en toda la aplicación.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cliente_id": 101,
      "tipo_documento": "examen_preocupacional",
      "descripcion": "Examen médico realizado antes de iniciar labores.",
      "dias_duracion": 365,
      "created_at": "2023-10-27T10:00:00.000Z",
      "updated_at": "2023-10-27T10:00:00.000Z"
    },
    {
      "id": 2,
      "cliente_id": 102,
      "tipo_documento": "certificado_altura",
      "descripcion": "Certificación para trabajos en altura.",
      "dias_duracion": 730,
      "created_at": "2023-11-01T12:30:00.000Z",
      "updated_at": "2023-11-01T12:30:00.000Z"
    },
    {
      "id": 3,
      "cliente_id": 101,
      "tipo_documento": "licencia_clase_b",
      "descripcion": "Licencia de conducir para vehículos livianos.",
      "dias_duracion": null,
      "created_at": "2023-11-05T09:00:00.000Z",
      "updated_at": "2023-11-05T09:00:00.000Z"
    }
    // ... más prerrequisitos
  ],
  "message": "Prerrequisitos obtenidos exitosamente"
}
```

**Campos clave para el frontend:**

-   `tipo_documento`: Es el campo principal que se utilizará para poblar el selector.

Con este endpoint, el frontend podrá obtener la lista completa y mantener el selector de tipos de documento siempre actualizado.
