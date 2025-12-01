import React, { useState, useEffect } from 'react';
import { Upload, Mail, FolderOpen, Globe, User, Edit2, Save, X, Clock, FileText } from 'lucide-react';
import apiService from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface MetodoSubidaDocumentosProps {
  clienteId: number;
  clienteNombre: string;
  metodoActual?: string;
  configActual?: any;
  onUpdate?: () => void;
}

const METODOS_DISPONIBLES = [
  {
    id: 'portal_web',
    nombre: 'Portal Web',
    descripcion: 'Los trabajadores suben documentos directamente a través del portal web',
    icon: Globe,
    color: 'blue'
  },
  {
    id: 'email',
    nombre: 'Correo Electrónico',
    descripcion: 'Los documentos se envían por correo electrónico',
    icon: Mail,
    color: 'green'
  },
  {
    id: 'carpeta_compartida',
    nombre: 'Carpeta Compartida',
    descripcion: 'Documentos se suben a una carpeta compartida (Google Drive, OneDrive, red local)',
    icon: FolderOpen,
    color: 'yellow'
  },
  {
    id: 'plataforma_externa',
    nombre: 'Plataforma Externa',
    descripcion: 'Los documentos se gestionan en una plataforma externa (Workday, SAP, etc.)',
    icon: Upload,
    color: 'purple'
  },
  {
    id: 'presencial',
    nombre: 'Entrega Presencial',
    descripcion: 'Los documentos se entregan de forma presencial',
    icon: User,
    color: 'gray'
  }
];

