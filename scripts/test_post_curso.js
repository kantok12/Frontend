// Script de prueba: realiza POST /cursos con multipart/form-data usando 'form-data' y 'axios'
// Uso: node ./scripts/test_post_curso.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const ENDPOINT = `${API_BASE.replace(/\/api$/, '')}/api/cursos`.replace(/\/\/api/, '/api');
// The above ensures we target '/api/cursos' even if API_BASE already contains /api

(async () => {
  try {
    const archivoPath = path.join(__dirname, 'testfile_node.txt');
    if (!fs.existsSync(archivoPath)) {
      console.error('Archivo de prueba no encontrado:', archivoPath);
      process.exit(1);
    }

    // Generar nombre único para evitar conflicto de duplicados en backend
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cursoNombreBase = 'Curso Manejo Seguro';
    const cursoData = {
      rut_persona: '20011078-1',
      nombre_curso: `${cursoNombreBase} ${timestamp}`,
      fecha_inicio: '2025-09-01',
      institucion: 'Instituto X',
      fecha_emision: '2025-09-02',
      dias_validez: 730,
      // nombre_archivo_destino: 'certificado_manejo_20011078.pdf', // puedes descomentar para forzar nombre
    };

    // derivar nombre_archivo_destino como hace el frontend
    const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').replace(/-+/g, '_').toLowerCase();
    const originalName = path.basename(archivoPath);
    const ext = (originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '.pdf');
    const desiredFilename = cursoData.nombre_archivo ? cursoData.nombre_archivo : `${slugify(cursoData.nombre_curso)}${ext}`;

    const form = new FormData();
    form.append('rut_persona', cursoData.rut_persona);
    form.append('nombre_curso', cursoData.nombre_curso);
    form.append('fecha_inicio', cursoData.fecha_inicio);
    form.append('institucion', cursoData.institucion);
    form.append('fecha_emision', cursoData.fecha_emision);
    form.append('dias_validez', String(cursoData.dias_validez));
    form.append('estado', 'completado');
    form.append('nombre_archivo_destino', desiredFilename);
  // Forzar contentType a application/pdf para evitar rechazos por MIME
  form.append('archivo', fs.createReadStream(archivoPath), { filename: desiredFilename, contentType: 'application/pdf' });

    console.log('Enviando POST a:', ENDPOINT);
    console.log('Headers will include multipart boundary.');

    const headers = form.getHeaders();
    // Si tienes token en env, úsalo
    if (process.env.API_TOKEN) headers['Authorization'] = `Bearer ${process.env.API_TOKEN}`;

    const resp = await axios.post(ENDPOINT, form, { headers, maxBodyLength: Infinity, timeout: 120000 });
    console.log('Status:', resp.status);
    console.log('Data:', JSON.stringify(resp.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('Error response status:', err.response.status);
      try { console.error('Response data:', JSON.stringify(err.response.data, null, 2)); } catch (e) { console.error('Response data (raw):', err.response.data); }
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
})();
