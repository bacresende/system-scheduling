import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiClient } from '../../../core/api/api-client';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('creates a self-registered account and starts the session', async () => {
    const auth = TestBed.inject(AuthService);
    const registration = auth.register({
      nome: 'Cliente',
      email: ' Cliente@example.test ',
      telefone: '5511999999999',
      senha: 'senha-segura',
    });
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://parseapi.back4app.com/functions/preCadastro',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.email).toBe('cliente@example.test');
    request.flush({
      result: {
        sessionToken: 'parse-session-token',
        id: 'user-1',
        nome: 'Cliente',
        telefone: '5511999999999',
        email: 'cliente@example.test',
        cadastroCompleto: false,
        perfil: 'CLIENTE',
      },
    });
    await expect(registration).resolves.toBeUndefined();
    expect(auth.session()?.id).toBe('user-1');
  });

  it('restores an existing session without requiring the token in the response', async () => {
    const auth = TestBed.inject(AuthService);
    const api = TestBed.inject(ApiClient);
    api.setSessionToken('stored-session-token');
    const restoration = auth.restore();
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://parseapi.back4app.com/functions/sessao',
    );
    expect(request.request.method).toBe('POST');
    request.flush({
      result: {
        id: 'user-1',
        nome: 'Cliente',
        email: 'cliente@example.test',
        telefone: '5511999999999',
        cadastroCompleto: false,
        perfil: 'CLIENTE',
      },
    });
    await expect(restoration).resolves.toMatchObject({ id: 'user-1' });
    expect(auth.session()?.id).toBe('user-1');
  });

  it('directs duplicate signup to password reset', async () => {
    const auth = TestBed.inject(AuthService);
    const registration = auth.register({
      nome: 'Cliente',
      email: 'cliente@example.test',
      telefone: '5511999999999',
      senha: 'senha-segura',
    });
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://parseapi.back4app.com/functions/preCadastro',
    );
    request.flush(
      { code: 202, error: 'username already taken' },
      { status: 400, statusText: 'Bad Request' },
    );
    await expect(registration).rejects.toThrow('Esqueci minha senha');
  });

  it('requests password reset through the Parse REST endpoint', async () => {
    const auth = TestBed.inject(AuthService);
    const reset = auth.requestPasswordReset(' CLIENTE@example.test ');
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://parseapi.back4app.com/requestPasswordReset',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('X-Parse-Session-Token')).toBe(false);
    expect(request.request.body).toEqual({ email: 'cliente@example.test' });
    request.flush({});
    await expect(reset).resolves.toBeUndefined();
  });

  it('completes the authenticated profile with the optional professional occupation', async () => {
    const auth = TestBed.inject(AuthService);
    const completion = auth.complete({
      cpf: '52998224725',
      nasc: '1990-01-01',
      ocupacaoProfissional: 'Esteticista',
      endereco: {
        cep: '01001000',
        logradouro: 'Praça da Sé',
        numeroResidencia: '1',
        bairro: 'Sé',
        cidade: 'São Paulo',
        estado: 'SP',
        pais: 'Brasil',
      },
    });
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://parseapi.back4app.com/functions/completarCadastro',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.ocupacaoProfissional).toBe('Esteticista');
    request.flush({
      result: {
        id: 'user-1',
        nome: 'Cliente',
        email: 'cliente@example.test',
        telefone: '5511999999999',
        cpf: '52998224725',
        nasc: '1990-01-01',
        ocupacaoProfissional: 'Esteticista',
        cadastroCompleto: true,
        perfil: 'CLIENTE',
      },
    });
    await expect(completion).resolves.toBeUndefined();
    expect(auth.session()?.cadastroCompleto).toBe(true);
  });

  it('looks up a Brazilian address through the authenticated Cloud Function', async () => {
    const auth = TestBed.inject(AuthService);
    const lookup = auth.lookupCep('01001000');
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://parseapi.back4app.com/functions/consultarCep',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ cep: '01001000' });
    request.flush({
      result: {
        cep: '01001000',
        logradouro: 'Praça da Sé',
        complemento: 'lado ímpar',
        bairro: 'Sé',
        cidade: 'São Paulo',
        estado: 'SP',
      },
    });
    await expect(lookup).resolves.toEqual({
      cep: '01001000',
      logradouro: 'Praça da Sé',
      complemento: 'lado ímpar',
      bairro: 'Sé',
      cidade: 'São Paulo',
      estado: 'SP',
    });
  });

  it('does not reveal when the email has no account', async () => {
    const auth = TestBed.inject(AuthService);
    const reset = auth.requestPasswordReset('ausente@example.test');
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://parseapi.back4app.com/requestPasswordReset',
    );
    request.flush(
      { code: 205, error: 'Email not found.' },
      { status: 400, statusText: 'Bad Request' },
    );
    await expect(reset).resolves.toBeUndefined();
  });
});
