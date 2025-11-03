
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Hook para obtener programaciones de todas las carteras
type CarteraResult = { cartera_id: string; nombre: string; response: any };
function useAllCarterasProgramacion(carterasData: any): CarteraResult[] {
  const [allResults, setAllResults] = useState<CarteraResult[]>([]);
  useEffect(() => {
    if (!carterasData?.data) return;
    const fetchAll = async () => {
      const results: CarteraResult[] = [];
      for (const cartera of carterasData.data) {
        try {
          const res = await fetch(`/api/programacion-optimizada?cartera_id=${cartera.id}`);
          const json = await res.json();
          results.push({ cartera_id: cartera.id, nombre: cartera.nombre, response: json });
        } catch (e) {
          results.push({ cartera_id: cartera.id, nombre: cartera.nombre, response: { error: true, message: String(e) } });
        }
      }
      setAllResults(results);
    };
    fetchAll();
  }, [carterasData]);
  return allResults;
}

const CalendarioPage: React.FC = () => {

  // Filtros de búsqueda y cartera
  const [search, setSearch] = useState('');
  const [cartera, setCartera] = useState('');
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
    estado: '',
  });

  // Estado para colapsar/minimizar paneles de debug (inicialmente minimizados)
  const [collapsedAllCarteras, setCollapsedAllCarteras] = useState(true);
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

  const queryClient = useQueryClient();

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
      if (nuevo.dia_semana) payload.dia_semana = nuevo.dia_semana;
      if (nuevo.cargo) payload.cargo = nuevo.cargo;
      if (nuevo.nombre_persona) payload.nombre_persona = nuevo.nombre_persona;
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
        nombre_persona: '', rut: '', cargo: '', cartera_id: '', cliente_id: '', fecha_trabajo: '', dia_semana: '', horas_estimadas: '', estado: '',
      });
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

  const allCarterasResults = useAllCarterasProgramacion(carterasData);
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
                dia_semana: trabajador.dia_semana || prog.dia_semana,
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
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          onClick={() => setShowModal(true)}
        >
          + Nueva programación
        </button>
      </div>

      {/* Modal de nueva programación */}
      {/* Panel flotante de debug de respuesta JSON de programación para todas las carteras (minimizable) */}
      {allCarterasResults.length > 0 && (
        <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 100, pointerEvents: 'auto' }}>
          {!collapsedAllCarteras ? (
            <div style={{
              background: 'rgba(30,30,30,0.97)',
              color: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              padding: '12px 14px',
              minWidth: '340px',
              maxWidth: '520px',
              fontSize: '13px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                <div style={{fontWeight: 'bold', fontSize: 15, color: '#7dd3fc'}}>Respuestas JSON de todas las carteras</div>
                <button onClick={() => setCollapsedAllCarteras(true)} style={{background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer'}}>— minimizar</button>
              </div>
              {allCarterasResults.map((r, idx) => (
                <div key={r.cartera_id} style={{marginBottom: 12}}>
                  <div style={{color: '#bef264', fontWeight: 'bold', fontSize: 13}}>
                    {r.nombre} (ID: {r.cartera_id})
                  </div>
                  <pre style={{margin: '6px 0 0 0', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.15)', borderRadius: 4, padding: 8}}>{JSON.stringify(r.response, null, 2)}</pre>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'rgba(30,30,30,0.9)',
              color: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              padding: '8px 10px',
              minWidth: '160px',
              textAlign: 'center',
              fontFamily: 'monospace',
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8}}>
                <div style={{fontSize: 13, color: '#7dd3fc', fontWeight: 600}}>Respuestas JSON</div>
                <button onClick={() => setCollapsedAllCarteras(false)} style={{background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer'}}>▲</button>
              </div>
            </div>
          )}
        </div>
      )}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowModal(false)}>&times;</button>
              <h2 className="text-lg font-semibold mb-4">Nueva programación</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  mutation.mutate(form);
                }}
                className="space-y-3"
              >
              <select
                className="border px-2 py-1 rounded w-full text-sm"
                value={form.rut}
                onChange={e => {
                  const rut = e.target.value;
                  const persona = personalDisponibleData?.data?.find((p: any) => p.rut === rut);
                  setForm(f => ({
                    ...f,
                    rut,
                    nombre_persona: persona ? (persona.nombre ? persona.nombre + (persona.apellido ? ' ' + persona.apellido : '') : persona.rut) : '',
                    cargo: persona?.cargo || '',
                  }));
                }}
                required
                disabled={loadingPersonal}
              >
                <option value="">Selecciona persona disponible</option>
                {personalDisponibleData?.data?.map((p: any) => (
                  <option key={p.rut} value={p.rut}>
                    {(p.nombres || p.nombre || '') + (p.apellido ? ' ' + p.apellido : '')} | {p.rut} | {p.cargo}
                  </option>
                ))}
              </select>
              <select className="border px-2 py-1 rounded w-full text-sm" value={form.cartera_id} onChange={e => setForm(f => ({ ...f, cartera_id: e.target.value, cliente_id: '' }))} required>
                <option value="">Selecciona cartera</option>
                {carterasData?.data?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <select
                className="border px-2 py-1 rounded w-full text-sm"
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
              <input className="border px-2 py-1 rounded w-full text-sm" type="date" placeholder="Fecha" value={form.fecha_trabajo} onChange={e => setForm(f => ({ ...f, fecha_trabajo: e.target.value }))} required />
              <select
                className="border px-2 py-1 rounded w-full text-sm"
                value={form.dia_semana}
                onChange={e => setForm(f => ({ ...f, dia_semana: e.target.value }))}
                required
              >
                <option value="">Selecciona día</option>
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miércoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sábado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
              <input className="border px-2 py-1 rounded w-full text-sm" placeholder="Horas estimadas" value={form.horas_estimadas} onChange={e => setForm(f => ({ ...f, horas_estimadas: e.target.value }))} required />
              <input className="border px-2 py-1 rounded w-full text-sm" placeholder="Estado" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} required />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium mt-2" disabled={mutation.isLoading}>
                {mutation.isLoading ? 'Guardando...' : 'Guardar'}
              </button>
              {mutation.isError && <div className="text-red-500 text-sm">Error al guardar</div>}
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

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 mt-4">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera ID</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente ID</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nodo ID</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
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
                {filtered.map((row: any, idx: number) => (
                  <tr key={row.id || idx} className="border-t">
                    <td className="px-2 py-2 text-xs">{row.id}</td>
                    <td className="px-2 py-2 text-xs">{row.nombre_persona}</td>
                    <td className="px-2 py-2 text-xs">{row.rut}</td>
                    <td className="px-2 py-2 text-xs">{row.cargo}</td>
                    <td className="px-2 py-2 text-xs">{row.nombre_cartera}</td>
                    <td className="px-2 py-2 text-xs">{row.cartera_id}</td>
                    <td className="px-2 py-2 text-xs">{row.nombre_cliente || '-'}</td>
                    <td className="px-2 py-2 text-xs">{row.cliente_id}</td>
                    <td className="px-2 py-2 text-xs">{row.nodo_id || '-'}</td>
                    <td className="px-2 py-2 text-xs">{row.fecha_trabajo ? new Date(row.fecha_trabajo).toLocaleDateString() : '-'}</td>
                    <td className="px-2 py-2 text-xs">{row.dia_semana}</td>
                    <td className="px-2 py-2 text-xs">{row.horas_estimadas}</td>
                    <td className="px-2 py-2 text-xs">{row.estado}</td>
                    <td className="px-2 py-2 text-xs">{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CalendarioPage;