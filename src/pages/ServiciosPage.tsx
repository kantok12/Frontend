import React, { useState } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Search, Plus, Edit, Trash2, Eye, Settings, Users, Briefcase, FolderOpen, Clock } from 'lucide-react';
import { ServicioModal } from '../components/servicios/ServicioModal';
import { ServicioViewModal } from '../components/servicios/ServicioViewModal';
import { ServicioEditModal } from '../components/servicios/ServicioEditModal';
import { ServicioDeleteModal } from '../components/servicios/ServicioDeleteModal';
import { AgregarClienteModal } from '../components/servicios/AgregarClienteModal';
import { CarteraViewModal } from '../components/servicios/CarteraViewModal';
import { CarteraEditModal } from '../components/servicios/CarteraEditModal';
import { CarteraDeleteModal } from '../components/servicios/CarteraDeleteModal';
import { useCarteras } from '../hooks/useCarteras';
import { Tooltip } from '../components/common/Tooltip';

// Datos mock para servicios (funcionalidad anterior)
const mockServicios = [
  {
    id: '1',
    nombre: 'Mantenimiento Minero Norte',
    descripcion: 'Servicio de mantenimiento para equipos mineros en zona norte',
    zonaGestion: 'Minería',
    categoria: 'Mantenimiento',
    cartera: 'Minera Norte S.A.',
    lugar: 'Antofagasta',
    duracion_horas: 8,
    tiempoPlanificacion: '2 días',
    personalRequerido: 3,
    personalSeleccionado: ['1', '2', '3'],
    diasActividad: [
      { dia: 'Lunes', actividad: 'Inspección inicial' },
      { dia: 'Martes', actividad: 'Mantenimiento preventivo' }
    ],
    estado: 'Activo',
    fechaCreacion: '2024-01-15',
    fechaActualizacion: '2024-01-20'
  },
  {
    id: '2',
    nombre: 'Servicio Integral Industrial',
    descripcion: 'Servicio integral para planta industrial',
    zonaGestion: 'Industria',
    categoria: 'Servicio Integral',
    cartera: 'Industrias del Sur',
    lugar: 'Concepción',
    duracion_horas: 12,
    tiempoPlanificacion: '1 semana',
    personalRequerido: 5,
    personalSeleccionado: ['4', '5', '6', '7', '8'],
    diasActividad: [
      { dia: 'Lunes', actividad: 'Evaluación inicial' },
      { dia: 'Martes', actividad: 'Implementación' },
      { dia: 'Miércoles', actividad: 'Monitoreo' }
    ],
    estado: 'Activo',
    fechaCreacion: '2024-01-10',
    fechaActualizacion: '2024-01-18'
  },
  {
    id: '3',
    nombre: 'Spot Minero Centro',
    descripcion: 'Servicio spot para emergencia minera',
    zonaGestion: 'Minería',
    categoria: 'Spot',
    cartera: 'Minera Centro',
    lugar: 'Santiago',
    duracion_horas: 6,
    tiempoPlanificacion: '1 día',
    personalRequerido: 2,
    personalSeleccionado: ['9', '10'],
    diasActividad: [
      { dia: 'Viernes', actividad: 'Intervención de emergencia' }
    ],
    estado: 'Activo',
    fechaCreacion: '2024-01-12',
    fechaActualizacion: '2024-01-19'
  }
];

// Nombres de personal para tooltip
const nombresPersonal: { [key: string]: string } = {
  '1': 'Juan Pérez',
  '2': 'María González',
  '3': 'Carlos Rodríguez',
  '4': 'Ana Martínez',
  '5': 'Luis Fernández',
  '6': 'Carmen López',
  '7': 'Pedro Sánchez',
  '8': 'Laura García',
  '9': 'Miguel Torres',
  '10': 'Isabel Ruiz',
  '11': 'Roberto Silva',
  '12': 'Patricia Morales',
  '13': 'Diego Herrera',
  '14': 'Valentina Castro',
  '15': 'Andrés Jiménez'
};

