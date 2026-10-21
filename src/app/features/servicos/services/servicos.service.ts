import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { SalvarServico, Servico } from '../models/servico.model';

@Injectable({ providedIn: 'root' })
export class ServicosService {
  private readonly api = inject(ApiClient);
  list(): Observable<Servico[]> { return this.api.request('GET', '/servicos'); }
  save(payload: SalvarServico, id?: string): Observable<Servico> {
    return this.api.request(id ? 'PUT' : 'POST', id ? `/servicos/${encodeURIComponent(id)}` : '/servicos', payload);
  }
  deactivate(id: string): Observable<Servico> {
    return this.api.request('PATCH', `/servicos/${encodeURIComponent(id)}/ativo`, { ativo: false });
  }
}
