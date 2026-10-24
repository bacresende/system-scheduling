import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiClient } from '../../../core/api/api-client';
import { CadastroCliente, Cliente, CompletarPerfil } from '../../clientes/models/cliente.model';

export interface Usuario {
  sessionToken?: string;
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf?: string;
  nasc?: string;
  endereco?: Endereco;
  cadastroCompleto: boolean;
  perfil: 'ADMIN' | 'CLIENTE';
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numeroResidencia: string;
  bairro: string;
  complemento: string;
  cidade: string;
  estado: string;
  pais: string;
}

export interface Credenciais {
  email: string;
  senha: string;
}
export type PreCadastro = CadastroCliente & { senha: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly current = signal<Usuario | null>(null);
  readonly session = this.current.asReadonly();

  async restore(): Promise<Usuario | null> {
    if (this.current()) return this.current();
    if (!this.api.sessionToken) return null;
    try {
      const session = await this.api.request<Usuario>('POST', '/sessao');
      this.acceptAuthenticationResponse(session);
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
    const response = await this.api.request<Usuario>('POST', '/login', {
      email: credentials.email,
      senha: credentials.senha,
    });
    this.acceptAuthenticationResponse(response);
  }

  async register(payload: PreCadastro): Promise<void> {
    const response = await this.api.request<Usuario>('POST', '/preCadastro', payload);
    this.acceptAuthenticationResponse(response);
  }

  //TODO: Ajustar método
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

  private acceptAuthenticationResponse(response: Usuario): void {
    if (!response.sessionToken || !response?.id) {
      throw new Error('A API não retornou uma sessão válida.');
    }
    this.api.setSessionToken(response.sessionToken);

    delete response.sessionToken;
    this.current.set(response);
  }
}
