import React from 'react';

type Documento = {
  id?: number;
  tipo_original?: string;
  tipo_normalizado?: string;
  fecha_subida?: string;
  fecha_vencimiento?: string;
  vencido?: boolean;
};

type Result = {
  rut: string;
  required_count?: number;
  provided_count?: number;
  estado_acreditacion?: string;
  faltantes?: string[];
  documentos?: Documento[];
};

type Props = {
  results?: Result[];
  onShowDocs?: (rut: string, documentos?: Documento[]) => void;
};

export default function PrereqResultsTable({ results = [], onShowDocs }: Props) {
  return (
    <div style={{ marginTop: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>RUT</th>
            <th>Estado</th>
            <th>Requeridos</th>
            <th>Presentados</th>
            <th>Faltantes</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.rut} style={{ borderTop: '1px solid #eee' }}>
              <td>{r.rut}</td>
              <td>{r.estado_acreditacion || (r.faltantes && r.faltantes.length === 0 ? 'completo' : 'parcial')}</td>
              <td style={{ textAlign: 'center' }}>{r.required_count ?? '-'}</td>
              <td style={{ textAlign: 'center' }}>{r.provided_count ?? '-'}</td>
              <td>{(r.faltantes || []).join(', ') || '-'}</td>
              <td>
                <button onClick={() => onShowDocs && onShowDocs(r.rut, r.documentos)}>Ver documentos</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
