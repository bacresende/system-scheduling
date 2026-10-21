import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ApiClient } from './core/api/api-client';
import { PreCadastroPage } from './features/auth/pages/pre-cadastro-page';
import { ClienteListPageComponent } from './features/clientes/pages/cliente-list-page/cliente-list-page.component';
import { AgendamentoDetailPageComponent } from './features/agendamentos/pages/agendamento-detail-page/agendamento-detail-page.component';
import { AgendamentosService } from './features/agendamentos/services/agendamentos.service';
import { AnamneseFacialPageComponent } from './features/anamnese/pages/anamnese-facial-page/anamnese-facial-page.component';
import { AuthService } from './features/auth/services/auth.service';
import { Agendamento } from './features/agendamentos/models/agendamento.model';

@Component({ template: '' })
class EmptyPage {}

describe('Frontend forms and clinical flows', () => {
  const request = vi.fn<(method: string, path: string, body?: unknown) => Promise<unknown>>();
  const booking: Agendamento = {
    id: 'a', idCliente: 'c', idServico: 's', idFuncionario: 'f',
    dataHora: '2026-10-20T10:00:00-03:00', status: 'Pendente', valor: 100, duracaoMinutos: 60
  };
  const service = {
    id: 's', nome: 'Facial', ativo: true, tipoAnamneseExigida: 'FACIAL', preco: 100, duracaoMinutos: 60
  };
  async function setup<T>(component: Type<T>) {
    TestBed.configureTestingModule({
      imports: [component],
      providers: [
        provideRouter([{ path: 'login', component: EmptyPage }]),
        { provide: ApiClient, useValue: { configured: true, request } },
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({ id: 'a' }), queryParamMap: convertToParamMap({ agendamento: 'a' }) }
        } }
      ]
    });
    vi.spyOn(TestBed.inject(AuthService), 'session').mockReturnValue({ id: 'admin', nome: 'Admin', papel: 'ADMIN' });
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }
  beforeEach(() => {
    request.mockReset();
    request.mockImplementation(async (_method, path) => {
      if (path === '/agendamentos/a') return booking;
      if (path === '/clientes') return [];
      if (path === '/servicos') return [service];
      if (path === '/servicos/s') return service;
      if (path.startsWith('/anamnese/facial?')) return null;
      throw new Error(`Unexpected request: ${path}`);
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
  it('requires all four minimal signup fields and does not send invalid data', async () => {
    const fixture = await setup(PreCadastroPage);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('input')).toHaveLength(4);
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    submit(root);
    await fixture.whenStable();
    expect(request).not.toHaveBeenCalled();
    expect(root.textContent).toContain('Preencha este campo');
  });
  it('sends only the four signup fields to the API and clears the password', async () => {
    request.mockResolvedValue(undefined);
    const fixture = await setup(PreCadastroPage);
    const root: HTMLElement = fixture.nativeElement;
    input(root, 'nome', 'Cliente'); input(root, 'email', 'c@example.test');
    input(root, 'telefone', '5511999999999'); input(root, 'senha', 'senha-de-teste');
    await fixture.whenStable();
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
    submit(root);
    await fixture.whenStable();
    expect(request).toHaveBeenCalledWith('POST', '/auth/pre-cadastro', {
      nome: 'Cliente', email: 'c@example.test', telefone: '5511999999999', senha: 'senha-de-teste'
    });
    expect(root.querySelector<HTMLInputElement>('input[type="password"]')?.value).toBe('');
    expect(root.textContent).toContain('Conta criada');
  });
  it('toggles signup password visibility without submitting or changing its value', async () => {
    const fixture = await setup(PreCadastroPage);
    const root: HTMLElement = fixture.nativeElement;
    input(root, 'senha', 'senha-de-teste');
    const toggle = root.querySelector<HTMLButtonElement>('button[aria-label="Mostrar senha"]');
    if (!toggle) throw new Error('Password toggle not found');
    toggle.click();
    await fixture.whenStable();
    expect(root.querySelector<HTMLInputElement>('#senha')?.type).toBe('text');
    expect(root.querySelector<HTMLInputElement>('#senha')?.value).toBe('senha-de-teste');
    toggle.click();
    await fixture.whenStable();
    expect(root.querySelector<HTMLInputElement>('#senha')?.type).toBe('password');
    expect(request).not.toHaveBeenCalled();
  });
  it('does not show success or clear input when signup API fails', async () => {
    request.mockRejectedValue(new Error('Cadastro indisponível'));
    const fixture = await setup(PreCadastroPage);
    const root: HTMLElement = fixture.nativeElement;
    input(root, 'nome', 'Cliente'); input(root, 'email', 'c@example.test');
    input(root, 'telefone', '5511999999999'); input(root, 'senha', 'senha-de-teste');
    submit(root); await fixture.whenStable();
    expect(root.textContent).toContain('Cadastro indisponível');
    expect(root.textContent).not.toContain('Conta criada');
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
    request.mockImplementation(async (_method, path) => {
      if (path === '/agendamentos/a') return { ...booking, status: 'Concluido', metodoPagamento: 'PIX' };
      if (path === '/clientes') return [];
      if (path === '/servicos') return [service];
      throw new Error(`Unexpected request: ${path}`);
    });
    const fixture = await setup(AgendamentoDetailPageComponent);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('form')).toBeNull();
    expect(root.textContent).toContain('não podem ser alterados');
  });
  it('sends a payment method when completing an appointment', async () => {
    const fixture = await setup(AgendamentoDetailPageComponent);
    request.mockResolvedValue({ ...booking, status: 'Concluido', metodoPagamento: 'PIX' });
    submit(fixture.nativeElement);
    await fixture.whenStable();
    expect(request).toHaveBeenCalledWith('POST', '/agendamentos/a/concluir', {
      metodoPagamento: 'PIX', anotacoesFinais: '', fotoResultadoUrl: undefined
    });
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it('requires acids to be specified when the facial response is affirmative', async () => {
    const fixture = await setup(AnamneseFacialPageComponent);
    const root: HTMLElement = fixture.nativeElement;
    const checkbox = root.querySelector<HTMLInputElement>('#acidos');
    if (!checkbox) throw new Error('Checkbox not found');
    checkbox.click(); await fixture.whenStable();
    request.mockClear();
    submit(root); await fixture.whenStable();
    expect(root.textContent).toContain('Informe quais ácidos');
    expect(request).not.toHaveBeenCalled();
  });
  it('does not allow overwriting a facial record after failing to load it', async () => {
    request.mockImplementation(async (_method, path) => {
      if (path === '/agendamentos/a') return booking;
      if (path === '/servicos/s') return service;
      throw new Error('Ficha indisponível');
    });
    const fixture = await setup(AnamneseFacialPageComponent);
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
    await expect(api.upload('a', new File(['x'], 'file.txt', { type: 'text/plain' }))).rejects.toThrow('5 MB');
    await expect(api.upload('a', new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'foto.png', { type: 'image/png' }))).rejects.toThrow('5 MB');
    expect(request).not.toHaveBeenCalled();
  });
  it('uploads multipart and stores only the returned HTTPS URL', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: ApiClient, useValue: { request } }] });
    const file = new File(['image'], 'foto.png', { type: 'image/png' });
    request.mockResolvedValue({ url: 'https://storage.example.test/foto.png' });
    await expect(TestBed.inject(AgendamentosService).upload('a', file)).resolves.toBe('https://storage.example.test/foto.png');
    const body = request.mock.calls[0][2];
    expect(body).toBeInstanceOf(FormData);
    if (!(body instanceof FormData)) throw new Error('Expected multipart');
    expect(body.get('foto')).toBe(file);
  });
});
