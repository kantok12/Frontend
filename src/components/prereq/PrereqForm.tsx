import React, { useState } from 'react';

type Props = {
  onSubmit: (ruts: string[]) => void;
  disabled?: boolean;
};

export default function PrereqForm({ onSubmit, disabled }: Props) {
  const [singleRut, setSingleRut] = useState('');
  const [bulk, setBulk] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ruts: string[] = [];
    if (singleRut.trim()) ruts.push(singleRut.trim());
    if (bulk.trim()) {
      const lines = bulk.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      lines.forEach(l => ruts.push(l));
    }
    if (ruts.length === 0) return;
    onSubmit(ruts);
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 border rounded">
      <div style={{ marginBottom: 8 }}>
        <label>RUT individual</label>
        <input disabled={disabled} value={singleRut} onChange={e => setSingleRut(e.target.value)} placeholder="16924504-5" style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Bulk (un RUT por línea)</label>
        <textarea disabled={disabled} value={bulk} onChange={e => setBulk(e.target.value)} placeholder={`16924504-5\n12345678-9`} rows={4} style={{ width: '100%' }} />
      </div>
      <button type="submit" disabled={disabled}>Evaluar RUT(s)</button>
    </form>
  );
}
