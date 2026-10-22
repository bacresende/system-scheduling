import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { Agendamento } from '../../agendamentos/models/agendamento.model';
import { Cliente } from '../../clientes/models/cliente.model';
import { Servico } from '../../servicos/models/servico.model';
import { whatsappLink } from '../../agendamentos/services/agenda-rules';

export interface CandidatoRetorno {
  agendamento: Agendamento;
  cliente: Cliente;
  servico: Servico;
}
export interface Oportunidade extends CandidatoRetorno {
  retornoEm: Date;
  whatsapp: string;
}
export function opportunities(candidates: CandidatoRetorno[], today: Date): Oportunidade[] {
  const endOfToday = new Date(today); endOfToday.setHours(23, 59, 59, 999);
  return candidates.flatMap(candidate => {
    const { agendamento, servico, cliente } = candidate;
    if (agendamento.status !== 'Concluido' || !servico.diasParaRetorno ||
        !Number.isInteger(servico.diasParaRetorno) || servico.diasParaRetorno < 1) return [];
    const retornoEm = new Date(agendamento.dataHora);
    retornoEm.setDate(retornoEm.getDate() + servico.diasParaRetorno);
    if (!Number.isFinite(retornoEm.getTime()) || retornoEm > endOfToday) return [];
    return [{ ...candidate, retornoEm, whatsapp: whatsappLink(cliente.telefone,
      `Olá, ${cliente.nome}! Está na hora de retornar para ${servico.nome}. Vamos agendar sua manutenção?`) }];
  }).sort((a, b) => a.retornoEm.getTime() - b.retornoEm.getTime());
}

@Injectable({ providedIn: 'root' })
export class OportunidadesService {
  private readonly api = inject(ApiClient);
  async list(): Promise<Oportunidade[]> {
    const candidates = await this.api.request<CandidatoRetorno[]>('GET', '/oportunidades');
    return opportunities(candidates, new Date());
  }
}
