import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { Agendamento, ConfiguracaoAgenda, ConcluirAgendamento, NovoAgendamento } from '../models/agendamento.model';

@Injectable({ providedIn: 'root' })
export class AgendamentosService {
  private readonly api = inject(ApiClient);
  list(start: Date, end: Date): Observable<Agendamento[]> {
    return this.api.request('GET', `/agendamentos?inicio=${encodeURIComponent(start.toISOString())}&fim=${encodeURIComponent(end.toISOString())}`);
  }
  get(id: string): Observable<Agendamento> { return this.api.request('GET', `/agendamentos/${encodeURIComponent(id)}`); }
  config(): Observable<ConfiguracaoAgenda> { return this.api.request('GET', '/clinica/agenda'); }
  create(payload: NovoAgendamento): Observable<Agendamento> { return this.api.request('POST', '/agendamentos', payload); }
  cancel(id: string): Observable<Agendamento> { return this.api.request('POST', `/agendamentos/${encodeURIComponent(id)}/cancelar`, {}); }
  complete(id: string, payload: ConcluirAgendamento): Observable<Agendamento> {
    return this.api.request('POST', `/agendamentos/${encodeURIComponent(id)}/concluir`, payload);
  }
  upload(id: string, file: File): Observable<string> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
      return throwError(() => new Error('Selecione uma foto JPEG, PNG ou WebP de até 5 MB.'));
    }
    const body = new FormData();
    body.append('foto', file);
    return this.api.request<{ url: string }>('POST', `/agendamentos/${encodeURIComponent(id)}/foto`, body).pipe(
      map(result => {
        if (!result.url.startsWith('https://')) throw new Error('O Storage não retornou uma URL HTTPS válida.');
        return result.url;
      })
    );
  }
}
