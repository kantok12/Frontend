import React from 'react';
import { Modal } from '../common/Modal';
import { PrerrequisitosCliente } from './PrerrequisitosCliente';
import { X } from 'lucide-react';

interface PrerrequisitosModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: number | null;
  clienteNombre: string;
}

export const PrerrequisitosModal: React.FC<PrerrequisitosModalProps> = ({ isOpen, onClose, clienteId, clienteNombre }) => {
  if (!isOpen || !clienteId) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gestionar Prerrequisitos para ${clienteNombre}`} size="xl">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestionar Prerrequisitos</h2>
            <p className="text-gray-600">Cliente: {clienteNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <PrerrequisitosCliente clienteId={clienteId} />
        </div>
      </div>
    </Modal>
  );
};
