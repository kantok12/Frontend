import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Hook para obtener programaciones de todas las carteras
type CarteraResult = { cartera_id: string; nombre: string; response: any };
function useAllCarterasProgramacion(carterasData: any, fecha_inicio?: string, fecha_fin?: string): { results: CarteraResult[]; loading: boolean } {
  const [allResults, setAllResults] = useState<CarteraResult[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (!carterasData?.data) {
      setAllResults([]);
      setLoading(false);
      return;
    }
    const fetchAll = async () => {
      setLoading(true);
      const results: CarteraResult[] = [];
      for (const cartera of carterasData.data) {
        try {
          let url = `/api/programacion-optimizada?cartera_id=${cartera.id}`;
          if (fecha_inicio) url += `&fecha_inicio=${encodeURIComponent(fecha_inicio)}`;
          if (fecha_fin) url += `&fecha_fin=${encodeURIComponent(fecha_fin)}`;
          const res = await fetch(url);
          const json = await res.json();
          results.push({ cartera_id: cartera.id, nombre: cartera.nombre, response: json });
        } catch (e) {
          results.push({ cartera_id: cartera.id, nombre: cartera.nombre, response: { error: true, message: String(e) } });
        }
      }
      if (mounted) setAllResults(results);
      setLoading(false);
    };
    fetchAll();
    return () => { mounted = false; };
  }, [carterasData, fecha_inicio, fecha_fin]);
  return { results: allResults, loading };
}

