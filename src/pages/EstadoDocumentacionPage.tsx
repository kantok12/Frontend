import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, Calendar, FileText, GraduationCap, Users, RefreshCw, Search, Filter, Download } from 'lucide-react';
import { useAllDocumentos } from '../hooks/useAllDocumentos';
import { useDownloadDocumento } from '../hooks/useDocumentos';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import * as XLSX from 'xlsx';

export const EstadoDocumentacionPage: React.FC = () => {
  const { documentos, isLoading, error, refetch } = useAllDocumentos();
  const downloadDocumentoMutation = useDownloadDocumento();
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [sortBy, setSortBy] = useState('fecha_vencimiento');
  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = () => {
    refetch();
  };

  const handleDownload = async (documentoId: number, nombreArchivo: string) => {
    try {
      await downloadDocumentoMutation.mutateAsync(documentoId);
    } catch (error) {
      console.error('Error al descargar documento:', error);
      // Aquí podrías mostrar un toast o mensaje de error al usuario
    }
  };

  // Function to handle export to Excel
  const handleExport = async () => {
    if (isExporting) return; // Prevenir múltiples clics
    
    setIsExporting(true);
    
    try {
      console.log('🔄 Iniciando exportación...');
      console.log('📊 Documentos a exportar:', documentosFiltrados.length);
      
      // Verificar que hay datos para exportar
      if (documentosFiltrados.length === 0) {
        alert('No hay documentos para exportar. Ajusta los filtros e intenta de nuevo.');
        return;
      }

      // Preparar datos para exportar
      const dataToExport = documentosFiltrados.map((documento) => ({
        'Personal': documento.personal?.nombres || 'N/A',
        'RUT': documento.rut_persona,
        'Documento': documento.nombre_documento,
        'Tipo': documento.tipo_documento,
        'Fecha Emisión': documento.fecha_emision_formateada,
        'Fecha Vencimiento': documento.fecha_vencimiento_formateada,
        'Estado': documento.estado_calculado,
        'Días Restantes': documento.dias_restantes || 'Sin fecha',
        'Descripción': documento.descripcion || '',
        'Institución Emisora': documento.institucion_emisora || '',
        'Estado Documento': documento.estado_documento || ''
      }));

      console.log('📋 Datos preparados para exportar:', dataToExport.length, 'registros');

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 25 }, // Personal
        { wch: 15 }, // RUT
        { wch: 30 }, // Documento
        { wch: 20 }, // Tipo
        { wch: 15 }, // Fecha Emisión
        { wch: 15 }, // Fecha Vencimiento
        { wch: 15 }, // Estado
        { wch: 15 }, // Días Restantes
        { wch: 30 }, // Descripción
        { wch: 20 }, // Institución Emisora
        { wch: 15 }  // Estado Documento
      ];
      ws['!cols'] = colWidths;

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Documentos Personal');

      // Generar nombre de archivo con fecha y hora
      const now = new Date();
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const nombreArchivo = `documentos_personal_${fecha}_${hora}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);

      console.log('✅ Archivo exportado exitosamente:', nombreArchivo);
      console.log('📊 Total de registros exportados:', dataToExport.length);
      
      // Mostrar mensaje de éxito
      alert(`✅ Archivo exportado exitosamente!\n\n📁 Nombre: ${nombreArchivo}\n📊 Registros: ${dataToExport.length}`);
      
    } catch (error) {
      console.error('❌ Error al exportar archivo:', error);
      alert('❌ Error al exportar el archivo. Por favor, inténtalo de nuevo.\n\nDetalles: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsExporting(false);
    }
  };

  // Filtrar y ordenar documentos
  const documentosFiltrados = useMemo(() => {
    let filtered = documentos;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.nombre_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.personal?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.rut_persona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tipo_documento?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (filterEstado !== 'todos') {
      filtered = filtered.filter(doc => doc.estado_calculado === filterEstado);
    }

    // Filtro por tipo
    if (filterTipo !== 'todos') {
      if (filterTipo === 'curso') {
        filtered = filtered.filter(doc => 
          doc.tipo_documento?.includes('curso') || 
          doc.tipo_documento?.includes('certificado') ||
          doc.tipo_documento?.includes('diploma')
        );
      } else {
        filtered = filtered.filter(doc => 
          !doc.tipo_documento?.includes('curso') && 
          !doc.tipo_documento?.includes('certificado') &&
          !doc.tipo_documento?.includes('diploma')
        );
      }
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'fecha_vencimiento':
          if (!a.fecha_vencimiento && !b.fecha_vencimiento) return 0;
          if (!a.fecha_vencimiento) return 1;
          if (!b.fecha_vencimiento) return -1;
          return new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime();
        case 'nombre_persona':
          return (a.personal?.nombres || a.rut_persona || '').localeCompare(b.personal?.nombres || b.rut_persona || '');
        case 'tipo_documento':
          return (a.tipo_documento || '').localeCompare(b.tipo_documento || '');
        case 'estado':
          const estadoOrder = { 'vencido': 0, 'por_vencer': 1, 'vigente': 2, 'sin_fecha': 3 };
          return (estadoOrder[a.estado_calculado as keyof typeof estadoOrder] || 4) - 
                 (estadoOrder[b.estado_calculado as keyof typeof estadoOrder] || 4);
        default:
          return 0;
      }
    });

    return filtered;
  }, [documentos, searchTerm, filterEstado, filterTipo, sortBy]);

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'vencido': return 'bg-red-100 text-red-800 border-red-200';
      case 'por_vencer': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vigente': return 'bg-green-100 text-green-800 border-green-200';
      case 'sin_fecha': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el icono del estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'vencido': return <AlertTriangle className="h-4 w-4" />;
      case 'por_vencer': return <Clock className="h-4 w-4" />;
      case 'vigente': return <CheckCircle className="h-4 w-4" />;
      case 'sin_fecha': return <Calendar className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header de la Página */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              to="/personal"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Personal
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Control de Documentación</h1>
              <p className="text-gray-600 mt-1">Vista completa de todos los documentos del personal con fechas de vencimiento</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, RUT, documento o tipo..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los Estados</option>
              <option value="vencido">Vencidos</option>
              <option value="por_vencer">Por Vencer</option>
              <option value="vigente">Vigentes</option>
              <option value="sin_fecha">Sin Fecha</option>
            </select>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="documento">Documentos Personales</option>
              <option value="curso">Cursos y Certificaciones</option>
            </select>
          </div>
        </div>

        {/* Ordenamiento */}
        <div className="mt-4 flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="fecha_vencimiento">Fecha de Vencimiento</option>
            <option value="nombre_persona">Nombre de Persona</option>
            <option value="tipo_documento">Tipo de Documento</option>
            <option value="estado">Estado</option>
          </select>
        </div>
      </div>

      {/* Contenido Principal */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Cargando documentos...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar documentos</h3>
          <p className="text-gray-600 mb-4">No se pudieron cargar los documentos</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Header de la tabla */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Documentos ({documentosFiltrados.length} de {documentos.length})
              </h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleExport}
                  disabled={isExporting || documentosFiltrados.length === 0}
                  className={`flex items-center px-3 py-1 text-sm rounded-lg transition-colors ${
                    isExporting || documentosFiltrados.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      Exportar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de documentos */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron documentos con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  documentosFiltrados.map((documento) => (
                    <tr key={documento.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {documento.personal?.nombres || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {documento.rut_persona}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{documento.nombre_documento}</div>
                        {documento.descripcion && (
                          <div className="text-sm text-gray-500">{documento.descripcion}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {documento.tipo_documento}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.fecha_emision_formateada}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.fecha_vencimiento_formateada}
                        {documento.dias_restantes !== null && (
                          <div className="text-xs text-gray-500">
                            {documento.dias_restantes < 0 
                              ? `Vencido hace ${Math.abs(documento.dias_restantes)} días`
                              : documento.dias_restantes === 0
                              ? 'Vence hoy'
                              : `Vence en ${documento.dias_restantes} días`
                            }
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoColor(documento.estado_calculado)}`}>
                          {getEstadoIcon(documento.estado_calculado)}
                          <span className="ml-1 capitalize">
                            {documento.estado_calculado.replace('_', ' ')}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleDownload(documento.id, documento.nombre_archivo)}
                          disabled={downloadDocumentoMutation.isPending}
                          className="text-green-600 hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                          title="Descargar documento"
                        >
                          {downloadDocumentoMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};