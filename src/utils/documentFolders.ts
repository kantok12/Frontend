// Utilidades para determinar la carpeta de destino al subir documentos
export type UploadFolder = 'cursos_certificaciones' | 'documentos';

/**
 * Decide la carpeta destino en base al tipo de documento.
 * - tipos relacionados con cursos/certificaciones => 'cursos_certificaciones'
 * - cualquier otro => 'documentos'
 *
 * Se puede usar para determinar la carpeta antes de crear el FormData
 */
export function mapTipoDocumentoToFolder(tipo?: string | null): UploadFolder {
  if (!tipo) return 'documentos';
  const s = String(tipo).toLowerCase().trim();
  const cursoKeys = new Set([
    'certificado_curso', 'curso', 'certificacion', 'certificación', 'diploma', 'certificado_seguridad', 'certificado_vencimiento'
  ]);
  if (cursoKeys.has(s)) return 'cursos_certificaciones';
  // Accept some common synonyms
  if (s.includes('curso') || s.includes('certific') || s.includes('diploma')) return 'cursos_certificaciones';
  return 'documentos';
}

/** Normaliza el valor recibido por el backend/usuario para exponer en UI */
export function folderLabel(folder: UploadFolder): string {
  return folder === 'cursos_certificaciones' ? 'Cursos / Certificaciones' : 'Documentos';
}
