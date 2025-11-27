import React, { useState, useMemo, useEffect } from 'react';
import { Prerrequisito, usePrerrequisitosByCliente, useAllPrerrequisitos, useCreatePrerrequisito, useUpdatePrerrequisito, useDeletePrerrequisito } from '../../hooks/useGestionPrerrequisitos';
import { toast } from 'react-toastify';
import { FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import { Globe, Edit, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PrerrequisitosClienteProps {
  clienteId: number | null;
}

export const PrerrequisitosCliente: React.FC<PrerrequisitosClienteProps> = ({ clienteId }) => {
  const [newPrerrequisito, setNewPrerrequisito] = useState({ tipo_documento: '', dias_duracion: '' });
  const [clients, setClients] = useState<Array<{ id: number; nombre: string }>>([]);
  const [selectedClienteForCreate, setSelectedClienteForCreate] = useState<number | null>(clienteId ?? null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<{ tipo_documento: string; dias_duracion: string | number }>({ tipo_documento: '', dias_duracion: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const isGlobalMode = clienteId === null;

  useEffect(() => {
    // Keep the default selected client in sync with the prop
    setSelectedClienteForCreate(clienteId ?? null);
  }, [clienteId]);

  useEffect(() => {
    // Load clients list to allow associating a prerrequisito to a specific client
    let mounted = true;
    const load = async () => {
      try {
        const res: any = await (await import('../../services/api')).default.getClientes({ limit: 2000 });
        if (!mounted) return;
        const data = res?.data || (res?.data?.data) || res;
        // normalize to array
        const list = Array.isArray(data) ? data : (data?.items || []);
        setClients(list.map((c: any) => ({ id: c.id, nombre: c.nombre || c.nombre_completo || `Cliente ${c.id}`})));
      } catch (e) {
        // ignore load errors — clients dropdown is optional
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const { data: prerrequisitosCliente, isLoading: isLoadingCliente } = usePrerrequisitosByCliente(clienteId, {
    enabled: !isGlobalMode,
  });

  const { data: prerrequisitosGlobales, isLoading: isLoadingGlobales } = useAllPrerrequisitos({
    enabled: true,
  });

  const createMutation = useCreatePrerrequisito();
  const updateMutation = useUpdatePrerrequisito();
  const deleteMutation = useDeletePrerrequisito();

  const prerrequisitosMostrados = useMemo(() => {
    let combinedList: Prerrequisito[] = [];

    if (isGlobalMode) {
      combinedList = prerrequisitosGlobales ?? [];
    } else {
      const cliente = prerrequisitosCliente ?? [];
      const globales = prerrequisitosGlobales ?? [];
      const tiposDeDocumentoCliente = new Set(cliente.map(p => p.tipo_documento));
      const globalesFiltrados = globales.filter(pGlobal => !tiposDeDocumentoCliente.has(pGlobal.tipo_documento));
      combinedList = [...cliente, ...globalesFiltrados];
    }
    
    const filtered = searchTerm
      ? combinedList.filter(p => p.tipo_documento.toLowerCase().includes(searchTerm.toLowerCase()))
      : combinedList;

    // Sort so that global prerequisites appear first in client view,
    // then fall back to alphabetical order by tipo_documento within each group.
    return filtered.sort((a, b) => {
      // If one is global and the other isn't, global goes first
      if (a.es_global && !b.es_global) return -1;
      if (!a.es_global && b.es_global) return 1;
      // Otherwise sort alphabetically
      return a.tipo_documento.localeCompare(b.tipo_documento);
    });
  }, [prerrequisitosCliente, prerrequisitosGlobales, isGlobalMode, searchTerm]);

  const isLoading = isLoadingGlobales || (!isGlobalMode && isLoadingCliente);

  const handleCreate = () => {
    if (!newPrerrequisito.tipo_documento) {
      toast.error('El tipo de documento es obligatorio.');
      return;
    }
    const payload = {
      ...newPrerrequisito,
      cliente_id: typeof selectedClienteForCreate !== 'undefined' ? selectedClienteForCreate : clienteId,
      dias_duracion: newPrerrequisito.dias_duracion ? Number(newPrerrequisito.dias_duracion) : null,
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Prerrequisito creado exitosamente.');
        setNewPrerrequisito({ tipo_documento: '', dias_duracion: '' });
      },
      onError: (error) => toast.error(`Error al crear: ${error.message}`),
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este prerrequisito?')) {
      deleteMutation.mutate({ id, cliente_id: clienteId }, {
        onSuccess: () => toast.success('Prerrequisito eliminado.'),
        onError: (error) => toast.error(`Error al eliminar: ${error.message}`),
      });
    }
  };

  const startEditing = (prerrequisito: Prerrequisito) => {
    setEditingId(prerrequisito.id);
    setEditingData({
      tipo_documento: prerrequisito.tipo_documento,
      dias_duracion: prerrequisito.dias_duracion ?? '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingData({ tipo_documento: '', dias_duracion: '' });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    const payload = {
      id: editingId,
      data: {
        tipo_documento: editingData.tipo_documento,
        dias_duracion: editingData.dias_duracion ? Number(editingData.dias_duracion) : null,
      },
      cliente_id: clienteId
    };
    updateMutation.mutate(payload, {
      onSuccess: () => {
        setEditingId(null);
        setEditingData({ tipo_documento: '', dias_duracion: '' });
        toast.success('Prerrequisito actualizado.');
      },
      onError: (error) => toast.error(`Error al actualizar: ${error.message}`),
    });
  };

  const allPrerrequisitosTipos = useMemo(() => 
    Array.from(new Set(prerrequisitosGlobales?.map(p => p.tipo_documento) ?? [])),
    [prerrequisitosGlobales]
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {isGlobalMode ? 'Crear Prerrequisito Global' : 'Añadir Prerrequisito para Cliente'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label htmlFor="tipo_documento" className="block text-sm font-medium text-gray-700">Tipo de documento</label>
              <input
                type="text"
                id="tipo_documento"
                list="prerrequisitos-tipos"
                value={newPrerrequisito.tipo_documento}
                onChange={(e) => setNewPrerrequisito({ ...newPrerrequisito, tipo_documento: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ej: Licencia de conducir"
              />
              {/* If creating a non-global prerrequisito allow selecting the client association */}
              {!isGlobalMode && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-600">Asociar a cliente (parciales)</label>
                  <select
                    value={selectedClienteForCreate ?? ''}
                    onChange={(e) => setSelectedClienteForCreate(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Seleccionar cliente (por defecto el cliente actual)</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              <datalist id="prerrequisitos-tipos">
                {allPrerrequisitosTipos.map(tipo => <option key={tipo} value={tipo} />)}
              </datalist>
            </div>
            <div>
              <label htmlFor="dias_duracion" className="block text-sm font-medium text-gray-700">Días de duración</label>
              <input
                type="number"
                id="dias_duracion"
                value={newPrerrequisito.dias_duracion}
                onChange={(e) => setNewPrerrequisito({ ...newPrerrequisito, dias_duracion: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ej: 365 (opcional)"
              />
            </div>
            <div className="md:col-span-3 text-right">
              <button
                onClick={handleCreate}
                disabled={createMutation.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                <FaPlus className="mr-2" />
                Añadir
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {isGlobalMode ? 'Prerrequisitos Globales' : 'Lista de Prerrequisitos del Cliente'}
          </h3>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por tipo de documento"
              className="border rounded-lg py-2 px-3 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="space-y-2">
            {prerrequisitosMostrados.map((prerrequisito) => {
              const isGlobalInClientView = !isGlobalMode && prerrequisito.es_global;
              const isEditing = editingId === prerrequisito.id;
              return (
                <li key={prerrequisito.id} className={`p-3 rounded-lg flex items-center justify-between transition-colors ${isEditing ? 'bg-indigo-50' : isGlobalInClientView ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editingData.tipo_documento}
                        onChange={(e) => setEditingData({ ...editingData, tipo_documento: e.target.value })}
                        className="border-gray-300 rounded-md shadow-sm flex-grow"
                      />
                      <input
                        type="number"
                        value={editingData.dias_duracion}
                        onChange={(e) => setEditingData({ ...editingData, dias_duracion: e.target.value })}
                        className="border-gray-300 rounded-md shadow-sm ml-2 w-32"
                        placeholder="Días"
                      />
                      <div className="flex items-center space-x-2 ml-2">
                        <button onClick={handleUpdate} className="text-green-500 hover:text-green-700 p-1" disabled={updateMutation.isLoading}><FaSave /></button>
                        <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700 p-1"><FaTimes /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 flex items-center">
                         {isGlobalInClientView && (
                          <span className="mr-3" title="Prerrequisito Global">
                            <Globe size={16} className="text-blue-500" />
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{prerrequisito.tipo_documento}</p>
                          <p className="text-sm text-gray-500">
                            {prerrequisito.dias_duracion ? `Válido por ${prerrequisito.dias_duracion} días` : 'Duración no especificada'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isGlobalInClientView && (
                          <>
                            <button onClick={() => startEditing(prerrequisito)} className="text-blue-500 hover:text-blue-700 p-1">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleDelete(prerrequisito.id)} className="text-red-500 hover:text-red-700 p-1" disabled={deleteMutation.isLoading && deleteMutation.variables?.id === prerrequisito.id}>
                              {deleteMutation.isLoading && deleteMutation.variables?.id === prerrequisito.id ? <LoadingSpinner size="sm" /> : <Trash2 size={18} />}
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrerrequisitosCliente;
