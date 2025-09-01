import React, { useState } from 'react';
import { useServiciosList } from '../hooks/useServicios';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Search, Plus, Edit, Trash2, Eye, Clock, Settings, MapPin, Calendar, Users } from 'lucide-react';

// Empresas chilenas para la cartera
const empresasChilenas = [
  'CODELCO',
  'Antofagasta Minerals',
  'Anglo American Sur',
  'BHP Billiton',
  'Colbún S.A.',
  'ENAP',
  'Arauco',
  'CAP S.A.',
  'SQM',
  'Escondida',
  'Cencosud',
  'Falabella',
  'LAN Airlines',
  'Banco de Chile',
  'Copec',
  'CCU',
  'Molibdenos y Metales',
  'Celulosa Arauco',
  'Viña Concha y Toro',
  'Agrosuper'
];

// Función para obtener empresa aleatoria
const getEmpresaAleatoria = () => {
  return empresasChilenas[Math.floor(Math.random() * empresasChilenas.length)];
};

// Datos mock para demostración organizados por Zonas de Gestión
const mockServicios = [
  // MINERÍA
  {
    id: '1',
    nombre: 'Mantenimiento Sistema de Lubricación Minera',
    descripcion: 'Mantenimiento preventivo y correctivo de sistemas de lubricación en equipos mineros',
    duracion_horas: 8,
    lugar: 'Planta Minera',
    tiempoPlanificacion: '1 semana',
    zonaGestion: 'Minería',
    categoria: 'Mantenimiento',
    cartera: 'CODELCO',
    diasActividad: [
      { dia: 'Lunes', actividad: 'Inspección de sistemas de lubricación en excavadoras' },
      { dia: 'Miércoles', actividad: 'Verificación de filtros y niveles en camiones mineros' },
      { dia: 'Viernes', actividad: 'Limpieza de boquillas en equipos de perforación' }
    ],
    personalRequerido: 3,
    activo: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    nombre: 'Servicio Spot Lubricación Minera',
    descripcion: 'Servicio de lubricación inmediata en sitio para equipos mineros críticos',
    duracion_horas: 4,
    lugar: 'Sitio Minero',
    tiempoPlanificacion: 'Emergencia',
    zonaGestion: 'Minería',
    categoria: 'Servicio Spot',
    cartera: 'Antofagasta Minerals',
    diasActividad: [
      { dia: 'Inmediato', actividad: 'Evaluación de emergencia y diagnóstico rápido' },
      { dia: 'Mismo día', actividad: 'Aplicación de lubricación y verificación operativa' }
    ],
    personalRequerido: 2,
    activo: true,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  },
  // INDUSTRIA
  {
    id: '3',
    nombre: 'Servicio Integral de Lubricación Industrial',
    descripcion: 'Servicio completo de lubricación para plantas industriales con monitoreo continuo',
    duracion_horas: 12,
    lugar: 'Planta Industrial',
    tiempoPlanificacion: '2 semanas',
    zonaGestion: 'Industria',
    categoria: 'Servicio Integral',
    cartera: 'Arauco',
    diasActividad: [
      { dia: 'Semana 1', actividad: 'Auditoría completa de sistemas de lubricación' },
      { dia: 'Semana 2', actividad: 'Implementación de mejoras y optimización' }
    ],
    personalRequerido: 4,
    activo: true,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00Z'
  },
  {
    id: '4',
    nombre: 'Programa de Lubricación Industrial',
    descripcion: 'Programa estructurado de lubricación preventiva para equipos industriales',
    duracion_horas: 6,
    lugar: 'Centro Industrial',
    tiempoPlanificacion: 'Mensual',
    zonaGestion: 'Industria',
    categoria: 'Programa de Lubricación',
    cartera: 'ENAP',
    diasActividad: [
      { dia: 'Semana 1', actividad: 'Planificación mensual de lubricación' },
      { dia: 'Semana 2', actividad: 'Ejecución de lubricación programada' },
      { dia: 'Semana 3', actividad: 'Verificación y control de calidad' },
      { dia: 'Semana 4', actividad: 'Reporte y análisis de resultados' }
    ],
    personalRequerido: 3,
    activo: true,
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z'
  },
  {
    id: '5',
    nombre: 'Levantamiento de Sistemas de Lubricación',
    descripcion: 'Evaluación técnica y levantamiento de información de sistemas existentes',
    duracion_horas: 10,
    lugar: 'Planta Industrial',
    tiempoPlanificacion: '1 semana',
    zonaGestion: 'Industria',
    categoria: 'Levantamientos',
    cartera: 'Colbún S.A.',
    diasActividad: [
      { dia: 'Día 1-2', actividad: 'Inspección física de equipos y sistemas' },
      { dia: 'Día 3-4', actividad: 'Análisis de documentación técnica' },
      { dia: 'Día 5', actividad: 'Generación de informe de levantamiento' }
    ],
    personalRequerido: 2,
    activo: true,
    created_at: '2024-01-19T10:00:00Z',
    updated_at: '2024-01-19T10:00:00Z'
  },
  {
    id: '6',
    nombre: 'Instalación de Sistemas Automáticos',
    descripcion: 'Instalación completa de sistemas automáticos de lubricación industrial',
    duracion_horas: 40,
    lugar: 'Planta Industrial',
    tiempoPlanificacion: '1 mes',
    zonaGestion: 'Industria',
    categoria: 'Instalaciones',
    cartera: 'BHP Billiton',
    diasActividad: [
      { dia: 'Semana 1', actividad: 'Preparación de sitio y planificación detallada' },
      { dia: 'Semana 2', actividad: 'Instalación de componentes principales' },
      { dia: 'Semana 3', actividad: 'Conexión y configuración de controles' },
      { dia: 'Semana 4', actividad: 'Puesta en marcha y capacitación' }
    ],
    personalRequerido: 5,
    activo: true,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  }
];