export const MetodoSubidaDocumentos: React.FC<MetodoSubidaDocumentosProps> = ({
  clienteId,
  clienteNombre,
  metodoActual = 'portal_web',
  configActual,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [metodoSeleccionado, setMetodoSeleccionado] = useState(metodoActual);
  const [configuracion, setConfiguracion] = useState<any>(configActual || {});

  useEffect(() => {
    setMetodoSeleccionado(metodoActual);
    setConfiguracion(configActual || {});
  }, [metodoActual, configActual]);

  const metodoInfo = METODOS_DISPONIBLES.find(m => m.id === metodoSeleccionado);
  const IconComponent = metodoInfo?.icon || Upload;

  const handleSave = async () => {
    if (!metodoSeleccionado) {
      alert('Debe seleccionar un método de subida');
      return;
    }

    setLoading(true);
    try {
      await apiService.updateMetodoSubidaCliente(clienteId, {
        metodo_subida_documentos: metodoSeleccionado,
        config_subida_documentos: configuracion
      });
      alert('Método de subida actualizado correctamente');
      setIsEditing(false);
      onUpdate?.();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error al actualizar método de subida');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMetodoSeleccionado(metodoActual);
    setConfiguracion(configActual || {});
    setIsEditing(false);
  };

  const loadHistorial = async () => {
    setLoadingHistory(true);
    try {
      const response = await apiService.getHistorialMetodoSubidaCliente(clienteId);
      setHistorial(response.data || []);
      setShowHistory(true);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const renderConfiguracion = () => {
    switch (metodoSeleccionado) {
      case 'email':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo de Recepción
              </label>
              <input
                type="email"
                value={configuracion.email_recepcion || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, email_recepcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="documentos@empresa.cl"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asunto Requerido
              </label>
              <input
                type="text"
                value={configuracion.asunto_requerido || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, asunto_requerido: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="[DOCUMENTOS] RUT - Nombre"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instrucciones Adicionales
              </label>
              <textarea
                value={configuracion.instrucciones || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, instrucciones: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Instrucciones para el trabajador..."
                disabled={!isEditing}
              />
            </div>
          </div>
        );

      case 'carpeta_compartida':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Carpeta
              </label>
              <select
                value={configuracion.tipo_carpeta || 'google_drive'}
                onChange={(e) => setConfiguracion({ ...configuracion, tipo_carpeta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isEditing}
              >
                <option value="google_drive">Google Drive</option>
                <option value="onedrive">OneDrive</option>
                <option value="red_local">Red Local</option>
                <option value="ftp">Servidor FTP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ruta/URL
              </label>
              <input
                type="text"
                value={configuracion.ruta || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, ruta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="\\servidor\documentos o https://drive.google.com/..."
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credenciales de Acceso
              </label>
              <input
                type="text"
                value={configuracion.credenciales || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, credenciales: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Usuario o enlace de acceso"
                disabled={!isEditing}
              />
            </div>
          </div>
        );

      case 'plataforma_externa':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Plataforma
              </label>
              <input
                type="text"
                value={configuracion.nombre_plataforma || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, nombre_plataforma: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Workday, SAP, Oracle, etc."
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de Acceso
              </label>
              <input
                type="url"
                value={configuracion.url_acceso || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, url_acceso: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://plataforma.empresa.com"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contacto de Soporte
              </label>
              <input
                type="text"
                value={configuracion.contacto_soporte || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, contacto_soporte: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="soporte@empresa.cl o +56 9 1234 5678"
                disabled={!isEditing}
              />
            </div>
          </div>
        );

      case 'presencial':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección de Entrega
              </label>
              <input
                type="text"
                value={configuracion.direccion || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, direccion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Av. Principal 123, Oficina 456"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horario de Atención
              </label>
              <input
                type="text"
                value={configuracion.horario || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, horario: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Lunes a Viernes 9:00 - 18:00"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                value={configuracion.contacto || ''}
                onChange={(e) => setConfiguracion({ ...configuracion, contacto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Juan Pérez - Recepción"
                disabled={!isEditing}
              />
            </div>
          </div>
        );

      case 'portal_web':
      default:
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del Portal
              </label>
              <input
                type="url"
                value={configuracion.url_portal || window.location.origin}
                onChange={(e) => setConfiguracion({ ...configuracion, url_portal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={window.location.origin}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instrucciones
              </label>
              <textarea
                value={configuracion.instrucciones || 'Acceda al portal web y suba sus documentos en la sección correspondiente.'}
                onChange={(e) => setConfiguracion({ ...configuracion, instrucciones: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isEditing}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Método de Subida de Documentos
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Configuración para {clienteNombre}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHistorial}
            disabled={loadingHistory}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            title="Ver historial de cambios"
          >
            <Clock className="h-4 w-4" />
            Historial
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selector de método */}
      {isEditing && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Seleccione el Método de Subida
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {METODOS_DISPONIBLES.map((metodo) => {
              const Icon = metodo.icon;
              const isSelected = metodoSeleccionado === metodo.id;
              return (
                <button
                  key={metodo.id}
                  onClick={() => setMetodoSeleccionado(metodo.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {metodo.nombre}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {metodo.descripcion}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Método actual */}
      {!isEditing && metodoInfo && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <IconComponent className={`h-6 w-6 text-${metodoInfo.color}-600`} />
            <div>
              <div className="font-semibold text-gray-900">{metodoInfo.nombre}</div>
              <div className="text-sm text-gray-600">{metodoInfo.descripcion}</div>
            </div>
          </div>
        </div>
      )}

      {/* Configuración específica */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Configuración del Método
        </h4>
        {renderConfiguracion()}
      </div>

      {/* Modal de historial */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Historial de Cambios
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : historial.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay historial de cambios
                </div>
              ) : (
                <div className="space-y-4">
                  {historial.map((item: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {METODOS_DISPONIBLES.find(m => m.id === item.metodo_anterior)?.nombre || item.metodo_anterior}
                            {' → '}
                            {METODOS_DISPONIBLES.find(m => m.id === item.metodo_nuevo)?.nombre || item.metodo_nuevo}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Por: {item.usuario_modificacion || 'Sistema'}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(item.fecha_cambio).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowHistory(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
