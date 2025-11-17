import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Calendar,
  Settings, 
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar
} from 'recharts';
import { useDashboardStats } from '../../hooks/useDashboard';
import useResumenPersonalPorCliente from '../../hooks/useResumenPersonalPorCliente';
import { usePersonalList } from '../../hooks/usePersonal';
import { useEstadisticasServicios } from '../../hooks/useServicios';
import { useEstados } from '../../hooks/useEstados';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PersonalInfoModal } from './PersonalInfoModal';
import { PersonalTrabajandoModal } from './PersonalTrabajandoModal';
import { PersonalAsignadoModal } from './PersonalAsignadoModal';
import { EventosModal } from './EventosModal';
import { NodosInfoModal } from './NodosInfoModal';
import { CarterasInfoModal } from './CarterasInfoModal';

// Función para obtener los próximos 15 días
const getProximosDias = () => {
  const dias = [];
  const hoy = new Date();
  for (let i = 0; i < 15; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    dias.push(fecha.toISOString().split('T')[0]);
  }
  return dias;
};

// const proximosDias = getProximosDias(); // TODO: Usar cuando se implementen eventos reales


const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  href?: string;
  onClick?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}> = ({ title, value, icon, color, href, onClick, trend }) => {
  const content = (
    <div className={`p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 ${(href || onClick) ? 'cursor-pointer hover:scale-105' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color} shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return content;
};

export const DashboardStats: React.FC = () => {
  const { isLoading } = useDashboardStats();
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showPersonalTrabajandoModal, setShowPersonalTrabajandoModal] = useState(false);
  const [showPersonalAsignadoModal, setShowPersonalAsignadoModal] = useState(false);
  const [showEventosModal, setShowEventosModal] = useState(false);
  const [showNodosModal, setShowNodosModal] = useState(false);
  const [showCarterasModal, setShowCarterasModal] = useState(false);
  const [semanaActual, setSemanaActual] = useState(true); // true = semana actual, false = próxima semana
  const [semanaActualTendencias, setSemanaActualTendencias] = useState(true); // true = semana actual, false = próxima semana

  // Obtener datos de personal por cliente para el gráfico
  const { data: personalPorClienteData } = useQuery(
    ['personal-por-cliente-grafico'],
    async () => {
      const res = await fetch('/api/personal-por-cliente');
      return await res.json();
    },
    { 
      staleTime: 5 * 60 * 1000
    }
  );

  // Obtener mínimos simples por cliente (endpoint ligero que devuelve minimo_real por cliente)
  const { data: minimoSimpleData } = useQuery(
    ['minimo-personal-simple'],
    async () => {
      try {
        const res = await fetch('/api/servicios/minimo-personal/simple');
        return await res.json();
      } catch (e) {
        console.warn('No se pudo obtener minimo-personal/simple', e);
        return null;
      }
    },
    {
      staleTime: 5 * 60 * 1000
    }
  );

  // Obtener datos reales del backend
  const { data: personalData, isLoading: personalLoading } = usePersonalList(1, 100, '');
  const { data: estadisticasServicios, isLoading: serviciosLoading } = useEstadisticasServicios();
  
  // Obtener datos de estados
  const { data: estadosData } = useEstados({ limit: 100 });
  const estadosList = estadosData?.data || [];
  
  // Log para ver todos los estados disponibles
  console.log('📋 Estados disponibles en la BD:', estadosList.map((e: any) => ({ id: e.id, nombre: e.nombre })));
  
  // Calcular estadísticas reales de los datos del backend
  const personalList = personalData?.data?.items || [];
  const totalPersonal = personalData?.data?.total || 0;
  const personalActivo = personalList.filter(p => p.activo).length;
  
  // Log para ver la distribución de estado_id en el personal
  const distribucionEstadoIds = personalList.reduce((acc: any, p: any) => {
    const key = `estado_${p.estado_id}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  console.log('👥 Distribución de estado_id en el personal:', distribucionEstadoIds);
  console.log('👥 Ejemplos de personal:', personalList.slice(0, 5).map((p: any) => ({ 
    nombre: p.nombre, 
    estado_id: p.estado_id,
    activo: p.activo 
  })));
  
  const personalTrabajando = personalList.filter(p => p.activo).length;
  
  // Calcular distribución por estado dinámicamente
  const distribucionEstados = estadosList
    .map((estado: any) => {
      const cantidad = personalList.filter(p => p.estado_id === estado.id).length;
      const porcentaje = totalPersonal > 0 ? Math.round((cantidad / totalPersonal) * 100) : 0;
      
      // Asignar colores basados en el nombre del estado
      let color = 'gray';
      const nombreLower = estado.nombre.toLowerCase();
      if (nombreLower.includes('activo') || nombreLower.includes('disponible')) color = 'green';
      else if (nombreLower.includes('examen') || nombreLower.includes('exámenes')) color = 'yellow';
      else if (nombreLower.includes('capacitación') || nombreLower.includes('capacitacion')) color = 'purple';
      else if (nombreLower.includes('vacaciones')) color = 'blue';
      else if (nombreLower.includes('licencia')) color = 'orange';
      else if (nombreLower.includes('inactivo')) color = 'red';
      else if (nombreLower.includes('asignado')) color = 'indigo';
      else if (nombreLower.includes('desvinculado')) color = 'slate';
      
      return {
        id: estado.id,
        nombre: estado.nombre,
        cantidad,
        porcentaje,
        color
      };
    })
    .sort((a: any, b: any) => b.cantidad - a.cantidad); // Ordenar por cantidad descendente
  
  const totalEventos = 0; // TODO: Implementar carga de eventos reales desde el backend
  const eventosHoy = 0; // TODO: Implementar carga de eventos reales desde el backend

  // Usar datos reales del backend
  const serviciosData = estadisticasServicios?.data;
  const dashboardStats = {
    total_personal: totalPersonal,
    personal_activo: personalActivo,
    personal_trabajando: personalTrabajando,
    total_servicios: serviciosData?.totales?.nodos || 0,
    servicios_activos: serviciosData?.totales?.nodos || 0,
    total_eventos: totalEventos,
    eventos_hoy: eventosHoy,
    total_carteras: serviciosData?.totales?.carteras || 0,
    total_clientes: serviciosData?.totales?.clientes || 0,
  };

  // Obtener total asignado desde el resumen por cliente (misma fuente que el widget inferior)
  const { data: resumenData, isLoading: resumenLoading } = useResumenPersonalPorCliente(undefined, undefined, undefined);
  const resumenRows: any[] = resumenData?.data || [];
  const totalPersonasAsignadas = resumenRows.reduce((s, r) => s + (Number(r.total_personal) || 0), 0);


  // Función para obtener el inicio de la semana (lunes)
  const getInicioSemana = (fecha: Date) => {
    const inicio = new Date(fecha);
    const dia = inicio.getDay();
    const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1); // Ajustar para que lunes sea 1
    inicio.setDate(diff);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
  };

  // Calcular número ISO de semana a partir de una fecha
  const getISOWeekNumber = (date: Date) => {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    const dayNum = (tmp.getUTCDay() + 6) % 7; // Monday=0, Sunday=6
    tmp.setUTCDate(tmp.getUTCDate() + 3 - dayNum);
    const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
    const weekNumber = 1 + Math.round(((tmp.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
    return weekNumber;
  };

  // Función para generar datos de eventos por día
  const generarEventosPorDia = (esSemanaActual: boolean) => {
    const hoy = new Date();
    const inicioSemana = getInicioSemana(hoy);
    
    // Si es próxima semana, agregar 7 días
    if (!esSemanaActual) {
      inicioSemana.setDate(inicioSemana.getDate() + 7);
    }

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const eventosPorDia = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      
      // Generar datos estables basados en la fecha (no aleatorios)
      const seed = fecha.getDate() + (esSemanaActual ? 0 : 100); // Diferente seed para cada semana
      const eventos = (seed % 6) + 1; // 1-6 eventos
      const completados = Math.min(eventos, (seed % 4) + 1); // 1-4 completados, máximo eventos
      
      eventosPorDia.push({
        name: diasSemana[i],
        eventos: eventos,
        completados: completados,
        fecha: fecha.toISOString().split('T')[0]
      });
    }

    return eventosPorDia;
  };

  // Datos para gráfico de eventos por día
  const eventosPorDia = generarEventosPorDia(semanaActual);

  // Función para generar datos de tendencias de servicios por día
  const generarTendenciasServicios = (esSemanaActual: boolean) => {
    console.log('📊 Generando tendencias servicios...');
    console.log('Datos personal por cliente:', personalPorClienteData);
    
    // Si no hay datos de personal por cliente, retornar array vacío
    if (!personalPorClienteData?.data || !Array.isArray(personalPorClienteData.data)) {
      console.log('❌ No hay datos de personal por cliente');
      return [];
    }

    // Filtrar solo clientes con personal asignado y mapear todos los clientes
    const clientesConDatos = personalPorClienteData.data
      .filter((cliente: any) => cliente.total_personal_asignado > 0) // Solo clientes con personal
      .map((cliente: any) => {
        const personalAsignado = cliente.total_personal_asignado || 0;
        // Preferir el mínimo calculado por el backend (`minimo_real`) si está disponible
        let personalMinimo = cliente.personal_minimo || 0;
        try {
          if (minimoSimpleData && minimoSimpleData.success && Array.isArray(minimoSimpleData.data)) {
            const found = minimoSimpleData.data.find((m: any) => Number(m.cliente_id) === Number(cliente.cliente_id));
            if (found && typeof found.minimo_real !== 'undefined' && found.minimo_real !== null) {
              personalMinimo = Number(found.minimo_real);
            }
          }
        } catch (e) {
          // ignore and keep cliente.personal_minimo
        }
        let clienteNombre = cliente.cliente_nombre || `Cliente ${cliente.cliente_id}`;
        
        // Acortar nombres largos para mejor visualización
        if (clienteNombre.length > 25) {
          // Tomar las primeras palabras significativas
          const palabras = clienteNombre.split(' - ');
          clienteNombre = palabras[0];
          
          // Si sigue siendo muy largo, tomar solo las primeras 3 palabras
          if (clienteNombre.length > 25) {
            const primerasPalabras = clienteNombre.split(' ').slice(0, 3).join(' ');
            clienteNombre = primerasPalabras + '...';
          }
        }
        
        return {
          name: clienteNombre,
          fecha: new Date().toISOString().split('T')[0],
          personalMinimo: personalMinimo,
          personalAsignado: personalAsignado,
          cliente_id: cliente.cliente_id
        };
      });

    console.log('✅ Clientes con datos para gráfico:', clientesConDatos);
    return clientesConDatos;
  };

  // Datos para gráfico de tendencia de servicios
  const tendenciaServicios = generarTendenciasServicios(semanaActualTendencias);

  // Información de la semana mostrada en el gráfico (usa la misma bandera semanaActualTendencias)
  const semanaInfo = useMemo(() => {
    const hoy = new Date();
    const inicio = getInicioSemana(hoy);
    if (!semanaActualTendencias) inicio.setDate(inicio.getDate() + 7);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    const weekNumber = getISOWeekNumber(inicio);
    return {
      weekNumber,
      start: inicio.toLocaleDateString('es-CL'),
      end: fin.toLocaleDateString('es-CL')
    };
  }, [semanaActualTendencias]);

  // Ensure data fetching hooks are correctly implemented
  useEffect(() => {
    if (!personalPorClienteData) {
      console.error('Error: Missing data from API endpoints');
    }
  }, [personalPorClienteData]);

  // Add fallback logic for empty data
  if (!personalPorClienteData?.data || personalPorClienteData.data.length === 0) {
    console.warn('Warning: No personal data available');
  }

  if (isLoading || personalLoading || serviciosLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`loading-card-${index}`} className="p-6 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-center h-24">
              <LoadingSpinner size="md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Tarjetas principales con animaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="stagger-item animate-delay-100">
          <StatCard
            title="Total Personal"
            value={dashboardStats.total_personal}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            onClick={() => setShowPersonalModal(true)}
            trend={{ value: 12, isPositive: true }}
          />
        </div>
        <div className="stagger-item animate-delay-200">
          <StatCard
            title="Personal Activo"
            value={dashboardStats.personal_trabajando}
            icon={<Activity className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-green-500 to-green-600"
            onClick={() => setShowPersonalTrabajandoModal(true)}
            trend={{ value: 8, isPositive: true }}
          />
        </div>
        <div className="stagger-item animate-delay-300">
          <StatCard
            title="Personal Asignado"
            value={resumenLoading ? dashboardStats.total_personal : totalPersonasAsignadas}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            onClick={() => setShowPersonalAsignadoModal(true)}
            trend={{ value: 5, isPositive: true }}
          />
        </div>
      </div>


      {/* Gráfico de Programación de Servicios - Expandido */}
      <div className="mb-8">
        {/* Programación de servicios */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Programación de Servicios</h3>
              <div className="text-sm text-gray-500">Semana {semanaInfo.weekNumber} — {semanaInfo.start} → {semanaInfo.end}</div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tendenciaServicios}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                angle={-25}
                textAnchor="end"
                height={100}
                interval={0}
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => {
                  if (name === 'personalMinimo') return [`${value} personas`, 'Personal Mínimo'];
                  if (name === 'personalAsignado') return [`${value} personas`, 'Personal Asignado'];
                  return [value, name];
                }}
              />
              <Bar 
                dataKey="personalMinimo" 
                fill="#3B82F6"
                name="Personal Mínimo"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="personalAsignado" 
                fill="#10B981"
                name="Personal Asignado"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Personal Mínimo</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Personal Asignado</span>
            </div>
          </div>
        </div>

        {/* Eventos por día - OCULTO (comentado para uso futuro) */}
        {false && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Eventos por Día</h3>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSemanaActual(true)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    semanaActual
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Semana Actual
                </button>
                <button
                  onClick={() => setSemanaActual(false)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    !semanaActual
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Próxima Semana
                </button>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eventosPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.name} - ${new Date(data.fecha).toLocaleDateString('es-CL')}`;
                  }
                  return value;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="eventos" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                name="Eventos Programados"
              />
              <Line 
                type="monotone" 
                dataKey="completados" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                name="Eventos Completados"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Eventos Programados</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Eventos Completados</span>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Tarjetas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stagger-item animate-delay-500">
          <StatCard
            title="Total Carteras"
            value={dashboardStats.total_carteras}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            href="/servicios"
          />
        </div>
        <div className="stagger-item animate-delay-600">
          <StatCard
            title="Total Clientes"
            value={dashboardStats.total_clientes}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            href="/servicios"
          />
        </div>
        <div className="stagger-item animate-delay-700">
          <StatCard
            title="Total Nodos"
            value={dashboardStats.total_servicios}
            icon={<Settings className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
            href="/servicios"
          />
        </div>
      </div>


      {/* Modal de información del personal */}
      <PersonalInfoModal
        isOpen={showPersonalModal}
        onClose={() => setShowPersonalModal(false)}
        totalPersonal={dashboardStats.total_personal}
        distribucionEstados={distribucionEstados}
      />

      {/* Modal de personal activo */}
      <PersonalTrabajandoModal
        isOpen={showPersonalTrabajandoModal}
        onClose={() => setShowPersonalTrabajandoModal(false)}
        personalTrabajando={(() => {
          // Buscar el estado "Activo" (id: 1 según la BD)
          const estadoActivo = estadosList.find((e: any) => 
            e.nombre.toLowerCase() === 'activo'
          );
          
          console.log('🔍 Estado Activo:', estadoActivo);
          
          const personalFiltrado = personalList.filter(p => {
            if (!estadoActivo) {
              console.warn('⚠️ No se encontró el estado "Activo"');
              return false;
            }
            return p.estado_id === estadoActivo.id;
          });
          
          console.log('👥 Personal con estado Activo:', personalFiltrado.length, 'personas');
          console.log('👥 Lista completa:', personalFiltrado.map(p => ({ 
            nombre: p.nombre, 
            cargo: p.cargo,
            estado_id: p.estado_id 
          })));
          
          return personalFiltrado.map(p => ({
            id: p.id,
            nombre: p.nombre,
            apellido: p.apellido || '',
            cargo: p.cargo,
            ubicacion: p.zona_geografica || 'No especificada',
            servicioAsignado: {
              id: p.servicio_id || '1',
              nombre: 'Servicio Asignado',
              categoria: 'General',
              zonaGestion: p.zona_geografica || 'No especificada'
            },
            estadoActividad: {
              label: 'Trabajando'
            }
          }));
        })()}
      />

      {/* Modal de personal asignado */}
      <PersonalAsignadoModal
        isOpen={showPersonalAsignadoModal}
        onClose={() => setShowPersonalAsignadoModal(false)}
      />

      {/* Modal de eventos */}
      <EventosModal
        isOpen={showEventosModal}
        onClose={() => setShowEventosModal(false)}
        eventos={[]}
      />

      {/* Modal de información de nodos */}
      <NodosInfoModal
        isOpen={showNodosModal}
        onClose={() => setShowNodosModal(false)}
        totalNodos={dashboardStats.total_servicios}
      />

      {/* Modal de información de carteras */}
      <CarterasInfoModal
        isOpen={showCarterasModal}
        onClose={() => setShowCarterasModal(false)}
        totalCarteras={dashboardStats.total_carteras}
      />
    </>
  );
};