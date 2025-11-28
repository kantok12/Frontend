import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	items: Array<{ id: number; nombre_documento?: string; tipo_documento?: string }>;
}

const ConfirmDeleteMultipleModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, items }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-10">
				<div className="flex items-start justify-between mb-4">
					<div className="pr-4 flex-1">
						<h3 className="text-2xl font-semibold leading-tight">Confirmar eliminación</h3>
						<p className="text-sm text-gray-700 mt-2">Se eliminarán {items.length} documento{items.length !== 1 ? 's' : ''}. Esta acción es irreversible.</p>
					</div>
					<div className="flex-shrink-0">
						<button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full bg-white hover:bg-gray-50"><X className="h-5 w-5" /></button>
					</div>
				</div>

				<div className="max-h-[60vh] overflow-y-auto mb-6 border p-4 rounded-lg bg-gray-50">
					<ul className="text-sm text-gray-800 space-y-3">
						{items.map(i => (
							<li key={i.id} className="flex items-center justify-between">
								<span className="truncate pr-4">{i.nombre_documento || `Documento ${i.id}`}</span>
								<span className="text-xs text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded">{i.tipo_documento || ''}</span>
							</li>
						))}
					</ul>
				</div>

				<div className="flex justify-end space-x-4">
					<button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">Cancelar</button>
					<button onClick={onConfirm} className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center min-w-[160px]"><Trash2 className="h-4 w-4 mr-2" />Eliminar</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmDeleteMultipleModal;

