// Script de prueba: simula la creación de FormData para POST /cursos
// Muestra los pares clave=>valor y cómo quedaría el filename usado para el archivo.

// Este script no hace una petición HTTP real; simula lo que hace el frontend antes de enviar.

const path = require('path');
const fs = require('fs');

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .toLowerCase();
}

function getExtension(filename) {
  const idx = filename.lastIndexOf('.');
  return idx !== -1 ? filename.substring(idx) : '';
}

// Datos de ejemplo (simulan el input del usuario / modal)
const cursoData = {
  rut_persona: '20011078-1',
  nombre_curso: 'Curso Manejo Seguro',
  fecha_inicio: '2025-09-01',
  institucion: 'Instituto X',
  fecha_emision: '2025-09-02',
  dias_validez: 730,
  // nombre_archivo_destino: 'certificado_manejo_20011078.pdf', // opcional
  archivo_path: path.join(__dirname, 'testfile_node.txt') // archivo de ejemplo (texto)
};

// Leer 'archivo' simulado
let archivoFile = null;
let archivoName = null;
let archivoSize = null;
let archivoType = 'text/plain';

try {
  const stats = fs.statSync(cursoData.archivo_path);
  archivoSize = stats.size;
  archivoName = path.basename(cursoData.archivo_path);
  archivoFile = { path: cursoData.archivo_path, name: archivoName };
} catch (err) {
  console.warn('No se encontró el archivo de prueba en scripts/testfile_node.txt. Se simulará sin leer fichero.');
  archivoFile = { path: cursoData.archivo_path, name: 'testfile_node.txt' };
  archivoSize = 123;
}

// Determinar nombre_archivo_destino (si no está dado, derivar desde nombre_curso)
let desiredFilename = cursoData.nombre_archivo_destino || '';
if (!desiredFilename && cursoData.nombre_curso) {
  const ext = getExtension(archivoFile.name) || '.pdf';
  desiredFilename = `${slugify(cursoData.nombre_curso)}${ext}`;
}

// Construir representación del FormData
const formData = [];
formData.push(['rut_persona', cursoData.rut_persona]);
formData.push(['nombre_curso', cursoData.nombre_curso]);
formData.push(['fecha_inicio', cursoData.fecha_inicio]);
formData.push(['institucion', cursoData.institucion]);
formData.push(['fecha_emision', cursoData.fecha_emision]);
formData.push(['dias_validez', String(cursoData.dias_validez)]);
formData.push(['estado', 'completado']);

if (desiredFilename) {
  formData.push(['nombre_archivo_destino', desiredFilename]);
  formData.push(['archivo', {
    originalName: archivoFile.name,
    filenameInMultipart: desiredFilename,
    type: archivoType,
    size: archivoSize,
    path: archivoFile.path
  }]);
} else {
  formData.push(['archivo', {
    originalName: archivoFile.name,
    filenameInMultipart: archivoFile.name,
    type: archivoType,
    size: archivoSize,
    path: archivoFile.path
  }]);
}

// Imprimir resultado legible
console.log('--- FormData simulation for POST /cursos ---\n');
for (const [k, v] of formData) {
  if (k === 'archivo') {
    console.log(`Key: ${k}`);
    console.log('  Original filename:', v.originalName);
    console.log('  Filename in multipart:', v.filenameInMultipart);
    console.log('  Type:', v.type);
    console.log('  Size:', v.size, 'bytes');
    console.log('  Path:', v.path);
  } else {
    console.log(`Key: ${k} => ${v}`);
  }
}
console.log('\n--- Simulated multipart snippet ---\n');
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const lines = [];
function part(name, value) {
  lines.push(`-- ${boundary}`);
  lines.push(`Content-Disposition: form-data; name="${name}"\n`);
  lines.push(value);
}
for (const [k, v] of formData) {
  if (k === 'archivo') {
    lines.push(`-- ${boundary}`);
    lines.push(`Content-Disposition: form-data; name="archivo"; filename="${v.filenameInMultipart}"`);
    lines.push(`Content-Type: ${v.type}\n`);
    lines.push('...binary data...');
  } else {
    lines.push(`-- ${boundary}`);
    lines.push(`Content-Disposition: form-data; name="${k}"\n`);
    lines.push(String(v));
  }
}
lines.push(`-- ${boundary}--`);
console.log(lines.join('\n'));

console.log('\n--- End of simulation ---');
