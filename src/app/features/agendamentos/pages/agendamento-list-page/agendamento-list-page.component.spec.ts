import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { vi } from 'vitest';
import { AgendamentoListPageComponent } from './agendamento-list-page.component';
import { AgendamentosService } from '../../services/agendamentos.service';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { ServicosService } from '../../../servicos/services/servicos.service';
import { CuponsService } from '../../../cupons/services/cupons.service';
import { Agendamento } from '../../models/agendamento.model';

type Page = {
  state: AgendamentoListPageComponent['state'];
  config: AgendamentoListPageComponent['config'];
  bookings: AgendamentoListPageComponent['bookings'];
  form: AgendamentoListPageComponent['form'];
  selectedBooking: AgendamentoListPageComponent['selectedBooking'];
  photos: AgendamentoListPageComponent['photos'];
  save(): void;
  loadAll(): void;
  refresh(): void;
  abrirDetalhes(booking: Agendamento): void;
  concluirAtendimento(): void;
};

describe('Agenda administrativa: falhas, pacotes e fotos', () => {
  const api = {
    config: vi.fn(), list: vi.fn(), listarHorariosDisponiveis: vi.fn(),
    createPackage: vi.fn(), uploadMany: vi.fn(), complete: vi.fn(),
  };
  const cliente = { id: 'c', nome: 'Cliente', telefone: '11999999999' };
  const servico = { id: 's', nome: 'Serviço', ativo: true, preco: 100, duracaoMinutos: 30 };
  const booking: Agendamento = {
    id: 'a', idCliente: 'c', idServico: 's', idFuncionario: 'f',
    dataHora: new Date(2026, 10, 9, 10), status: 'Confirmado', duracaoMinutos: 30, valor: 100,
  };
  const users = { listByProfile: vi.fn() };

  beforeEach(() => {
    Object.values(api).forEach(mock => mock.mockReset());
    users.listByProfile.mockReset().mockResolvedValue([cliente]);
    api.config.mockResolvedValue({
      fusoHorario: Intl.DateTimeFormat().resolvedOptions().timeZone,
      funcionarios: [{ id: 'f', nome: 'Profissional' }],
      expediente: [{ diaSemana: 1, inicio: '08:00', fim: '19:00' }],
    });
    api.list.mockResolvedValue([]);
    api.listarHorariosDisponiveis.mockResolvedValue([]);
    api.createPackage.mockResolvedValue([booking]);
    api.uploadMany.mockResolvedValue(['https://files.example/foto.png']);
    api.complete.mockResolvedValue({ ...booking, status: 'Concluido' });
    TestBed.configureTestingModule({
      imports: [AgendamentoListPageComponent],
      providers: [
        { provide: AgendamentosService, useValue: api },
        { provide: UsuariosService, useValue: users },
        { provide: ServicosService, useValue: { list: () => Promise.resolve([servico]) } },
        { provide: CuponsService, useValue: { list: () => Promise.resolve([]) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    }).overrideComponent(AgendamentoListPageComponent, { set: { template: '' } });
  });

  async function setup() {
    const fixture = TestBed.createComponent(AgendamentoListPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, page: fixture.componentInstance as unknown as Page };
  }

  it('exibe falha da configuração e não presume expediente/profissionais', async () => {
    api.config.mockRejectedValue(new Error('Configuração indisponível'));
    const { page } = await setup();
    expect(page.config()).toBeNull();
    expect(page.state.error()).toContain('Configuração indisponível');
    expect(api.list).not.toHaveBeenCalled();
  });

  it('não oculta falhas de clientes e limpa reservas anteriores se a listagem falhar', async () => {
    const { page, fixture } = await setup();
    page.bookings.set([booking]);
    api.list.mockRejectedValueOnce(new Error('Agenda indisponível'));
    page.refresh();
    await fixture.whenStable();
    expect(page.bookings()).toEqual([]);
    expect(page.state.error()).toContain('Agenda indisponível');
    users.listByProfile.mockRejectedValueOnce(new Error('Clientes indisponíveis'));
    page.loadAll();
    await fixture.whenStable();
    expect(page.config()).toBeNull();
    expect(page.state.error()).toContain('Clientes indisponíveis');
  });

  it('envia o pacote inteiro e repete a mesma chave após perder a resposta, sem revalidar como novo', async () => {
    const { page, fixture } = await setup();
    page.form.patchValue({ idCliente: 'c', idServico: 's', idFuncionario: 'f', dataHora: new Date(2026, 10, 9, 10), totalSessoes: 3 });
    await fixture.whenStable();
    api.createPackage.mockRejectedValueOnce(new Error('Resposta perdida'));
    page.save();
    await fixture.whenStable();
    expect(page.state.error()).toContain('Resposta perdida');
    const first = api.createPackage.mock.calls[0][0];
    expect(first.sessoes).toHaveLength(3);
    expect(first.sessoes[1].dataDefinida).toBe(false);
    // Agora a listagem encontra o pacote já salvo no servidor: a repetição precisa
    // chegar ao endpoint idempotente sem ser bloqueada como sobreposição local.
    api.list.mockResolvedValue([booking]);
    api.list.mockClear();
    page.save();
    await fixture.whenStable();
    expect(api.createPackage).toHaveBeenCalledTimes(2);
    expect(api.createPackage.mock.calls[1][0]).toEqual(first);
    expect(api.list).toHaveBeenCalledTimes(1); // atualização após sucesso
    expect(page.state.success()).toContain('criado');
  });

  it('retém as URLs já vinculadas e não reenvia fotos se a conclusão falhar', async () => {
    const { page, fixture } = await setup();
    page.bookings.set([booking]);
    page.abrirDetalhes(booking);
    page.photos.set([{ id: 'foto', file: new File(['foto'], 'foto.png', { type: 'image/png' }), previewUrl: null }]);
    api.complete.mockRejectedValueOnce(new Error('Conclusão indisponível'));
    page.concluirAtendimento();
    await fixture.whenStable();
    expect(page.state.error()).toContain('Conclusão indisponível');
    expect(page.selectedBooking()?.fotosResultadoUrls).toEqual(['https://files.example/foto.png']);
    expect(page.photos()).toEqual([]);
    page.concluirAtendimento();
    await fixture.whenStable();
    expect(api.uploadMany).toHaveBeenCalledTimes(1);
    expect(api.complete.mock.calls[1][1].fotosResultadoUrls).toEqual(['https://files.example/foto.png']);
  });

  it('impede conclusão de uma sessão em aberto antes de chamar a API', async () => {
    const { page, fixture } = await setup();
    page.abrirDetalhes({ ...booking, dataDefinida: false });
    page.concluirAtendimento();
    await fixture.whenStable();
    expect(api.complete).not.toHaveBeenCalled();
  });
});
