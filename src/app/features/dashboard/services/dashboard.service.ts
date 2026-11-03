import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { Agendamento } from '../../agendamentos/models/agendamento.model';

export interface AgendamentoDashboard
  extends Pick<
    Agendamento,
    | 'id'
    | 'dataHora'
    | 'idCliente'
    | 'idServico'
    | 'status'
    | 'duracaoMinutos'
    | 'reagendado'
    | 'reagendadoPor'
    | 'alteracaoVistaPeloAdmin'
    | 'dataDefinida'
  > {
  cliente: string;
  servico: string;
}

export interface ResumoDashboard {
  agendamentosHoje: number;
  clientes: number;
  receitaConcluidaHoje: number;
  oportunidades: number;
  agendaHoje: AgendamentoDashboard[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiClient);
  get(): Promise<ResumoDashboard> {
    return this.api.request('POST', '/dashboard', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }
}
