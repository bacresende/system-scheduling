import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService, Sessao } from './auth.service';
import { adminGuard, sessionGuard } from './auth.guard';

@Component({ template: '<h1>Página de teste</h1>' })
class TestPage {}

describe('Access and progressive profile guards', () => {
  async function setup(session: Sessao | null, error?: Error): Promise<RouterTestingHarness> {
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: {
        restore: () => error ? throwError(() => error) : of(session), session: () => session
      } },
      provideRouter([
        { path: 'login', component: TestPage },
        { path: 'completar-cadastro', component: TestPage, canActivate: [sessionGuard] },
        { path: 'portal', component: TestPage, canActivate: [sessionGuard] },
        { path: '', canActivate: [sessionGuard], canActivateChild: [adminGuard], children: [
          { path: 'dashboard', component: TestPage }
        ] }
      ])
    ] });
    return RouterTestingHarness.create();
  }
  const client = (complete: boolean): Sessao => ({
    id: 'u', nome: 'Cliente', papel: 'CLIENTE',
    cliente: { id: 'c', nome: 'Cliente', email: 'c@example.test', telefone: '5511999999999', cadastroCompleto: complete }
  });
  it('redirects anonymous access to login preserving return URL', async () => {
    const harness = await setup(null); await harness.navigateByUrl('/dashboard');
    const { Router } = await import('@angular/router');
    expect(TestBed.inject(Router).url).toContain('/login?retorno=%2Fdashboard');
  });
  it('blocks incomplete profiles before any portal functionality', async () => {
    const harness = await setup(client(false)); await harness.navigateByUrl('/portal');
    const { Router } = await import('@angular/router');
    expect(TestBed.inject(Router).url).toBe('/completar-cadastro');
  });
  it('prevents clients from accessing admin screens', async () => {
    const harness = await setup(client(true)); await harness.navigateByUrl('/dashboard');
    const { Router } = await import('@angular/router');
    expect(TestBed.inject(Router).url).toBe('/portal');
  });
  it('allows administrators', async () => {
    const harness = await setup({ id: 'u', nome: 'Admin', papel: 'ADMIN' }); await harness.navigateByUrl('/dashboard');
    const { Router } = await import('@angular/router');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
  it('reports backend failures rather than authenticating by default', async () => {
    const harness = await setup(null, new Error('Backend indisponível')); await harness.navigateByUrl('/dashboard');
    const { Router } = await import('@angular/router');
    expect(decodeURIComponent(TestBed.inject(Router).url)).toContain('erro=Backend indisponível');
  });
});
