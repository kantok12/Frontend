import React from 'react';
import { X, Globe } from 'lucide-react';
import { PrerrequisitosCliente } from './PrerrequisitosCliente';

interface GlobalPrerrequisitosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalPrerrequisitosModal: React.FC<GlobalPrerrequisitosModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-5 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center">
            <Globe className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Gestión de Prerrequisitos Globales</h2>
              <p className="text-gray-300 text-sm">
                Estas reglas aplican a todo el personal, sin importar el cliente.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <PrerrequisitosCliente clienteId={null} />
        </div>
      </div>
    </div>
  );
};