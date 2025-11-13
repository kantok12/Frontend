const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const base = process.env.API_BASE || 'http://localhost:3000/api';
const rut = process.argv[2] || '20011078-1';

async function getPersona() {
  console.log(`[1] GET /documentos/persona/${rut}`);
  try {
    const resp = await axios.get(`${base}/documentos/persona/${encodeURIComponent(rut)}`);
    console.log('--> OK GET persona:', JSON.stringify(resp.data, null, 2));
    return resp.data;
  } catch (err) {
    if (err.response) {
      console.error('--> ERROR GET persona:', err.response.status, err.response.data);
    } else {
      console.error('--> ERROR GET persona:', err.message);
    }
    return null;
  }
}

async function postRegistrarExistente() {
  console.log(`[2] POST /documentos/registrar-existente (JSON)`);
  const payload = {
    rut_persona: rut,
    nombre_documento: 'Prueba desde script Node',
    nombre_archivo: 'testfile_node.txt',
    ruta_local: 'drive://tests/testfile_node.txt',
    nombre_archivo_destino: 'prueba_node_destino.txt',
    tipo_documento: 'certificado_curso'
  };
  try {
    const resp = await axios.post(`${base}/documentos/registrar-existente`, payload, { headers: { 'Content-Type': 'application/json' } });
    console.log('--> OK registrar existente:', JSON.stringify(resp.data, null, 2));
    return resp.data;
  } catch (err) {
    if (err.response) {
      console.error('--> ERROR registrar existente:', err.response.status, err.response.data);
    } else {
      console.error('--> ERROR registrar existente:', err.message);
    }
    return null;
  }
}

async function postUpload() {
  console.log(`[3] POST /documentos (multipart/form-data) con nombre_archivo_destino`);
  const filePath = path.join(__dirname, 'testfile_node.txt');
  if (!fs.existsSync(filePath)) {
    console.error(`---> Archivo de prueba no encontrado: ${filePath}`);
    return null;
  }

  const form = new FormData();
  form.append('archivo', fs.createReadStream(filePath));
  form.append('rut_persona', rut);
  form.append('nombre_documento', 'Prueba upload desde Node');
  form.append('nombre_archivo_destino', 'upload_node_destino.txt');
  form.append('tipo_documento', 'certificado_curso');

  try {
    const headers = form.getHeaders();
    const resp = await axios.post(`${base}/documentos`, form, { headers, maxBodyLength: Infinity });
    console.log('--> OK upload:', JSON.stringify(resp.data, null, 2));
    return resp.data;
  } catch (err) {
    if (err.response) {
      console.error('--> ERROR upload:', err.response.status, err.response.data);
    } else {
      console.error('--> ERROR upload:', err.message);
    }
    return null;
  }
}

(async () => {
  console.log('Base URL:', base);
  await getPersona();
  await postRegistrarExistente();
  await postUpload();
  console.log('\nPruebas finalizadas. Revisa si las respuestas incluyen `finalName` o `nombre_archivo_guardado`.');
})();
