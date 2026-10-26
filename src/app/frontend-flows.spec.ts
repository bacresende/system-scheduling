import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ApiClient } from './core/api/api-client';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { PreCadastroPage } from './features/auth/pages/pre-cadastro-page/pre-cadastro-page';
import { ClienteListPageComponent } from './features/clientes/pages/cliente-list-page/cliente-list-page.component';
import { AgendamentoDetailPageComponent } from './features/agendamentos/pages/agendamento-detail-page/agendamento-detail-page.component';
import { AgendamentosService } from './features/agendamentos/services/agendamentos.service';
import { AnamnesePageComponent } from './features/anamnese/pages/anamnese-page/anamnese-page.component';
import { AuthService } from './features/auth/services/auth.service';
import { Agendamento } from './features/agendamentos/models/agendamento.model';

@Component({ template: '' })
class EmptyPage {}

describe('Frontend forms and clinical flows', () => {
  const request = vi.fn<(method: string, path: string, body?: unknown) => Promise<unknown>>();
  const requestPasswordReset = vi.fn<(email: string) => Promise<void>>();
  const booking: Agendamento = {
    id: 'a', idCliente: 'c', idServico: 's', idFuncionario: 'f',
    dataHora: '2026-10-20T10:00:00-03:00', status: 'Pendente', valor: 100, duracaoMinutos: 60
  };
  const service = {
    id: 's', nome: 'Facial', ativo: true, preco: 100, duracaoMinutos: 60
  };
  async function setup<T>(component: Type<T>) {
    TestBed.configureTestingModule({
      imports: [component],
      providers: [
        provideRouter([{ path: 'login', component: EmptyPage }]),
        { provide: ApiClient, useValue: { configured: true, request, requestPasswordReset } },
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({ id: 'a' }), queryParamMap: convertToParamMap({ agendamento: 'a' }) }
        } }
      ]
    });
    vi.spyOn(TestBed.inject(AuthService), 'session').mockReturnValue({
      id: 'admin',
      nome: 'Admin',
      telefone: '',
      email: '',
      cadastroCompleto: true,
      perfil: 'ADMIN',
    });
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }
  beforeEach(() => {
    request.mockReset();
    requestPasswordReset.mockReset();
    requestPasswordReset.mockResolvedValue(undefined);
    request.mockImplementation((_method, path) => {
      if (path === '/agendamentos/a') return Promise.resolve(booking);
      if (path === '/listUsuarios') return Promise.resolve([]);
      if (path === '/listServicos') return Promise.resolve([service]);
      if (path.startsWith('/anamnese?')) return Promise.resolve(null);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
  });
  function input(root: HTMLElement, name: string, value: string): void {
    const element = root.querySelector<HTMLInputElement>(`input[formControlName="${name}"]`);
    if (!element) throw new Error(`Input not found: ${name}`);
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }
  function submit(root: HTMLElement): void {
    const form = root.querySelector('form');
    if (!form) throw new Error('Form not found');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
  it('sends reset instructions for a valid email without revealing account existence', async () => {
    const fixture = await setup(LoginPageComponent);
    const root: HTMLElement = fixture.nativeElement;
    const resetButton = Array.from(root.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Esqueci minha senha'),
    );
    if (!resetButton) throw new Error('Password reset action not found');
    resetButton.click();
    await fixture.whenStable();
    input(root, 'email', 'c@example.test');
    submit(root);
    await fixture.whenStable();
    expect(requestPasswordReset).toHaveBeenCalledWith('c@example.test');
    expect(root.textContent).toContain('Se houver uma conta associada');
  });
  it('does not request a reset for an invalid email', async () => {
    const fixture = await setup(LoginPageComponent);
    const root: HTMLElement = fixture.nativeElement;
    const resetButton = Array.from(root.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Esqueci minha senha'),
    );
    if (!resetButton) throw new Error('Password reset action not found');
    resetButton.click();
    await fixture.whenStable();
    input(root, 'email', 'not-an-email');
    submit(root);
    await fixture.whenStable();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
  it('keeps self-registration available and validates its required fields', async () => {
    const fixture = await setup(PreCadastroPage);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('input')).toHaveLength(4);
    submit(root);
    await fixture.whenStable();
    expect(request).not.toHaveBeenCalled();
    expect(root.textContent).toContain('Preencha este campo');
  });
  it('validates client contact fields before sending a registration', async () => {
    const fixture = await setup(ClienteListPageComponent);
    const root: HTMLElement = fixture.nativeElement;
    request.mockClear();
    input(root, 'nome', 'Cliente'); input(root, 'email', 'invalid'); input(root, 'telefone', '123');
    submit(root); await fixture.whenStable();
    expect(request).not.toHaveBeenCalled();
    expect(root.textContent).toContain('Preencha este campo');
  });
  it('keeps completed appointments read-only', async () => {
    request.mockImplementation((_method, path) => {
      if (path === '/agendamentos/a') return Promise.resolve({ ...booking, status: 'Concluido', metodoPagamento: 'PIX' });
      if (path === '/listUsuarios') return Promise.resolve([]);
      if (path === '/listServicos') return Promise.resolve([service]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    const fixture = await setup(AgendamentoDetailPageComponent);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('form')).toBeNull();
    expect(root.textContent).toContain('não podem ser alterados');
  });
  it('sends a payment method when completing an appointment', async () => {
    const fixture = await setup(AgendamentoDetailPageComponent);
    request.mockReturnValue(Promise.resolve({ ...booking, status: 'Concluido', metodoPagamento: 'PIX' }));
    submit(fixture.nativeElement);
    await fixture.whenStable();
    expect(request).toHaveBeenCalledWith('POST', '/agendamentos/a/concluir', {
      metodoPagamento: 'PIX', anotacoesFinais: '', fotoResultadoUrl: undefined
    });
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it('requires acids to be specified when the response is affirmative', async () => {
    const fixture = await setup(AnamnesePageComponent);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('#varizes')).not.toBeNull();
    expect(root.querySelector('#cirurgia')).not.toBeNull();
    expect(root.querySelector('#atividade')).not.toBeNull();
    expect(root.querySelector('#alergia')).not.toBeNull();
    const checkbox = root.querySelector<HTMLInputElement>('#acidos');
    if (!checkbox) throw new Error('Checkbox not found');
    checkbox.click(); await fixture.whenStable();
    request.mockClear();
    submit(root); await fixture.whenStable();
    expect(root.textContent).toContain('Informe quais ácidos');
    expect(request).not.toHaveBeenCalled();
  });
  it('does not allow overwriting the record after failing to load it', async () => {
    request.mockImplementation((_method, path) => {
      if (path === '/agendamentos/a') return Promise.resolve(booking);
      return Promise.reject(new Error('Ficha indisponível'));
    });
    const fixture = await setup(AnamnesePageComponent);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Ficha indisponível');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    request.mockClear();
    submit(root); await fixture.whenStable();
    expect(request).not.toHaveBeenCalled();
  });
  it('rejects invalid files and excessive uploads without sending to the API', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: ApiClient, useValue: { request } }] });
    const api = TestBed.inject(AgendamentosService);
    await expect(api.upload('a', new File(['x'], 'file.txt', { type: 'text/plain' })))
      .rejects.toThrow('5 MB');
    await expect(api.upload('a', new File([
      new Uint8Array(5 * 1024 * 1024 + 1)
    ], 'foto.png', { type: 'image/png' }))).rejects.toThrow('5 MB');
    expect(request).not.toHaveBeenCalled();
  });
  it('uploads multipart and stores only the returned HTTPS URL', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: ApiClient, useValue: { request } }] });
    const file = new File(['image'], 'foto.png', { type: 'image/png' });
    request.mockReturnValue(Promise.resolve({ url: 'https://storage.example.test/foto.png' }));
    await expect(TestBed.inject(AgendamentosService).upload('a', file))
      .resolves.toBe('https://storage.example.test/foto.png');
    const body = request.mock.calls[0][2];
    expect(body).toBeInstanceOf(FormData);
    if (!(body instanceof FormData)) throw new Error('Expected multipart');
    expect(body.get('foto')).toBe(file);
  });
});
