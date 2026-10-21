import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, throwError } from 'rxjs';

// Configure somente quando o backend implementar os contratos documentados.
export const API_BASE_URL = new InjectionToken<string | null>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => null
});

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  readonly configured = this.baseUrl !== null;

  request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH', path: string, body?: unknown): Observable<T> {
    if (!this.baseUrl) {
      return throwError(() => new Error('Backend não configurado. Autenticação, consultas e salvamentos dependem da API.'));
    }
    return this.http.request<T>(method, `${this.baseUrl.replace(/\/$/, '')}${path}`, {
      body,
      withCredentials: true
    });
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) return 'Sua sessão expirou ou as credenciais são inválidas. Entre novamente.';
    if (error.status === 403) return 'Você não tem permissão para realizar esta operação.';
    if (error.status === 409) return 'Conflito de dados. Atualize a página: o horário ou registro pode ter sido alterado.';
    return 'Não foi possível comunicar com a API. Verifique a conexão e tente novamente.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}
