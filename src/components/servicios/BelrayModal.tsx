import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateBelray, useUpdateBelray } from '../../hooks/useBelray';

interface BelrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresa?: any | null;
}

export const BelrayModal: React.FC<BelrayModalProps> = ({ isOpen, onClose, empresa }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    observaciones: '',
    giro: '',
    numero_telefono: '',
    direccion: '',
    razon_social: '',
    rut_empresa: '',
    comuna: '',
    correo_electronico: '',
    representante_legal: '',
    gerente_general: '',
    numero_trabajadores_obra: '',
    organismo_admin_ley_16744: '',
    numero_adherentes: '',
    tasa_siniestralidad_generica: '',
    tasa_siniestralidad_adicional: '',
    experto_prevencion_riesgos: '',
    supervisor_coordinador_obra: '',
  });

  const createMutation = useCreateBelray();
  const updateMutation = useUpdateBelray();

  const isEditing = !!empresa;

  useEffect(() => {
    if (empresa) {
      setFormData({
        nombre: empresa.nombre || '',
        descripcion: empresa.descripcion || '',
        observaciones: empresa.observaciones || '',
        giro: empresa.giro || '',
        numero_telefono: empresa.numero_telefono || '',
        direccion: empresa.direccion || '',
        razon_social: empresa.razon_social || '',
        rut_empresa: empresa.rut_empresa || '',
        comuna: empresa.comuna || '',
        correo_electronico: empresa.correo_electronico || '',
        representante_legal: empresa.representante_legal || '',
        gerente_general: empresa.gerente_general || '',
        numero_trabajadores_obra: empresa.numero_trabajadores_obra || '',
        organismo_admin_ley_16744: empresa.organismo_admin_ley_16744 || '',
        numero_adherentes: empresa.numero_adherentes || '',
        tasa_siniestralidad_generica: empresa.tasa_siniestralidad_generica || '',
        tasa_siniestralidad_adicional: empresa.tasa_siniestralidad_adicional || '',
        experto_prevencion_riesgos: empresa.experto_prevencion_riesgos || '',
        supervisor_coordinador_obra: empresa.supervisor_coordinador_obra || '',
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        observaciones: '',
        giro: '',
        numero_telefono: '',
        direccion: '',
        razon_social: '',
        rut_empresa: '',
        comuna: '',
        correo_electronico: '',
        representante_legal: '',
        gerente_general: '',
        numero_trabajadores_obra: '',
        organismo_admin_ley_16744: '',
        numero_adherentes: '',
        tasa_siniestralidad_generica: '',
        tasa_siniestralidad_adicional: '',
        experto_prevencion_riesgos: '',
        supervisor_coordinador_obra: '',
      });
    }
  }, [empresa]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: empresa.id, data: formData });
        alert('Empresa actualizada exitosamente');
      } else {
        await createMutation.mutateAsync(formData);
        alert('Empresa creada exitosamente');
      }
      onClose();
    } catch (error: any) {
      alert(error?.response?.data?.message || `Error al ${isEditing ? 'actualizar' : 'crear'} empresa`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Empresa Belray' : 'Agregar Empresa Belray'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Información Básica */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Información Básica</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Empresa Belray S.A."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT Empresa</label>
                    <input
                      type="text"
                      name="rut_empresa"
                      value={formData.rut_empresa}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12.345.678-9"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                    <input
                      type="text"
                      name="razon_social"
                      value={formData.razon_social}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Razón social"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giro</label>
                  <input
                    type="text"
                    name="giro"
                    value={formData.giro}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Giro o actividad comercial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleChange(e as any)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción de la empresa"
                  />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      name="numero_telefono"
                      value={formData.numero_telefono}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+56 2 2345 6789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="correo_electronico"
                      value={formData.correo_electronico}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contacto@empresa.cl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Av. Principal 123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
                    <input
                      type="text"
                      name="comuna"
                      value={formData.comuna}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Las Condes"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Clave */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Personal Clave</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Representante Legal</label>
                    <input
                      type="text"
                      name="representante_legal"
                      value={formData.representante_legal}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre del representante"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gerente General</label>
                    <input
                      type="text"
                      name="gerente_general"
                      value={formData.gerente_general}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre del gerente"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experto Prevención de Riesgos</label>
                    <input
                      type="text"
                      name="experto_prevencion_riesgos"
                      value={formData.experto_prevencion_riesgos}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre del experto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor/Coordinador Obra</label>
                    <input
                      type="text"
                      name="supervisor_coordinador_obra"
                      value={formData.supervisor_coordinador_obra}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre del supervisor"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Datos Laborales y Seguridad */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Datos Laborales y Seguridad</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Trabajadores Obra</label>
                    <input
                      type="number"
                      name="numero_trabajadores_obra"
                      value={formData.numero_trabajadores_obra}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Adherentes</label>
                    <input
                      type="number"
                      name="numero_adherentes"
                      value={formData.numero_adherentes}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organismo Ley 16.744</label>
                    <input
                      type="text"
                      name="organismo_admin_ley_16744"
                      value={formData.organismo_admin_ley_16744}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mutual / ISL"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasa Siniestralidad Genérica (%)</label>
                    <input
                      type="text"
                      name="tasa_siniestralidad_generica"
                      value={formData.tasa_siniestralidad_generica}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasa Siniestralidad Adicional (%)</label>
                    <input
                      type="text"
                      name="tasa_siniestralidad_adicional"
                      value={formData.tasa_siniestralidad_adicional}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Observaciones</h3>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleChange(e as any)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observaciones o notas adicionales..."
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : isEditing
              ? 'Actualizar'
              : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
};
