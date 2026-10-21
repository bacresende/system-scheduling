import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { Agendamento, ConfiguracaoAgenda, ConcluirAgendamento, NovoAgendamento } from '../models/agendamento.model';

@Injectable({ providedIn: 'root' })
export class AgendamentosService {
  private readonly api = inject(ApiClient);
  list(start: Date, end: Date): Promise<Agendamento[]> {
    return this.api.request('GET', `/agendamentos?inicio=${encodeURIComponent(start.toISOString())}&fim=${encodeURIComponent(end.toISOString())}`);
  }
  get(id: string): Promise<Agendamento> { return this.api.request('GET', `/agendamentos/${encodeURIComponent(id)}`); }
  config(): Promise<ConfiguracaoAgenda> { return this.api.request('GET', '/clinica/agenda'); }
  create(payload: NovoAgendamento): Promise<Agendamento> { return this.api.request('POST', '/agendamentos', payload); }
  cancel(id: string): Promise<Agendamento> { return this.api.request('POST', `/agendamentos/${encodeURIComponent(id)}/cancelar`, {}); }
  complete(id: string, payload: ConcluirAgendamento): Promise<Agendamento> {
    return this.api.request('POST', `/agendamentos/${encodeURIComponent(id)}/concluir`, payload);
  }
  async upload(id: string, file: File): Promise<string> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
      throw new Error('Selecione uma foto JPEG, PNG ou WebP de até 5 MB.');
    }
    const body = new FormData();
    body.append('foto', file);
    const result = await this.api.request<{ url: string }>('POST', `/agendamentos/${encodeURIComponent(id)}/foto`, body);
    if (!result.url.startsWith('https://')) throw new Error('O Storage não retornou uma URL HTTPS válida.');
    return result.url;
  }
}