export const ServiciosPage: React.FC = () => {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<'servicios' | 'carteras'>('servicios');
  
  // Estados comunes
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [zonaFilter, setZonaFilter] = useState('Todas');
  const [limit] = useState(10);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [showAgregarClienteModal, setShowAgregarClienteModal] = useState(false);
  
  // Estados para servicios (datos mock)
  const [servicios, setServicios] = useState(mockServicios);
  
  // Estados para carteras (datos reales)
  const { data: carterasResponse, isLoading, error } = useCarteras({ limit: 50 });
  const carteras = React.useMemo(() => carterasResponse?.data || [], [carterasResponse]);
  
  // Debug: Ver qué datos están llegando
  React.useEffect(() => {
    if (carterasResponse && carteras.length > 0) {
      // eslint-disable-next-line no-console
      console.log('🔍 Datos de carteras recibidos:', carterasResponse);
      // eslint-disable-next-line no-console
      console.log('📊 Primera cartera:', carteras[0]);
      // eslint-disable-next-line no-console
      console.log('👥 Total clientes en primera cartera:', carteras[0]?.total_clientes);
    }
  }, [carterasResponse, carteras]);
  
  // Estados para los modales de servicios
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<any>(null);
  
  // Estados para los modales de carteras
  const [showCarteraViewModal, setShowCarteraViewModal] = useState(false);
  const [showCarteraEditModal, setShowCarteraEditModal] = useState(false);
  const [showCarteraDeleteModal, setShowCarteraDeleteModal] = useState(false);
  const [selectedCartera, setSelectedCartera] = useState<any>(null);


  // Filtrar servicios basado en la búsqueda
  const filteredServicios = servicios.filter(servicio => {
    const matchesSearch = 
      servicio.nombre.toLowerCase().includes(search.toLowerCase()) ||
      servicio.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      servicio.cartera.toLowerCase().includes(search.toLowerCase());
    
    const matchesZona = zonaFilter === 'Todas' || servicio.zonaGestion === zonaFilter;
    
    return matchesSearch && matchesZona;
  });

  // Filtrar carteras basado en la búsqueda
  const filteredCarteras = carteras.filter(cartera => {
    const matchesSearch = 
      cartera.name.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  // Función para obtener información del personal asignado
  const getPersonalAsignadoInfo = (servicio: any) => {
    if (!servicio || !servicio.personalSeleccionado || !Array.isArray(servicio.personalSeleccionado) || servicio.personalSeleccionado.length === 0) {
      return 'No hay personal asignado';
    }
    
    const nombres: string[] = [];
    for (const id of servicio.personalSeleccionado) {
      const idStr = String(id);
      const nombre = nombresPersonal[idStr];
      if (nombre) {
        nombres.push(nombre);
      } else {
        nombres.push(`Personal ${idStr}`);
      }
    }
    
    return nombres.join(', ');
  };

  // Paginación dinámica según la pestaña activa
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const currentData = activeTab === 'servicios' ? filteredServicios : filteredCarteras;
  const paginatedData = currentData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(currentData.length / limit);
  const total = currentData.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  // Reset page when search or filter changes
  React.useEffect(() => {
    setPage(1);
  }, [search, zonaFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleServicioSuccess = (nuevoServicio: any) => {
    if (activeTab === 'servicios') {
      // Agregar nuevo servicio a la lista
      const servicioConId = {
        ...nuevoServicio,
        id: Date.now().toString(),
        estado: 'Activo',
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaActualizacion: new Date().toISOString().split('T')[0]
      };
      setServicios(prev => [servicioConId, ...prev]);
    }
  };

  const handleAgregarClienteSuccess = (carteraId: string, clientes: any[]) => {
    // En el futuro, aquí se podría actualizar la cartera con los nuevos clientes
    // eslint-disable-next-line no-console
    console.log('Clientes agregados exitosamente a la cartera:', carteraId, clientes);
  };

  // Funciones para manejar los modales
  const handleViewServicio = (servicio: any) => {
    setSelectedServicio(servicio);
    setShowViewModal(true);
  };

  const handleEditServicio = (servicio: any) => {
    setSelectedServicio(servicio);
    setShowEditModal(true);
  };

  const handleDeleteServicio = (servicio: any) => {
    setSelectedServicio(servicio);
    setShowDeleteModal(true);
  };

  const handleEditSuccess = (servicioActualizado: any) => {
    if (activeTab === 'servicios') {
      // Actualizar servicio en la lista
      setServicios(prev => prev.map(servicio => 
        servicio.id === selectedServicio.id 
          ? { ...servicioActualizado, id: servicio.id, fechaActualizacion: new Date().toISOString().split('T')[0] }
          : servicio
      ));
    } else {
      // En el futuro, aquí se podría actualizar la cartera en el listado
      // eslint-disable-next-line no-console
      console.log('Cartera actualizada exitosamente:', servicioActualizado);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedServicio) {
      if (activeTab === 'servicios') {
        // Eliminar servicio de la lista
        setServicios(prev => prev.filter(servicio => servicio.id !== selectedServicio.id));
      } else {
        // En el futuro, aquí se podría eliminar la cartera del listado
        // eslint-disable-next-line no-console
        console.log('Cartera eliminada exitosamente:', selectedServicio);
      }
    }
  };

  // Funciones para manejar los modales de carteras
  const handleViewCartera = (cartera: any) => {
    setSelectedCartera(cartera);
    setShowCarteraViewModal(true);
  };

  const handleEditCartera = (cartera: any) => {
    setSelectedCartera(cartera);
    setShowCarteraEditModal(true);
  };

  const handleDeleteCartera = (cartera: any) => {
    setSelectedCartera(cartera);
    setShowCarteraDeleteModal(true);
  };

  const handleCarteraEditSuccess = (carteraActualizada: any) => {
    // En el futuro, aquí se podría actualizar la cartera en el listado
    // eslint-disable-next-line no-console
    console.log('Cartera actualizada exitosamente:', carteraActualizada);
    setShowCarteraEditModal(false);
    setSelectedCartera(null);
  };

  const handleCarteraDeleteConfirm = (carteraId: string) => {
    // En el futuro, aquí se podría eliminar la cartera del backend
    // eslint-disable-next-line no-console
    console.log('Cartera eliminada:', carteraId);
    setShowCarteraDeleteModal(false);
    setSelectedCartera(null);
  };


  if (isLoading && activeTab === 'carteras') {
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
        <button 
          onClick={() => {
            if (activeTab === 'servicios') {
              setShowServicioModal(true);
            } else {
              setShowAgregarClienteModal(true);
            }
          }}
          className="btn-primary hover-grow"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'servicios' ? 'Nuevo Servicio' : 'Agregar Cliente'}
        </button>
      </div>

      {/* Pestañas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('servicios')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'servicios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                Servicios
              </div>
            </button>
            <button
              onClick={() => setActiveTab('carteras')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'carteras'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FolderOpen className="h-4 w-4 mr-2" />
                Carteras
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 items-center">
          {/* Filtro por Zona de Gestión - Solo para Servicios */}
          {activeTab === 'servicios' && (
            <div className="w-48">
              <select
                value={zonaFilter}
                onChange={(e) => {
                  setZonaFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
              >
                <option value="Todas">Todas las Zonas</option>
                <option value="Minería">Minería</option>
                <option value="Industria">Industria</option>
              </select>
            </div>
          )}
          
          {/* Barra de búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <input
              type="text"
              placeholder={activeTab === 'servicios' ? 'Buscar servicios por nombre, descripción o cartera...' : 'Buscar carteras por nombre...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            Buscar
          </button>
          {(search || (activeTab === 'servicios' && zonaFilter !== 'Todas')) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setZonaFilter('Todas');
                setPage(1);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Resumen dinámico según pestaña activa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 slide-up animate-delay-300">
        {activeTab === 'servicios' ? (
          <>
            {/* Estadísticas de Servicios */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Servicios</h3>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Servicios:</span>
                  <span className="font-semibold text-blue-600">
                    {servicios.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Minería:</span>
                  <span className="font-semibold text-orange-600">
                    {servicios.filter(s => s.zonaGestion === 'Minería').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Industria:</span>
                  <span className="font-semibold text-green-600">
                    {servicios.filter(s => s.zonaGestion === 'Industria').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Servicios por categoría */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Por Categoría</h3>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="space-y-3">
                {['Mantenimiento', 'Spot', 'Servicio Integral', 'Programa de Lubricación', 'Levantamiento', 'Instalaciones']
                  .filter(cat => servicios.some(s => s.categoria === cat))
                  .map(categoria => (
                    <div key={categoria} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{categoria}:</span>
                      <span className="font-semibold text-green-600">
                        {servicios.filter(s => s.categoria === categoria).length}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Estadísticas de Carteras */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Carteras</h3>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Carteras:</span>
                  <span className="font-semibold text-blue-600">
                    {carteras.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Con Clientes:</span>
                  <span className="font-semibold text-green-600">
                    {carteras.filter(c => parseInt(c.total_clientes) > 0).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Clientes:</span>
                  <span className="font-semibold text-purple-600">
                    {carteras.reduce((acc, c) => acc + parseInt(c.total_clientes), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Carteras con más clientes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Carteras</h3>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="space-y-3">
                {carteras
                  .filter(c => parseInt(c.total_clientes) > 0)
                  .sort((a, b) => parseInt(b.total_clientes) - parseInt(a.total_clientes))
                  .slice(0, 3)
                  .map((cartera, index) => (
                    <div key={cartera.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {index + 1}. {cartera.name.replace('_', ' ')}
                      </span>
                      <span className="font-semibold text-green-600">
                        {cartera.total_clientes} clientes
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabla dinámica según pestaña activa */}
      <div className="slide-up animate-delay-300">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'servicios' ? 'Servicios' : 'Carteras'} ({total} registros)
          </h2>
        </div>

        {isLoading && activeTab === 'carteras' ? (
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className="text-gray-500 mt-2">Cargando carteras...</p>
          </div>
        ) : error && activeTab === 'carteras' ? (
          <div className="text-center py-8 text-red-500">
            <p>Error al cargar las carteras</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {search ? 
              `No se encontraron ${activeTab === 'servicios' ? 'servicios' : 'carteras'} con los criterios de búsqueda` : 
              `No hay ${activeTab === 'servicios' ? 'servicios' : 'carteras'} registrados`
            }
          </div>
        ) : (
          <>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {activeTab === 'servicios' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Servicio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Zona
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Personal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duración
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cartera
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clientes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nodos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha Creación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((item, index) => (
                      <tr key={item.id} className={`hover:bg-gray-50 transition-colors duration-200 stagger-item animate-delay-${(index + 1) * 100}`}>
                        {activeTab === 'servicios' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Briefcase className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.nombre}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.cartera}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.zonaGestion === 'Minería' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {item.zonaGestion}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.categoria}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Tooltip 
                                content={getPersonalAsignadoInfo(item)}
                                position="top"
                              >
                                <div className="flex items-center text-sm text-gray-900 cursor-help">
                                  <Users className="h-4 w-4 mr-1 text-green-500" />
                                  {item.personalRequerido} personas
                                </div>
                              </Tooltip>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                                {item.duracion_horas}h
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button 
                                  className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                                  onClick={() => handleViewServicio(item)}
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button 
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  onClick={() => handleEditServicio(item)}
                                  title="Editar servicio"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  onClick={() => handleDeleteServicio(item)}
                                  title="Eliminar servicio"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <FolderOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 capitalize">
                                    {item.name.replace('_', ' ')}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Cartera de servicios
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Users className="h-4 w-4 mr-1 text-green-500" />
                                {item.total_clientes} clientes
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Settings className="h-4 w-4 mr-1 text-blue-500" />
                                {item.total_nodos} nodos
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(item.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button 
                                  className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                                  onClick={() => handleViewCartera(item)}
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button 
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  onClick={() => handleEditCartera(item)}
                                  title="Editar cartera"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  onClick={() => handleDeleteCartera(item)}
                                  title="Eliminar cartera"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
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


      {/* Modal de Nuevo Servicio */}
      <ServicioModal
        isOpen={showServicioModal}
        onClose={() => setShowServicioModal(false)}
        onSuccess={(servicio) => handleServicioSuccess(servicio)}
      />

      {/* Modal de Agregar Cliente */}
      <AgregarClienteModal
        isOpen={showAgregarClienteModal}
        onClose={() => setShowAgregarClienteModal(false)}
        onSuccess={handleAgregarClienteSuccess}
        carteras={carteras}
      />

      {/* Modal de Ver Cartera */}
      <CarteraViewModal
        isOpen={showCarteraViewModal}
        onClose={() => setShowCarteraViewModal(false)}
        cartera={selectedCartera}
      />

      {/* Modal de Editar Cartera */}
      <CarteraEditModal
        isOpen={showCarteraEditModal}
        onClose={() => setShowCarteraEditModal(false)}
        onSuccess={handleCarteraEditSuccess}
        cartera={selectedCartera}
      />

      {/* Modal de Eliminar Cartera */}
      <CarteraDeleteModal
        isOpen={showCarteraDeleteModal}
        onClose={() => setShowCarteraDeleteModal(false)}
        onConfirm={handleCarteraDeleteConfirm}
        cartera={selectedCartera}
      />

      {/* Modal de Ver Servicio */}
      <ServicioViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        servicio={selectedServicio}
      />

      {/* Modal de Editar Servicio */}
      <ServicioEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        servicio={selectedServicio}
      />

      {/* Modal de Eliminar Servicio */}
      <ServicioDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        servicio={selectedServicio}
      />
    </div>
  );
};
