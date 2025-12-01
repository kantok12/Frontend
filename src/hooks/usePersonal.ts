import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { Personal, UpdatePersonalData, CreatePersonalDisponibleData } from '../types';

// Función para adaptar datos del backend al frontend
const adaptPersonalData = (personalBackend: any): Personal => {
  // Debug: Log para ver qué datos llegan del backend
  // eslint-disable-next-line no-console
  console.log('🔍 Datos del backend recibidos:', personalBackend);
  // eslint-disable-next-line no-console
  console.log('🔍 Campos disponibles:', Object.keys(personalBackend));
  // eslint-disable-next-line no-console
  console.log('🔍 Información de nombres:', personalBackend.nombres);
  // Mostrar documentos y tipo de documento principal si existen
  // eslint-disable-next-line no-console
  console.log('🔍 Documentos disponibles:', personalBackend.documentos || 'No hay documentos');
  if (personalBackend.documentos && personalBackend.documentos.length) {
    // eslint-disable-next-line no-console
    console.log('🔍 Tipo documento principal:', personalBackend.documentos[0].tipo_documento);
  }

  let nombre = 'Sin nombre';
  let apellido = 'Sin apellido';

  // Intentar múltiples estrategias para obtener el nombre
  const strategies = [
    // Estrategia 1: Columna nombres (nueva estructura)
    () => {
      if (personalBackend.nombres && typeof personalBackend.nombres === 'string' && personalBackend.nombres.trim() && personalBackend.nombres !== 'null') {
        const fullName = personalBackend.nombres.trim();
        const nameParts = fullName.split(' ');
        if (nameParts.length === 1) {
          return { nombre: nameParts[0], apellido: '' };
        } else if (nameParts.length === 2) {
          return { nombre: nameParts[0], apellido: nameParts[1] };
        } else {
          return { 
            nombre: nameParts.slice(0, -1).join(' '), 
            apellido: nameParts.slice(-1).join(' ') 
          };
        }
      }
      return null;
    },
    
    // Estrategia 2: Campo nombre directo
    () => {
      if (personalBackend.nombre && personalBackend.nombre.trim()) {
        const fullName = personalBackend.nombre.trim();
        const nameParts = fullName.split(' ');
        if (nameParts.length === 1) {
          return { nombre: nameParts[0], apellido: '' };
        } else if (nameParts.length === 2) {
          return { nombre: nameParts[0], apellido: nameParts[1] };
        } else {
          return { 
            nombre: nameParts.slice(0, -1).join(' '), 
            apellido: nameParts.slice(-1).join(' ') 
          };
        }
      }
      return null;
    },
    
    // Estrategia 3: Comentario estado
    () => {
      if (personalBackend.comentario_estado && personalBackend.comentario_estado.includes(':')) {
        const fullName = personalBackend.comentario_estado.split(':')[1]?.trim() || '';
        if (fullName) {
          const nameParts = fullName.split(' ');
          if (nameParts.length >= 2) {
            return { 
              nombre: nameParts.slice(0, -2).join(' ') || nameParts[0], 
              apellido: nameParts.slice(-2).join(' ') || nameParts.slice(1).join(' ') 
            };
          } else if (nameParts.length === 1) {
            return { nombre: nameParts[0], apellido: '' };
          }
        }
      }
      return null;
    },
    
    // Estrategia 4: Nombre completo
    () => {
      if (personalBackend.nombre_completo && personalBackend.nombre_completo.trim()) {
        const fullName = personalBackend.nombre_completo.trim();
        const nameParts = fullName.split(' ');
        if (nameParts.length === 1) {
          return { nombre: nameParts[0], apellido: '' };
        } else if (nameParts.length === 2) {
          return { nombre: nameParts[0], apellido: nameParts[1] };
        } else {
          return { 
            nombre: nameParts.slice(0, -1).join(' '), 
            apellido: nameParts.slice(-1).join(' ') 
          };
        }
      }
      return null;
    },
    
    // Estrategia 5: Buscar en otros campos posibles
    () => {
      // Buscar en campos que podrían contener nombres
      const possibleFields = ['full_name', 'fullName', 'name', 'nombre_persona', 'persona_nombre'];
      for (const field of possibleFields) {
        if (personalBackend[field] && personalBackend[field].trim()) {
          const fullName = personalBackend[field].trim();
          const nameParts = fullName.split(' ');
          if (nameParts.length === 1) {
            return { nombre: nameParts[0], apellido: '' };
          } else if (nameParts.length === 2) {
            return { nombre: nameParts[0], apellido: nameParts[1] };
          } else {
            return { 
              nombre: nameParts.slice(0, -1).join(' '), 
              apellido: nameParts.slice(-1).join(' ') 
            };
          }
        }
      }
      return null;
    },
    
    // Estrategia 6: Buscar en campos de texto libre
    () => {
      // Buscar en campos que podrían contener información de nombres
      const textFields = ['descripcion', 'description', 'observaciones', 'notes', 'info'];
      for (const field of textFields) {
        if (personalBackend[field] && personalBackend[field].trim()) {
          const text = personalBackend[field].trim();
          // Buscar patrones como "Nombre: Juan Pérez" o "Juan Pérez - Cargo"
          const nameMatch = text.match(/(?:nombre|name)[:\s]+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)/i);
          if (nameMatch) {
            const fullName = nameMatch[1].trim();
            const nameParts = fullName.split(' ');
            if (nameParts.length === 1) {
              return { nombre: nameParts[0], apellido: '' };
            } else if (nameParts.length === 2) {
              return { nombre: nameParts[0], apellido: nameParts[1] };
            } else {
              return { 
                nombre: nameParts.slice(0, -1).join(' '), 
                apellido: nameParts.slice(-1).join(' ') 
              };
            }
          }
        }
      }
      return null;
    },
    
    // Estrategia 7: Usar RUT como identificador (última opción)
    () => {
      if (personalBackend.rut) {
        return { nombre: `Personal ${personalBackend.rut}`, apellido: '' };
      }
      return null;
    }
  ];

  // Probar cada estrategia hasta encontrar una que funcione
  for (let i = 0; i < strategies.length; i++) {
    const result = strategies[i]();
    if (result) {
      nombre = result.nombre;
      apellido = result.apellido;
            // eslint-disable-next-line no-console
            console.log(`✅ Estrategia ${i + 1} exitosa - Nombre extraído:`, { nombre, apellido });
      break;
    } else {
      // eslint-disable-next-line no-console
      console.log(`❌ Estrategia ${i + 1} falló`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('🎯 Nombre final asignado:', { nombre, apellido });
  // Normalizar contacto de emergencia en una variable para evitar expresiones complejas inline
  let contactoEmerg: any = undefined;
  if (personalBackend.nombre_contacto_emergencia || personalBackend.telefono_contacto_emergencia || personalBackend.vinculo_contacto_emergencia || personalBackend.contacto_emergencia) {
    const raw = personalBackend.contacto_emergencia;
    let cNombre = personalBackend.nombre_contacto_emergencia || undefined;
    let cRelacion = personalBackend.vinculo_contacto_emergencia || undefined;
    let cTelefono = personalBackend.telefono_contacto_emergencia || undefined;
    const cEmail = personalBackend.email_contacto_emergencia || undefined;
    if (!cNombre && typeof raw === 'string') {
      const parts = raw.split('-').map((p: string) => p.trim());
      if (parts.length >= 1 && parts[0]) cNombre = parts[0];
      if (!cRelacion && parts.length >= 2 && parts[1]) cRelacion = 'Contacto';
      if (!cTelefono && parts.length >= 2 && parts[1]) cTelefono = parts[1];
    }
    contactoEmerg = { nombre: cNombre, relacion: cRelacion, telefono: cTelefono, email: cEmail };
  }

  return {
    ...personalBackend,
    id: personalBackend.rut || personalBackend.id,
    nombre,
    apellido,
    rut: personalBackend.rut || personalBackend.id,
    activo: (personalBackend.estado_nombre || '').toString().toLowerCase() === 'activo' || Boolean(personalBackend.activo),
    email: personalBackend.correo_electronico || personalBackend.email || personalBackend.correo || undefined,
    telefono: personalBackend.telefono || personalBackend.telefono_2 || personalBackend.phone || undefined,
    contacto: personalBackend.contacto_emergencia || undefined,
    profile_image_url: personalBackend.profile_image_url || personalBackend.profile_image || undefined,
    created_at: personalBackend.created_at || new Date().toISOString(),
    updated_at: personalBackend.updated_at || new Date().toISOString(),
    empresa_id: personalBackend.empresa_id || '1',
    servicio_id: personalBackend.servicio_id || '1',
    fecha_inicio_contrato: personalBackend.fecha_inicio_contrato || personalBackend.fecha_inicio || undefined,
    zona_geografica: personalBackend.zona_geografica || personalBackend.zona || undefined,
    fecha_nacimiento: personalBackend.fecha_nacimiento || personalBackend.nacimiento || undefined,
    talla_zapatos: personalBackend.talla_zapatos || personalBackend.talla_zapato || personalBackend.talla_z || undefined,
    talla_pantalon: personalBackend.talla_pantalon || personalBackend.talla_pantalones || personalBackend.talla_p || undefined,
    talla_poleras: personalBackend.talla_poleras || personalBackend.talla_polera || personalBackend.talla_camisa || undefined,
    // Información adicional del ejemplo de backend
    profesion: personalBackend.profesion || personalBackend.profesión || undefined,
    area: personalBackend.area || personalBackend.id_area || undefined,
    supervisor: personalBackend.supervisor || personalBackend.nombre_supervisor || undefined,
    tipo_asistencia: personalBackend.tipo_asistencia || personalBackend.asistencia || undefined,
    // Contacto de emergencia ya normalizado
    contacto_emergencia: contactoEmerg,
    // Ubicación detallada
    ubicacion: {
      pais: personalBackend.pais || undefined,
      region: personalBackend.region || undefined,
      ciudad: personalBackend.ciudad || undefined,
      comuna: personalBackend.comuna || undefined,
      direccion: personalBackend.direccion || personalBackend.domicilio || undefined,
    },
    empresa: {
      id: personalBackend.empresa_id ? String(personalBackend.empresa_id) : '1',
      nombre: personalBackend.empresa || personalBackend.empresa_nombre || personalBackend.empresa_name || personalBackend.zona_geografica || ''
    }
  };
};

// Hook para obtener lista de personal con paginación y filtros
export const usePersonalList = (page = 1, limit = 10, search = '', filters: any = {}) => {
  // Solo loggear si los parámetros son diferentes a los valores por defecto
  if (page !== 1 || limit !== 10 || search !== '' || Object.keys(filters).length > 0) {
    console.log('🔍 usePersonalList llamado con:', { page, limit, search, filters });
  }
  
  return useQuery({
    queryKey: ['personal', 'list', page, limit, search, filters],
    queryFn: async () => {
      // Solo loggear si hay búsqueda activa
      if (search) {
        console.log('🔍 Ejecutando queryFn con búsqueda:', search);
      }
      const response = await apiService.getPersonal(page, limit, search, JSON.stringify(filters));
      // Adaptar la estructura de respuesta del backend al frontend
      return {
        success: response.success,
        data: {
          items: response.data.map(adaptPersonalData),
          total: response.pagination.total,
          page: Math.floor(response.pagination.offset / response.pagination.limit) + 1,
          limit: response.pagination.limit,
          totalPages: Math.ceil(response.pagination.total / response.pagination.limit)
        },
        message: response.message
      };
    },
    staleTime: 30 * 1000, // 30 segundos para que se refresque más rápido durante búsquedas
    keepPreviousData: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refrescar automáticamente cuando cambie el término de búsqueda
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

// Hook para obtener personal por ID
export const usePersonalById = (id: string) => {
  return useQuery({
    queryKey: ['personal', 'detail', id],
    queryFn: () => apiService.getPersonalById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para crear personal (usando personal-disponible)
export const useCreatePersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePersonalDisponibleData) => apiService.createPersonalDisponible(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal'] });
    },
  });
};

// Hook para actualizar personal
export const useUpdatePersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonalData }) => 
      apiService.updatePersonal(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['personal', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['personal', 'detail', id] });
    },
  });
};

// Hook para eliminar personal
export const useDeletePersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deletePersonal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal'] });
    },
  });
};

// Hook para obtener/actualizar disponibilidad
export const usePersonalAvailability = (id: string) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['personal', 'availability', id],
    queryFn: () => apiService.getPersonalDisponibilidad(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (disponibilidad: any) => apiService.updatePersonalDisponibilidad(id, disponibilidad),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal', 'availability', id] });
    },
  });

  return {
    ...query,
    updateAvailability: updateMutation.mutate,
    isUpdating: updateMutation.isLoading,
  };
};
