import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import {
  Agendamento,
  ConcluirAgendamento,
  ConfiguracaoAgenda,
  NovoAgendamento,
  ReagendarAgendamento,
} from '../models/agendamento.model';
import { HorarioDisponivelSlot, ResumoFinanceiroAgendamento } from './agenda-rules';

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
    return this.api.request('POST', '/listAgendamentos', {
      inicio: start.toISOString(),
      fim: end.toISOString(),
    });
  }

  get(id: string): Promise<Agendamento> {
    return this.api.request('POST', '/getAgendamento', { id });
  }

  config(): Promise<ConfiguracaoAgenda> {
    return this.api.request('POST', '/getConfiguracaoAgenda', {});
  }

  create(payload: NovoAgendamento): Promise<Agendamento> {
    return this.api.request('POST', '/createAgendamento', payload);
  }

  confirm(id: string): Promise<Agendamento> {
    return this.api.request('POST', '/confirmarAgendamento', { id });
  }

  reschedule(id: string, payload: ReagendarAgendamento): Promise<Agendamento> {
    return this.api.request('POST', '/reagendarAgendamento', {
      id,
      ...payload,
    });
  }

  markAlertSeen(id: string): Promise<Agendamento> {
    return this.api.request('POST', '/marcarAlertaVistoAgendamento', { id });
  }

  cancel(id: string): Promise<Agendamento> {
    return this.api.request('POST', '/cancelarAgendamento', { id });
  }

  complete(id: string, payload: ConcluirAgendamento): Promise<Agendamento> {
    return this.api.request('POST', '/concluirAgendamento', {
      id,
      ...payload,
    });
  }

  /**
   * Horários livres do dia consultados no backend, considerando TODOS os
   * agendamentos do banco (não apenas os carregados no período da tela).
   */
  async listarHorariosDisponiveis(params: {
    dia: Date;
    duracaoMinutos: number;
    ignoreBookingId?: string;
  }): Promise<HorarioDisponivelSlot[]> {
    const slots = await this.api.request<{ label: string; fimLabel: string; date: string }[]>(
      'POST',
      '/listarHorariosDisponiveis',
      {
        dia: params.dia.toISOString(),
        duracaoMinutos: params.duracaoMinutos,
        ignoreBookingId: params.ignoreBookingId,
      },
    );
    return (slots ?? []).map((slot) => ({
      label: slot.label,
      fimLabel: slot.fimLabel,
      date: new Date(slot.date),
    }));
  }

  /**
   * Resumo financeiro calculado no backend, incluindo os limites de uso do
   * cupom (global e por cliente), que o frontend não tem como conhecer.
   */
  calcularResumoFinanceiro(params: {
    idServico: string;
    idCliente?: string;
    totalSessoes: number;
    codigoCupom?: string | null;
    usarDescontoManual: boolean;
    tipoDescontoManual?: 'PORCENTAGEM' | 'VALOR_FIXO';
    valorDescontoManual?: number | null;
    dataReferencia?: Date | null;
  }): Promise<ResumoFinanceiroAgendamento & { erroCupom: string | null }> {
    return this.api.request('POST', '/calcularResumoFinanceiroAgendamento', {
      ...params,
      dataReferencia: params.dataReferencia ? params.dataReferencia.toISOString() : null,
    });
  }

  async upload(id: string, file: File): Promise<string> {
    const urls = await this.uploadMany(id, [file]);
    return urls[0];
  }

  async uploadMany(id: string, files: File[]): Promise<string[]> {
    if (files.length === 0) {
      return [];
    }
    for (const file of files) {
      this.validateImageFile(file);
    }

    const arquivos = await Promise.all(
      files.map(async (file) => ({
        nomeArquivo: file.name,
        mimeType: file.type,
        base64: await this.fileToBase64(file),
      })),
    );

    const result = await this.api.request<{ url: string; urls: string[] }>(
      'POST',
      '/uploadFotoAgendamento',
      {
        id,
        arquivos,
      },
    );

    const urls = Array.isArray(result.urls)
      ? result.urls
      : result.url
        ? [result.url]
        : [];

    if (urls.length === 0 || urls.some((u) => !u.startsWith('https://'))) {
      throw new Error('O Storage não retornou URLs HTTPS válidas.');
    }
    return urls;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Falha ao converter arquivo para Base64.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro na leitura do arquivo de imagem.'));
      reader.readAsDataURL(file);
    });
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
