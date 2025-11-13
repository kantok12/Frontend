// Script de diagnóstico: muestra headers multipart y prueba POST a /api/cursos y /documentos
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const CREATE_CURSO_ENDPOINT = `${API_BASE.replace(/\/api$/, '')}/api/cursos`.replace(/\/\/api/, '/api');
const DOCUMENTOS_ENDPOINT = `${API_BASE.replace(/\/api$/, '')}/api/documentos`.replace(/\/\/api/, '/api');

const archivoPathPdf = path.join(__dirname, 'testfile_node.pdf');
if (!fs.existsSync(archivoPathPdf)) {
  console.error('Archivo PDF de prueba no encontrado:', archivoPathPdf);
  process.exit(1);
}

(async () => {
  try {
    const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').replace(/-+/g, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cursoNombre = `Curso Manejo Seguro ${timestamp}`;
    const originalName = path.basename(archivoPathPdf);
    const ext = (originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '.pdf');
    const desiredFilename = `${slugify(cursoNombre)}${ext}`;

  // Intentar resolver personal_id a partir del RUT antes de crear curso
  // Allow passing RUT via CLI: node test_post_curso_debug.js 18841612-8
  const rut = process.argv[2] || '18841612-8';
    const PERSONAL_BY_RUT = `${API_BASE.replace(/\/api$/, '')}/api/personal-disponible/${encodeURIComponent(rut)}`;
    const PERSONAL_LIST = `${API_BASE.replace(/\/api$/, '')}/api/personal-disponible?limit=1000&offset=0`;
    let resolvedPersonalId = null;
    try {
      const personResp = await axios.get(PERSONAL_BY_RUT);
      if (personResp?.data?.success && personResp.data.data) {
        const personaObj = personResp.data.data;
        if (personaObj.id) resolvedPersonalId = String(personaObj.id);
      } else if (personResp?.data) {
        // algunos endpoints devuelven el objeto directo
        const maybe = personResp.data;
        if (maybe.id) resolvedPersonalId = String(maybe.id);
      }
    } catch (e) {
      console.warn('No se pudo resolver personal por RUT con lookup directo (intentando listado):', e.message || e);
      // Fallback: obtener lista y buscar por rut para extraer id
      try {
        const listResp = await axios.get(PERSONAL_LIST, { timeout: 15000 });
        const listData = listResp.data && listResp.data.data ? listResp.data.data : listResp.data;
        if (Array.isArray(listData)) {
          const found = listData.find(p => ((p.rut || '').toString().trim().toLowerCase()) === rut.toString().trim().toLowerCase());
          if (found && found.id) {
            resolvedPersonalId = String(found.id);
            console.log('Resolved personal_id from list fallback:', resolvedPersonalId, 'for RUT', rut);
          } else {
            console.log('No match found in list fallback for RUT', rut);
          }
        } else {
          console.log('List endpoint returned unexpected shape during fallback:', JSON.stringify(listResp.data));
        }
      } catch (le) {
        console.warn('Listado fallback failed:', le.message || le);
      }
    }

    // FormData para /api/cursos
    const formCursos = new FormData();
    // Always include rut_persona to satisfy endpoints that expect the RUT string.
    formCursos.append('rut_persona', rut);
    if (resolvedPersonalId) {
      // Also include numeric id where supported by the backend
      formCursos.append('personal_id', resolvedPersonalId);
    }
    formCursos.append('nombre_curso', cursoNombre);
    formCursos.append('fecha_inicio', '2025-09-01');
    formCursos.append('institucion', 'Instituto X');
    formCursos.append('fecha_emision', '2025-09-02');
    formCursos.append('dias_validez', String(730));
    formCursos.append('estado', 'completado');
    formCursos.append('nombre_archivo_destino', desiredFilename);
    formCursos.append('archivo', fs.createReadStream(archivoPathPdf), { filename: desiredFilename, contentType: 'application/pdf' });

    console.log('--- Headers for /api/cursos request ---');
    console.log(formCursos.getHeaders());

    try {
      const resp = await axios.post(CREATE_CURSO_ENDPOINT, formCursos, { headers: formCursos.getHeaders(), maxBodyLength: Infinity, timeout: 120000 });
      console.log('Cursos response status:', resp.status);
      console.log('Cursos response data:', JSON.stringify(resp.data, null, 2));
    } catch (err) {
      if (err.response) {
        console.error('Cursos error status:', err.response.status);
        console.error('Cursos response data:', JSON.stringify(err.response.data, null, 2));
      } else {
        console.error('Cursos error:', err.message);
      }
    }

    // FormData para /api/documentos (uploadDocumento expects personal_id, nombre_documento, archivo)
    const formDocs = new FormData();
  // The documentos endpoint typically expects the RUT string; send rut_persona.
  formDocs.append('rut_persona', rut);
  // Include personal_id as an extra field if resolved (some backends accept either)
  if (resolvedPersonalId) formDocs.append('personal_id', resolvedPersonalId);
    formDocs.append('nombre_documento', cursoNombre + ' - certificado');
    formDocs.append('tipo_documento', 'certificado_curso');
    formDocs.append('fecha_emision', '2025-09-02');
    formDocs.append('fecha_vencimiento', '2027-09-02');
    formDocs.append('dias_validez', String(730));
    formDocs.append('institucion_emisora', 'Instituto X');
    formDocs.append('nombre_archivo_destino', desiredFilename);
    formDocs.append('archivo', fs.createReadStream(archivoPathPdf), { filename: desiredFilename, contentType: 'application/pdf' });

    console.log('\n--- Headers for /api/documentos request ---');
    console.log(formDocs.getHeaders());

    try {
      const resp2 = await axios.post(DOCUMENTOS_ENDPOINT, formDocs, { headers: formDocs.getHeaders(), maxBodyLength: Infinity, timeout: 120000 });
      console.log('Documentos response status:', resp2.status);
      console.log('Documentos response data:', JSON.stringify(resp2.data, null, 2));
    } catch (err) {
      if (err.response) {
        console.error('Documentos error status:', err.response.status);
        console.error('Documentos response data:', JSON.stringify(err.response.data, null, 2));
      } else {
        console.error('Documentos error:', err.message);
      }
    }

  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
})();
