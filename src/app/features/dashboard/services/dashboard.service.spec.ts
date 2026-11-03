import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ApiClient } from '../../../core/api/api-client';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('calls the dashboard Cloud Function with the browser time zone', async () => {
    const request = vi.fn().mockResolvedValue({
      agendamentosHoje: 2,
      clientes: 8,
      receitaConcluidaHoje: 150,
      oportunidades: 3,
      agendaHoje: [],
    });
    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: ApiClient, useValue: { request } }],
    });

    const service = TestBed.inject(DashboardService);
    await expect(service.get()).resolves.toEqual({
      agendamentosHoje: 2,
      clientes: 8,
      receitaConcluidaHoje: 150,
      oportunidades: 3,
      agendaHoje: [],
    });
    expect(request).toHaveBeenCalledWith('POST', '/dashboard', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  });

  it('normalizes Parse date values in today appointments', async () => {
    const request = vi.fn().mockResolvedValue({
      agendamentosHoje: 1,
      clientes: 8,
      receitaConcluidaHoje: 150,
      oportunidades: 3,
      agendaHoje: [
        {
          id: 'booking-1',
          dataHora: { __type: 'Date', iso: '2026-11-03T10:00:00.000Z' },
          idCliente: 'client-1',
          idServico: 'service-1',
          status: 'Confirmado',
          duracaoMinutos: 30,
          cliente: 'Ana',
          servico: 'Limpeza de pele',
        },
      ],
    });
    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: ApiClient, useValue: { request } }],
    });

    const summary = await TestBed.inject(DashboardService).get();

    expect(summary.agendaHoje[0].dataHora).toBe('2026-11-03T10:00:00.000Z');
  });
});
