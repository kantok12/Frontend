const axios = require('axios');
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Allow passing RUT via CLI: node get_personal_by_rut.js 20011078-1
const rut = process.argv[2] || '20011078-1';
const singleUrl = `${API_BASE.replace(/\/api$/, '')}/api/personal-disponible/${encodeURIComponent(rut)}`;
const listUrl = `${API_BASE.replace(/\/api$/, '')}/api/personal-disponible?limit=1000&offset=0`;

function prettyPrintCandidates(list) {
  if (!Array.isArray(list) || list.length === 0) {
    console.log('No candidates found in list.');
    return;
  }
  console.log(`Found ${list.length} records (showing rut, nombres, apellidos):`);
  list.slice(0, 200).forEach(p => {
    const r = p.rut || p.rut_persona || p.rut_ || p.rutString || '';
    const nombres = p.nombres || p.nombre || p.nombres_completos || '';
    const apellidos = p.apellidos || p.apellido || '';
    console.log(` - ${r} | ${nombres} ${apellidos}`);
  });
}

(async ()=>{
  try {
    console.log('GET', singleUrl);
    const resp = await axios.get(singleUrl, { timeout: 10000 });
    console.log('Status:', resp.status);
    console.log('Data:', JSON.stringify(resp.data, null, 2));
    return;
  } catch (err) {
    if (err.response) {
      console.error('Status:', err.response.status);
      try { console.error('Data:', JSON.stringify(err.response.data, null, 2)); } catch (e) { console.error('Data (raw):', err.response.data); }

      if (err.response.status === 404) {
        // fallback: fetch list and try to find close matches
        try {
          console.log('Falling back to listing endpoint to find candidates:', listUrl);
          const listResp = await axios.get(listUrl, { timeout: 15000 });
          const data = listResp.data && listResp.data.data ? listResp.data.data : listResp.data;
          if (!data || !Array.isArray(data)) {
            console.log('List endpoint returned unexpected shape:', JSON.stringify(listResp.data));
            return;
          }

          // Exact matches by rut string
          const exact = data.filter(p => (p.rut || '').toString().trim().toLowerCase() === rut.toString().trim().toLowerCase());
          if (exact.length > 0) {
            console.log('Exact match(s) found in list (full objects):');
            exact.forEach(p => console.log(JSON.stringify(p, null, 2)));
            return;
          }

          // Partial matches (contains)
          const partial = data.filter(p => ((p.rut || '') + ' ' + (p.nombres || '') + ' ' + (p.apellidos || '')).toLowerCase().includes(rut.toString().toLowerCase()));
          if (partial.length > 0) {
            console.log('Partial matches found (showing full objects):');
            partial.slice(0,50).forEach(p => console.log(JSON.stringify(p, null, 2)));
            return;
          }

          // If no matches near the provided rut, show top 20 entries to help manual search
          console.log('No entries matched the provided RUT. Showing first 20 records to inspect:');
          prettyPrintCandidates(data.slice(0, 20));
        } catch (listErr) {
          console.error('Error fetching list fallback:', listErr.message || listErr);
          if (listErr.response) {
            try { console.error('List response:', JSON.stringify(listErr.response.data, null, 2)); } catch (e) { console.error('List response raw:', listErr.response.data); }
          }
        }
      }
    } else {
      console.error('Error:', err.message);
    }
  }
})();
