import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, ApiClient } from './api-client';

describe('ApiClient', () => {
  it('fails explicitly without making a request when backend is unconfigured', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    await expect(firstValueFrom(TestBed.inject(ApiClient).request('POST', '/auth/login', {})))
      .rejects.toThrow('Backend não configurado');
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });
  it('sends typed requests with cookie credentials to the configured API', async () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api/' }
    ] });
    const result = firstValueFrom(TestBed.inject(ApiClient).request<{ id: string }>('GET', '/teste'));
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/teste');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ id: '1' });
    await expect(result).resolves.toEqual({ id: '1' });
    http.verify();
  });
});
