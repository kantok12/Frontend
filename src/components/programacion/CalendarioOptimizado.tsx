import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { format, startOfWeek, addDays } from 'date-fns';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Trabajador {
  id: number;
  rut: string;
  nombre_persona: string;
  cargo: string;
  cliente_id: number;
  cliente_nombre: string;
  nodo_id?: number;
  nodo_nombre?: string;
  horas_estimadas: number;
  estado: string;
}

interface Nodo {
  id: number;
  nombre: string;
  dias: Trabajador[][];
}

interface Cliente {
  id: number;
  nombre: string;
  nodos: Map<number, Nodo>;
  dias: Trabajador[][];
}

interface CalendarioOptimizadoProps {
  carteraId: number;
  onAsignacionClick?: (asignacion: Trabajador[]) => void;
}

export const CalendarioOptimizado: React.FC<CalendarioOptimizadoProps> = ({
  carteraId,
  onAsignacionClick
}) => {
  const [semanaActual, setSemanaActual] = useState(new Date());
  const queryClient = useQueryClient();

  // Obtener fechas de la semana
  const inicioSemana = startOfWeek(semanaActual, { weekStartsOn: 1 });
  const fechasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));

  // Consulta para obtener la programación
  const { data, isLoading, error } = useQuery({
    queryKey: ['programacion-optimizada', carteraId, format(inicioSemana, 'yyyy-MM-dd')],
    queryFn: async () => {
      const fechaInicio = format(inicioSemana, 'yyyy-MM-dd');
      const fechaFin = format(addDays(inicioSemana, 6), 'yyyy-MM-dd');
      
      console.log('🔄 Consultando programación:', {
        cartera_id: carteraId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      
      try {
        const response = await apiService.getProgramacionOptimizada({
          cartera_id: carteraId,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        });

        console.log('📦 Respuesta del servidor:', JSON.stringify(response, null, 2));
        
        // Validar la estructura de la respuesta
        if (!response.success || !response.data || !response.data.programacion) {
          console.error('❌ Respuesta inválida:', response);
          throw new Error('Formato de respuesta inválido');
        }

        return response;
      } catch (error) {
        console.error('❌ Error al obtener programación:', error);
        throw error;
      }
    },
    enabled: carteraId > 0
  });

  // Función para organizar los datos por cliente
  const getProgramacionPorCliente = () => {
    console.log('🔍 Procesando datos:', {
      hayData: !!data,
      dataEstructura: data ? Object.keys(data) : null,
      dataData: data?.data ? Object.keys(data.data) : null,
      programacion: data?.data?.programacion ? data.data.programacion.length : 0
    });

    if (!data?.data?.programacion) {
      console.log('❌ No hay datos de programación');
      return [];
    }
    
    console.log('🔍 Datos recibidos:', {
      cartera: data.data.cartera,
      diasProgramados: data.data.programacion.length,
      fechaInicio: fechasSemana[0],
      fechaFin: fechasSemana[fechasSemana.length - 1]
    });
    
    const programacionPorCliente = new Map<string, Cliente>();

    // Inicializar array vacío para cada día de la semana
    const emptyWeek = () => Array(7).fill(null).map(() => [] as Trabajador[]);

    // Iterar sobre la programación recibida
    data.data.programacion.forEach((dia: any) => {
      // Convertir la fecha a objeto Date y obtener el índice del día
      const fecha = new Date(dia.fecha);
      const diaIndex = fechasSemana.findIndex(d => 
        format(d, 'yyyy-MM-dd') === format(fecha, 'yyyy-MM-dd')
      );

      console.log(`📅 Procesando ${format(fecha, 'yyyy-MM-dd')}, índice: ${diaIndex}`);

      if (diaIndex !== -1 && dia.trabajadores) {
        dia.trabajadores.forEach((trabajador: Trabajador) => {
          const clienteKey = trabajador.cliente_id?.toString() || 'sin_cliente';
          
          // Inicializar cliente si no existe
          if (!programacionPorCliente.has(clienteKey)) {
            programacionPorCliente.set(clienteKey, {
              id: trabajador.cliente_id ? parseInt(trabajador.cliente_id.toString()) : 0,
              nombre: trabajador.cliente_nombre || 'Sin Cliente',
              nodos: new Map(),
              dias: emptyWeek()
            });
          }

          const cliente = programacionPorCliente.get(clienteKey)!;
          
          // Agrupar por nodo si existe
          if (trabajador.nodo_id) {
            const nodoId = parseInt(trabajador.nodo_id.toString());
            if (!cliente.nodos.has(nodoId)) {
              cliente.nodos.set(nodoId, {
                id: nodoId,
                nombre: trabajador.nodo_nombre || 'Sin Nombre',
                dias: emptyWeek()
              });
            }
            const nodo = cliente.nodos.get(nodoId)!;
            nodo.dias[diaIndex] = [...nodo.dias[diaIndex], trabajador];
          } else {
            cliente.dias[diaIndex] = [...cliente.dias[diaIndex], trabajador];
          }
        });
      }
    });

    return Array.from(programacionPorCliente.values());
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error al cargar la programación</div>;

  const programacionPorCliente = getProgramacionPorCliente();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CARTERA/CLIENTE/NODO
            </th>
            {fechasSemana.map((fecha, index) => (
              <th key={index} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>{format(fecha, 'EEE').toUpperCase()}</div>
                <div>{format(fecha, 'd')}</div>
                <div>{format(fecha, 'MMM').toUpperCase()}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {programacionPorCliente.map((cliente: any) => (
            <React.Fragment key={cliente.id || 'sin_cliente'}>
              {/* Fila del cliente */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                  {cliente.nombre}
                </td>
                {cliente.dias.map((trabajadores: Trabajador[], index: number) => (
                  <td 
                    key={index} 
                    className={`px-6 py-4 whitespace-nowrap text-center text-sm ${
                      trabajadores.length > 0 ? 'bg-blue-50' : ''
                    }`}
                  >
                    {trabajadores.length > 0 && (
                      <div 
                        className="cursor-pointer hover:bg-blue-100 rounded-lg p-2 transition-colors"
                        onClick={() => onAsignacionClick && onAsignacionClick(trabajadores)}
                      >
                        <span className="font-medium text-blue-600">{trabajadores.length}</span>
                        <span className="text-xs text-gray-500 block">asignados</span>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
              
              {/* Filas de nodos */}
              {Array.from(cliente.nodos.values() as Iterable<Nodo>).map((nodo) => (
                <tr key={nodo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 pl-8">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">└</span>
                      {nodo.nombre}
                    </div>
                  </td>
                  {nodo.dias.map((trabajadores: Trabajador[], index: number) => (
                    <td 
                      key={index} 
                      className={`px-6 py-4 whitespace-nowrap text-center text-sm ${
                        trabajadores.length > 0 ? 'bg-gray-50' : ''
                      }`}
                    >
                      {trabajadores.length > 0 && (
                        <div 
                          className="cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors"
                          onClick={() => onAsignacionClick && onAsignacionClick(trabajadores)}
                        >
                          <span className="font-medium text-gray-700">{trabajadores.length}</span>
                          <span className="text-xs text-gray-500 block">asignados</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};