import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, ApiClient } from '../../../core/api/api-client';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://parse.example/functions' },
      ],
    });
  });

  it('stores the Parse token and authenticated session after registration', async () => {
    const auth = TestBed.inject(AuthService);
    const api = TestBed.inject(ApiClient);
    const registration = auth.register({
      nome: 'Cliente Teste',
      email: 'cliente@example.test',
      telefone: '5511999999999',
      senha: 'senha-teste',
    });
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://parse.example/functions/preCadastro',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('X-Parse-Session-Token')).toBe(false);
    request.flush({
      result: {
        sessionToken: 'parse-session-token',
        session: { id: 'user-1', nome: 'Cliente Teste', papel: 'CLIENTE' },
      },
    });

    await expect(registration).resolves.toEqual({
      id: 'user-1',
      nome: 'Cliente Teste',
      papel: 'CLIENTE',
    });
    expect(api.sessionToken).toBe('parse-session-token');
    expect(auth.session()).toEqual({
      id: 'user-1',
      nome: 'Cliente Teste',
      papel: 'CLIENTE',
    });
  });
});