export const ServiciosPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [zonaFilter, setZonaFilter] = useState('Todas');
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Filtrar datos mock basado en la búsqueda y zona de gestión
  const filteredServicios = mockServicios.filter(servicio => {
    const matchesSearch = 
      servicio.nombre.toLowerCase().includes(search.toLowerCase()) ||
      servicio.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      servicio.lugar.toLowerCase().includes(search.toLowerCase()) ||
      servicio.tiempoPlanificacion.toLowerCase().includes(search.toLowerCase()) ||
      servicio.zonaGestion.toLowerCase().includes(search.toLowerCase()) ||
      servicio.categoria.toLowerCase().includes(search.toLowerCase()) ||
      servicio.cartera.toLowerCase().includes(search.toLowerCase());
    
    const matchesZona = zonaFilter === 'Todas' || servicio.zonaGestion === zonaFilter;
    
    return matchesSearch && matchesZona;
  });

  // Paginación de datos mock
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedServicios = filteredServicios.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredServicios.length / limit);
  const total = filteredServicios.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 fade-in">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Servicios</h1>
        <button className="btn-primary hover-grow">
          <Plus className="h-4 w-4" />
          Nuevo Servicio
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card hover-lift slide-up animate-delay-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Filtro por Zona de Gestión */}
          <div className="lg:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zona de Gestión
            </label>
            <select
              value={zonaFilter}
              onChange={(e) => {
                setZonaFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Todas">Todas las Zonas</option>
              <option value="Minería">Minería</option>
              <option value="Industria">Industria</option>
            </select>
          </div>
          
          {/* Barra de búsqueda */}
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                 <input
                   type="text"
                   placeholder="Buscar por nombre, descripción, lugar, zona, categoría o cartera..."
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="input-field"
                 />
              </div>
              <button
                type="submit"
                className="btn-primary"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Resumen de Zonas de Gestión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 slide-up animate-delay-300">
        {/* Estadísticas Minería */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Minería</h3>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Settings className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Servicios:</span>
              <span className="font-semibold text-orange-600">
                {mockServicios.filter(s => s.zonaGestion === 'Minería').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mantenimiento:</span>
              <span className="text-sm font-medium text-gray-900">
                {mockServicios.filter(s => s.zonaGestion === 'Minería' && s.categoria === 'Mantenimiento').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Servicio Spot:</span>
              <span className="text-sm font-medium text-gray-900">
                {mockServicios.filter(s => s.zonaGestion === 'Minería' && s.categoria === 'Servicio Spot').length}
              </span>
            </div>
          </div>
        </div>

        {/* Estadísticas Industria */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Industria</h3>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Servicios:</span>
              <span className="font-semibold text-blue-600">
                {mockServicios.filter(s => s.zonaGestion === 'Industria').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Servicio Integral:</span>
              <span className="text-sm font-medium text-gray-900">
                {mockServicios.filter(s => s.zonaGestion === 'Industria' && s.categoria === 'Servicio Integral').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Programa de Lubricación:</span>
              <span className="text-sm font-medium text-gray-900">
                {mockServicios.filter(s => s.zonaGestion === 'Industria' && s.categoria === 'Programa de Lubricación').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Levantamientos:</span>
              <span className="text-sm font-medium text-gray-900">
                {mockServicios.filter(s => s.zonaGestion === 'Industria' && s.categoria === 'Levantamientos').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Instalaciones:</span>
              <span className="text-sm font-medium text-gray-900">
                {mockServicios.filter(s => s.zonaGestion === 'Industria' && s.categoria === 'Instalaciones').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de servicios */}
      <div className="slide-up animate-delay-300">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Servicios ({total} registros)
          </h2>
        </div>

        {paginatedServicios.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron servicios
          </div>
        ) : (
          <>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zona de Gestión
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cartera
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Planificación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedServicios.map((servicio, index) => (
                      <tr key={servicio.id} className={`hover:bg-gray-50 transition-colors duration-200 stagger-item animate-delay-${(index + 1) * 100}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                              servicio.zonaGestion === 'Minería' 
                                ? 'bg-orange-100' 
                                : 'bg-blue-100'
                            }`}>
                              <Settings className={`h-4 w-4 ${
                                servicio.zonaGestion === 'Minería' 
                                  ? 'text-orange-600' 
                                  : 'text-blue-600'
                              }`} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {servicio.nombre}
                              </div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {servicio.descripcion}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            servicio.zonaGestion === 'Minería' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {servicio.zonaGestion}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            servicio.zonaGestion === 'Minería' 
                              ? 'bg-orange-50 text-orange-700 border border-orange-300' 
                              : 'bg-blue-50 text-blue-700 border border-blue-300'
                          }`}>
                            {servicio.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {servicio.cartera}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {servicio.lugar}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="h-4 w-4 mr-1 text-blue-500" />
                            {servicio.duracion_horas} horas
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="h-4 w-4 mr-1 text-purple-500" />
                            {servicio.tiempoPlanificacion}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Users className="h-4 w-4 mr-1 text-green-500" />
                            {servicio.personalRequerido} personas
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            servicio.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {servicio.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                              onClick={() => alert(`Ver detalles de ${servicio.nombre}`)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              onClick={() => alert(`Editar ${servicio.nombre}`)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              onClick={() => alert(`Eliminar ${servicio.nombre}`)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(endIndex, total)}
                      </span>{' '}
                      de <span className="font-medium">{total}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === page
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
