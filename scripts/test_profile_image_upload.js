/*
Node script to test backend endpoints and profile image upload.
Usage:
  node scripts/test_profile_image_upload.js --api http://localhost:3000/api --rut 16924504-5 [--token YOUR_TOKEN] [--file C:\path\to\image.jpg]

If --file is omitted the script will run non-destructive checks (health, documentos/persona).
If --token is provided the script will attempt authenticated actions (GET /auth/me, PUT /personal/:rut, POST upload, DELETE image).

Requires project dependencies: axios, form-data
*/

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : true;
      out[key] = val;
      if (val !== true) i++; 
    }
  }
  return out;
}

(async function main(){
  const argv = parseArgs();
  const API = argv.api || process.env.API_BASE || 'http://localhost:3000/api';
  const RUT = argv.rut || process.env.TEST_RUT || '16924504-5';
  const TOKEN = argv.token || process.env.API_TOKEN || null;
  const FILE = argv.file || null;

  const client = axios.create({ baseURL: API, timeout: 20000 });
  if (TOKEN) client.defaults.headers.common['Authorization'] = `Bearer ${TOKEN}`;

  console.log('Using API:', API);
  console.log('RUT:', RUT);

  try {
    console.log('\n1) Health check: GET /health');
    const health = await client.get('/health');
    console.log('  ->', health.data);
  } catch (e) {
    console.error('  Health check failed:', e.message || e);
  }

  try {
    console.log('\n2) GET /documentos/persona/:rut');
    const docs = await client.get(`/documentos/persona/${encodeURIComponent(RUT)}`);
    console.log('  -> documentos count:', docs.data?.data?.documentos?.length ?? 'n/a');
  } catch (e) {
    console.error('  GET documentos/persona failed:', e.response ? e.response.data : e.message);
  }

  if (!TOKEN) {
    console.log('\nNo token provided: skipping authenticated operations (auth/me, update personal, upload, delete).');
    console.log('To test uploads provide --token <JWT> and --file <path>');
    process.exit(0);
  }

  try {
    console.log('\n3) GET /auth/me (authenticated)');
    const me = await client.get('/auth/me');
    console.log('  ->', me.data);
  } catch (e) {
    console.error('  GET /auth/me failed:', e.response ? e.response.data : e.message);
  }

  try {
    console.log('\n4) PUT /personal/:rut (update name/email)');
    const payload = { nombres: 'Prueba', apellidos: 'Script', email: `prueba_script_${Date.now()}@example.com` };
    const upd = await client.put(`/personal/${encodeURIComponent(RUT)}`, payload);
    console.log('  ->', upd.data);
  } catch (e) {
    console.error('  PUT /personal failed:', e.response ? e.response.data : e.message);
  }

  if (!FILE) {
    console.log('\nNo file provided: skipping upload/delete image steps.');
    process.exit(0);
  }

  // Upload file
  try {
    console.log('\n5) POST /personal/:rut/upload (uploading file):', FILE);
    const filePath = path.resolve(FILE);
    if (!fs.existsSync(filePath)) throw new Error('File not found: ' + filePath);
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const headers = form.getHeaders();
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

    const uploadResp = await axios.post(`${API}/personal/${encodeURIComponent(RUT)}/upload`, form, { headers, maxBodyLength: Infinity, timeout: 60000 });
    console.log('  -> upload response:', uploadResp.data);
  } catch (e) {
    console.error('  Upload failed:', e.response ? e.response.data : e.message);
  }

  // Optional: delete image
  try {
    console.log('\n6) DELETE /personal/:rut/image (delete uploaded image)');
    const del = await client.delete(`/personal/${encodeURIComponent(RUT)}/image`);
    console.log('  ->', del.data);
  } catch (e) {
    console.error('  DELETE image failed:', e.response ? e.response.data : e.message);
  }

})();
