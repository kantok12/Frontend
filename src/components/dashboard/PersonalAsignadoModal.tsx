import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PersonalAsignadoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalAsignadoModal: React.FC<PersonalAsignadoModalProps> = ({
  isOpen,
  onClose
}) => {
  const [filtroCartera, setFiltroCartera] = useState<string>('');
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  const [filtroCargo, setFiltroCargo] = useState<string>('');
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const personasPorPagina = 10;

  // Calcular el rango de la semana actual
  const getRangoSemana = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana; // Ajustar para que lunes sea el primer día
    
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diferencia);
    
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    
    const formatearFecha = (fecha: Date) => {
      return fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    
    return `${formatearFecha(lunes)} - ${formatearFecha(domingo)}`;
  };

  const rangoSemana = getRangoSemana();

  // Obtener datos del endpoint
  const { data: responseData } = useQuery(
    ['personal-por-cliente'],
    async () => {
      const res = await fetch('/api/personal-por-cliente');
      return await res.json();
    },
    { enabled: isOpen }
  );

  // Aplanar los datos: extraer cada persona de cada cliente
  const personalList = useMemo(() => {
    if (!responseData?.data) return [];
    
    const list: any[] = [];
    responseData.data.forEach((cliente: any) => {
      if (cliente.personal && Array.isArray(cliente.personal)) {
        cliente.personal.forEach((persona: any) => {
          list.push({
            cartera: cliente.cartera_nombre || 'Sin cartera',
            cliente: cliente.cliente_nombre || 'Sin cliente',
            rut: persona.rut,
            nombre: persona.nombre || 'Sin nombre',
            cargo: persona.cargo || 'No especificado'
          });
        });
      }
    });
    return list;
  }, [responseData]);

  // Obtener listas únicas para filtros
  const carterasUnicas = useMemo(() => {
    const carteras = personalList.map(p => p.cartera).filter(Boolean);
    return ['Todas', ...Array.from(new Set(carteras))];
  }, [personalList]);

  const clientesUnicos = useMemo(() => {
    const clientes = personalList.map(p => p.cliente).filter(Boolean);
    return ['Todos', ...Array.from(new Set(clientes))];
  }, [personalList]);

  const cargosUnicos = useMemo(() => {
    const cargos = personalList.map(p => p.cargo).filter(Boolean);
    return ['Todos', ...Array.from(new Set(cargos))];
  }, [personalList]);

  // Filtrar personal
  const personalFiltrado = useMemo(() => {
    return personalList.filter(persona => {
      const cumpleCartera = !filtroCartera || filtroCartera === 'Todas' || persona.cartera === filtroCartera;
      const cumpleCliente = !filtroCliente || filtroCliente === 'Todos' || persona.cliente === filtroCliente;
      const cumpleCargo = !filtroCargo || filtroCargo === 'Todos' || persona.cargo === filtroCargo;
      return cumpleCartera && cumpleCliente && cumpleCargo;
    });
  }, [personalList, filtroCartera, filtroCliente, filtroCargo]);

  // Conteos de clientes únicos (filtrados y totales)
  const uniqueFilteredClientesCount = useMemo(() => {
    try {
      return new Set(personalFiltrado.map((p: any) => p.cliente)).size;
    } catch (e) { return 0; }
  }, [personalFiltrado]);

  const uniqueTotalClientesCount = useMemo(() => {
    try { return new Set(personalList.map((p: any) => p.cliente)).size; } catch (e) { return 0; }
  }, [personalList]);

  // Calcular paginación
  const totalPaginas = Math.ceil(personalFiltrado.length / personasPorPagina);
  const indiceInicio = (paginaActual - 1) * personasPorPagina;
  const indiceFin = indiceInicio + personasPorPagina;
  const personalPaginado = personalFiltrado.slice(indiceInicio, indiceFin);

  // Resetear página al cambiar filtros
  useMemo(() => {
    setPaginaActual(1);
  }, [filtroCartera, filtroCliente, filtroCargo]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Personal Asignado</h2>
                <p className="text-purple-100">
                  Semana del {rangoSemana} • {personalFiltrado.length} de {personalList.length} persona{personalList.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-10 px-3 py-1 rounded-lg text-sm text-purple-100 text-center">
                <div className="font-semibold text-white text-lg">{uniqueFilteredClientesCount}</div>
                <div className="text-xs">Clientes con asignación</div>
                <div className="text-xs text-purple-200">de {uniqueTotalClientesCount}</div>
              </div>

              {(filtroCartera || filtroCliente || filtroCargo) && (
                <button
                  onClick={() => { setFiltroCartera(''); setFiltroCliente(''); setFiltroCargo(''); }}
                  className="text-sm bg-white bg-opacity-10 text-purple-100 px-3 py-1 rounded-lg hover:bg-opacity-20"
                >
                  Limpiar filtros
                </button>
              )}

              <button
                onClick={onClose}
                className="text-white hover:text-purple-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4 flex-wrap gap-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            {/* Filtro por Cartera */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Cartera:</label>
              <select
                value={filtroCartera}
                onChange={(e) => setFiltroCartera(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {carterasUnicas.map((cartera) => (
                  <option key={cartera} value={cartera === 'Todas' ? '' : cartera}>
                    {cartera}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Cliente */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Cliente:</label>
              <select
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {clientesUnicos.map((cliente) => (
                  <option key={cliente} value={cliente === 'Todos' ? '' : cliente}>
                    {cliente}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Cargo */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Cargo:</label>
              <select
                value={filtroCargo}
                onChange={(e) => setFiltroCargo(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {cargosUnicos.map((cargo) => (
                  <option key={cargo} value={cargo === 'Todos' ? '' : cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón limpiar filtros */}
            {(filtroCartera || filtroCliente || filtroCargo) && (
              <button
                onClick={() => {
                  setFiltroCartera('');
                  setFiltroCliente('');
                  setFiltroCargo('');
                }}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-8">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Main table area */}
            <div className="flex-1 overflow-auto">
              {personalFiltrado.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {personalList.length === 0 ? 'No hay personal asignado' : 'No hay resultados'}
                  </h3>
                  <p className="text-gray-500">
                    {personalList.length === 0 
                      ? 'Actualmente no hay personas asignadas a clientes.'
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
                          <th className="text-left py-3 px-6 font-semibold text-gray-700 bg-gray-50 text-base">Cartera</th>
                          <th className="text-left py-3 px-6 font-semibold text-gray-700 bg-gray-50 text-base">Cliente</th>
                          <th className="text-left py-3 px-6 font-semibold text-gray-700 bg-gray-50 text-base">Nombre</th>
                          <th className="text-left py-3 px-6 font-semibold text-gray-700 bg-gray-50 text-base">Cargo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {personalPaginado.map((persona, index) => (
                          <tr
                            key={`${persona.rut}-${index}`}
                            className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            <td className="py-3 px-6 text-gray-700">{persona.cartera}</td>
                            <td className="py-3 px-6 text-gray-700">{persona.cliente}</td>
                            <td className="py-3 px-6 font-medium text-gray-900">{persona.nombre}</td>
                            <td className="py-3 px-6 text-gray-700">{persona.cargo}</td>
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
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
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
                                  ? 'bg-purple-600 text-white'
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
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
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

            {/* Sidebar removed: counts now displayed in header */}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Mostrando:</span> {personalFiltrado.length} de {personalList.length} persona{personalList.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
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