const CalendarioPage: React.FC = () => {

  // Helper: convertir string fecha 'YYYY-MM-DD' a nombre de día en español (lowercase)
  const fechaToDiaSemana = (fecha?: string) => {
    if (!fecha) return undefined;
    // Try to parse robustly:
    // - If fecha looks like an ISO datetime (contains 'T' or timezone), use UTC day to avoid local TZ shifts.
    // - If it's a plain YYYY-MM-DD, construct a local date for that calendar day.
    const map = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    try {
      if (fecha.includes('T') || fecha.includes('Z') || /[+\-][0-9]{2}:[0-9]{2}$/.test(fecha)) {
        const d = new Date(fecha);
        if (isNaN(d.getTime())) return undefined;
        // Use UTC day so the calendar column is determined by the server-provided date itself, not the client's timezone.
        return map[d.getUTCDay()];
      }
      // Plain date like YYYY-MM-DD (or YYYY-MM-DDTHH:...), fallback to parse date parts safely
      const parts = fecha.split('-');
      if (parts.length < 3) return undefined;
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2].split('T')[0]);
      if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return undefined;
      const d = new Date(year, month - 1, day);
      return map[d.getDay()];
    } catch (e) {
      return undefined;
    }
  };

  // Filtros de búsqueda y cartera
  const [search, setSearch] = useState('');
  const [cartera, setCartera] = useState('');
  // Semana seleccionada: fecha de inicio (Lunes) en formato YYYY-MM-DD
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // move to Monday (if Sunday, go back 6)
    date.setDate(date.getDate() + diff);
    return date;
  };
  const defaultMonday = (() => {
    const m = getMonday(new Date());
    return m.toISOString().split('T')[0];
  })();
  const [weekStart, setWeekStart] = useState<string>(defaultMonday);
  // Modal para nueva programación
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nombre_persona: '',
    rut: '',
    cargo: '',
    cartera_id: '', // store cartera id (number as string)
    cliente_id: '', // store cliente id (number as string)
    fecha_trabajo: '',
    dia_semana: '',
    horas_estimadas: '',
    estado: 'activo',
  });

  // Estado para colapsar/minimizar paneles de debug (inicialmente minimizados)
  const [collapsedPayload, setCollapsedPayload] = useState(true);


  // Obtener carteras para el filtro (puede requerir endpoint)
  const { data: carterasData } = useQuery({
    queryKey: ['carteras'],
    queryFn: async () => {
      const { apiService } = await import('../services/api');
      return apiService.getCarteras ? apiService.getCarteras() : { data: [] };
    },
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });

  // Panel flotante para mostrar el JSON de todas las carteras



  // Panel flotante para mostrar el JSON de todas las carteras

  // Hook para clientes por cartera (solo cuando hay cartera seleccionada en el form)
  const [clientesCartera, setClientesCartera] = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  
  // Estado para prerrequisitos del cliente seleccionado
  const [prerequisitosCliente, setPrerequisitosCliente] = useState<any[]>([]);
  const [loadingPrerequisitos, setLoadingPrerequisitos] = useState(false);
  
  // Estado para personal filtrado según prerrequisitos
  const [personalFiltrado, setPersonalFiltrado] = useState<any[]>([]);
  const [loadingFiltrado, setLoadingFiltrado] = useState(false);

  // Efecto para cargar clientes cuando cambia la cartera en el formulario
  React.useEffect(() => {
    const fetchClientes = async () => {
      if (!form.cartera_id) {
        setClientesCartera([]);
        return;
      }
      setLoadingClientes(true);
      try {
        const { apiService } = await import('../services/api');
        const resp = await apiService.getClientesByCartera(String(form.cartera_id));
        if (resp.success && Array.isArray(resp.data)) {
          setClientesCartera(resp.data);
        } else {
          setClientesCartera([]);
        }
      } catch {
        setClientesCartera([]);
      }
      setLoadingClientes(false);
    };
    fetchClientes();
  }, [form.cartera_id, carterasData]);

  // Efecto para cargar prerrequisitos cuando cambia el cliente en el formulario
  React.useEffect(() => {
    const fetchPrerequisitos = async () => {
      if (!form.cliente_id) {
        setPrerequisitosCliente([]);
        return;
      }
      setLoadingPrerequisitos(true);
      try {
        const { apiService } = await import('../services/api');
        const resp = await apiService.getPrerrequisitosByCliente(Number(form.cliente_id));
        console.log('🔍 PRERREQUISITOS - Respuesta completa:', resp);
        if (resp.success && Array.isArray(resp.data)) {
          console.log('🔍 PRERREQUISITOS - Data array:', resp.data);
          console.log('🔍 PRERREQUISITOS - Primer item:', resp.data[0]);
          setPrerequisitosCliente(resp.data);
        } else {
          setPrerequisitosCliente([]);
        }
      } catch {
        setPrerequisitosCliente([]);
      }
      setLoadingPrerequisitos(false);
    };
    fetchPrerequisitos();
  }, [form.cliente_id]);

  // Obtener personal disponible para el selector (después de showModal)
  const { data: personalDisponibleData, isLoading: loadingPersonal } = useQuery({
    queryKey: ['personal-disponible'],
    queryFn: async () => {
      const { apiService } = await import('../services/api');
      // Usar getPersonal con limit alto para obtener todos
      if (apiService.getPersonal) {
        return apiService.getPersonal(1, 1000);
      }
      // fallback fetch
      return fetch('/api/personal-disponible?limit=1000&offset=0').then(r => r.json());
    },
    staleTime: 5 * 60 * 1000,
    enabled: showModal,
  });

  // Efecto para filtrar personal según prerrequisitos del cliente
  React.useEffect(() => {
    const filtrarPersonal = async () => {
      // Si no hay cliente seleccionado, no mostramos personal
      if (!form.cliente_id || !personalDisponibleData?.data) {
        setPersonalFiltrado([]);
        return;
      }

      // Si no hay prerrequisitos, no hay match posible
      if (prerequisitosCliente.length === 0) {
        setPersonalFiltrado([]);
        return;
      }

      setLoadingFiltrado(true);
      try {
        const { apiService } = await import('../services/api');
        console.log('🔍 FILTRADO (batch) - llamando al backend para match de prerrequisitos (cliente):', form.cliente_id);

        // Construir lista de RUTs candidatos desde personalDisponibleData
        const allRuts: string[] = (personalDisponibleData.data || []).map((p: any) => p.rut).filter(Boolean);
        if (allRuts.length === 0) {
          setPersonalFiltrado([]);
          setLoadingFiltrado(false);
          return;
        }

        // Chunking para evitar payloads enormes (tamaño recomendado: 200)
        const chunkSize = 200;
        const matchedRuts = new Set<string>();

        for (let i = 0; i < allRuts.length; i += chunkSize) {
          const chunk = allRuts.slice(i, i + chunkSize);
          try {
            const resp = await apiService.matchPrerequisitosClienteBatch(Number(form.cliente_id), chunk, { requireAll: true, includeGlobal: true });
            console.log('🔍 FILTRADO - respuesta batch:', resp);

            const items = resp?.data || [];
            for (const it of items) {
              if (!it) continue;
              const rut = it.rut || it?.data?.rut;
              // Heurísticas para detectar match
              let isMatch = false;
              if (typeof it.matchesAll === 'boolean') isMatch = it.matchesAll;
              else if (typeof it.matches_all === 'boolean') isMatch = it.matches_all;
              else if (Array.isArray(it.faltantes)) isMatch = it.faltantes.length === 0;
              else if (it.data && Array.isArray(it.data.faltantes)) isMatch = it.data.faltantes.length === 0;
              else if (it.data && typeof it.data.matchesAll === 'boolean') isMatch = it.data.matchesAll;

              if (isMatch && rut) matchedRuts.add(String(rut));
            }
          } catch (batchErr) {
            console.warn('⚠️ Error en batch match para chunk, intentando fallback per-rut:', batchErr);
            // Fallback: intentar por cada rut del chunk con el método single
            for (const rut of chunk) {
              try {
                const single = await apiService.matchPrerequisitosCliente(Number(form.cliente_id), rut).catch(e => { throw e; });
                // Parsear respuesta similar a batch
                const payload = (single && (single.data || single)) || null;
                if (!payload) continue;
                // payload puede variar; buscar indicios de faltantes o matches
                const p = Array.isArray(payload) && payload.length === 1 ? payload[0] : payload;
                let isMatch = false;
                if (p && typeof p.matchesAll === 'boolean') isMatch = p.matchesAll;
                else if (p && Array.isArray(p.faltantes)) isMatch = p.faltantes.length === 0;
                else if (p && p.data && Array.isArray(p.data.faltantes)) isMatch = p.data.faltantes.length === 0;
                if (isMatch) matchedRuts.add(String(rut));
              } catch (e) {
                console.error('Error fallback single match rut', rut, e);
              }
            }
          }
        }

        // Construir lista de personas filtradas usando matchedRuts
        const personalConMatch = (personalDisponibleData.data || []).filter((p: any) => matchedRuts.has(p.rut));
        console.log(`✅ FILTRADO - ${personalConMatch.length} personas cumplen los requisitos (batch)`);
        setPersonalFiltrado(personalConMatch);
      } catch (error) {
        console.error('Error al filtrar personal (batch):', error);
        setPersonalFiltrado([]);
      }
      setLoadingFiltrado(false);
    };

    filtrarPersonal();
  }, [form.cliente_id, prerequisitosCliente, personalDisponibleData]);

  // ... (código existente)

  const queryClient = useQueryClient();

  // Mutación para eliminar una programación
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { apiService } = await import('../services/api');
      return apiService.deleteProgramacionOptimizada(id);
    },
    onSuccess: () => {
      // Invalidar la query para forzar un refetch de los datos
      queryClient.invalidateQueries({ queryKey: ['programacion-optimizada'] });
      queryClient.invalidateQueries({ queryKey: ['carteras'] });
      // Recargar la página para reflejar los cambios inmediatamente
      try {
        window.location.reload();
      } catch (e) {
        // en entornos sin window (tests) simplemente ignorar
      }
    },
    onError: (error) => {
      console.error("Error al eliminar la programación", error);
      alert("Hubo un error al eliminar la programación.");
    }
  });

  // Mutación para crear nueva programación
  const mutation = useMutation({
    mutationFn: async (nuevo: any) => {
      // Build payload for API: cartera_id (number), cliente_id (number), rut, fechas_trabajo (array), horas_estimadas (number), estado
      const payload: any = {
        rut: nuevo.rut,
        cartera_id: Number(nuevo.cartera_id),
        fechas_trabajo: [nuevo.fecha_trabajo],
        horas_estimadas: nuevo.horas_estimadas ? Number(nuevo.horas_estimadas) : undefined,
        estado: nuevo.estado,
      };
  if (nuevo.cliente_id) payload.cliente_id = Number(nuevo.cliente_id);
      if (nuevo.cargo) payload.cargo = nuevo.cargo;
      if (nuevo.nombre_persona) payload.nombre_persona = nuevo.nombre_persona;
      // Note: we no longer send an explicit "fix_dia_en_bd" flag from the UI.
      // The backend will compute/accept dia_semana as needed. Do not force dia_semana here.
  // (El debug visual ahora se muestra en un panel flotante, no alert)
  // --- Debug visual: JSON que se enviará al backend ---
  // (debe estar justo antes del return para estar en scope del JSX)

      const { apiService } = await import('../services/api');
      if (apiService.crearProgramacionOptimizada) {
        return apiService.crearProgramacionOptimizada(payload);
      }
      // fallback fetch
      return fetch('/api/programacion-optimizada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['programacion-optimizada']);
      setShowModal(false);
        setForm({
            nombre_persona: '', rut: '', cargo: '', cartera_id: '', cliente_id: '', fecha_trabajo: '', dia_semana: '', horas_estimadas: '', estado: 'activo',
          });
      // Recargar la página para asegurarnos de que todas las visualizaciones (incluyendo las respuestas por cartera) se actualicen.
      // Esto evita inconsistencias si hay caches o fetches paralelos que no se invalidan automáticamente.
      try {
        window.location.reload();
      } catch (e) {
        // en entornos sin window (tests) simplemente ignorar
      }
    },
  });

  // Obtener carteras para el filtro (puede requerir endpoint)
  // Si tienes endpoint, reemplaza el fetch por el hook adecuado
  const { data: programacionData, isLoading, error } = useQuery({
    queryKey: ['programacion-optimizada'],
    queryFn: async () => {
      const { apiService } = await import('../services/api');
      return apiService.getProgramacionOptimizada({ cartera_id: 1, fecha_inicio: '2025-11-03', fecha_fin: '2025-11-09' });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Procesar datos para tabla simple (siempre usar nombre_cliente del backend si está presente)
  // Panel flotante para mostrar el JSON de todas las carteras

  // Panel flotante para mostrar el JSON de todas las carteras

  // compute week end (Sunday) from weekStart
  const weekEnd = (() => {
    if (!weekStart) return '';
    const parts = weekStart.split('-');
    if (parts.length < 3) return '';
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    const dt = new Date(y, m - 1, d );
    dt.setDate(dt.getDate() + 6);
    return dt.toISOString().split('T')[0];
  })();

  const { results: allCarterasResults, loading: loadingCarteras } = useAllCarterasProgramacion(carterasData, weekStart, weekEnd);
  // Procesar datos para tabla simple, mostrando registros de todas las carteras
  const programacion: any[] = [];
  if (allCarterasResults && allCarterasResults.length > 0) {
    allCarterasResults.forEach((carteraRes: any) => {
      const res = carteraRes.response;
      if (res && res.success && res.data && Array.isArray(res.data.programacion)) {
        res.data.programacion.forEach((prog: any) => {
          if (Array.isArray(prog.trabajadores)) {
            prog.trabajadores.forEach((trabajador: any) => {
              programacion.push({
                id: trabajador.id,
                rut: trabajador.rut,
                nombre_persona: trabajador.nombre_persona,
                cargo: trabajador.cargo,
                nombre_cartera: trabajador.nombre_cartera || carteraRes.nombre,
                nombre_cliente: trabajador.nombre_cliente && trabajador.nombre_cliente !== '' ? trabajador.nombre_cliente : '-',
                fecha_trabajo: trabajador.fecha_trabajo,
                // Preferir calcular el día desde la fecha (evita que el backend guarde por defecto 'domingo' por zona horaria)
                dia_semana: fechaToDiaSemana(trabajador.fecha_trabajo) || (trabajador.dia_semana ? String(trabajador.dia_semana).toLowerCase() : undefined),
                horas_estimadas: trabajador.horas_estimadas,
                estado: trabajador.estado,
                cartera_id: trabajador.cartera_id || carteraRes.cartera_id,
                cliente_id: trabajador.cliente_id,
                nodo_id: trabajador.nodo_id,
                created_at: trabajador.created_at
              });
            });
          }
        });
      }
    });
  }

  // Filtrar datos por búsqueda y cartera
  const filtered = programacion.filter(row => {
    const matchesSearch =
      search === '' ||
      (row.nombre_persona && row.nombre_persona.toLowerCase().includes(search.toLowerCase())) ||
      (row.rut && row.rut.toLowerCase().includes(search.toLowerCase())) ||
      (row.nombre_cliente && row.nombre_cliente.toLowerCase().includes(search.toLowerCase()));
    const matchesCartera = cartera === '' || row.nombre_cartera === cartera;
    return matchesSearch && matchesCartera;
  });

  // Debug payload para mostrar en el panel flotante
  const debugPayload = {
    rut: form.rut,
    cartera_id: form.cartera_id ? Number(form.cartera_id) : undefined,
    fechas_trabajo: form.fecha_trabajo ? [form.fecha_trabajo] : [],
    horas_estimadas: form.horas_estimadas ? Number(form.horas_estimadas) : undefined,
    estado: form.estado,
    cliente_id: form.cliente_id ? Number(form.cliente_id) : undefined,
    dia_semana: form.dia_semana,
    cargo: form.cargo,
    nombre_persona: form.nombre_persona,
  };
  // Panel flotante para mostrar el JSON crudo de la respuesta de programación optimizada
  const rawProgramacionJson = programacionData?.data ? JSON.stringify(programacionData.data, null, 2) : '';

  // Panel flotante para mostrar el JSON de todas las carteras (declarado más arriba)
  
    // Panel flotante para mostrar el JSON de todas las carteras
  const exportToPDF = () => {
    const tableElement = document.querySelector('.min-w-full') as HTMLElement; // Selector for the table
    if (!tableElement) {
      console.error('No se encontró la tabla para exportar.');
      return;
    }

    html2canvas(tableElement, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('planificacion.pdf');
    }).catch(error => {
      console.error('Error al generar el PDF:', error);
    });
  };

  const copyWeekSchedule = async () => {
    try {
      const response = await fetch('/api/programacion-optimizada/copiar-semana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha_inicio: weekStart, // Fecha de inicio de la semana actual
          cartera_id: form.cartera_id, // ID de la cartera seleccionada
        }),
      });

      if (!response.ok) {
        throw new Error('Error al copiar la programación semanal');
      }

      const result = await response.json();
      alert('Programación copiada exitosamente a la siguiente semana');
      console.log('Resultado:', result);
      // Opcional: Refrescar la vista
      window.location.reload();
    } catch (error) {
      console.error('Error al copiar la programación:', error);
      alert('Hubo un problema al copiar la programación.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros y botón */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border px-2 py-1 rounded-md text-sm"
          />
          <select
            value={cartera}
            onChange={e => setCartera(e.target.value)}
            className="border px-2 py-1 rounded-md text-sm"
          >
            <option value="">Todas las carteras</option>
            {carterasData?.data?.map((c: any) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
          {/* Week selector (start Monday) */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Semana inicio (Lun):</label>
            <input type="date" className="border px-2 py-1 rounded-md text-sm" value={weekStart} onChange={e => {
              const v = e.target.value;
              // normalize to Monday for selected date
              try {
                const parts = v.split('-');
                if (parts.length === 3) {
                  const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  const monday = getMonday(dt).toISOString().split('T')[0];
                  setWeekStart(monday);
                } else {
                  setWeekStart(v);
                }
              } catch (e) {
                setWeekStart(v);
              }
            }} />
            <div className="text-sm text-gray-500">— {weekStart} → {weekEnd}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            onClick={() => setShowModal(true)}
          >
            + Nueva programación
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            onClick={copyWeekSchedule}
          >
            Copiar Programación a la Siguiente Semana
          </button>
        </div>
      </div>

      {/* Modal de nueva programación */}
      {/* Panel flotante de debug de respuesta JSON de programación para todas las carteras (minimizable) */}
      {/* 'Respuesta JSON' floating panel removed per request */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative ring-1 ring-gray-100">
              <button aria-label="Cerrar" className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 bg-white rounded-full w-7 h-7 flex items-center justify-center border border-transparent hover:shadow" onClick={() => setShowModal(false)}>×</button>
              <div className="mb-4">
                <h2 className="text-2xl md:text-3xl font-bold">Nueva programación</h2>
                <p className="text-sm text-gray-500 mt-1">Selecciona persona, cartera, cliente y fecha para crear la programación.</p>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  mutation.mutate(form);
                }}
                className="space-y-4"
              >
              <div className="grid grid-cols-2 gap-3">
                <select className="border px-3 py-2 rounded-md w-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.cartera_id} onChange={e => setForm(f => ({ ...f, cartera_id: e.target.value, cliente_id: '' }))} required>
                  <option value="">Selecciona cartera</option>
                  {carterasData?.data?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <select
                  className="border px-3 py-2 rounded-md w-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.cliente_id}
                  onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                  required
                  disabled={loadingClientes || !form.cartera_id}
                >
                  <option value="">Selecciona cliente</option>
                  {clientesCartera.map((cli: any) => (
                    <option key={cli.id} value={cli.id}>{cli.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="border px-3 py-2 rounded-md w-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 mt-2"
                  value={form.rut}
                  onChange={e => {
                    const rut = e.target.value;
                    const persona = personalFiltrado.find((p: any) => p.rut === rut);
                    setForm(f => ({
                      ...f,
                      rut,
                      nombre_persona: persona ? (persona.nombre ? persona.nombre + (persona.apellido ? ' ' + persona.apellido : '') : persona.rut) : '',
                      cargo: persona?.cargo || '',
                    }));
                  }}
                  required
                  disabled={loadingPersonal || loadingFiltrado || !form.cliente_id}
                >
                  <option value="">
                    {!form.cliente_id 
                      ? 'Primero selecciona un cliente' 
                      : loadingFiltrado 
                        ? 'Filtrando personal...' 
                        : personalFiltrado.length === 0 
                          ? 'No hay personal con los prerrequisitos requeridos' 
                          : 'Selecciona persona disponible'}
                  </option>
                  {personalFiltrado.map((p: any) => (
                    <option key={p.rut} value={p.rut}>
                      {(p.nombres || p.nombre || '') + (p.apellido ? ' ' + p.apellido : '')} | {p.rut} | {p.cargo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input className="border px-3 py-2 rounded-md w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" type="date" placeholder="Fecha" value={form.fecha_trabajo} onChange={e => setForm(f => ({ ...f, fecha_trabajo: e.target.value }))} required />
                <div className="mt-2 text-sm text-gray-600">Día (calculado): <strong className="capitalize text-gray-800">{fechaToDiaSemana(form.fecha_trabajo) || '-'}</strong></div>
              </div>
              {/* 'Enviar día calculado para corregir DB' removed per UX request */}
              <div className="grid grid-cols-2 gap-3">
                <input className="border px-3 py-2 rounded-md w-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Horas estimadas" value={form.horas_estimadas} onChange={e => setForm(f => ({ ...f, horas_estimadas: e.target.value }))} required />
                <select className="border px-3 py-2 rounded-md w-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} required>
                  <option value="activo">Activo</option>
                  <option value="progreso">Progreso</option>
                </select>
              </div>
              <div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold shadow" disabled={mutation.isLoading}>
                  {mutation.isLoading ? 'Guardando...' : 'Guardar'}
                </button>
                {mutation.isError && <div className="text-red-500 text-sm mt-2">Error al guardar</div>}
              </div>
              </form>
            </div>
            {/* Panel flotante de debug JSON (minimizable) */}
            <div style={{ position: 'fixed', bottom: 30, left: 30, zIndex: 60, pointerEvents: 'auto' }}>
              {!collapsedPayload ? (
                <div style={{
                  background: 'rgba(30,30,30,0.97)',
                  color: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                  padding: '12px 14px',
                  minWidth: '320px',
                  maxWidth: '420px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                    <div style={{fontWeight: 'bold', fontSize: 15, color: '#7dd3fc'}}>Payload al backend</div>
                    <button onClick={() => setCollapsedPayload(true)} style={{background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer'}}>— minimizar</button>
                  </div>
                  <pre style={{margin: 0, whiteSpace: 'pre-wrap'}}>{JSON.stringify(debugPayload, null, 2)}</pre>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(30,30,30,0.9)',
                  color: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                  padding: '8px 10px',
                  minWidth: '140px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8}}>
                    <div style={{fontSize: 13, color: '#7dd3fc', fontWeight: 600}}>Payload</div>
                    <button onClick={() => setCollapsedPayload(false)} style={{background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer'}}>▲</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

  <div className="flex items-center justify-between mb-2">
    <div>
      <h1 className="text-lg font-semibold">Programación semanal</h1>
      <div className="text-sm text-gray-600">Semana: <strong className="text-gray-800">{weekStart} → {weekEnd}</strong></div>
    </div>
    <div className="text-sm text-gray-500">Mostrando datos por semana seleccionada</div>
  </div>

  <div className="bg-white rounded-lg shadow-lg border overflow-hidden relative" style={{ padding: 8 }}>
        {(isLoading || loadingCarteras) && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <svg width="56" height="56" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="g1" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <circle cx="25" cy="25" r="20" stroke="url(#g1)" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="31.4 31.4">
                  <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                </circle>
              </svg>
              <div style={{ marginTop: 8, color: '#374151', fontWeight: 600 }}>Cargando programaciones...</div>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 mt-4 bg-white" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ borderRight: 'none', position: 'sticky', left: 0, zIndex: 30, background: '#fff', minWidth: 160 }}>Cartera</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ borderLeft: 'none', position: 'sticky', left: 160, zIndex: 29, background: '#fff', minWidth: 220 }}>Cliente</th>
                {/* Weekday columns: Lunes..Domingo */}
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lunes</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Martes</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Miércoles</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jueves</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Viernes</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sábado</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Domingo</th>
              </tr>
            </thead>
            <tbody>
              <>
                {isLoading && (
                  <tr><td colSpan={9} className="text-center py-4 text-gray-400">Cargando...</td></tr>
                )}
                {error && (
                  <tr><td colSpan={9} className="text-center py-4 text-red-400">Error al cargar datos</td></tr>
                )}
                {filtered.length === 0 && !isLoading && !error && (
                  <tr><td colSpan={9} className="text-center py-4 text-gray-400">No hay datos</td></tr>
                )}
                {/* Agrupar filas por cartera: una fila por cartera. Mostrar lista vertical de clientes y lista vertical de personal (nombre/rut/cargo) alineadas por índice. */}
                {(() => {
                  // Build groups by cartera, and inside each cartera group clients with personnel assigned to that client
                  type Person = { nombre_persona: string; rut: string; cargo: string; days: string[] };
                  type ClientGroup = { id: any; name: string; personnel: Person[] };
                  const groups: Record<string, { cartera: string; cartera_id: any; clients: ClientGroup[] }> = {};
                  filtered.forEach((row: any) => {
                    const key = row.nombre_cartera || 'Sin cartera';
                    if (!groups[key]) groups[key] = { cartera: key, cartera_id: row.cartera_id, clients: [] };
                    const clienteId = row.cliente_id || ('cli_' + (row.nombre_cliente || 'sin'));
                    const clienteName = row.nombre_cliente && row.nombre_cliente !== '' ? row.nombre_cliente : '—';
                    let client = groups[key].clients.find((c: ClientGroup) => String(c.id) === String(clienteId));
                    if (!client) {
                      client = { id: clienteId, name: clienteName, personnel: [] };
                      groups[key].clients.push(client);
                    }
                    // add person to client if not present, and collect assigned days
                    const pRut = row.rut || String(Math.random());
                    let person = client.personnel.find((p: Person) => p.rut === pRut);
                    if (!person) {
                      person = { nombre_persona: row.nombre_persona || '—', rut: row.rut || '—', cargo: row.cargo || '—', days: [] };
                      client.personnel.push(person);
                    }
                    const dia = row.dia_semana ? String(row.dia_semana).toLowerCase() : undefined;
                    if (dia && !person.days.includes(dia)) person.days.push(dia);
                  });
                  const grouped = Object.values(groups);
                  // Ahora generamos una fila por cliente (sub-filas) dentro de cada cartera.
                  const dias = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
                  return grouped.flatMap((g, gi) => {
                    const clients = g.clients || [];
                    // Precompute clients info: keep a stable persons order and build dayLists aligned to that order
                    const clientsInfo = clients.map((client: any) => {
                      const persons = (client.personnel as Person[]) || [];
                      // Make ordering deterministic (sort by nombre_persona) so the same person keeps the same sub-row across all days
                      const sortedPersons = [...persons].sort((a, b) => (a.nombre_persona || '').localeCompare(b.nombre_persona || ''));
                      const dayLists = dias.map(day => sortedPersons.map(p => p.days.includes(day) ? p.nombre_persona : undefined));
                      const maxRows = Math.max(1, sortedPersons.length);
                      return { id: client.id, name: client.name, dayLists, maxRows, persons: sortedPersons };
                    });
                    const totalRowsForCartera = clientsInfo.reduce((s, c) => s + c.maxRows, 0) || 1;

                    // For each client, render client.maxRows TRs. Show cartera cell once with rowspan=totalRowsForCartera.
                    const rows: any[] = [];
                    clientsInfo.forEach((ci, clientIndex) => {
                      for (let r = 0; r < ci.maxRows; r++) {
                          const trClass = r === 0 ? 'border-t align-top' : 'align-top';
                          rows.push(
                            <tr key={`${g.cartera}_${gi}_cli_${clientIndex}_row_${r}`} className={`${trClass} hover:bg-gray-50`}>
                              {clientIndex === 0 && r === 0 && (
                                <td className="px-3 py-3 text-xs font-medium align-top" rowSpan={totalRowsForCartera} style={{ borderRight: 'none', position: 'sticky', left: 0, zIndex: 20, background: '#fff' }}>{g.cartera}</td>
                              )}
                              {r === 0 ? (
                                <td className="px-3 py-3 text-xs align-top" style={{ minWidth: 220, borderLeft: 'none', position: 'sticky', left: 160, zIndex: 19, background: '#fff' }} rowSpan={ci.maxRows}>{ci.name}</td>
                              ) : null}
                              {dias.map((day, dIdx) => {
                                const personInfo = ci.persons[r];
                                const isAssigned = personInfo && personInfo.days.includes(day);
                                const assignment = isAssigned ? filtered.find(p => p.rut === personInfo.rut && p.dia_semana === day && String(p.cliente_id) === String(ci.id)) : undefined;
                                
                                return (
                                  <td key={day} className="px-2 py-2 text-xs align-top border-l border-gray-200">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: 28 }}>
                                      {assignment ? (
                                        <div className="group relative" style={{ fontSize: 12, background: 'linear-gradient(90deg,#10b981,#06b6d4)', color: '#fff', padding: '6px 8px', borderRadius: 9999, boxShadow: '0 1px 3px rgba(16,185,129,0.12)', fontWeight: 600 }}>
                                          {personInfo.nombre_persona}
                                          <button 
                                            onClick={() => {
                                              if (window.confirm(`¿Estás seguro de que quieres eliminar a ${personInfo.nombre_persona} de este día?`)) {
                                                deleteMutation.mutate(assignment.id);
                                              }
                                            }}
                                            className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ width: 20, height: 20, borderRadius: 10, border: '1px solid transparent', margin: '0 auto' }} />
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                      }
                    });
                    return rows;
                  });
                })()}
              </>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          onClick={exportToPDF}
        >
          Exportar Programación a PDF
        </button>
      </div>
    </div>
  );
};

export default CalendarioPage;