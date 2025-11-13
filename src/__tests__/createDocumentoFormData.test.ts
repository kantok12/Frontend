// Mock apiService to avoid importing axios (Jest will hoist this mock before imports)
jest.mock('../services/api', () => ({ apiService: {} }));

import { createDocumentoFormData } from '../hooks/useDocumentos';

describe('createDocumentoFormData', () => {
  it('incluye los campos esperados y serializa prerrequisitos', () => {
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const data: any = {
      personal_id: '11111111-1',
      nombre_documento: 'mi_documento.pdf',
      tipo_documento: 'prerrequisitos',
      archivo: file,
      prerrequisitos: [12, 34]
    };

    const fd = createDocumentoFormData(data);

    expect(fd.get('rut_persona')).toBe('11111111-1');
    expect(fd.get('nombre_documento')).toBe('mi_documento.pdf');
    expect(fd.get('nombre_archivo_destino')).toBe('mi_documento.pdf');
    expect(fd.get('tipo_documento')).toBe('prerrequisitos');

    const prer = fd.get('prerrequisitos') as string | null;
    expect(prer).not.toBeNull();
    if (prer) {
      expect(JSON.parse(prer)).toEqual([12, 34]);
    }

    const archivo = fd.get('archivo') as File | null;
    expect(archivo).not.toBeNull();
    if (archivo) {
      expect(archivo instanceof File).toBe(true);
      expect(archivo.name).toBe('test.pdf');
    }
  });
});
