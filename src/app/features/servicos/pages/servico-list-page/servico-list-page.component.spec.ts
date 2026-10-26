import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ApiClient } from '../../../../core/api/api-client';
import { Servico } from '../../models/servico.model';
import { ServicoListPageComponent } from './servico-list-page.component';

describe('ServicoListPageComponent', () => {
  const request = vi.fn<(method: string, path: string, body?: unknown) => Promise<unknown>>();
  const initialService: Servico = {
    id: 'srv-1',
    nome: 'Drenagem Linfática',
    descricao: 'Procedimento corporal',
    preco: 150,
    duracaoMinutos: 60,
    ativo: true,
    diasParaRetorno: 15,
    sessoesDisponiveis: [1, 4],
  };

  beforeEach(async () => {
    request.mockReset();
    request.mockImplementation((_method, path) => {
      if (path === '/listServicos') return Promise.resolve([initialService]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    await TestBed.configureTestingModule({
      imports: [ServicoListPageComponent],
      providers: [{ provide: ApiClient, useValue: { configured: true, request } }],
    }).compileComponents();
  });

  it('exibe as tags de sessões disponíveis nos cards da listagem', async () => {
    const fixture = TestBed.createComponent(ServicoListPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('1 sessão');
    expect(root.textContent).toContain('4 sessões');
  });

  it('permite adicionar e remover opções de sessões ordenadas sem duplicidade e salvar o serviço', async () => {
    const fixture = TestBed.createComponent(ServicoListPageComponent);
    const component = fixture.componentInstance as unknown as {
      form: ServicoListPageComponent['form'];
      novaSessaoControl: ServicoListPageComponent['novaSessaoControl'];
      addSessao(): void;
      removeSessao(sessao: number): void;
      save(): void;
    };

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.controls.sessoesDisponiveis.value).toEqual([1]);

    component.novaSessaoControl.setValue(4);
    component.addSessao();
    component.novaSessaoControl.setValue(4);
    component.addSessao();
    component.novaSessaoControl.setValue(2);
    component.addSessao();

    expect(component.form.controls.sessoesDisponiveis.value).toEqual([1, 2, 4]);

    component.removeSessao(2);
    expect(component.form.controls.sessoesDisponiveis.value).toEqual([1, 4]);

    component.form.patchValue({
      nome: 'Limpeza Facial',
      descricao: 'Com extração',
      preco: 120,
      duracaoMinutos: 50,
    });

    request.mockImplementation((_method, path, body) => {
      if (path === '/createServico') {
        return Promise.resolve({ id: 'srv-2', ...(body as object) });
      }
      return Promise.resolve([]);
    });

    component.save();
    await fixture.whenStable();

    expect(request).toHaveBeenCalledWith('POST', '/createServico', {
      nome: 'Limpeza Facial',
      descricao: 'Com extração',
      preco: 120,
      duracaoMinutos: 50,
      ativo: true,
      diasParaRetorno: null,
      sessoesDisponiveis: [1, 4],
    });
  });

  it('impede salvar quando todas as opções de sessões são removidas', async () => {
    const fixture = TestBed.createComponent(ServicoListPageComponent);
    const component = fixture.componentInstance as unknown as {
      form: ServicoListPageComponent['form'];
      removeSessao(sessao: number): void;
      save(): void;
    };

    fixture.detectChanges();
    await fixture.whenStable();
    request.mockClear();

    component.form.patchValue({
      nome: 'Peeling',
      preco: 200,
      duracaoMinutos: 45,
    });
    component.removeSessao(1);

    component.save();
    await fixture.whenStable();

    expect(component.form.controls.sessoesDisponiveis.invalid).toBe(true);
    expect(request).not.toHaveBeenCalled();
  });

  it('permite confirmar a exclusão de um serviço e removê-lo da listagem', async () => {
    const fixture = TestBed.createComponent(ServicoListPageComponent);
    const component = fixture.componentInstance as unknown as {
      servicos: ServicoListPageComponent['servicos'];
      pendingDelete: ServicoListPageComponent['pendingDelete'];
      requestDelete(item: Servico): void;
      confirmDelete(): void;
    };

    fixture.detectChanges();
    await fixture.whenStable();

    request.mockImplementation((_method, path) => {
      if (path === '/deleteServico') return Promise.resolve({ id: initialService.id });
      return Promise.resolve([]);
    });

    component.requestDelete(initialService);
    expect(component.pendingDelete()?.id).toBe('srv-1');

    component.confirmDelete();
    await fixture.whenStable();

    expect(request).toHaveBeenCalledWith('POST', '/deleteServico', { id: 'srv-1' });
    expect(component.servicos()).toEqual([]);
    expect(component.pendingDelete()).toBeNull();
  });
});

