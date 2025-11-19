// Mock axios before importing ApiService to avoid ESM import/transform issues in Jest
jest.mock('axios', () => {
  const mAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    head: jest.fn(),
    defaults: { baseURL: 'http://test', withCredentials: false },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
  };
  // Export create directly so axios.create(...) works in the ApiService constructor
  return { create: () => mAxiosInstance };
});

const ApiService = require('../services/api').default;

describe('ApiService.matchPrerequisitosCliente fallback behavior', () => {
  let service: any;

  beforeEach(() => {
    process.env.REACT_APP_PREREQ_VERBOSE_LOG = 'true';
    // Use the exported singleton instance created by the module
    const apiModule = require('../services/api');
    service = apiModule.apiService || apiModule.default;
    // Reset mocked methods
    if (service.api && service.api.get && service.api.get.mockClear) service.api.get.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.REACT_APP_PREREQ_VERBOSE_LOG;
  });

  test('returns server response when match endpoint exists', async () => {
    // Mock the internal axios instance get to return a successful match
    (service as any).api.get = jest.fn().mockResolvedValue({ data: { success: true, data: { matched: true } } });

    const res = await service.matchPrerequisitosCliente(1, '16924504-5');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ matched: true });
    expect((service as any).api.get).toHaveBeenCalledWith('/prerequisitos/clientes/1/match', { params: { rut: '16924504-5' } });
  });

  test('falls back to local computation when server match endpoints are 404', async () => {
    // Simulate three consecutive 404s for the three api.get attempts
    const rejected404 = { response: { status: 404 } };
    const mockGet = jest.fn()
      .mockRejectedValueOnce(rejected404) // initial /match
      .mockRejectedValueOnce(rejected404) // alt1
      .mockRejectedValueOnce(rejected404); // alt2

    (service as any).api.get = mockGet;

    // Mock getClientePrerequisitos and getDocumentosByPersona to return matching types
    service.getClientePrerequisitos = jest.fn().mockResolvedValue({ success: true, data: [{ tipo_documento: 'licencia_conducir' }] });
    service.getDocumentosByPersona = jest.fn().mockResolvedValue({ success: true, data: [{ tipo_documento: 'licencia_conducir' }] });

    const res = await service.matchPrerequisitosCliente(1, '16924504-5');

    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('rut', '16924504-5');
    expect(res.data).toHaveProperty('clienteId', 1);
    expect(res.data).toHaveProperty('requisitos');
    expect(res.data).toHaveProperty('documentos');
    expect(res.data).toHaveProperty('faltantes');
    expect(res.data.cumple).toBe(true);
    expect(service.getClientePrerequisitos).toHaveBeenCalledWith(1);
    expect(service.getDocumentosByPersona).toHaveBeenCalledWith('16924504-5');
  });
});
