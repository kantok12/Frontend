import React, { useState } from 'react';
import apiService from '../../services/api';

type Doc = {
  id?: number;
  tipo_original?: string;
  tipo_normalizado?: string;
  fecha_subida?: string;
  fecha_vencimiento?: string;
  vencido?: boolean;
  ruta_local?: string;
};

export default function DocumentList({ rut, initial = [] }: { rut: string; initial?: Doc[] }) {
  const [docs, setDocs] = useState<Doc[]>(initial || []);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const resp = await apiService.getDocumentosByPersona(rut);
      const data = (resp as any)?.data || [];
      setDocs(data);
    } catch (err) {
      console.error('Error fetching documentos for', rut, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>Documentos ({docs.length})</strong>
        {docs.length === 0 && <button onClick={fetchDocs} disabled={loading} style={{ marginLeft: 8 }}>{loading ? 'Cargando...' : 'Cargar documentos'}</button>}
      </div>
      <ul>
        {docs.map(d => (
          <li key={d.id || d.tipo_original}>
            <div>{d.tipo_original || d.tipo_normalizado}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{d.fecha_subida || ''} {d.fecha_vencimiento ? `(venc: ${d.fecha_vencimiento})` : ''}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
