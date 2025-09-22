import React, { useState } from 'react';
import { usePersonalList, useDeletePersonal } from '../hooks/usePersonal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PersonalForm } from '../components/personal/PersonalForm';
import { PersonalDetailModal } from '../components/personal/PersonalDetailModal';
import { Search, Plus, Trash2, Eye, User, Mail, CheckCircle, XCircle } from 'lucide-react';
import { Personal } from '../types';

// Estados de actividad (para UI, no relacionados con backend)
const estadosActividad = [
  { id: 'activo', label: 'Activo', color: 'green', icon: CheckCircle },
  { id: 'inactivo', label: 'Inactivo', color: 'red', icon: XCircle }
];

// Función para obtener estado de actividad basado en el campo 'activo'
const getEstadoActividad = (activo: boolean) => {
  return activo ? estadosActividad[0] : estadosActividad[1];
};

// Función para formatear fecha (comentada porque no se usa actualmente)
// const formatDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString('es-CL', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   });
// };

// Función para formatear hora de actualización
const formatUpdateTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minutos`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }
};

export const PersonalPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [limit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Debounce search para evitar demasiadas consultas
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset página cuando cambie búsqueda
    }, 300); // 300ms de delay

    return () => clearTimeout(timer);
  }, [search]);

  // Usar el hook real para obtener datos del backend con búsqueda debounced
  const { data: personalData, isLoading, error, refetch } = usePersonalList(page, limit, debouncedSearch);
  const deletePersonalMutation = useDeletePersonal();

  // Extraer datos de la respuesta
  const personalList = personalData?.data?.items || [];
  const total = personalData?.data?.total || 0;
  const totalPages = personalData?.data?.totalPages || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    // El refetch se ejecutará automáticamente porque cambió el queryKey con el nuevo search
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleView = (personal: Personal) => {
    setSelectedPersonal(personal);
    setShowDetailModal(true);
  };

  const handleDelete = (personal: Personal) => {
    setSelectedPersonal(personal);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedPersonal) {
      try {
        await deletePersonalMutation.mutateAsync(selectedPersonal.id || selectedPersonal.rut);
        setShowDeleteModal(false);
        setSelectedPersonal(null);
        refetch();
        // Aquí puedes mostrar un toast de éxito
        alert('Personal eliminado exitosamente');
      } catch (error) {
        alert('Error al eliminar personal');
      }
    }
  };

  const handleFormSuccess = () => {
    refetch();
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPersonal(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al cargar el personal</p>
          <button 
            onClick={() => refetch()}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 fade-in">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary hover-grow"
        >
          <Plus className="h-4 w-4" />
          Nuevo Personal
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="card hover-lift slide-up animate-delay-200 mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT, cargo, zona geográfica..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="btn-primary whitespace-nowrap py-2 px-4 text-sm"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Cards de personal */}
      <div className="slide-up animate-delay-300">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Personal ({total} registros)
          </h2>
        </div>

        {personalList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {search ? 'No se encontró personal con esos criterios' : 'No hay personal registrado'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {personalList.map((persona, index) => {
                const estadoActividad = getEstadoActividad(persona.activo || false);
                const IconComponent = estadoActividad.icon;
                const getStatusColor = (color: string) => {
                  const colors = {
                    green: 'bg-green-100 text-green-800 border-green-200',
                    red: 'bg-red-100 text-red-800 border-red-200'
                  };
                  return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
                };

                return (
                  <div key={persona.id} className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 stagger-item animate-delay-${(index + 1) * 100}`}>
                    {/* Header con foto y info básica */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {persona.nombre} {persona.apellido}
                          </h3>
                          <p className="text-sm text-gray-600">{persona.cargo}</p>
                          {persona.empresa && (
                            <div className="flex items-center mt-1 text-sm text-blue-600">
                              <User className="h-3 w-3 mr-1" />
                              {persona.empresa.nombre}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            RUT: {persona.rut}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="text-primary-600 hover:text-primary-900 p-2 rounded-full hover:bg-primary-50"
                          onClick={() => handleView(persona)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button 
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                          onClick={() => handleDelete(persona)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Estado actual */}
                    <div className="mb-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(estadoActividad.color)}`}>
                        <IconComponent className="h-4 w-4 mr-2" />
                        {estadoActividad.label}
                      </div>
                      <span className="ml-3 text-xs text-gray-500">
                        Actualizado: {formatUpdateTime(persona.updated_at || new Date().toISOString())}
                      </span>
                    </div>

                    {/* Información de Nacimiento */}
                    {/* <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</h4>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {formatDate(persona.fecha_nacimiento)}
                      </p>
                    </div> */}

                    {/* Información de Registro */}
                    {/* <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Zona Geográfica</h4>
                      <p className="text-sm text-gray-600 italic">
                        {persona.zona_geografica}
                      </p>
                    </div> */}

                    {/* Información Adicional */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {persona.sexo === 'M' ? 'Masculino' : 'Femenino'}
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          Licencia: {persona.licencia_conducir}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-8">
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
                      <span className="font-medium">{endIndex}</span>{' '}
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

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedPersonal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ¿Eliminar Personal?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar a <strong>{selectedPersonal.nombre} {selectedPersonal.apellido}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPersonal(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletePersonalMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deletePersonalMutation.isLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear personal */}
      <PersonalForm
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSuccess={handleFormSuccess}
      />

      {/* Modal para ver detalles del personal */}
      <PersonalDetailModal
        personal={selectedPersonal}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onUpdate={refetch}
      />
    </div>
  );
};