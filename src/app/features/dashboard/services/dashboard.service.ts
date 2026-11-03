import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { Agendamento } from '../../agendamentos/models/agendamento.model';

export interface AgendamentoDashboard
  extends Omit<
    Pick<
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
    >,
    'dataHora'
  > {
  dataHora: string;
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

type DashboardApiResponse = Omit<ResumoDashboard, 'agendaHoje'> & {
  agendaHoje: Array<Omit<AgendamentoDashboard, 'dataHora'> & { dataHora: unknown }>;
};

function isParseDate(value: unknown): value is { __type: 'Date'; iso: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__type' in value &&
    value.__type === 'Date' &&
    'iso' in value &&
    typeof value.iso === 'string'
  );
}

function normalizeDate(value: unknown): string {
  const dateValue = isParseDate(value) ? value.iso : value;
  const date =
    dateValue instanceof Date
      ? dateValue
      : typeof dateValue === 'string' || typeof dateValue === 'number'
        ? new Date(dateValue)
        : null;

  if (!date || Number.isNaN(date.getTime())) {
    throw new Error('A API retornou a data do agendamento em formato inválido.');
  }

  return date.toISOString();
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiClient);
  async get(): Promise<ResumoDashboard> {
    const response = await this.api.request<DashboardApiResponse>('POST', '/dashboard', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return {
      ...response,
      agendaHoje: response.agendaHoje.map((booking) => ({
        ...booking,
        dataHora: normalizeDate(booking.dataHora),
      })),
    };
  }
}
