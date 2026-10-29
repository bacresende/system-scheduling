import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import {
  Agendamento,
  ConcluirAgendamento,
  ConfiguracaoAgenda,
  NovoAgendamento,
  ReagendarAgendamento,
} from '../models/agendamento.model';

export const DEFAULT_AGENDA_CONFIG: ConfiguracaoAgenda = {
  fusoHorario: Intl.DateTimeFormat().resolvedOptions().timeZone,
  expediente: [
    { diaSemana: 1, inicio: '08:00', fim: '19:00' },
    { diaSemana: 2, inicio: '08:00', fim: '19:00' },
    { diaSemana: 3, inicio: '08:00', fim: '19:00' },
    { diaSemana: 4, inicio: '08:00', fim: '19:00' },
    { diaSemana: 5, inicio: '08:00', fim: '19:00' },
    { diaSemana: 6, inicio: '08:00', fim: '16:00' },
  ],
  funcionarios: [
    { id: 'prof-1', nome: 'Dra. Especialista (Principal)' },
    { id: 'prof-2', nome: 'Esteticista Responsável' },
  ],
};

@Injectable({ providedIn: 'root' })
export class AgendamentosService {
  private readonly api = inject(ApiClient);

  list(start: Date, end: Date): Promise<Agendamento[]> {
    return this.api.request(
      'GET',
      `/agendamentos?inicio=${encodeURIComponent(start.toISOString())}&fim=${encodeURIComponent(end.toISOString())}`,
    );
  }

  get(id: string): Promise<Agendamento> {
    return this.api.request('GET', `/agendamentos/${encodeURIComponent(id)}`);
  }

  config(): Promise<ConfiguracaoAgenda> {
    return this.api.request('GET', '/clinica/agenda');
  }

  create(payload: NovoAgendamento): Promise<Agendamento> {
    return this.api.request('POST', '/agendamentos', payload);
  }

  confirm(id: string): Promise<Agendamento> {
    return this.api.request('POST', `/agendamentos/${encodeURIComponent(id)}/confirmar`, {});
  }

  reschedule(id: string, payload: ReagendarAgendamento): Promise<Agendamento> {
    return this.api.request('POST', `/agendamentos/${encodeURIComponent(id)}/reagendar`, payload);
  }

  markAlertSeen(id: string): Promise<Agendamento> {
    return this.api.request('POST', `/agendamentos/${encodeURIComponent(id)}/ciente`, {});
  }

  cancel(id: string): Promise<Agendamento> {
    return this.api.request('POST', `/agendamentos/${encodeURIComponent(id)}/cancelar`, {});
  }

  complete(id: string, payload: ConcluirAgendamento): Promise<Agendamento> {
    return this.api.request('POST', `/agendamentos/${encodeURIComponent(id)}/concluir`, payload);
  }

  async upload(id: string, file: File): Promise<string> {
    this.validateImageFile(file);
    const body = new FormData();
    body.append('foto', file);
    const result = await this.api.request<{ url: string }>(
      'POST',
      `/agendamentos/${encodeURIComponent(id)}/foto`,
      body,
    );
    if (!result.url.startsWith('https://')) {
      throw new Error('O Storage não retornou uma URL HTTPS válida.');
    }
    return result.url;
  }

  async uploadMany(id: string, files: File[]): Promise<string[]> {
    for (const file of files) {
      this.validateImageFile(file);
    }
    const urls: string[] = [];
    for (const file of files) {
      const url = await this.upload(id, file);
      urls.push(url);
    }
    return urls;
  }

  private validateImageFile(file: File): void {
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024 ||
      file.size === 0
    ) {
      throw new Error(
        `Arquivo "${file.name}" inválido. Selecione fotos JPEG, PNG ou WebP de até 5 MB cada.`,
      );
    }
  }
}
