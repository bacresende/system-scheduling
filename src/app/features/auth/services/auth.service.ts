import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiClient } from '../../../core/api/api-client';
import {
  CompletarPerfil,
  EnderecoCep,
  PreCadastro,
  Usuario,
} from '../../usuarios/models/usuario.model';

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
    try {
      const response = await this.api.request<Usuario>('POST', '/login', {
        email: credentials.email.trim().toLowerCase(),
        senha: credentials.senha,
      });
      this.acceptAuthenticationResponse(response);
    } catch (error: unknown) {
      if (this.isInvalidCredentials(error)) {
        throw new Error('E-mail ou senha incorretos. Confira os dados e tente novamente.');
      }
      throw error;
    }
  }

  async register(payload: PreCadastro): Promise<void> {
    try {
      const response = await this.api.request<Usuario>('POST', '/preCadastro', {
        ...payload,
        email: payload.email.trim().toLowerCase(),
        cpf: payload.cpf.replace(/\D/g, ''),
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
    const usuario = await this.api.request<Usuario>('POST', '/completarCadastro', payload);
    this.current.set(usuario);
  }

  async lookupCep(cep: string): Promise<EnderecoCep> {
    return this.api.request<EnderecoCep>('POST', '/consultarCep', { cep });
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
    const code = this.parseErrorCode(error);
    const message = this.parseErrorText(error).toLowerCase();
    return code === 202 || code === 203 || message.includes('já existe uma conta com esse e-mail');
  }

  private isInvalidCredentials(error: unknown): boolean {
    const code = this.parseErrorCode(error);
    const message = this.parseErrorText(error).toLowerCase();
    return (
      code === 101 ||
      message.includes('invalid username/password') ||
      message.includes('e-mail ou senha incorretos')
    );
  }

  private parseErrorCode(error: unknown): number | null {
    if (!(error instanceof HttpErrorResponse) || typeof error.error !== 'object' || !error.error) {
      return null;
    }
    const code = 'code' in error.error ? error.error.code : null;
    return typeof code === 'number' ? code : null;
  }

  private parseErrorText(error: unknown): string {
    if (!(error instanceof HttpErrorResponse) || typeof error.error !== 'object' || !error.error) {
      return '';
    }
    const message = 'error' in error.error ? error.error.error : '';
    return typeof message === 'string' ? message : '';
  }
}
