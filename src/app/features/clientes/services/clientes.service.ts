import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { CadastroCliente, Cliente } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly api = inject(ApiClient);
  list(): Promise<Cliente[]> { return this.api.request('GET', '/clientes'); }
  create(payload: CadastroCliente): Promise<Cliente> { return this.api.request('POST', '/clientes', payload); }
}
