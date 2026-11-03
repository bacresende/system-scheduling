import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { ClienteProntuario } from '../models/cliente-prontuario.model';

@Injectable({ providedIn: 'root' })
export class ClienteProntuarioService {
  private readonly api = inject(ApiClient);

  get(id: string): Promise<ClienteProntuario> {
    return this.api.request('POST', '/getClienteProntuario', { id });
  }
}
