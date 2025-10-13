import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Users, Building2, MapPin, Briefcase, ArrowRight, Clock } from 'lucide-react';
import { useGlobalSearch, SearchResult } from '../../hooks/useGlobalSearch';
import { Personal, Cliente, Nodo, Cartera } from '../../types';
import { LoadingSpinner } from './LoadingSpinner';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { results, totalResults, isLoading, error } = useGlobalSearch(query, isOpen);

  // Focus en el input cuando se abre el modal
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Cerrar modal al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleClose = () => {
    setQuery('');
    setSelectedCategory(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal':
        return <Users className="w-4 h-4" />;
      case 'clientes':
        return <Building2 className="w-4 h-4" />;
      case 'nodos':
        return <MapPin className="w-4 h-4" />;
      case 'carteras':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personal':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'clientes':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'nodos':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'carteras':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderPersonalItem = (item: Personal) => (
    <div key={item.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{item.nombre} {item.apellido}</h4>
            <p className="text-sm text-gray-500">RUT: {item.rut}</p>
            <p className="text-sm text-gray-500">{item.cargo}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  const renderClienteItem = (item: Cliente) => (
    <div key={item.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{item.nombre}</h4>
            <p className="text-sm text-gray-500">Cartera: {item.cartera_nombre || 'Sin cartera'}</p>
            <p className="text-sm text-gray-500">Nodos: {item.total_nodos}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  const renderNodoItem = (item: Nodo) => (
    <div key={item.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{item.nombre}</h4>
            <p className="text-sm text-gray-500">Cliente: {item.cliente_nombre || 'Sin cliente'}</p>
            <p className="text-sm text-gray-500">Cartera: {item.cartera_nombre || 'Sin cartera'}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  const renderCarteraItem = (item: Cartera) => (
    <div key={item.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{item.nombre}</h4>
            <p className="text-sm text-gray-500">Nodos: {item.total_nodos}</p>
            <p className="text-sm text-gray-500">Creada: {formatDate(item.fecha_creacion)}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  const categories = [
    { key: 'personal', label: 'Personal', count: results.personal.length, icon: Users },
    { key: 'clientes', label: 'Clientes', count: results.clientes.length, icon: Building2 },
    { key: 'nodos', label: 'Nodos', count: results.nodos.length, icon: MapPin },
    { key: 'carteras', label: 'Carteras', count: results.carteras.length, icon: Briefcase }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Búsqueda Global</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar personal, clientes, nodos, carteras..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
              <span className="ml-3 text-gray-600">Buscando...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-gray-600">Error al realizar la búsqueda</p>
                <p className="text-sm text-gray-500 mt-1">Intenta nuevamente</p>
              </div>
            </div>
          ) : query.trim() === '' ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600">Escribe algo para buscar</p>
                <p className="text-sm text-gray-500 mt-1">Personal, clientes, nodos, carteras...</p>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600">No se encontraron resultados</p>
                <p className="text-sm text-gray-500 mt-1">Intenta con otros términos de búsqueda</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Categories Sidebar */}
              <div className="w-64 border-r border-gray-200 bg-gray-50">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Categorías</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.key}
                        onClick={() => setSelectedCategory(
                          selectedCategory === category.key ? null : category.key
                        )}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          selectedCategory === category.key
                            ? 'bg-white shadow-sm border border-gray-200'
                            : 'hover:bg-white/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <category.icon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">{category.label}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          category.count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {category.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedCategory ? 
                        categories.find(c => c.key === selectedCategory)?.label : 
                        'Todos los resultados'
                      }
                    </h3>
                    <span className="text-sm text-gray-500">
                      {totalResults} resultado{totalResults !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {!selectedCategory && (
                      <>
                        {results.personal.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-3">
                              <Users className="w-5 h-5 text-blue-600" />
                              <h4 className="font-semibold text-gray-900">Personal ({results.personal.length})</h4>
                            </div>
                            {results.personal.map(renderPersonalItem)}
                          </div>
                        )}

                        {results.clientes.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-3">
                              <Building2 className="w-5 h-5 text-green-600" />
                              <h4 className="font-semibold text-gray-900">Clientes ({results.clientes.length})</h4>
                            </div>
                            {results.clientes.map(renderClienteItem)}
                          </div>
                        )}

                        {results.nodos.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-3">
                              <MapPin className="w-5 h-5 text-purple-600" />
                              <h4 className="font-semibold text-gray-900">Nodos ({results.nodos.length})</h4>
                            </div>
                            {results.nodos.map(renderNodoItem)}
                          </div>
                        )}

                        {results.carteras.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-3">
                              <Briefcase className="w-5 h-5 text-orange-600" />
                              <h4 className="font-semibold text-gray-900">Carteras ({results.carteras.length})</h4>
                            </div>
                            {results.carteras.map(renderCarteraItem)}
                          </div>
                        )}
                      </>
                    )}

                    {selectedCategory === 'personal' && results.personal.map(renderPersonalItem)}
                    {selectedCategory === 'clientes' && results.clientes.map(renderClienteItem)}
                    {selectedCategory === 'nodos' && results.nodos.map(renderNodoItem)}
                    {selectedCategory === 'carteras' && results.carteras.map(renderCarteraItem)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
