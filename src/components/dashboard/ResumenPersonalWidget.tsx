import React, { useMemo, useState } from 'react';
import useResumenPersonalPorCliente from '../../hooks/useResumenPersonalPorCliente';

type Props = {
  carteraId?: number;
  fechaInicio?: string;
  fechaFin?: string;
};

function exportCsv(rows: any[], filename = 'resumen_personal.csv') {
  if (!rows || rows.length === 0) return;
  const headers = [
    'cliente_id',
    'cliente_nombre',
    'cartera_id',
    'cartera_nombre',
    'total_personal',
    'total_programaciones',
    'total_horas_estimadas',
    'total_horas_reales',
    'personal_activo',
    'personal_completado',
  ];
  const lines = [headers.join(',')];
  rows.forEach(r => {
    const vals = headers.map(h => {
      const v = r[h];
      if (v === null || typeof v === 'undefined') return '';
      // Escape double quotes
      return String(v).includes(',') || String(v).includes('"') ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
    });
    lines.push(vals.join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ResumenPersonalWidget: React.FC<Props> = ({ carteraId, fechaInicio, fechaFin }) => {
  const { data, isLoading, refetch } = useResumenPersonalPorCliente(carteraId, fechaInicio, fechaFin);
  const [open, setOpen] = useState(false);

  const rows: any[] = data?.data || [];

  const totalPersonas = useMemo(() => {
    return rows.reduce((s, r) => s + (Number(r.total_personal) || 0), 0);
  }, [rows]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Total personas asignadas</div>
          <div className="text-2xl font-bold text-gray-900">{isLoading ? '...' : totalPersonas}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="px-3 py-1 text-sm border rounded">Actualizar</button>
          <button onClick={() => setOpen(true)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Ver detalle</button>
        </div>
      </div>

      {/* Modal detalle */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg z-10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalle por cartera / cliente</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => exportCsv(rows)}>Exportar CSV</button>
                <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setOpen(false)}>Cerrar</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-600">
                    <th className="px-2 py-2">Cartera</th>
                    <th className="px-2 py-2">Cliente</th>
                    <th className="px-2 py-2">Total personal</th>
                    <th className="px-2 py-2">Programaciones</th>
                    <th className="px-2 py-2">Horas estimadas</th>
                    <th className="px-2 py-2">Horas reales</th>
                    <th className="px-2 py-2">Activo</th>
                    <th className="px-2 py-2">Completado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="px-2 py-4 text-center text-gray-500">Sin datos</td></tr>
                  )}
                  {rows.map((r, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-2">{r.cartera_nombre || r.cartera_id}</td>
                      <td className="px-2 py-2">{r.cliente_nombre || r.cliente_id}</td>
                      <td className="px-2 py-2">{r.total_personal ?? '-'}</td>
                      <td className="px-2 py-2">{r.total_programaciones ?? '-'}</td>
                      <td className="px-2 py-2">{r.total_horas_estimadas ?? '-'}</td>
                      <td className="px-2 py-2">{r.total_horas_reales ?? '-'}</td>
                      <td className="px-2 py-2">{r.personal_activo ?? '-'}</td>
                      <td className="px-2 py-2">{r.personal_completado ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumenPersonalWidget;
