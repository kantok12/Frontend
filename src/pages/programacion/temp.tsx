import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import apiService from '../../services/api';
import { CalendarioOptimizado } from '../../components/programacion/CalendarioOptimizado';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProgramacionOptimizadaPage: React.FC = () => {
  const [carteraSeleccionada, setCarteraSeleccionada] = useState<number | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // Obtener carteras
  const { data: carterasData, isLoading: loadingCarteras } = useQuery({
    queryKey: ['carteras'],
    queryFn: () => apiService.getCarteras()
  });

  // Obtener programación optimizada
  const {
    data: programacionData,
    isLoading: loadingProgramacion,
    error: errorProgramacion,
    refetch
  } = useQuery({
    queryKey: ['programacion-optimizada', carteraSeleccionada, format(fechaSeleccionada, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!carteraSeleccionada) return null;

      const response = await apiService.getProgramacionOptimizada({
        cartera_id: carteraSeleccionada,
        fecha_inicio: format(fechaSeleccionada, 'yyyy-MM-dd'),
        fecha_fin: format(fechaSeleccionada, 'yyyy-MM-dd')
      });

      console.log('🔍 Respuesta de programación:', response);
      return response;
    },
    enabled: !!carteraSeleccionada
  });

  const handleCarteraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setCarteraSeleccionada(value);
  };

  const handleAsignacionClick = (asignacion: any) => {
    console.log('Asignación seleccionada:', asignacion);
  };

  if (loadingCarteras) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Programación Optimizada
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cartera
            </label>
            <select
              value={carteraSeleccionada || ''}
              onChange={handleCarteraChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar cartera...</option>
              {carterasData?.data?.map((cartera: any) => (
                <option key={cartera.id} value={cartera.id}>
                  {cartera.nombre || cartera.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {carteraSeleccionada ? (
        <CalendarioOptimizado
          carteraId={carteraSeleccionada}
          onAsignacionClick={handleAsignacionClick}
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Seleccione una cartera para ver la programación</p>
        </div>
      )}
    </div>
  );
};

export default ProgramacionOptimizadaPage;