import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { SalvarServico, Servico } from '../models/servico.model';

@Injectable({ providedIn: 'root' })
export class ServicosService {
  private readonly api = inject(ApiClient);
  list(): Promise<Servico[]> { return this.api.request('GET', '/servicos'); }
  save(payload: SalvarServico, id?: string): Promise<Servico> {
    return this.api.request(id ? 'PUT' : 'POST', id ? `/servicos/${encodeURIComponent(id)}` : '/servicos', payload);
  }
  deactivate(id: string): Promise<Servico> {
    return this.api.request('PATCH', `/servicos/${encodeURIComponent(id)}/ativo`, { ativo: false });
  }
}
