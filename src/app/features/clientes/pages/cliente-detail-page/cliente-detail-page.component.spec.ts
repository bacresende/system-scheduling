import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { afterEach, vi } from 'vitest';
import { ApiClient } from '../../../../core/api/api-client';
import { ClienteProntuario } from '../../models/cliente-prontuario.model';
import { ClienteDetailPageComponent } from './cliente-detail-page.component';
import { fichaCorporal } from '../../../anamnese/testing/anamnese.fixture';

describe('ClienteDetailPageComponent', () => {
  const request = vi.fn<(method: string, path: string, body?: unknown) => Promise<unknown>>();
  const prontuario: ClienteProntuario = {
    cliente: {
      id: 'cliente-1',
      nome: 'Ana Silva',
      email: 'ana@example.test',
      telefone: '61999999999',
      cpf: '12345678901',
      nasc: '1990-04-20',
      cadastroCompleto: true,
      perfil: 'CLIENTE',
      endereco: {
        cep: '70000000',
        logradouro: 'Rua das Flores',
        numeroResidencia: '10',
        bairro: 'Centro',
        cidade: 'Brasília',
        estado: 'DF',
        pais: 'Brasil',
      },
    },
    anamnesesAvulsas: [
      {
          idCliente: 'cliente-1',
          dataPreenchimento: '2026-10-10T09:00:00-03:00',
          ...fichaCorporal,
          id: 'corporal-1',
          declaracao: { informacoesVerdadeiras: true, texto: 'Informações verdadeiras', aceitaEm: '2026-10-10T12:00:00Z', idUsuario: 'cliente-1' },
        },
    ],
    agendamentos: [
      {
        id: 'atendimento-antigo',
        idCliente: 'cliente-1',
        idServico: 'servico-1',
        idFuncionario: 'profissional-1',
        dataHora: '2026-09-10T10:00:00-03:00',
        status: 'Concluido',
        duracaoMinutos: 60,
        valor: 100,
        nomeServico: 'Limpeza de pele',
        fotoResultadoUrl: 'https://storage.example.test/antiga.jpg',
      },
      {
        id: 'atendimento-recente',
        idCliente: 'cliente-1',
        idServico: 'servico-1',
        idFuncionario: 'profissional-1',
        dataHora: '2026-10-10T10:00:00-03:00',
        status: 'Concluido',
        duracaoMinutos: 60,
        valor: 120,
        metodoPagamento: 'PIX',
        nomeServico: 'Limpeza de pele',
        fotosResultadoUrls: [
          'https://storage.example.test/recente-1.jpg',
          'https://storage.example.test/recente-2.jpg',
        ],

      },
    ],
  };

  beforeEach(async () => {
    request.mockReset();
    request.mockResolvedValue(prontuario);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );

    await TestBed.configureTestingModule({
      imports: [ClienteDetailPageComponent],
      providers: [
        { provide: ApiClient, useValue: { configured: true, request } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'cliente-1' }) } },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the complete client record and presents appointments and photos', async () => {
    const fixture = TestBed.createComponent(ClienteDetailPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(request).toHaveBeenCalledWith('POST', '/getClienteProntuario', { id: 'cliente-1' });
    expect(root.textContent).toContain('Ana Silva');
    expect(root.textContent).toContain('Rua das Flores, 10');
    expect(root.textContent).toContain('Limpeza de pele');
    expect(root.textContent).toContain('Avaliação corporal');
    expect(root.querySelectorAll('img')).toHaveLength(3);
    expect(root.textContent).toContain('3 fotos');
    expect(root.querySelectorAll('[role="tab"]')).toHaveLength(4);
    const anamnese = root.querySelector<HTMLDetailsElement>('ol[aria-label="Anamneses da mais recente para a mais antiga"] > li > details');
    expect(anamnese?.open).toBe(true);
    expect(anamnese?.querySelector('summary')?.textContent).toContain('Anamnese corporal');
    expect(anamnese?.querySelector('summary')?.textContent).not.toContain('Mais recente');
    expect(root.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe(
      'Seções do prontuário da cliente',
    );
    const photoVisits = root.querySelectorAll(
      'ol[aria-label="Fotos dos atendimentos em ordem cronológica"] > li',
    );
    expect(photoVisits).toHaveLength(2);
    expect(photoVisits[0].querySelectorAll('img')).toHaveLength(2);
    expect(photoVisits[0].querySelector('a[href="/agendamentos?data=2026-10-10"]')?.textContent).toContain(
      'Ir para o dia na agenda',
    );
    expect(photoVisits[1].querySelectorAll('img')).toHaveLength(1);
    expect(root.querySelectorAll('a[href="/agendamentos?data=2026-10-10"]')).toHaveLength(2);
  });

  it('ordena as fichas por data e destaca apenas a mais recente sem alterar os dados recebidos', async () => {
    const original = prontuario.anamnesesAvulsas[0];
    const anamnesesAvulsas = [
      original,
      { ...original, id: 'recente', dataPreenchimento: '2026-11-04T12:00:00Z' },
      { ...original, id: 'intermediaria', dataPreenchimento: '2026-10-20T12:00:00Z' },
    ];
    request.mockResolvedValue({ ...prontuario, anamnesesAvulsas });
    const fixture = TestBed.createComponent(ClienteDetailPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    const cards = Array.from(root.querySelectorAll<HTMLDetailsElement>(
      'ol[aria-label="Anamneses da mais recente para a mais antiga"] > li > details',
    ));
    const titles = cards.map(card => card.querySelector('summary')!);
    expect(cards).toHaveLength(3);
    expect(titles[0].textContent).toContain('04/11/2026');
    expect(titles[1].textContent).toContain('20/10/2026');
    expect(titles[2].textContent).toContain('10/10/2026');
    expect(titles[0].textContent).toContain('Mais recente');
    expect(titles.slice(1).every(title => !title.textContent?.includes('Mais recente'))).toBe(true);
    expect(cards.every(card => !card.open)).toBe(true);
    titles[0].click();
    expect(cards[0].open).toBe(true);
    expect(cards[0].querySelector('app-anamnese-respostas')).not.toBeNull();
    expect(anamnesesAvulsas.map(item => item.id)).toEqual(['corporal-1', 'recente', 'intermediaria']);
  });

  it('displays API errors instead of showing an empty client record', async () => {
    request.mockRejectedValue(new Error('Prontuário indisponível.'));
    const fixture = TestBed.createComponent(ClienteDetailPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Prontuário indisponível.');
    expect(root.textContent).not.toContain('Nenhum agendamento foi registrado');
  });

  it('mostra todos os blocos da ficha corporal sem discriminador de versão', async () => {
    request.mockResolvedValue({ ...prontuario, anamnesesAvulsas: [
      { ...fichaCorporal, id: 'corporal-1', idCliente: 'cliente-1', dataPreenchimento: '2026-11-01T12:00:00Z',
        declaracao: { informacoesVerdadeiras: true, texto: 'Informações verdadeiras', aceitaEm: '2026-11-01T12:00:00Z', idUsuario: 'cliente-1' } },
    ] });
    const fixture = TestBed.createComponent(ClienteDetailPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Avaliação corporal');
    expect(root.textContent).toContain('Histórico de saúde');
    expect(root.textContent).toContain('Caminhada');
    expect(root.textContent).toContain('Prefiro não informar');
    expect(root.textContent).not.toContain('Saúde feminina');
    expect(root.textContent).not.toContain('Saúde masculina');
    expect(root.textContent).toContain('Informações verdadeiras');
    expect(root.textContent).not.toContain('[object Object]');
  });
});
