import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { SalvarServico, Servico } from '../models/servico.model';

@Injectable({ providedIn: 'root' })
export class ServicosService {
  private readonly api = inject(ApiClient);
  list(): Promise<Servico[]> {
    return this.api.request('POST', '/listServicos');
  }
  save(payload: SalvarServico, id?: string): Promise<Servico> {
    return id
      ? this.api.request('POST', '/updateServico', { ...payload, id })
      : this.api.request('POST', '/createServico', payload);
  }
  deactivate(id: string): Promise<Servico> {
    return this.api.request('POST', '/deactivateServico', { id });
  }
  delete(id: string): Promise<{ id: string }> {
    return this.api.request('POST', '/deleteServico', { id });
  }
}
