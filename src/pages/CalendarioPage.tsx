import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Download, Users, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useProgramacionSemanal } from '../hooks/useProgramacion';
import { useCarteras } from '../hooks/useCarteras';
import { usePersonalList } from '../hooks/usePersonal';
import { ProgramacionCalendarioModal } from '../components/programacion/ProgramacionCalendarioModal';
import { ProgramacionSemanalCompleta } from '../components/programacion/ProgramacionSemanalCompleta';
import { useClientesByCartera } from '../hooks/useCarteras';
import { useClientes, useNodos } from '../hooks/useServicios';
import { exportarPlanificacionPDF } from '../utils/pdfExporter';


export const CalendarioPage: React.FC = () => {
  const [vistaCalendario, setVistaCalendario] = useState<'semanal-completa' | 'semana' | 'dia'>('semanal-completa');
  
  // Estados para la planificación semanal
  const [fechaInicioSemana, setFechaInicioSemana] = useState(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes de esta semana
    return lunes;
  });
  
  // Estados para la integración con la API
  const [carteraSeleccionada, setCarteraSeleccionada] = useState<number | null>(null);
  const [showNuevaProgramacionModal, setShowNuevaProgramacionModal] = useState(false);
  const [showProgramacionCalendarioModal, setShowProgramacionCalendarioModal] = useState(false);
  const [vistaTabla, setVistaTabla] = useState<'simple' | 'jerarquica'>('jerarquica');
  const [mostrarTodasCarteras, setMostrarTodasCarteras] = useState(true);
  
  // Estados para el modal de asignación
  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [asignacionForm, setAsignacionForm] = useState({
    carteraId: carteraSeleccionada || 0,
    clienteId: 0,
    nodoId: 0,
    personalId: '',
    dias: {
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false
    },
    horasEstimadas: 8,
    observaciones: ''
  });
  
  // Hooks para datos
  const { data: carterasData } = useCarteras();
  const { data: clientesData } = useClientes({ limit: 1000 }); // Obtener todos los clientes
  const { data: nodosData } = useNodos({ limit: 1000 }); // Obtener todos los nodos
  const { data: clientesByCarteraData } = useClientesByCartera(
    asignacionForm.carteraId && asignacionForm.carteraId > 0 ? asignacionForm.carteraId.toString() : ''
  );
  const { data: personalData } = usePersonalList();
  
  // Hook para programación semanal - usar 0 para todas las carteras cuando mostrarTodasCarteras esté activo
  const {
    programacion,
    cartera,
    isLoading: isLoadingProgramacion,
    error: errorProgramacion,
    crearProgramacion,
    alternarDia,
    calcularTotalHoras,
    getTrabajadoresUnicos,
    isUpdating,
    isCreating
  } = useProgramacionSemanal(
    mostrarTodasCarteras ? 0 : (carteraSeleccionada || 0), 
    fechaInicioSemana.toISOString().split('T')[0]
  );
  

  // Efecto para seleccionar la primera cartera por defecto
  useEffect(() => {
    if (carterasData?.data && carterasData.data.length > 0 && !carteraSeleccionada) {
      setCarteraSeleccionada(carterasData.data[0].id);
    }
  }, [carterasData, carteraSeleccionada]);

  // Funciones para la planificación semanal
  const handleCambiarSemana = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaInicioSemana);
    if (direccion === 'anterior') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    }
    setFechaInicioSemana(nuevaFecha);
  };

  const handleExportarPDF = async () => {
    try {
      // Debug: Log de datos originales
      console.log('🔍 Datos de programación originales:', programacion);
      console.log('🔍 Fecha inicio semana:', fechaInicioSemana);
      
      // Convertir los datos de programación al formato esperado por el exportador
      const asignacionesParaExportar: any[] = [];
      
      if (programacion && programacion.length > 0) {
        programacion.forEach((item: any) => {
          console.log('🔍 Procesando item:', item);
          
          const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
          const diasMap = {
            'lunes': 'LUN',
            'martes': 'MAR', 
            'miercoles': 'MIE',
            'jueves': 'JUE',
            'viernes': 'VIE',
            'sabado': 'SAB',
            'domingo': 'DOM'
          };

          // Crear una asignación por cada día que esté marcado
          dias.forEach(dia => {
            if (item[dia]) {
              console.log(`✅ Día ${dia} marcado para ${item.nombre_persona}`);
              asignacionesParaExportar.push({
                id: `${item.rut}-${item.nodo_id || item.cliente_id}-${dia}`,
                personalId: item.rut,
                personalNombre: item.nombre_persona,
                servicioId: item.nodo_id || item.cliente_id,
                servicioNombre: item.nombre_nodo || item.nombre_cliente,
                cliente: item.nombre_cliente,
                lugar: item.nombre_nodo || 'Sin ubicación específica',
                horaInicio: '08:00',
                horaFin: '17:00',
                dia: diasMap[dia as keyof typeof diasMap]
              });
            }
          });
        });
      }

      // Debug: Log de datos finales
      console.log('🔍 Asignaciones para exportar:', asignacionesParaExportar);
      console.log('🔍 Total asignaciones:', asignacionesParaExportar.length);

      // Exportar PDF
      await exportarPlanificacionPDF(fechaInicioSemana, asignacionesParaExportar);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar la programación. Por favor, inténtalo de nuevo.');
    }
  };

  const handleAlternarDia = async (id: number, dia: string) => {
    try {
      await alternarDia(id, dia);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al alternar día:', error);
    }
  };

  // Funciones para el modal de asignación
  const handleAbrirAsignacionModal = () => {
    setAsignacionForm({
      carteraId: carteraSeleccionada || 0,
      clienteId: 0,
      nodoId: 0,
      personalId: '',
      dias: {
        lunes: false,
        martes: false,
        miercoles: false,
        jueves: false,
        viernes: false,
        sabado: false,
        domingo: false
      },
      horasEstimadas: 8,
      observaciones: ''
    });
    setShowAsignacionModal(true);
  };

  const handleCerrarAsignacionModal = () => {
    setShowAsignacionModal(false);
  };

  const handleCambiarFormulario = (campo: string, valor: any) => {
    setAsignacionForm(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleCambiarDia = (dia: string, valor: boolean) => {
    setAsignacionForm(prev => ({
      ...prev,
      dias: {
        ...prev.dias,
        [dia]: valor
      }
    }));
  };

  const handleCrearAsignacion = async () => {
    try {
      // Validar que se haya seleccionado personal
      if (!asignacionForm.personalId) {
        alert('Por favor selecciona un trabajador');
        return;
      }

      // Validar que se haya seleccionado al menos un día
      const diasSeleccionados = Object.values(asignacionForm.dias).some(dia => dia);
      if (!diasSeleccionados) {
        alert('Por favor selecciona al menos un día');
        return;
      }

      // Obtener datos del personal seleccionado
      const personalSeleccionado = personalData?.data?.items?.find((p: any) => p.rut === asignacionForm.personalId);
      if (!personalSeleccionado) {
        alert('No se encontró el personal seleccionado');
        return;
      }

      // Crear la programación
      await crearProgramacion.mutateAsync({
        rut: asignacionForm.personalId,
        cliente_id: asignacionForm.clienteId || undefined,
        nodo_id: asignacionForm.nodoId || undefined,
        ...asignacionForm.dias,
        horas_estimadas: asignacionForm.horasEstimadas,
        observaciones: asignacionForm.observaciones || undefined,
        estado: 'programado'
      });

      // Cerrar modal y limpiar formulario
      handleCerrarAsignacionModal();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al crear asignación:', error);
      alert('Error al crear la asignación. Por favor intenta nuevamente.');
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Función para obtener los días de la semana
  const getDiasSemana = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(fechaInicioSemana);
      fecha.setDate(fechaInicioSemana.getDate() + i);
      dias.push({
        fecha,
        nombre: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
        numero: fecha.getDate(),
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' })
      });
    }
    return dias;
  };

  // Función para organizar datos jerárquicamente
  const organizarDatosJerarquicos = () => {
    if (!programacion || programacion.length === 0) return [];

    const datosOrganizados: any = {};

    programacion.forEach((item: any) => {
      const carteraId = item.cartera_id;
      const carteraNombre = item.nombre_cartera;
      const rut = item.rut;
      const nombrePersona = item.nombre_persona;
      const cargo = item.cargo;
      const clienteId = item.cliente_id;
      const clienteNombre = item.nombre_cliente;
      const nodoId = item.nodo_id;
      const nodoNombre = item.nombre_nodo;

      // Inicializar cartera si no existe
      if (!datosOrganizados[carteraId]) {
        datosOrganizados[carteraId] = {
          id: carteraId,
          nombre: carteraNombre,
          personal: {}
        };
      }

      // Inicializar personal si no existe
      if (!datosOrganizados[carteraId].personal[rut]) {
        datosOrganizados[carteraId].personal[rut] = {
          rut,
          nombre: nombrePersona,
          cargo,
          nodos: {}
        };
      }

      // Inicializar nodo si no existe
      const nodoKey = nodoId ? `${clienteId}-${nodoId}` : clienteId;
      if (!datosOrganizados[carteraId].personal[rut].nodos[nodoKey]) {
        datosOrganizados[carteraId].personal[rut].nodos[nodoKey] = {
          clienteId,
          clienteNombre,
          nodoId,
          nodoNombre,
          asignaciones: {
            lunes: false,
            martes: false,
            miercoles: false,
            jueves: false,
            viernes: false,
            sabado: false,
            domingo: false
          }
        };
      }

      // Asignar días de trabajo
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      dias.forEach(dia => {
        if (item[dia]) {
          datosOrganizados[carteraId].personal[rut].nodos[nodoKey].asignaciones[dia] = true;
        }
      });
    });

    return Object.values(datosOrganizados);
  };

  // Función para obtener color de cartera
  const getColorCartera = (carteraNombre: string) => {
    const colores: { [key: string]: string } = {
      'SNACK': 'bg-orange-100 border-orange-200',
      'Carozzi': 'bg-green-100 border-green-200',
      'Quantum': 'bg-blue-100 border-blue-200',
      'Cementaras': 'bg-blue-100 border-blue-200',
      'Puertos': 'bg-blue-200 border-blue-300',
      'Los Castaños': 'bg-pink-100 border-pink-200',
      'SOPROLE': 'bg-white border-gray-200',
      'Servicios': 'bg-white border-gray-200'
    };
    return colores[carteraNombre] || 'bg-gray-100 border-gray-200';
  };



  return (
    <div className="container mx-auto px-4 py-8">

      {/* Controles del calendario */}
      <div className="card hover-lift slide-up animate-delay-200 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              Planificación Semanal
            </h2>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            {['semanal-completa', 'semana', 'dia'].map((vista) => (
              <button
                key={vista}
                onClick={() => setVistaCalendario(vista as 'semanal-completa' | 'semana' | 'dia')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaCalendario === vista
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {vista === 'semanal-completa' ? 'Programación Semanal' : 
                 vista === 'semana' ? 'Vista Semana' : 
                 'Vista Día'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vista de Programación Semanal Completa */}
      {vistaCalendario === 'semanal-completa' && (
        <ProgramacionSemanalCompleta />
      )}

      {/* Modal de Programación con Calendario */}
      <ProgramacionCalendarioModal
        isOpen={showProgramacionCalendarioModal}
        onClose={() => setShowProgramacionCalendarioModal(false)}
        onSuccess={(asignaciones) => {
          console.log('Programación guardada:', asignaciones);
          // Aquí podrías refrescar los datos o mostrar un mensaje de éxito
          setShowProgramacionCalendarioModal(false);
        }}
        carteras={carterasData?.data || []}
        clientes={clientesData?.data || []}
        nodos={nodosData?.data || []}
        personal={personalData?.data?.items || []}
      />

    </div>
  );
};