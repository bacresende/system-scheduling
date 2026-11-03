import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { vi } from 'vitest';
import { ApiClient } from '../../../../core/api/api-client';
import { ClienteProntuario } from '../../models/cliente-prontuario.model';
import { ClienteDetailPageComponent } from './cliente-detail-page.component';

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
    anamnesesAvulsas: [],
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
        anamnese: null,
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
        anamnese: {
          idCliente: 'cliente-1',
          idServico: 'servico-1',
          idAgendamento: 'atendimento-recente',
          dataPreenchimento: '2026-10-10T09:00:00-03:00',
          tipoPele: 'Mista',
          usaAcidos: true,
          quaisAcidos: 'Ácido glicólico',
          sensibilidadeSol: false,
          temVarizes: false,
          fezCirurgiaRecente: false,
          praticaAtividadeFisica: true,
          alergiaCosmeticos: false,
        },
      },
    ],
  };

  beforeEach(async () => {
    request.mockReset();
    request.mockResolvedValue(prontuario);

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
    expect(root.textContent).toContain('Ácido glicólico');
    expect(root.querySelectorAll('img')).toHaveLength(3);
    expect(root.textContent).toContain('3 fotos');
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
});
