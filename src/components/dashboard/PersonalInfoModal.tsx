import React from 'react';
import { createPortal } from 'react-dom';
import { X, Users } from 'lucide-react';

interface PersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPersonal: number;
  personalActivo: number;
  personalTrabajando: number;
  personalAcreditacion?: number;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  isOpen,
  onClose,
  totalPersonal,
  personalActivo,
  personalTrabajando,
  personalAcreditacion = 0
}) => {
  if (!isOpen) return null;

  const personalInactivo = totalPersonal - personalActivo;
  const porcentajeActivo = totalPersonal > 0 ? Math.round((personalActivo/totalPersonal)*100) : 0;
  const porcentajeInactivo = totalPersonal > 0 ? Math.round((personalInactivo/totalPersonal)*100) : 0;
  const porcentajeAcreditacion = totalPersonal > 0 ? Math.round((personalAcreditacion/totalPersonal)*100) : 0;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Información del Personal</h2>
                <p className="text-blue-100">Resumen estadístico del personal registrado</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Personal */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Total Personal</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{totalPersonal}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Personal Activo */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Personal Activo</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{personalActivo}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-100">
                  <div className="h-6 w-6 rounded-full bg-green-500"></div>
                </div>
              </div>
            </div>

            {/* Personal Trabajando */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-900">Personal Trabajando</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{personalTrabajando}</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-100">
                  <div className="h-6 w-6 rounded-full bg-orange-500"></div>
                </div>
              </div>
            </div>

            {/* Proceso de Acreditación */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-900">Proceso de Acreditación</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{personalAcreditacion}</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-100">
                  <div className="h-6 w-6 rounded-full bg-yellow-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Distribución por Estado */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Personal Activo</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {personalActivo} ({porcentajeActivo}%)
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Personal Inactivo</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {personalInactivo} ({porcentajeInactivo}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Proceso de Acreditación</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {personalAcreditacion} ({porcentajeAcreditacion}%)
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${porcentajeActivo}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">Resumen Detallado</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <span className="font-semibold">{personalTrabajando}</span> personas están actualmente trabajando</p>
              <p>• <span className="font-semibold">{personalActivo - personalTrabajando}</span> personas activas no trabajando</p>
              <p>• <span className="font-semibold">{personalAcreditacion}</span> personas en proceso de acreditación</p>
              <p>• <span className="font-semibold">{personalInactivo}</span> personas inactivas en el sistema</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total registrado:</span> {totalPersonal} personas
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
