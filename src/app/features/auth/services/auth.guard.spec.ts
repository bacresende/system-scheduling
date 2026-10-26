import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Usuario } from '../../usuarios/models/usuario.model';
import { AuthService } from './auth.service';
import { adminGuard, homeFor, sessionGuard } from './auth.guard';

@Component({ template: '<h1>Página de teste</h1>' })
class TestPage {}

describe('Access and progressive profile guards', () => {
  async function setup(session: Usuario | null, error?: Error): Promise<RouterTestingHarness> {
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: {
        restore: () => error ? Promise.reject(error) : Promise.resolve(session), session: () => session
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
  const client = (complete: boolean): Usuario => ({
    id: 'u',
    nome: 'Cliente',
    email: 'c@example.test',
    telefone: '5511999999999',
    perfil: 'CLIENTE',
    cadastroCompleto: complete,
  });
  it('redirects anonymous access to login preserving return URL', async () => {
    const harness = await setup(null); await harness.navigateByUrl('/dashboard');
    const { Router } = await import('@angular/router');
    expect(TestBed.inject(Router).url).toContain('/login?retorno=%2Fdashboard');
  });
  it('allows incomplete profiles to access the portal', async () => {
    const harness = await setup(client(false)); await harness.navigateByUrl('/portal');
    const { Router } = await import('@angular/router');
    expect(TestBed.inject(Router).url).toBe('/portal');
  });
  it('uses the portal as the home page for incomplete client profiles', () => {
    expect(homeFor(null, client(false).perfil)).toBe('/portal');
  });
  it('redirects incomplete profiles from admin routes to the portal', async () => {
    const harness = await setup(client(false)); await harness.navigateByUrl('/dashboard');
    const { Router } = await import('@angular/router');
    expect(TestBed.inject(Router).url).toBe('/portal');
  });
  it('prevents clients from accessing admin screens', async () => {
    const harness = await setup(client(true)); await harness.navigateByUrl('/dashboard');
    const { Router } = await import('@angular/router');
    expect(TestBed.inject(Router).url).toBe('/portal');
  });
  it('allows administrators', async () => {
    const harness = await setup({
      id: 'u',
      nome: 'Admin',
      email: 'admin@example.test',
      telefone: '',
      cadastroCompleto: true,
      perfil: 'ADMIN',
    }); await harness.navigateByUrl('/dashboard');
    const { Router } = await import('@angular/router');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
  it('reports backend failures rather than authenticating by default', async () => {
    const harness = await setup(null, new Error('Backend indisponível')); await harness.navigateByUrl('/dashboard');
    const { Router } = await import('@angular/router');
    expect(decodeURIComponent(TestBed.inject(Router).url)).toContain('erro=Backend indisponível');
  });
});
