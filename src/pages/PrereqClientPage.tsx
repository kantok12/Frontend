import React, { useState } from 'react';
import useClientePrerequisitos from '../hooks/useClientePrerequisitos';
import { useMatchPrerequisitos } from '../hooks/useMatchPrerequisitos';
import PrereqForm from '../components/prereq/PrereqForm';
import PrereqResultsTable from '../components/prereq/PrereqResultsTable';
import DocumentList from '../components/prereq/DocumentList';

export default function PrereqClientPage() {
  const [clienteId, setClienteId] = useState<number | undefined>(1);
  const [results, setResults] = useState<any[]>([]);
  const [selectedRutDocs, setSelectedRutDocs] = useState<{ rut: string; docs?: any[] } | null>(null);

  const prereqQuery = useClientePrerequisitos(clienteId);
  const matchMutation = useMatchPrerequisitos();

  const handleSubmit = async (ruts: string[]) => {
    if (!clienteId) return;
    try {
      const resp = await matchMutation.mutateAsync({ clienteId, ruts });
      // normalize resp
      const data = (resp as any)?.data || resp;
      // if data is an array of results or results property
      let resultsArr: any[] = [];
      if (Array.isArray(data)) resultsArr = data;
      else if (Array.isArray(data.results)) resultsArr = data.results;
      else if (Array.isArray((data as any).data)) resultsArr = (data as any).data;
      setResults(resultsArr);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error matching prerrequisitos', err);
      // Safe formatting for unknown error shapes
      const msg = err && (err.message || err.toString()) || 'Error desconocido';
      // Use window.alert to ensure global function is available in tests/environments
      // eslint-disable-next-line no-alert
      window.alert('Error al consultar prerrequisitos: ' + msg);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Prerrequisitos por Cliente</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Cliente ID: </label>
        <input type="number" value={clienteId ?? ''} onChange={e => setClienteId(e.target.value ? Number(e.target.value) : undefined)} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <h3>Prerrequisitos</h3>
        {prereqQuery.isLoading && <div>Cargando prerrequisitos...</div>}
        {prereqQuery.isError && <div>Error cargando prerrequisitos</div>}
        {prereqQuery.data && prereqQuery.data.success && Array.isArray(prereqQuery.data.data) && (
          <ul>
            {prereqQuery.data.data.map((r: any) => (
              <li key={r.id || r.tipo_normalizado}>{r.nombre || r.tipo_normalizado}</li>
            ))}
          </ul>
        )}
      </div>

      <PrereqForm onSubmit={handleSubmit} disabled={matchMutation.isLoading} />

      {matchMutation.isLoading && <div style={{ marginTop: 8 }}>Evaluando...</div>}

      <PrereqResultsTable results={results} onShowDocs={(rut, documentos) => setSelectedRutDocs({ rut, docs: documentos })} />

      {selectedRutDocs && (
        <div style={{ marginTop: 12 }}>
          <h4>Documentos para {selectedRutDocs.rut}</h4>
          <DocumentList rut={selectedRutDocs.rut} initial={selectedRutDocs.docs || []} />
        </div>
      )}
    </div>
  );
}
