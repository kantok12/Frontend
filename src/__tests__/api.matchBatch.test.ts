// Mock axios before importing apiService to avoid ESM parsing issues in Node environment
jest.mock('axios', () => {
  const post = jest.fn(() => Promise.reject({ response: { status: 404 } }));
  const get = jest.fn(() => Promise.resolve({ data: {} }));
  const create = jest.fn(() => ({
    defaults: { baseURL: 'http://test', withCredentials: false },
    post,
    get,
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
  }));
  return { create, __esModule: true };
});

import apiService from '../services/api';

describe('apiService.matchPrerequisitosClienteBatch', () => {
  let originalApi: any;

  beforeEach(() => {
    originalApi = (apiService as any).api;
  });

  afterEach(() => {
    (apiService as any).api = originalApi;
    jest.restoreAllMocks();
  });

  test('falls back to per-rut when batch endpoint returns 404', async () => {
    // Simulate batch endpoint not available by making api.post reject with 404
    (apiService as any).api = { post: jest.fn(() => Promise.reject({ response: { status: 404 } })), get: jest.fn() };

    const mockResult = { success: true, data: { rut: '20011078-1', faltantes: [], cumple: true } };
    const matchSpy = jest.spyOn(apiService as any, 'matchPrerequisitosCliente').mockResolvedValue(mockResult as any);

    const res = await apiService.matchPrerequisitosClienteBatch(28, ['20.011.078-1']);

    expect((apiService as any).api.post).toHaveBeenCalled();
    expect(matchSpy).toHaveBeenCalled();
    expect(res).toHaveProperty('success');
    expect(res.success).toBe(true);
    expect(res).toHaveProperty('data');
  });
});
