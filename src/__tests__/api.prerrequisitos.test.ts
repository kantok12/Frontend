import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import ApiService from '../services/api';

describe('ApiService - Prerrequisitos', () => {
  let apiService: ApiService;
  let mock: MockAdapter;

  beforeAll(() => {
    apiService = new ApiService();
    mock = new MockAdapter(apiService['api']);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  test('GET /api/prerrequisitos/clientes', async () => {
    const mockResponse = {
      success: true,
      data: {
        '28': [
          {
            id: 5,
            cliente_id: 28,
            tipo_documento: 'CV',
            descripcion: 'Curriculum vitae',
            dias_duracion: 100,
          },
        ],
        global: [
          {
            id: 16,
            cliente_id: null,
            tipo_documento: 'Carnet de Identidad',
            dias_duracion: 10000,
          },
        ],
      },
    };

    mock.onGet('/prerrequisitos/clientes').reply(200, mockResponse);

    const response = await apiService.getClientePrerequisitos(28);
    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('28');
    expect(response.data['28'][0].tipo_documento).toBe('CV');
  });

  test('POST /api/prerrequisitos/clientes/:clienteId/match', async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          rut: '20.011.078-1',
          matchesAll: false,
          required_count: 3,
          provided_count: 2,
          faltantes: ['certificado_seguridad'],
        },
      ],
    };

    const payload = { ruts: ['20.011.078-1'] };
    mock.onPost('/prerrequisitos/clientes/28/match', payload).reply(200, mockResponse);

    const response = await apiService.matchPrerequisitosClienteBatch(28, ['20.011.078-1']);
    expect(response.success).toBe(true);
    expect(response.data[0].rut).toBe('20.011.078-1');
    expect(response.data[0].faltantes).toContain('certificado_seguridad');
  });

  test('GET /api/prerrequisitos/clientes/:clienteId/cumplen', async () => {
    const mockResponse = {
      success: true,
      data: [],
    };

    mock.onGet('/prerrequisitos/clientes/28/cumplen').reply(200, mockResponse);

    const response = await apiService.matchPrerequisitosCliente(28, 'cumplen');
    expect(response.success).toBe(true);
    expect(response.data).toEqual([]);
  });
});