import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiClient } from './api-client';

describe('ApiClient', () => {
  const FUNCTIONS_URL = 'https://parseapi.back4app.com/functions';

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('sends Parse credentials and unwraps Cloud Function responses', async () => {
    const api = TestBed.inject(ApiClient);
    api.setSessionToken('session-token');
    const result = api.request<{ id: string }>('POST', '/teste');
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne(`${FUNCTIONS_URL}/teste`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Parse-Application-Id')).toBe(
      'EuT2u3Ws5LaUp4x6awiXZ5XmgkTppQPCgCr4u08e',
    );
    expect(request.request.headers.get('X-Parse-REST-API-Key')).toBe(
      'f5VkymrtvfQD9AnO2Pe8hLGYLqIM2krPran0jgQQ',
    );
    expect(request.request.headers.get('X-Parse-Session-Token')).toBe('session-token');
    request.flush({ result: { id: '1' } });
    await expect(result).resolves.toEqual({ id: '1' });
    http.verify();
  });

  it('posts the params as the JSON body of the Cloud Function', async () => {
    const api = TestBed.inject(ApiClient);
    const result = api.request('POST', '/listAgendamentos', { inicio: 'a', fim: 'b' });
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne(`${FUNCTIONS_URL}/listAgendamentos`);
    expect(request.request.body).toEqual({ inicio: 'a', fim: 'b' });
    request.flush({ result: [] });
    await expect(result).resolves.toEqual([]);
  });

  it('does not send the session header when there is no logged user', async () => {
    const api = TestBed.inject(ApiClient);
    const result = api.request('POST', '/teste');
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne(`${FUNCTIONS_URL}/teste`);
    expect(request.request.headers.has('X-Parse-Session-Token')).toBe(false);
    request.flush({ result: null });
    await result;
  });

  it('stores and clears the session token', () => {
    const api = TestBed.inject(ApiClient);
    expect(api.sessionToken).toBeNull();
    api.setSessionToken('abc');
    expect(api.sessionToken).toBe('abc');
    api.clearSessionToken();
    expect(api.sessionToken).toBeNull();
  });
});
