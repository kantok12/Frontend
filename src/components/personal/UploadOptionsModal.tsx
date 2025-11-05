import React from 'react';
import { Upload, ListChecks, X } from 'lucide-react';

interface UploadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubirDesdeEquipo: () => void;
  onSeleccionarPendiente: () => void;
}

const UploadOptionsModal: React.FC<UploadOptionsModalProps> = ({
  isOpen,
  onClose,
  onSubirDesdeEquipo,
  onSeleccionarPendiente,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Elegir acción</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid gap-4">
          <button
            type="button"
            onClick={() => { onClose(); onSubirDesdeEquipo(); }}
            className="flex items-center gap-3 w-full border rounded-lg px-4 py-3 hover:bg-gray-50 text-left"
          >
            <Upload className="w-5 h-5 text-orange-600" />
            <div>
              <div className="font-medium">Subir desde equipo</div>
              <div className="text-xs text-gray-500">Selecciona un archivo de tu computador</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { onClose(); onSeleccionarPendiente(); }}
            className="flex items-center gap-3 w-full border rounded-lg px-4 py-3 hover:bg-gray-50 text-left"
          >
            <ListChecks className="w-5 h-5 text-amber-600" />
            <div>
              <div className="font-medium">Seleccionar pendiente</div>
              <div className="text-xs text-gray-500">Elegir desde los archivos detectados (Drive)</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadOptionsModal;
