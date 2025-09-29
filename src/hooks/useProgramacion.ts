import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Hook para obtener eventos/programación
export const useEventos = (params?: { 
  fechaInicio?: string; 
  fechaFin?: string; 
  limit?: number; 
  offset?: number 
}) => {
  return useQuery({
    queryKey: ['eventos', params],
    queryFn: async () => {
      // Por ahora, usar datos mock hasta que el backend implemente los endpoints
      // TODO: Cambiar a apiService.getEventos() cuando esté disponible
      return {
        success: true,
        data: getMockEventos(),
        pagination: { total: 6, offset: 0, limit: 50 }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Función para generar datos mock de eventos
const getMockEventos = () => {
  const hoy = new Date();
  const proximosDias = [];
  
  for (let i = 0; i < 15; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    proximosDias.push(fecha.toISOString().split('T')[0]);
  }

  return [
    {
      id: '1',
      titulo: 'Mantenimiento Sistema Minero - Planta Norte',
      descripcion: 'Mantenimiento preventivo del sistema de lubricación en la planta minera norte',
      fecha: proximosDias[0],
      hora: '08:00',
      duracion: '8 horas',
      ubicacion: 'Planta Minera Norte',
      zonaGestion: 'Minería',
      categoria: 'Mantenimiento',
      personal: ['Juan Carlos Pérez', 'Roberto Silva'],
      estado: 'en_progreso',
      cartera: '6',
      cliente: '1'
    },
    {
      id: '2',
      titulo: 'Servicio Spot - Emergencia Excavadora',
      descripcion: 'Servicio de emergencia para reparación de excavadora',
      fecha: proximosDias[1],
      hora: '14:30',
      duracion: '4 horas',
      ubicacion: 'Sitio Minero Sur',
      zonaGestion: 'Minería',
      categoria: 'Servicio Spot',
      personal: ['Patricia Vargas'],
      estado: 'programado',
      cartera: '6',
      cliente: '2'
    },
    {
      id: '3',
      titulo: 'Servicio Integral Industrial',
      descripcion: 'Servicio integral para planta industrial',
      fecha: proximosDias[2],
      hora: '09:00',
      duracion: '6 horas',
      ubicacion: 'Planta Industrial Centro',
      zonaGestion: 'Industria',
      categoria: 'Servicio Integral',
      personal: ['Carlos Mendoza', 'Ana Torres', 'Luis Ramírez'],
      estado: 'programado',
      cartera: '7',
      cliente: '3'
    },
    {
      id: '4',
      titulo: 'Inspección Equipos Mineros',
      descripcion: 'Inspección general de equipos mineros',
      fecha: proximosDias[3],
      hora: '07:00',
      duracion: '5 horas',
      ubicacion: 'Mina Principal',
      zonaGestion: 'Minería',
      categoria: 'Inspección',
      personal: ['María González', 'Pedro Sánchez'],
      estado: 'programado',
      cartera: '6',
      cliente: '1'
    },
    {
      id: '5',
      titulo: 'Programa de Lubricación',
      descripcion: 'Programa de lubricación preventiva',
      fecha: proximosDias[4],
      hora: '10:00',
      duracion: '3 horas',
      ubicacion: 'Planta Industrial Este',
      zonaGestion: 'Industria',
      categoria: 'Programa de Lubricación',
      personal: ['Roberto Silva', 'Carmen Fernández'],
      estado: 'programado',
      cartera: '7',
      cliente: '4'
    },
    {
      id: '6',
      titulo: 'Levantamiento de Instalaciones',
      descripcion: 'Levantamiento técnico de instalaciones',
      fecha: proximosDias[5],
      hora: '13:00',
      duracion: '4 horas',
      ubicacion: 'Sitio Industrial Oeste',
      zonaGestion: 'Industria',
      categoria: 'Levantamiento',
      personal: ['Juan Carlos Pérez', 'Ana Torres'],
      estado: 'programado',
      cartera: '7',
      cliente: '5'
    }
  ];
};

// Hook para obtener un evento específico
export const useEventoById = (eventoId: string) => {
  return useQuery({
    queryKey: ['evento', eventoId],
    queryFn: () => apiService.getEventoById(eventoId),
    enabled: !!eventoId,
  });
};

// Hook para crear un nuevo evento
export const useCreateEvento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventoData: any) => {
      // Simular creación de evento (por ahora con datos mock)
      // TODO: Cambiar a apiService.createEvento() cuando esté disponible
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      return {
        success: true,
        data: { ...eventoData, id: `evento_${Date.now()}` },
        message: 'Evento creado exitosamente'
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
    },
  });
};

// Hook para actualizar un evento
export const useUpdateEvento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Simular actualización de evento (por ahora con datos mock)
      // TODO: Cambiar a apiService.updateEvento() cuando esté disponible
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      return {
        success: true,
        data: { ...data, id },
        message: 'Evento actualizado exitosamente'
      };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      queryClient.invalidateQueries({ queryKey: ['evento', id] });
    },
  });
};

// Hook para eliminar un evento
export const useDeleteEvento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventoId: string) => {
      // Simular eliminación de evento (por ahora con datos mock)
      // TODO: Cambiar a apiService.deleteEvento() cuando esté disponible
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      return {
        success: true,
        data: null,
        message: 'Evento eliminado exitosamente'
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
    },
  });
};

// Hook para obtener estadísticas de programación
export const useProgramacionStats = () => {
  return useQuery({
    queryKey: ['programacion-stats'],
    queryFn: async () => {
      // Simular estadísticas (por ahora con datos mock)
      // TODO: Cambiar a apiService.getProgramacionStats() cuando esté disponible
      return {
        success: true,
        data: {
          total_eventos: 6,
          eventos_programados: 5,
          eventos_en_progreso: 1,
          eventos_completados: 0,
          personal_asignado: 8,
          servicios_activos: 4
        }
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};
