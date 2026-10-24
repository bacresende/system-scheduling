import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const BACK4APP_FUNCTIONS_URL = 'https://parseapi.back4app.com/functions';
const BACK4APP_REST_URL = 'https://parseapi.back4app.com';
const BACK4APP_APPLICATION_ID = 'EuT2u3Ws5LaUp4x6awiXZ5XmgkTppQPCgCr4u08e';
const BACK4APP_REST_API_KEY = 'f5VkymrtvfQD9AnO2Pe8hLGYLqIM2krPran0jgQQ';
const SESSION_TOKEN_KEY = 'back4app.sessionToken';

interface ParseFunctionResponse<T> {
  result: T;
}

function isParseFunctionResponse<T>(
  response: T | ParseFunctionResponse<T>,
): response is ParseFunctionResponse<T> {
  return typeof response === 'object' && response !== null && 'result' in response;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = BACK4APP_FUNCTIONS_URL;
  readonly configured = this.baseUrl !== null;

  get sessionToken(): string | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(SESSION_TOKEN_KEY);
  }

  setSessionToken(token: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    }
  }

  clearSessionToken(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await firstValueFrom(
      this.http.request<T | ParseFunctionResponse<T>>(
        method,
        `${this.baseUrl.replace(/\/$/, '')}${path}`,
        {
          body,
          headers: this.parseHeaders(this.sessionToken),
        },
      ),
    );
    return isParseFunctionResponse(response) ? response.result : response;
  }

  async logoutParseSession(): Promise<void> {
    const token = this.sessionToken;
    if (!token) return;
    await firstValueFrom(
      this.http.post(
        `${BACK4APP_REST_URL}/logout`,
        {},
        {
          headers: this.parseHeaders(token),
        },
      ),
    );
  }

  private parseHeaders(sessionToken: string | null): HttpHeaders {
    let headers = new HttpHeaders({
      'X-Parse-Application-Id': BACK4APP_APPLICATION_ID,
      'X-Parse-REST-API-Key': BACK4APP_REST_API_KEY,
    });
    if (sessionToken) headers = headers.set('X-Parse-Session-Token', sessionToken);
    return headers;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401)
      return 'Sua sessão expirou ou as credenciais são inválidas. Entre novamente.';
    if (error.status === 403) return 'Você não tem permissão para realizar esta operação.';
    if (error.status === 409)
      return 'Conflito de dados. Atualize a página: o horário ou registro pode ter sido alterado.';
    return 'Não foi possível comunicar com a API. Verifique a conexão e tente novamente.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}
