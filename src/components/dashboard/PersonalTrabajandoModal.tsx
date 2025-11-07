import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Activity, Filter } from 'lucide-react';

interface PersonalTrabajando {
  id: string;
  nombre: string;
  apellido: string;
  cargo: string;
  ubicacion: string;
  servicioAsignado: {
    id: string;
    nombre: string;
    categoria: string;
    zonaGestion: string;
  };
  estadoActividad: {
    label: string;
  };
}

interface PersonalTrabajandoModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalTrabajando: PersonalTrabajando[];
}

export const PersonalTrabajandoModal: React.FC<PersonalTrabajandoModalProps> = ({
  isOpen,
  onClose,
  personalTrabajando
}) => {
  const [filtroCargo, setFiltroCargo] = useState<string>('');
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('');
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const personasPorPagina = 10;

  // Obtener listas únicas de cargos y ubicaciones
  const cargosUnicos = useMemo(() => {
    const cargos = personalTrabajando.map(p => p.cargo).filter(Boolean);
    return ['Todos', ...Array.from(new Set(cargos))];
  }, [personalTrabajando]);

  const ubicacionesUnicas = useMemo(() => {
    const ubicaciones = personalTrabajando.map(p => p.ubicacion).filter(Boolean);
    return ['Todas', ...Array.from(new Set(ubicaciones))];
  }, [personalTrabajando]);

  // Filtrar personal según los filtros seleccionados
  const personalFiltrado = useMemo(() => {
    return personalTrabajando.filter(persona => {
      const cumpleCargo = !filtroCargo || filtroCargo === 'Todos' || persona.cargo === filtroCargo;
      const cumpleUbicacion = !filtroUbicacion || filtroUbicacion === 'Todas' || persona.ubicacion === filtroUbicacion;
      return cumpleCargo && cumpleUbicacion;
    });
  }, [personalTrabajando, filtroCargo, filtroUbicacion]);

  // Calcular paginación
  const totalPaginas = Math.ceil(personalFiltrado.length / personasPorPagina);
  const indiceInicio = (paginaActual - 1) * personasPorPagina;
  const indiceFin = indiceInicio + personasPorPagina;
  const personalPaginado = personalFiltrado.slice(indiceInicio, indiceFin);

  // Resetear página al cambiar filtros
  useMemo(() => {
    setPaginaActual(1);
  }, [filtroCargo, filtroUbicacion]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Personal Activo</h2>
                <p className="text-green-100">
                  {personalFiltrado.length} de {personalTrabajando.length} persona{personalTrabajando.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            {/* Filtro por Cargo */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Cargo:</label>
              <select
                value={filtroCargo}
                onChange={(e) => setFiltroCargo(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {cargosUnicos.map((cargo) => (
                  <option key={cargo} value={cargo === 'Todos' ? '' : cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Ubicación */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Ubicación:</label>
              <select
                value={filtroUbicacion}
                onChange={(e) => setFiltroUbicacion(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {ubicacionesUnicas.map((ubicacion) => (
                  <option key={ubicacion} value={ubicacion === 'Todas' ? '' : ubicacion}>
                    {ubicacion}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón limpiar filtros */}
            {(filtroCargo || filtroUbicacion) && (
              <button
                onClick={() => {
                  setFiltroCargo('');
                  setFiltroUbicacion('');
                }}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {personalFiltrado.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {personalTrabajando.length === 0 ? 'No hay personal activo' : 'No hay resultados'}
              </h3>
              <p className="text-gray-500">
                {personalTrabajando.length === 0 
                  ? 'Actualmente no hay personas activas en el sistema.'
                  : 'No se encontró personal con los filtros seleccionados.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                {/* Tabla estilo Excel */}
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-6 font-semibold text-gray-700 bg-gray-50 text-base">Nombre</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-700 bg-gray-50 text-base">Cargo</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-700 bg-gray-50 text-base">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalPaginado.map((persona, index) => (
                      <tr
                        key={persona.id}
                        className={`border-b border-gray-200 hover:bg-green-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-6 font-medium text-gray-900">
                          {persona.nombre} {persona.apellido}
                        </td>
                        <td className="py-3 px-6 text-gray-700">{persona.cargo}</td>
                        <td className="py-3 px-6 text-gray-600">{persona.ubicacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Mostrando {indiceInicio + 1} - {Math.min(indiceFin, personalFiltrado.length)} de {personalFiltrado.length}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                      disabled={paginaActual === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        paginaActual === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      Anterior
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
                        <button
                          key={pagina}
                          onClick={() => setPaginaActual(pagina)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            paginaActual === pagina
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pagina}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                      disabled={paginaActual === totalPaginas}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        paginaActual === totalPaginas
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Mostrando:</span> {personalFiltrado.length} de {personalTrabajando.length} persona{personalTrabajando.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
