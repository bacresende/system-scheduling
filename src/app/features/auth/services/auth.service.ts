import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiClient } from '../../../core/api/api-client';
import { CompletarPerfil, PreCadastro, Usuario } from '../../usuarios/models/usuario.model';

export interface Credenciais {
  email: string;
  senha: string;
}

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
    try {
      const response = await this.api.request<Usuario>('POST', '/preCadastro', {
        ...payload,
        email: payload.email.trim().toLowerCase(),
      });
      this.acceptAuthenticationResponse(response);
    } catch (error: unknown) {
      if (this.isUsernameOrEmailTaken(error)) {
        throw new Error(
          'Já existe uma conta com esse e-mail. Use “Esqueci minha senha” para definir sua senha.',
        );
      }
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.api.requestPasswordReset(email.trim().toLowerCase());
  }

  async complete(payload: CompletarPerfil): Promise<void> {
    const usuario = await this.api.request<Usuario>('PUT', '/usuarios/me/perfil', payload);
    this.current.set(usuario);
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

  private isUsernameOrEmailTaken(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 400) return false;
    if (typeof error.error !== 'object' || error.error === null || !('code' in error.error)) {
      return false;
    }
    return error.error.code === 202 || error.error.code === 203;
  }
}
