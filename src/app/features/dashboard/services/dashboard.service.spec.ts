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

});
