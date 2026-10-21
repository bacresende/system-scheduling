import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
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

  restore(): Observable<Sessao | null> {
    if (this.current()) return of(this.current());
    return this.api.request<Sessao>('GET', '/auth/sessao').pipe(
      tap(session => this.current.set(session)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) return of(null);
        return throwError(() => error);
      })
    );
  }

  login(credentials: Credenciais): Observable<void> {
    return this.api.request<Sessao>('POST', '/auth/login', credentials).pipe(
      tap(session => this.current.set(session)),
      map(() => undefined)
    );
  }

  register(payload: PreCadastro): Observable<void> {
    return this.api.request<void>('POST', '/auth/pre-cadastro', payload);
  }

  complete(payload: CompletarPerfil): Observable<void> {
    return this.api.request<Cliente>('PUT', '/clientes/me/perfil', payload).pipe(
      tap(cliente => this.current.update(session => session ? { ...session, cliente } : null)),
      map(() => undefined)
    );
  }

  logout(): Observable<void> {
    return this.api.request<void>('POST', '/auth/logout', {}).pipe(
      tap(() => this.current.set(null))
    );
  }
}
