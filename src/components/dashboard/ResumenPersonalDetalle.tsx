import React, { useMemo } from 'react';
import useResumenPersonalPorCliente from '../../hooks/useResumenPersonalPorCliente';

function exportCsv(rows: any[], filename = 'resumen_personal_detalle.csv') {
  if (!rows || rows.length === 0) return;
  const headers = [
    'cartera_id','cartera_nombre','cliente_id','cliente_nombre','total_personal','total_programaciones','total_horas_estimadas','total_horas_reales','personal_activo','personal_completado'
  ];
  const lines = [headers.join(',')];
  rows.forEach(r => {
    const vals = headers.map(h => {
      const v = r[h];
      if (v === null || typeof v === 'undefined') return '';
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

const ResumenPersonalDetalle: React.FC<{ carteraId?: number; fechaInicio?: string; fechaFin?: string }> = ({ carteraId, fechaInicio, fechaFin }) => {
  const { data, isLoading, refetch } = useResumenPersonalPorCliente(carteraId, fechaInicio, fechaFin);
  const rows: any[] = data?.data || [];

  const totalPersonas = useMemo(() => rows.reduce((s, r) => s + (Number(r.total_personal) || 0), 0), [rows]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Detalle: Personal por Cliente</h3>
          <div className="text-sm text-gray-500">Total personas asignadas: <strong>{isLoading ? '...' : totalPersonas}</strong></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="px-3 py-1 border rounded text-sm">Actualizar</button>
          <button onClick={() => exportCsv(rows)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Exportar CSV</button>
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
  );
};

export default ResumenPersonalDetalle;
