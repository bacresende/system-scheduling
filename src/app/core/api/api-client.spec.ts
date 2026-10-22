import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, ApiClient } from './api-client';

describe('ApiClient', () => {
  beforeEach(() => sessionStorage.clear());

  it('fails explicitly without making a request when backend is unconfigured', async () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: null }
    ] });
    await expect(TestBed.inject(ApiClient).request('POST', '/auth/login', {}))
      .rejects.toThrow('Backend não configurado');
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });
  it('sends Parse credentials and unwraps Cloud Function responses', async () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api/' }
    ] });
    const api = TestBed.inject(ApiClient);
    api.setSessionToken('session-token');
    const result = api.request<{ id: string }>('POST', '/teste');
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/teste');
    expect(request.request.headers.get('X-Parse-Application-Id')).toBe('EuT2u3Ws5LaUp4x6awiXZ5XmgkTppQPCgCr4u08e');
    expect(request.request.headers.get('X-Parse-REST-API-Key')).toBe('f5VkymrtvfQD9AnO2Pe8hLGYLqIM2krPran0jgQQ');
    expect(request.request.headers.get('X-Parse-Session-Token')).toBe('session-token');
    request.flush({ result: { id: '1' } });
    await expect(result).resolves.toEqual({ id: '1' });
    http.verify();
  });

});
