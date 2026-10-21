import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiClient } from '../../../core/api/api-client';
import { CadastroCliente, Cliente, CompletarPerfil } from '../../clientes/models/cliente.model';

export interface Sessao {
  id: string;
  nome: string;
  papel: 'ADMIN' | 'CLIENTE';
  cliente?: Cliente;
}
export interface Credenciais { email: string; senha: string }
export type PreCadastro = CadastroCliente & { senha: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly current = signal<Sessao | null>(null);
  readonly session = this.current.asReadonly();

  async restore(): Promise<Sessao | null> {
    if (this.current()) return this.current();
    try {
      const session = await this.api.request<Sessao>('GET', '/auth/sessao');
      this.current.set(session);
      return session;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 401) return null;
      throw error;
    }
  }

  async login(credentials: Credenciais): Promise<void> {
    this.current.set(await this.api.request<Sessao>('POST', '/auth/login', credentials));
  }

  async register(payload: PreCadastro): Promise<void> {
    await this.api.request<void>('POST', '/auth/pre-cadastro', payload);
  }

  async complete(payload: CompletarPerfil): Promise<void> {
    const cliente = await this.api.request<Cliente>('PUT', '/clientes/me/perfil', payload);
    this.current.update(session => session ? { ...session, cliente } : null);
  }

  async logout(): Promise<void> {
    await this.api.request<void>('POST', '/auth/logout', {});
    this.current.set(null);
  }
}
