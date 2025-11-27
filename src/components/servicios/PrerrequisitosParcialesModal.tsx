import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import apiService from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clienteId: number | null;
}

export const PrerrequisitosParcialesModal: React.FC<Props> = ({ isOpen, onClose, clienteId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (!clienteId) {
      setData([]);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await apiService.getPartialPrerequisitosCliente(clienteId, { includeGlobal: true, limit: 200, offset: 0 });
        const d = res?.data || res;
        setData(Array.isArray(d) ? d : (d?.data || []));
      } catch (e: any) {
        setError(e?.message || 'Error al cargar prerrequisitos parciales');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, clienteId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Prerrequisitos Parciales</h3>
            <p className="text-sm text-gray-500">Clientes: muestra personas que cumplen algunos prerrequisitos</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : data.length === 0 ? (
            <div className="text-gray-500">No hay personas con prerrequisitos parciales para este cliente.</div>
          ) : (
            <ul className="space-y-3">
              {data.map((item, idx) => (
                <li key={idx} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.persona?.nombres || item.rut || 'Sin nombre'}</div>
                      <div className="text-sm text-gray-500">{item.persona?.cargo || ''} • {item.persona?.rut || ''}</div>
                    </div>
                    <div className="text-sm text-gray-700">
                      Faltantes: {Array.isArray(item.faltantes) ? item.faltantes.join(', ') : (item.faltantes || '-')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrerrequisitosParcialesModal;
