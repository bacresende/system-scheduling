import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ApiClient } from '../../../core/api/api-client';
import { NovoCupomPayload } from '../models/cupom.model';
import { CuponsService } from './cupons.service';

describe('CuponsService', () => {
  const request = vi.fn<(method: string, path: string, body?: unknown) => Promise<unknown>>();
  const payload: NovoCupomPayload = {
    codigo: 'BEMVINDA10',
    tipoDesconto: 'PORCENTAGEM',
    valor: 10,
    dataMinima: '2026-10-01',
    dataMaxima: '2026-10-31',
    limiteUsoGlobal: 100,
    limitePorCliente: 1,
    servicosValidos: ['servico-1'],
    minimoSessoes: 2,
    maximoSessoes: 8,
    ativo: true,
  };

  beforeEach(() => {
    request.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { configured: true, request } }],
    });
  });

  it('creates a coupon and normalizes Parse dates', async () => {
    request.mockResolvedValue({
      id: 'cupom-1',
      ...payload,
      dataMinima: { __type: 'Date', iso: '2026-10-01T00:00:00.000Z' },
      dataMaxima: '2026-10-31T00:00:00.000Z',
    });

    await expect(TestBed.inject(CuponsService).create(payload)).resolves.toMatchObject({
      id: 'cupom-1',
      dataMinima: '2026-10-01',
      dataMaxima: '2026-10-31',
    });
    expect(request).toHaveBeenCalledWith('POST', '/createCupom', payload);
  });

  it('updates a coupon with its id in the request body', async () => {
    request.mockResolvedValue({ id: 'cupom-1', ...payload });

    await expect(TestBed.inject(CuponsService).update('cupom-1', payload)).resolves.toMatchObject({
      id: 'cupom-1',
      dataMinima: '2026-10-01',
      dataMaxima: '2026-10-31',
    });
    expect(request).toHaveBeenCalledWith('POST', '/updateCupom', {
      ...payload,
      id: 'cupom-1',
    });
  });

  it('lists coupons and normalizes null and date values', async () => {
    request.mockResolvedValue([
      { id: 'cupom-1', ...payload, dataMinima: '2026-10-01', dataMaxima: null },
      { id: 'cupom-2', ...payload, dataMinima: '', dataMaxima: new Date('2026-11-01T00:00:00Z') },
    ]);

    await expect(TestBed.inject(CuponsService).list()).resolves.toMatchObject([
      { id: 'cupom-1', dataMinima: '2026-10-01', dataMaxima: null },
      { id: 'cupom-2', dataMinima: null, dataMaxima: '2026-11-01' },
    ]);
    expect(request).toHaveBeenCalledWith('POST', '/listCupons');
  });

  it('deletes and deactivates coupons using their ids', async () => {
    request
      .mockResolvedValueOnce({ id: 'cupom-1' })
      .mockResolvedValueOnce({ id: 'cupom-1', ...payload, ativo: false });
    const service = TestBed.inject(CuponsService);

    await expect(service.delete('cupom-1')).resolves.toEqual({ id: 'cupom-1' });
    await expect(service.deactivate('cupom-1')).resolves.toMatchObject({
      id: 'cupom-1',
      ativo: false,
      dataMinima: '2026-10-01',
      dataMaxima: '2026-10-31',
    });
    expect(request).toHaveBeenNthCalledWith(1, 'POST', '/deleteCupom', { id: 'cupom-1' });
    expect(request).toHaveBeenNthCalledWith(2, 'POST', '/deactivateCupom', { id: 'cupom-1' });
  });

  it.each([
    { __type: 'Date', iso: 'inválida' },
    { __type: 'Other', iso: '2026-10-01T00:00:00.000Z' },
    'data-inválida',
  ])('rejects invalid API date values: %s', async (dataMinima) => {
    request.mockResolvedValue({
      id: 'cupom-1',
      ...payload,
      dataMinima,
      dataMaxima: null,
    });

    await expect(TestBed.inject(CuponsService).create(payload)).rejects.toThrow(
      'A API retornou uma data em formato inválido para o cupom.',
    );
  });
});
