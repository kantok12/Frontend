import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCarteras } from '../../hooks/useCarteras';
import { useClientes, useNodos } from '../../hooks/useServicios';
import { usePersonalList } from '../../hooks/usePersonal';
import { ProgramacionCalendarioModal } from '../../components/programacion/ProgramacionCalendarioModal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Plus, RefreshCw, Calendar, ChevronLeft, ChevronRight, Users, Building2, MapPin } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

interface CalendarioPageProps {}

const CalendarioPage: React.FC<CalendarioPageProps> = () => {
  const queryClient = useQueryClient();
  
  // Estados básicos
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCartera, setSelectedCartera] = useState<number>(6); // Cartera por defecto
  const [showModal, setShowModal] = useState(false);
  const [fechaInicioSemana, setFechaInicioSemana] = useState<Date>(new Date());
  const [vistaActiva, setVistaActiva] = useState<'tabla' | 'calendario'>('calendario');

  // Calcular fecha fin de semana (domingo)
  const fechaFinSemana = useMemo(() => {
    const fin = new Date(fechaInicioSemana);
    fin.setDate(fin.getDate() + 6); // 7 días desde el lunes
    return fin;
  }, [fechaInicioSemana]);

  // Calcular fechas de la semana
  const getFechaInicioSemana = (fecha: Date): Date => {
    const inicio = new Date(fecha);
    const dia = inicio.getDay();
    const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1); // Lunes
    inicio.setDate(diff);
    return inicio;
  };

  // Obtener fechas de la semana
  const fechasSemana = useMemo(() => {
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(fechaInicioSemana);
      fecha.setDate(fechaInicioSemana.getDate() + i);
      fechas.push(fecha);
    }
    return fechas;
  }, [fechaInicioSemana]);

  // Hooks de datos
  const { data: carterasData } = useCarteras();
  const { data: clientesData } = useClientes();
  const { data: nodosData } = useNodos();
  const { data: personalData } = usePersonalList(1, 1000);

  // Hook de programación - Usar endpoint programacion-optimizada
  const { 
    data: programacionData,
    isLoading: isLoadingProgramacion,
    error: errorProgramacion
  } = useQuery({
    queryKey: ['programacion-optimizada', fechaInicioSemana.toISOString().split('T')[0], fechaFinSemana.toISOString().split('T')[0], selectedCartera],
    queryFn: async () => {
      const { apiService } = await import('../../services/api');
      const response = await apiService.getProgramacionOptimizada({
        cartera_id: Number(selectedCartera) || 1,
        fecha_inicio: fechaInicioSemana.toISOString().split('T')[0],
        fecha_fin: fechaFinSemana.toISOString().split('T')[0]
      });
      console.log('🔍 Respuesta de programación optimizada:', response);
      if (response?.data?.programacion) {
        console.log('📊 Total de programación:', response.data.programacion.length);
      }
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Inicializar fecha de inicio de semana
  useEffect(() => {
    const hoy = new Date();
    setFechaInicioSemana(getFechaInicioSemana(hoy));
  }, []);

  // Procesar datos del endpoint programacion-optimizada
  const procesarDatosOptimizados = (data: any) => {
    if (!data?.programacion) {
      console.log('❌ No hay datos de programación disponibles');
      return [];
    }

    const datos: any[] = [];
    const { programacion } = data;

    programacion.forEach((dia: any) => {
      if (!dia.trabajadores?.length) return;

      dia.trabajadores.forEach((trabajador: any) => {
        // Convertir IDs a números para asegurar comparación correcta
        const registro = {
          id: Number(trabajador.id),
          rut: trabajador.rut,
          nombre_persona: trabajador.nombre,
          cargo: trabajador.cargo || '',
          cartera_id: Number(trabajador.cartera_id),
          nombre_cartera: trabajador.cartera_nombre,
          cliente_id: Number(trabajador.cliente_id),
          nombre_cliente: trabajador.cliente_nombre,
          nodo_id: Number(trabajador.nodo_id || 0),
          nombre_nodo: trabajador.nodo_nombre,
          fecha_trabajo: dia.fecha,
          horas_estimadas: Number(trabajador.horas_estimadas) || 8,
          observaciones: trabajador.observaciones || '',
          estado: trabajador.estado || 'activo'
        };

        if (registro.cartera_id === Number(selectedCartera)) {
          datos.push(registro);
        }
      });
    });

    console.log('✅ Datos procesados:', datos.length, 'registros');
    console.log('🔍 Ejemplo de registro:', datos[0]);
    return datos;
  };

  const programacion = useMemo(() => {
    if (!programacionData?.data) return [];
    return procesarDatosOptimizados(programacionData.data);
  }, [programacionData]);

  // Los datos vienen en formato de programación semanal
  const tablaProgramacion = programacion;

  // Resto del código...[omitido por brevedad]

  return (
    <div>
      <h1>Calendario Page</h1>
      {/* Aquí va el resto del JSX */}
    </div>
  );
};

export default CalendarioPage;