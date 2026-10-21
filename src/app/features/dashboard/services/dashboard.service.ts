import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';

export interface ResumoDashboard {
  agendamentosHoje: number;
  clientes: number;
  receitaConcluidaHoje: number;
  oportunidades: number;
}
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiClient);
  get(): Observable<ResumoDashboard> { return this.api.request('GET', '/dashboard'); }
}
