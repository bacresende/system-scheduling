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
interface RespostaAutenticacao {
  sessionToken: string;
  session: Sessao;
}
export interface Credenciais {
  email: string;
  senha: string;
}
export type PreCadastro = CadastroCliente & { senha: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly current = signal<Sessao | null>(null);
  readonly session = this.current.asReadonly();

  async restore(): Promise<Sessao | null> {
    if (this.current()) return this.current();
    if (!this.api.sessionToken) return null;
    try {
      const session = await this.api.request<Sessao>('POST', '/sessao');
      this.current.set(session);
      return session;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.api.clearSessionToken();
        return null;
      }
      throw error;
    }
  }

  async login(credentials: Credenciais): Promise<void> {
    const response = await this.api.request<RespostaAutenticacao>('POST', '/login', {
      email: credentials.email,
      senha: credentials.senha,
    });
    this.acceptAuthenticationResponse(response);
  }

  async register(payload: PreCadastro): Promise<Sessao> {
    const response = await this.api.request<RespostaAutenticacao>('POST', '/preCadastro', payload);
    this.acceptAuthenticationResponse(response);
    return response.session;
  }

  async complete(payload: CompletarPerfil): Promise<void> {
    const cliente = await this.api.request<Cliente>('PUT', '/clientes/me/perfil', payload);
    this.current.update((session) => (session ? { ...session, cliente } : null));
  }

  async logout(): Promise<void> {
    try {
      await this.api.logoutParseSession();
    } finally {
      this.api.clearSessionToken();
      this.current.set(null);
    }
  }

  private acceptAuthenticationResponse(response: RespostaAutenticacao): void {
    if (!response.sessionToken || !response.session?.id) {
      throw new Error('A API não retornou uma sessão válida.');
    }
    this.api.setSessionToken(response.sessionToken);
    this.current.set(response.session);
  }
}
