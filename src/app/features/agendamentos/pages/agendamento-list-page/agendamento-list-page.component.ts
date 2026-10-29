import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { errorMessage } from '../../../../core/api/api-client';
import { TelefonePipe } from '../../../../shared/pipes/telefone.pipe';
import { FieldError } from '../../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';
import { localDay } from '../../../../shared/utils/date';
import { Cupom } from '../../../cupons/models/cupom.model';
import { CuponsService } from '../../../cupons/services/cupons.service';
import { Servico } from '../../../servicos/models/servico.model';
import { ServicosService } from '../../../servicos/services/servicos.service';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import {
  Agendamento,
  ConfiguracaoAgenda,
  MetodoPagamento,
  NovoAgendamento,
  SessaoAgendamentoInput,
  StatusAgendamento,
} from '../../models/agendamento.model';
import {
  availableSlotsForDay,
  calculateBookingPricing,
  endTime,
  HorarioDisponivelSlot,
  suggestPackageDates,
  validateCupomForBooking,
  validateSlot,
  whatsappLink,
} from '../../services/agenda-rules';
import { AgendamentosService, DEFAULT_AGENDA_CONFIG } from '../../services/agendamentos.service';

export type FiltroStatusAgenda = 'TODOS' | 'AGUARDANDO' | 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO';

export type PainelDetalheAgendamento = 'nenhum' | 'concluir' | 'reagendar' | 'cancelar';
export type ModoRepeticaoPacote = 'definir_depois' | 'manual' | '1x_semana' | '2x_semana';

export interface FotoPreviewItem {
  id: string;
  file: File;
  previewUrl: string | null;
}

const DIAS_SEMANA_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];
const DIAS_SEMANA_LONGOS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

@Component({
  selector: 'app-agendamento-list-page',
  imports: [
    DatePipe,
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    TextareaModule,
    ToggleSwitchModule,
    TelefonePipe,
    FieldError,
    RequestFeedback,
  ],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agendamento-list-page.component.html',
  styleUrl: './agendamento-list-page.component.css',
})
export class AgendamentoListPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(AgendamentosService);
  private readonly usuariosApi = inject(UsuariosService);
  private readonly servicesApi = inject(ServicosService);
  private readonly cuponsApi = inject(CuponsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly novoDialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('novoAgendamentoDialog');
  private readonly detalhesDialogRef = viewChild<ElementRef<HTMLDialogElement>>(
    'detalhesAgendamentoDialog',
  );
  private readonly imagemPreviewDialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('imagemPreviewDialog');

  protected readonly config = signal<ConfiguracaoAgenda | null>(null);
  protected readonly clientes = signal<Usuario[]>([]);
  protected readonly servicos = signal<Servico[]>([]);
  protected readonly cupons = signal<Cupom[]>([]);
  protected readonly bookings = signal<Agendamento[]>([]);
  protected readonly loadCycle = signal(0);
  protected readonly modalAberto = signal(false);

  protected readonly selectedDay = signal(new Date());
  protected readonly isSelectedDayToday = computed(
    () => localDay(this.selectedDay()) === localDay(new Date()),
  );
  protected readonly mode = signal<'dia' | 'semana'>('dia');
  protected readonly statusFilter = signal<FiltroStatusAgenda>('TODOS');
  protected readonly searchTerm = signal('');
  protected readonly mobileWeekDayIndex = signal<number | null>(null);

  protected readonly filter = this.fb.nonNullable.group({
    data: [new Date()],
    modo: ['dia' as 'dia' | 'semana'],
  });

  protected readonly modos = [
    { label: 'Diária', value: 'dia' as const },
    { label: 'Semanal', value: 'semana' as const },
  ];

  protected readonly tiposDescontoManual = [
    { label: 'Valor fixo (R$)', value: 'VALOR_FIXO' as const },
    { label: 'Porcentagem (%)', value: 'PORCENTAGEM' as const },
  ];

  protected readonly opcoesRepeticaoPacote: { label: string; value: ModoRepeticaoPacote }[] = [
    { label: 'Deixar todas em aberto (definir depois)', value: 'definir_depois' },
    { label: 'Escolher datas manualmente', value: 'manual' },
    { label: 'Sugerir repetição 1x por semana', value: '1x_semana' },
    { label: 'Sugerir repetição 2x por semana', value: '2x_semana' },
  ];

  protected readonly modoRepeticaoPacote = signal<ModoRepeticaoPacote>('definir_depois');

  protected readonly metodosPagamento: { label: string; value: MetodoPagamento; icon: string }[] = [
    { label: 'PIX', value: 'PIX', icon: 'pi pi-qrcode' },
    { label: 'Cartão', value: 'Cartao', icon: 'pi pi-credit-card' },
    { label: 'Dinheiro', value: 'Dinheiro', icon: 'pi pi-wallet' },
  ];

  // --- Form Values Signals for Reactive Summary ---
  protected readonly formServicoId = signal('');
  protected readonly formClienteId = signal('');
  protected readonly formTotalSessoes = signal(1);
  protected readonly formDataHora = signal<Date | null>(null);
  protected readonly formCodigoCupom = signal<string | null>(null);
  protected readonly formUsarDescontoManual = signal(false);
  protected readonly formTipoDescontoManual = signal<'PORCENTAGEM' | 'VALOR_FIXO'>('VALOR_FIXO');
  protected readonly formValorDescontoManual = signal<number | null>(null);
  protected readonly sessoesExtras = signal<SessaoAgendamentoInput[]>([]);

  // --- Validações consultadas no backend ---
  /** Horários livres por dia vindos do backend (chave: dia|duração|agendamento ignorado). */
  private readonly slotsServidor = signal<Record<string, HorarioDisponivelSlot[]>>({});
  private readonly slotsServidorPendentes = new Set<string>();
  private seqAjustePrimeiraSessao = 0;
  private seqAjusteReagendamento = 0;

  /** Resultado da validação do cupom no backend (limites de uso global e por cliente). */
  private readonly validacaoCupomServidor = signal<{ chave: string; erro: string | null } | null>(
    null,
  );
  protected readonly validandoCupom = signal(false);
  private cupomTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly form = this.fb.group({
    idCliente: this.fb.nonNullable.control('', Validators.required),
    idServico: this.fb.nonNullable.control('', Validators.required),
    idFuncionario: this.fb.nonNullable.control('', Validators.required),
    totalSessoes: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    dataHora: this.fb.control<Date | null>(null, Validators.required),
    codigoCupom: this.fb.control<string | null>(null),
    usarDescontoManual: this.fb.nonNullable.control(false),
    tipoDescontoManual: this.fb.nonNullable.control<'PORCENTAGEM' | 'VALOR_FIXO'>('VALOR_FIXO'),
    valorDescontoManual: this.fb.control<number | null>(null, [Validators.min(0)]),
  });

  // --- Details / Complete / Reschedule Modal State ---
  protected readonly selectedBooking = signal<Agendamento | null>(null);
  protected readonly detalhePainelAtivo = signal<PainelDetalheAgendamento>('nenhum');
  protected readonly photos = signal<FotoPreviewItem[]>([]);
  protected readonly imagemExpandida = signal<{ url: string; titulo: string } | null>(null);
  protected readonly reagendarDataHoraSignal = signal<Date | null>(null);

  protected readonly concluirForm = this.fb.nonNullable.group({
    metodoPagamento: ['PIX' as MetodoPagamento, Validators.required],
    anotacoesFinais: [''],
  });

  protected readonly reagendarForm = this.fb.group({
    novaDataHora: this.fb.control<Date | null>(null, Validators.required),
    idFuncionario: this.fb.nonNullable.control('', Validators.required),
  });

  protected readonly endTime = endTime;

  // --- Computed Agenda Views ---
  protected readonly scheduledBookings = computed(() =>
    this.bookings().filter((item) => item.dataDefinida !== false),
  );

  protected readonly openSessionBookings = computed(() =>
    this.bookings().filter((item) => item.dataDefinida === false && item.status !== 'Cancelado'),
  );

  protected readonly pendingAttentionBookings = computed(() =>
    this.bookings().filter(
      (item) =>
        item.status !== 'Cancelado' &&
        item.status !== 'Concluido' &&
        (item.status === 'AguardandoConfirmacao' ||
          (item.reagendado && item.reagendadoPor === 'CLIENTE' && !item.alteracaoVistaPeloAdmin)),
    ),
  );

  protected readonly overdueBookings = computed(() =>
    this.bookings()
      .filter((item) => this.isBookingOverdue(item))
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()),
  );

  protected readonly searchResultsAllDates = computed(() => {
    const term = this.searchTerm().trim();
    if (!term) return [];
    return this.bookings()
      .filter((item) => this.matchesSearchTerm(item, term))
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
  });

  protected readonly periodBookings = computed(() => {
    const dayKeys = new Set(this.rawDays().map((d) => localDay(d)));
    return this.scheduledBookings().filter((item) =>
      dayKeys.has(localDay(new Date(item.dataHora))),
    );
  });

  protected readonly periodCounters = computed(() => {
    const all = this.periodBookings();
    return {
      total: all.length,
      aguardando: all.filter((b) => b.status === 'AguardandoConfirmacao').length,
      confirmados: all.filter((b) => b.status === 'Confirmado' || b.status === 'Pendente').length,
      concluidos: all.filter((b) => b.status === 'Concluido').length,
      cancelados: all.filter((b) => b.status === 'Cancelado').length,
    };
  });

  private readonly rawDays = computed(() => {
    const date = new Date(this.selectedDay());
    date.setHours(0, 0, 0, 0);
    if (this.mode() === 'semana') {
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    }
    return Array.from({ length: this.mode() === 'dia' ? 1 : 7 }, (_, index) => {
      const day = new Date(date);
      day.setDate(date.getDate() + index);
      return day;
    });
  });

  protected readonly days = computed(() => {
    const currentFilter = this.statusFilter();
    const currentSearch = this.searchTerm().trim();
    const todayKey = localDay(new Date());
    return this.rawDays().map((day) => {
      const dayKey = localDay(day);
      const allDayItems = this.scheduledBookings()
        .filter((item) => localDay(new Date(item.dataHora)) === dayKey)
        .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

      const filteredItems = allDayItems.filter(
        (item) =>
          this.matchesStatusFilter(item, currentFilter) &&
          (!currentSearch || this.matchesSearchTerm(item, currentSearch)),
      );

      return {
        date: day,
        dayKey,
        isToday: dayKey === todayKey,
        shortLabel: DIAS_SEMANA_CURTOS[day.getDay()],
        longLabel: DIAS_SEMANA_LONGOS[day.getDay()],
        expedienteLabel: this.expedienteDoDiaLabel(day),
        totalCount: allDayItems.length,
        items: filteredItems,
      };
    });
  });

  protected readonly visibleDays = computed(() => {
    const list = this.days();
    const mobileIdx = this.mobileWeekDayIndex();
    if (this.mode() === 'semana' && mobileIdx !== null && list[mobileIdx]) {
      return [list[mobileIdx]];
    }
    return list;
  });

  // --- Computed Form Helpers (Novo Agendamento) ---
  protected readonly servicoSelecionado = computed(
    () => this.servicos().find((s) => s.id === this.formServicoId()) ?? null,
  );

  protected readonly opcoesSessoesServico = computed(() => {
    const servico = this.servicoSelecionado();
    const lista = servico?.sessoesDisponiveis?.length ? servico.sessoesDisponiveis : [1];
    return Array.from(new Set(lista)).sort((a, b) => a - b);
  });

  protected readonly cuponsAtivos = computed(() => this.cupons().filter((c) => c.ativo));

  protected readonly cupomSelecionado = computed(() => {
    const codigo = this.formCodigoCupom();
    if (!codigo) return null;
    return this.cuponsAtivos().find((c) => c.codigo.toUpperCase() === codigo.toUpperCase()) ?? null;
  });

  protected readonly erroValidacaoCupom = computed(() => {
    if (this.formUsarDescontoManual()) return null;
    const cupom = this.cupomSelecionado();
    if (!cupom) return null;
    const erroLocal = validateCupomForBooking(
      cupom,
      this.formServicoId(),
      this.formTotalSessoes(),
      this.formDataHora(),
    );
    if (erroLocal) return erroLocal;
    // Limites de uso só o backend conhece: usa a resposta dele para a combinação atual
    const servidor = this.validacaoCupomServidor();
    return servidor && servidor.chave === this.chaveCupomAtual() ? servidor.erro : null;
  });

  /** Identifica a combinação do formulário que influencia a validação do cupom. */
  private readonly chaveCupomAtual = computed(() => {
    const codigo = this.formCodigoCupom();
    const idServico = this.formServicoId();
    if (this.formUsarDescontoManual() || !codigo || !idServico) return null;
    const data = this.formDataHora();
    return [
      codigo.toUpperCase(),
      idServico,
      this.formClienteId(),
      this.formTotalSessoes(),
      data ? localDay(data) : '',
    ].join('|');
  });

  protected readonly resumoFinanceiro = computed(() => {
    const servico = this.servicoSelecionado();
    const precoUnitario = servico?.preco ?? 0;
    const cupom = this.cupomSelecionado();
    const cupomValido = Boolean(cupom && !this.erroValidacaoCupom());
    return calculateBookingPricing(
      precoUnitario,
      this.formTotalSessoes(),
      this.formUsarDescontoManual(),
      cupom,
      cupomValido,
      this.formTipoDescontoManual(),
      this.formValorDescontoManual(),
    );
  });

  protected readonly validacaoPrimeiraSessao = computed(() => {
    const start = this.formDataHora();
    const servico = this.servicoSelecionado();
    const config = this.config();
    if (!start || !servico || !config) return null;
    return (
      validateSlot(start, servico.duracaoMinutos, config.expediente, this.bookings()) ??
      this.erroHorarioServidor(start, servico.duracaoMinutos)
    );
  });

  protected readonly horariosDisponiveisPrimeiraSessao = computed<HorarioDisponivelSlot[]>(() => {
    const start = this.formDataHora();
    const servico = this.servicoSelecionado();
    const config = this.config();
    if (!start || !servico || !config) return [];
    const extrasDatas = this.sessoesExtras()
      .filter((s) => !s.definirDepois && s.dataHora !== null)
      .map((s) => s.dataHora!);
    return this.slotsDoDia(start, servico.duracaoMinutos, extrasDatas);
  });

  protected readonly horariosManhaPrimeiraSessao = computed(() =>
    this.horariosDisponiveisPrimeiraSessao().filter((s) => s.date.getHours() < 12),
  );

  protected readonly horariosTardePrimeiraSessao = computed(() =>
    this.horariosDisponiveisPrimeiraSessao().filter((s) => s.date.getHours() >= 12),
  );

  protected readonly horariosDisponiveisReagendamento = computed<HorarioDisponivelSlot[]>(() => {
    const booking = this.selectedBooking();
    const novaData = this.reagendarDataHoraSignal();
    const config = this.config();
    if (!booking || !novaData || !config) return [];
    return this.slotsDoDia(novaData, booking.duracaoMinutos, [], booking.id);
  });

  protected readonly horariosManhaReagendamento = computed(() =>
    this.horariosDisponiveisReagendamento().filter((s) => s.date.getHours() < 12),
  );

  protected readonly horariosTardeReagendamento = computed(() =>
    this.horariosDisponiveisReagendamento().filter((s) => s.date.getHours() >= 12),
  );

  protected readonly resumoSessoesPacote = computed(() => {
    const total = this.formTotalSessoes();
    const primeiraDefinida = Boolean(this.formDataHora());
    const extras = this.sessoesExtras();
    const extrasDefinidas = extras.filter((s) => !s.definirDepois && s.dataHora !== null).length;
    const definidas = (primeiraDefinida ? 1 : 0) + extrasDefinidas;
    const emAberto = Math.max(0, total - definidas);
    return { total, definidas, emAberto };
  });

  protected readonly validacaoReagendamento = computed(() => {
    const booking = this.selectedBooking();
    const novaData = this.reagendarDataHoraSignal();
    const config = this.config();
    if (!booking || !novaData || !config) return null;
    return (
      validateSlot(
        novaData,
        booking.duracaoMinutos,
        config.expediente,
        this.bookings(),
        booking.id,
      ) ?? this.erroHorarioServidor(novaData, booking.duracaoMinutos, booking.id)
    );
  });

  protected readonly sessoesDoPacoteSelecionado = computed<Agendamento[]>(() => {
    const atual = this.selectedBooking();
    if (!atual) return [];
    const todas = this.bookings();

    if (atual.idPacote) {
      return todas
        .filter((b) => b.idPacote === atual.idPacote)
        .sort((a, b) => (a.sessaoNumero ?? 1) - (b.sessaoNumero ?? 1));
    }

    if ((atual.totalSessoes ?? 1) > 1) {
      return todas
        .filter(
          (b) =>
            b.idCliente === atual.idCliente &&
            b.idServico === atual.idServico &&
            b.totalSessoes === atual.totalSessoes,
        )
        .sort((a, b) => (a.sessaoNumero ?? 1) - (b.sessaoNumero ?? 1));
    }

    return [];
  });

  protected readonly progressoPacoteSelecionado = computed(() => {
    const sessoes = this.sessoesDoPacoteSelecionado();
    const total = sessoes.length || (this.selectedBooking()?.totalSessoes ?? 1);
    const concluidas = sessoes.filter((s) => s.status === 'Concluido').length;
    const emAberto = sessoes.filter(
      (s) => s.dataDefinida === false && s.status !== 'Cancelado',
    ).length;
    return { total, concluidas, emAberto };
  });

  constructor() {
    this.form.controls.idServico.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((idServico) => {
        this.formServicoId.set(idServico);
        const servico = this.servicos().find((s) => s.id === idServico);
        const opcoes = servico?.sessoesDisponiveis?.length
          ? Array.from(new Set(servico.sessoesDisponiveis)).sort((a, b) => a - b)
          : [1];
        const primeiraOpcao = opcoes[0] ?? 1;
        this.form.controls.totalSessoes.setValue(primeiraOpcao);
        const dataAtual = this.form.controls.dataHora.value;
        if (dataAtual && servico) {
          void this.ajustarParaHorarioValidoPrimeiraSessao(dataAtual);
        }
      });

    this.form.controls.idCliente.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => this.formClienteId.set(id));

    this.form.controls.totalSessoes.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((total) => {
        const qtd = Math.max(1, Number(total) || 1);
        this.formTotalSessoes.set(qtd);
        this.sincronizarSessoesExtras(qtd);
      });

    this.form.controls.dataHora.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dt) => this.formDataHora.set(dt));

    this.form.controls.codigoCupom.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cod) => this.formCodigoCupom.set(cod));

    this.form.controls.usarDescontoManual.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((manual) => {
        this.formUsarDescontoManual.set(manual);
        if (manual) {
          this.form.controls.codigoCupom.setValue(null, { emitEvent: false });
          this.formCodigoCupom.set(null);
        } else {
          this.form.controls.valorDescontoManual.setValue(null, { emitEvent: false });
          this.formValorDescontoManual.set(null);
        }
      });

    this.form.controls.tipoDescontoManual.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tipo) => this.formTipoDescontoManual.set(tipo));

    this.form.controls.valorDescontoManual.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.formValorDescontoManual.set(val));

    this.reagendarForm.controls.novaDataHora.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dt) => this.reagendarDataHoraSignal.set(dt));

    // Valida o cupom no backend (limites de uso) sempre que a combinação do formulário mudar
    effect(() => {
      const chave = this.chaveCupomAtual();
      untracked(() => this.agendarValidacaoCupomServidor(chave));
    });

    // Pré-carrega do backend os horários livres dos dias escolhidos no formulário
    effect(() => {
      const inicio = this.formDataHora();
      const servico = this.servicoSelecionado();
      const extras = this.sessoesExtras();
      if (!servico) return;
      untracked(() => {
        if (inicio) void this.carregarSlotsServidor(inicio, servico.duracaoMinutos);
        for (const sessao of extras) {
          if (!sessao.definirDepois && sessao.dataHora) {
            void this.carregarSlotsServidor(sessao.dataHora, servico.duracaoMinutos);
          }
        }
      });
    });

    effect(() => {
      const booking = this.selectedBooking();
      const novaData = this.reagendarDataHoraSignal();
      if (!booking || !novaData) return;
      untracked(
        () => void this.carregarSlotsServidor(novaData, booking.duracaoMinutos, booking.id),
      );
    });

    this.destroyRef.onDestroy(() => {
      if (this.cupomTimer) clearTimeout(this.cupomTimer);
    });
  }

  // --- Integração com as regras do backend ---
  private chaveSlots(dia: Date, duracao: number, ignorarId?: string): string {
    return `${localDay(dia)}|${duracao}|${ignorarId ?? ''}`;
  }

  /** Busca no backend os horários livres do dia (uma vez por dia/duração). */
  private async carregarSlotsServidor(
    dia: Date,
    duracao: number,
    ignorarId?: string,
  ): Promise<void> {
    if (!Number.isFinite(dia.getTime()) || duracao <= 0) return;
    const chave = this.chaveSlots(dia, duracao, ignorarId);
    if (chave in this.slotsServidor() || this.slotsServidorPendentes.has(chave)) return;
    this.slotsServidorPendentes.add(chave);
    try {
      const slots = await this.api.listarHorariosDisponiveis({
        dia,
        duracaoMinutos: duracao,
        ignoreBookingId: ignorarId,
      });
      this.slotsServidor.update((atual) => ({ ...atual, [chave]: slots }));
    } catch {
      // Sem resposta do backend: segue com a prévia local; o backend revalida ao salvar.
    } finally {
      this.slotsServidorPendentes.delete(chave);
    }
  }

  /**
   * Horários livres do dia: usa a resposta do backend quando disponível
   * (conhece todos os agendamentos) e a prévia local enquanto ela não chega.
   */
  private slotsDoDia(
    dia: Date,
    duracao: number,
    outrasDatas: Date[] = [],
    ignorarId?: string,
  ): HorarioDisponivelSlot[] {
    const config = this.config();
    if (!config) return [];
    const servidor = this.slotsServidor()[this.chaveSlots(dia, duracao, ignorarId)];
    if (!servidor) {
      return availableSlotsForDay(
        dia,
        duracao,
        config.expediente,
        this.bookings(),
        30,
        ignorarId,
        outrasDatas,
      );
    }
    // Remove os horários que conflitam com sessões ainda não salvas deste mesmo pacote
    return servidor.filter((slot) => {
      const fim = endTime(slot.date, duracao);
      return !outrasDatas.some((outra) => slot.date < endTime(outra, duracao) && fim > outra);
    });
  }

  /** Retorna erro quando o backend informou que o horário escolhido não está livre. */
  private erroHorarioServidor(inicio: Date, duracao: number, ignorarId?: string): string | null {
    const servidor = this.slotsServidor()[this.chaveSlots(inicio, duracao, ignorarId)];
    if (!servidor) return null;
    if (servidor.some((slot) => slot.date.getTime() === inicio.getTime())) return null;
    // Só afirma conflito quando o horário está na mesma grade de 30 min dos slots do backend
    const naGrade = servidor.some(
      (slot) => Math.abs(slot.date.getTime() - inicio.getTime()) % (30 * 60000) === 0,
    );
    return naGrade || servidor.length === 0
      ? 'Este horário já está ocupado por outro agendamento ou fora do expediente.'
      : null;
  }

  private agendarValidacaoCupomServidor(chave: string | null): void {
    if (this.cupomTimer) clearTimeout(this.cupomTimer);
    this.cupomTimer = null;
    if (!chave) {
      this.validandoCupom.set(false);
      return;
    }
    this.validandoCupom.set(true);
    this.cupomTimer = setTimeout(() => void this.validarCupomNoServidor(chave), 400);
  }

  /** Consulta o resumo financeiro no backend e devolve o erro do cupom (se houver). */
  private async validarCupomNoServidor(chave: string): Promise<string | null> {
    const value = this.form.getRawValue();
    try {
      const resultado = await this.api.calcularResumoFinanceiro({
        idServico: value.idServico,
        idCliente: value.idCliente || undefined,
        totalSessoes: Math.max(1, value.totalSessoes),
        codigoCupom: value.codigoCupom,
        usarDescontoManual: false,
        dataReferencia: value.dataHora,
      });
      const erro = resultado.erroCupom ?? null;
      this.validacaoCupomServidor.set({ chave, erro });
      return erro;
    } catch {
      // Falha de comunicação: o backend revalida o cupom ao criar o agendamento.
      return null;
    } finally {
      if (this.chaveCupomAtual() === chave) this.validandoCupom.set(false);
    }
  }

  ngOnInit(): void {
    this.loadAll();
  }

  protected loadAll(): void {
    this.loadCycle.update((c) => c + 1);
    void this.state.run(async () => {
      const [configResult, clientesResult, servicosResult, cuponsResult] = await Promise.allSettled(
        [
          this.api.config(),
          this.usuariosApi.listByProfile('CLIENTE'),
          this.servicesApi.list(),
          this.cuponsApi.list(),
        ],
      );

      const loadedConfig =
        configResult.status === 'fulfilled' ? configResult.value : DEFAULT_AGENDA_CONFIG;

      if (
        configResult.status === 'fulfilled' &&
        loadedConfig.fusoHorario &&
        loadedConfig.fusoHorario !== Intl.DateTimeFormat().resolvedOptions().timeZone
      ) {
        throw new Error(
          `Configure seu dispositivo no fuso da clínica (${loadedConfig.fusoHorario}) para operar a agenda.`,
        );
      }
      debugger;
      this.config.set(loadedConfig);
      if (clientesResult.status === 'fulfilled') {
        this.clientes.set(clientesResult.value);
      }
      if (servicosResult.status === 'fulfilled') {
        this.servicos.set(servicosResult.value.filter((item) => item.ativo));
      }
      if (cuponsResult.status === 'fulfilled') {
        this.cupons.set(cuponsResult.value);
      }

      if (!this.form.controls.idFuncionario.value && loadedConfig.funcionarios.length > 0) {
        this.form.controls.idFuncionario.setValue(loadedConfig.funcionarios[0].id);
      }

      await this.fetch();
    });
  }

  private async fetch(): Promise<void> {
    const raw = this.rawDays();
    const first = raw[0];
    const last = new Date(first);
    last.setDate(first.getDate() + raw.length);
    try {
      const remoteBookings = await this.api.list(first, last);
      this.bookings.set(remoteBookings);
    } catch {
      // Preserva agendamentos em memória caso o endpoint de listagem ainda não esteja disponível
    }
    // A agenda mudou: horários livres consultados antes podem estar desatualizados
    this.slotsServidor.set({});
  }

  // --- Toolbar Navigation & Filters ---
  protected refresh(): void {
    if (!this.config()) {
      this.state.error.set(
        'Não é possível consultar a agenda sem uma configuração válida da clínica.',
      );
      return;
    }
    if (this.filter.invalid || !this.filter.controls.data.value) {
      this.state.error.set('Selecione uma data para consultar a agenda.');
      return;
    }
    this.selectedDay.set(this.filter.controls.data.value);
    this.mode.set(this.filter.controls.modo.value);
    this.mobileWeekDayIndex.set(null);
    this.loadCycle.update((c) => c + 1);
    void this.state.run(() => this.fetch());
  }

  protected onDateSelected(date: Date | null): void {
    if (!date) return;
    this.filter.controls.data.setValue(date, { emitEvent: false });
    this.selectedDay.set(date);
    this.mobileWeekDayIndex.set(null);
    this.loadCycle.update((c) => c + 1);
    void this.state.run(() => this.fetch());
  }

  protected setMode(novoModo: 'dia' | 'semana'): void {
    if (this.mode() === novoModo) return;
    this.filter.controls.modo.setValue(novoModo, { emitEvent: false });
    this.mode.set(novoModo);
    this.mobileWeekDayIndex.set(null);
    this.loadCycle.update((c) => c + 1);
    void this.state.run(() => this.fetch());
  }

  protected navigatePeriod(direction: -1 | 1): void {
    const stepDays = this.mode() === 'dia' ? 1 : 7;
    const next = new Date(this.selectedDay());
    next.setDate(next.getDate() + direction * stepDays);
    this.onDateSelected(next);
  }

  protected goToToday(): void {
    this.onDateSelected(new Date());
  }

  protected jumpToBookingDate(booking: Agendamento): void {
    const target = new Date(booking.dataHora);
    if (Number.isFinite(target.getTime())) {
      this.onDateSelected(target);
    }
  }

  protected setStatusFilter(filtro: FiltroStatusAgenda): void {
    this.statusFilter.set(filtro);
  }

  protected toggleMobileWeekDay(index: number | null): void {
    this.mobileWeekDayIndex.update((current) => (current === index ? null : index));
  }

  // --- Display & Formatting Helpers ---
  protected serviceName(id: string): string {
    return this.servicos().find((item) => item.id === id)?.nome ?? id;
  }

  protected clientName(id: string): string {
    return this.clientes().find((item) => item.id === id)?.nome ?? id;
  }

  protected clientById(id: string): Usuario | undefined {
    return this.clientes().find((item) => item.id === id);
  }

  protected professionalName(id: string): string {
    return this.config()?.funcionarios.find((item) => item.id === id)?.nome ?? id;
  }

  protected expedienteDoDiaLabel(date: Date): string {
    const janela = this.config()?.expediente.find((e) => e.diaSemana === date.getDay());
    return janela ? `${janela.inicio} às ${janela.fim}` : 'Clínica fechada';
  }

  protected statusLabel(status: StatusAgendamento): string {
    switch (status) {
      case 'AguardandoConfirmacao':
        return 'Aguardando confirmação';
      case 'Confirmado':
        return 'Confirmado';
      case 'Pendente':
        return 'Confirmado';
      case 'Concluido':
        return 'Concluído';
      case 'Cancelado':
        return 'Cancelado';
    }
  }

  protected statusBadgeClass(status: StatusAgendamento): string {
    switch (status) {
      case 'AguardandoConfirmacao':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'Confirmado':
      case 'Pendente':
        return 'bg-estetica-secondary text-estetica-primary border border-estetica-primary/40';
      case 'Concluido':
        return 'bg-estetica-tertiary/25 text-estetica-text border border-estetica-tertiary/50';
      case 'Cancelado':
        return 'bg-neutral-100 text-estetica-text/60 border border-neutral-200';
    }
  }

  protected statusDotClass(status: StatusAgendamento): string {
    switch (status) {
      case 'AguardandoConfirmacao':
        return 'bg-amber-500';
      case 'Confirmado':
      case 'Pendente':
        return 'bg-estetica-primary';
      case 'Concluido':
        return 'bg-estetica-tertiary';
      case 'Cancelado':
        return 'bg-estetica-text/40';
    }
  }

  protected cardAccentClass(status: StatusAgendamento): string {
    switch (status) {
      case 'AguardandoConfirmacao':
        return 'bg-amber-400';
      case 'Confirmado':
      case 'Pendente':
        return 'bg-estetica-primary/80';
      case 'Concluido':
        return 'bg-estetica-tertiary';
      case 'Cancelado':
        return 'bg-neutral-300';
    }
  }

  protected isAtendimentoAtivo(status: StatusAgendamento): boolean {
    return status === 'AguardandoConfirmacao' || status === 'Confirmado' || status === 'Pendente';
  }

  protected isBookingOverdue(item: Agendamento): boolean {
    if (item.dataDefinida === false) return false;
    if (!this.isAtendimentoAtivo(item.status)) return false;
    const inicio = new Date(item.dataHora);
    if (!Number.isFinite(inicio.getTime())) return false;
    const fim = endTime(inicio, item.duracaoMinutos);
    return fim.getTime() < Date.now();
  }

  protected fotosDoAgendamento(item: Agendamento): string[] {
    if (item.fotosResultadoUrls?.length) {
      return item.fotosResultadoUrls;
    }
    if (item.fotoResultadoUrl) {
      return [item.fotoResultadoUrl];
    }
    return [];
  }

  protected matchesSearchTerm(item: Agendamento, rawTerm: string): boolean {
    const norm = (v: string) =>
      v
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const term = norm(rawTerm.trim());
    if (!term) return true;
    const cliente = norm(this.clientName(item.idCliente));
    const servico = norm(this.serviceName(item.idServico));
    const profissional = norm(this.professionalName(item.idFuncionario));
    return cliente.includes(term) || servico.includes(term) || profissional.includes(term);
  }

  protected whatsappReminderUrl(item: Agendamento): string | null {
    const client = this.clientById(item.idCliente);
    if (!client?.telefone || item.dataDefinida === false) return null;
    try {
      const dataFormatada = new Date(item.dataHora).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const sessaoInfo =
        item.totalSessoes && item.totalSessoes > 1
          ? ` (Sessão ${item.sessaoNumero ?? 1}/${item.totalSessoes})`
          : '';
      const msg =
        item.status === 'AguardandoConfirmacao'
          ? `Olá, ${client.nome}! Confirmamos seu agendamento de ${this.serviceName(item.idServico)}${sessaoInfo} para ${dataFormatada}.`
          : `Olá, ${client.nome}! Lembramos seu agendamento de ${this.serviceName(item.idServico)}${sessaoInfo} em ${dataFormatada}.`;
      return whatsappLink(client.telefone, msg);
    } catch {
      return null;
    }
  }

  private matchesStatusFilter(item: Agendamento, filtro: FiltroStatusAgenda): boolean {
    switch (filtro) {
      case 'TODOS':
        return true;
      case 'AGUARDANDO':
        return item.status === 'AguardandoConfirmacao';
      case 'CONFIRMADO':
        return item.status === 'Confirmado' || item.status === 'Pendente';
      case 'CONCLUIDO':
        return item.status === 'Concluido';
      case 'CANCELADO':
        return item.status === 'Cancelado';
    }
  }

  // --- Novo Agendamento Modal Logic ---
  protected abrirNovoAgendamento(dataPreSelecionada?: Date): void {
    this.limparFormularioNovo(dataPreSelecionada);
    const dialog = this.novoDialogRef()?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
      this.modalAberto.set(true);
    }
  }

  protected fecharNovoAgendamento(): void {
    if (this.state.busy()) return;
    this.fecharDialogNovoAgendamento();
  }

  /** Fecha o modal sem checar `busy` (usado dentro do próprio `state.run`). */
  private fecharDialogNovoAgendamento(): void {
    const dialog = this.novoDialogRef()?.nativeElement;
    if (dialog?.open) dialog.close();
    this.modalAberto.set(false);
  }

  protected handleNovoDialogCancel(event: Event): void {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.fecharNovoAgendamento();
  }

  protected handleNovoDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.fecharNovoAgendamento();
    }
  }

  protected handleDialogClose(): void {
    const novoOpen = this.novoDialogRef()?.nativeElement.open ?? false;
    const detOpen = this.detalhesDialogRef()?.nativeElement.open ?? false;
    this.modalAberto.set(novoOpen || detOpen);
  }

  protected selecionarQuantidadeSessoes(sessoes: number): void {
    this.form.controls.totalSessoes.setValue(sessoes);
  }

  private sincronizarSessoesExtras(totalSessoes: number): void {
    if (totalSessoes <= 1) {
      this.sessoesExtras.set([]);
      this.modoRepeticaoPacote.set('definir_depois');
      return;
    }
    const atuais = this.sessoesExtras();
    const novas: SessaoAgendamentoInput[] = [];
    for (let numero = 2; numero <= totalSessoes; numero++) {
      const existente = atuais.find((s) => s.sessaoNumero === numero);
      novas.push(
        existente ?? {
          sessaoNumero: numero,
          definirDepois: true,
          dataHora: null,
        },
      );
    }
    this.sessoesExtras.set(novas);
  }

  protected onModoRepeticaoChange(modo: ModoRepeticaoPacote): void {
    this.modoRepeticaoPacote.set(modo);
    if (modo === 'definir_depois') {
      this.definirTodasSessoesDepois();
      return;
    }
    if (modo === 'manual') {
      const base = this.formDataHora() ?? this.selectedDay();
      this.sessoesExtras.update((lista) =>
        lista.map((item, idx) => {
          if (item.dataHora) {
            return { ...item, definirDepois: false };
          }
          const sugerida = new Date(base);
          sugerida.setDate(base.getDate() + (idx + 1));
          const slots = this.calcularSlotsParaDataExtra(sugerida, item.sessaoNumero);
          return {
            ...item,
            definirDepois: false,
            dataHora: slots[0]?.date ?? sugerida,
          };
        }),
      );
      return;
    }
    void this.preencherSessoesAutomatico(modo);
  }

  protected async preencherSessoesAutomatico(frequencia: '1x_semana' | '2x_semana'): Promise<void> {
    const primeiraData = this.form.controls.dataHora.value;
    const total = this.formTotalSessoes();
    if (!primeiraData || total <= 1) {
      this.state.error.set(
        'Escolha primeiro a data e o horário da 1ª sessão para sugerir as próximas datas.',
      );
      return;
    }
    const sugeridas = suggestPackageDates(primeiraData, total, frequencia);
    const servico = this.servicoSelecionado();
    if (servico) {
      // Consulta no backend a ocupação real das datas sugeridas antes de escolher os horários
      await Promise.all(
        sugeridas.map((data) => this.carregarSlotsServidor(data, servico.duracaoMinutos)),
      );
    }
    this.sessoesExtras.set(
      sugeridas.map((data, idx) => {
        const sessaoNumero = idx + 2;
        const slots = this.calcularSlotsParaDataExtra(data, sessaoNumero);
        const mesmoHorario = slots.find((s) => this.isMesmoHorario(data, s.date));
        return {
          sessaoNumero,
          definirDepois: false,
          dataHora: mesmoHorario?.date ?? slots[0]?.date ?? data,
        };
      }),
    );
  }

  protected definirTodasSessoesDepois(): void {
    this.sessoesExtras.update((lista) =>
      lista.map((item) => ({ ...item, definirDepois: true, dataHora: null })),
    );
  }

  protected onPrimeiraSessaoDiaChange(day: Date | null): void {
    if (!day) {
      this.form.controls.dataHora.setValue(null);
      return;
    }
    void this.ajustarParaHorarioValidoPrimeiraSessao(day);
  }

  private async ajustarParaHorarioValidoPrimeiraSessao(day: Date): Promise<void> {
    const seq = ++this.seqAjustePrimeiraSessao;
    const servico = this.servicoSelecionado();
    const config = this.config();
    const anterior = this.form.controls.dataHora.value;
    const candidato = new Date(day);
    if (anterior) {
      candidato.setHours(anterior.getHours(), anterior.getMinutes(), 0, 0);
    } else {
      candidato.setHours(9, 0, 0, 0);
    }

    if (servico && config) {
      await this.carregarSlotsServidor(candidato, servico.duracaoMinutos);
      // Ignora o resultado se a usuária já escolheu outro dia enquanto aguardava
      if (seq !== this.seqAjustePrimeiraSessao) return;
      const extrasDatas = this.sessoesExtras()
        .filter((s) => !s.definirDepois && s.dataHora !== null)
        .map((s) => s.dataHora!);
      const slots = this.slotsDoDia(candidato, servico.duracaoMinutos, extrasDatas);
      const horarioPreservado = slots.find((s) => this.isMesmoHorario(candidato, s.date));
      if (horarioPreservado) {
        this.form.controls.dataHora.setValue(horarioPreservado.date);
        return;
      }
      if (slots.length > 0) {
        this.form.controls.dataHora.setValue(slots[0].date);
        return;
      }
    }
    this.form.controls.dataHora.setValue(candidato);
  }

  protected selecionarHorarioPrimeiraSessao(slotDate: Date): void {
    this.form.controls.dataHora.setValue(new Date(slotDate));
    this.form.controls.dataHora.markAsDirty();
  }

  protected horariosDisponiveisSessaoExtra(
    sessao: SessaoAgendamentoInput,
  ): HorarioDisponivelSlot[] {
    if (sessao.definirDepois || !sessao.dataHora) return [];
    return this.calcularSlotsParaDataExtra(sessao.dataHora, sessao.sessaoNumero);
  }

  protected horariosManhaSessaoExtra(sessao: SessaoAgendamentoInput): HorarioDisponivelSlot[] {
    return this.horariosDisponiveisSessaoExtra(sessao).filter((s) => s.date.getHours() < 12);
  }

  protected horariosTardeSessaoExtra(sessao: SessaoAgendamentoInput): HorarioDisponivelSlot[] {
    return this.horariosDisponiveisSessaoExtra(sessao).filter((s) => s.date.getHours() >= 12);
  }

  protected formatarResumoHorario(
    dataInput: Date | string | null | undefined,
    duracaoMinutos: number,
  ): string {
    if (!dataInput) return '';
    const d = dataInput instanceof Date ? dataInput : new Date(dataInput);
    if (!Number.isFinite(d.getTime())) return '';
    const fim = endTime(d, duracaoMinutos);
    const diaSemana = DIAS_SEMANA_CURTOS[d.getDay()];
    const diaMes = String(d.getDate()).padStart(2, '0');
    const mes = MESES_CURTOS[d.getMonth()];
    const hIni = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const hFim = `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`;
    return `${diaSemana}, ${diaMes} ${mes} · ${hIni} – ${hFim}`;
  }

  private calcularSlotsParaDataExtra(day: Date, sessaoNumero: number): HorarioDisponivelSlot[] {
    const servico = this.servicoSelecionado();
    const config = this.config();
    if (!servico || !config) return [];
    const outrasDatas = [
      this.formDataHora(),
      ...this.sessoesExtras()
        .filter((s) => s.sessaoNumero !== sessaoNumero && !s.definirDepois)
        .map((s) => s.dataHora),
    ].filter((d): d is Date => d instanceof Date && Number.isFinite(d.getTime()));

    return this.slotsDoDia(day, servico.duracaoMinutos, outrasDatas);
  }

  protected async onSessaoExtraDiaChange(sessaoNumero: number, day: Date | null): Promise<void> {
    if (!day) {
      this.atualizarSessaoExtraData(sessaoNumero, null);
      return;
    }
    const baseTime = this.formDataHora();
    const candidato = new Date(day);
    if (baseTime) {
      candidato.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);
    } else {
      candidato.setHours(9, 0, 0, 0);
    }
    const servico = this.servicoSelecionado();
    if (servico) {
      await this.carregarSlotsServidor(candidato, servico.duracaoMinutos);
    }
    const slots = this.calcularSlotsParaDataExtra(candidato, sessaoNumero);
    const preservado = slots.find((s) => this.isMesmoHorario(candidato, s.date));
    const escolhida = preservado?.date ?? slots[0]?.date ?? candidato;
    this.atualizarSessaoExtraData(sessaoNumero, escolhida);
  }

  protected selecionarHorarioSessaoExtra(sessaoNumero: number, slotDate: Date): void {
    this.atualizarSessaoExtraData(sessaoNumero, new Date(slotDate));
  }

  protected async onReagendarDiaChange(day: Date | null): Promise<void> {
    if (!day) {
      this.reagendarForm.controls.novaDataHora.setValue(null);
      return;
    }
    const seq = ++this.seqAjusteReagendamento;
    const booking = this.selectedBooking();
    const config = this.config();
    const atual = this.reagendarForm.controls.novaDataHora.value;
    const candidato = new Date(day);
    if (atual) {
      candidato.setHours(atual.getHours(), atual.getMinutes(), 0, 0);
    } else {
      candidato.setHours(9, 0, 0, 0);
    }

    if (booking && config) {
      await this.carregarSlotsServidor(candidato, booking.duracaoMinutos, booking.id);
      if (seq !== this.seqAjusteReagendamento) return;
      const slots = this.slotsDoDia(candidato, booking.duracaoMinutos, [], booking.id);
      const preservado = slots.find((s) => this.isMesmoHorario(candidato, s.date));
      if (preservado) {
        this.reagendarForm.controls.novaDataHora.setValue(preservado.date);
        return;
      }
      if (slots.length > 0) {
        this.reagendarForm.controls.novaDataHora.setValue(slots[0].date);
        return;
      }
    }
    this.reagendarForm.controls.novaDataHora.setValue(candidato);
  }

  protected selecionarHorarioReagendamento(slotDate: Date): void {
    this.reagendarForm.controls.novaDataHora.setValue(new Date(slotDate));
    this.reagendarForm.controls.novaDataHora.markAsDirty();
  }

  protected isMesmoHorario(a: Date | null | undefined, b: Date): boolean {
    if (!a || !Number.isFinite(a.getTime())) return false;
    return (
      localDay(a) === localDay(b) &&
      a.getHours() === b.getHours() &&
      a.getMinutes() === b.getMinutes()
    );
  }

  protected atualizarSessaoExtraData(sessaoNumero: number, dataHora: Date | null): void {
    this.sessoesExtras.update((lista) =>
      lista.map((item) =>
        item.sessaoNumero === sessaoNumero
          ? { ...item, dataHora, definirDepois: dataHora === null }
          : item,
      ),
    );
  }

  protected alternarDefinirDepoisSessao(sessaoNumero: number, definirDepois: boolean): void {
    const base = this.formDataHora() ?? this.selectedDay();
    this.sessoesExtras.update((lista) =>
      lista.map((item) => {
        if (item.sessaoNumero !== sessaoNumero) return item;
        if (definirDepois) {
          return { ...item, definirDepois: true, dataHora: null };
        }
        const sugerida = item.dataHora ?? new Date(base);
        const slots = this.calcularSlotsParaDataExtra(sugerida, sessaoNumero);
        return {
          ...item,
          definirDepois: false,
          dataHora: slots[0]?.date ?? sugerida,
        };
      }),
    );
  }

  protected validarDataSessaoExtra(sessao: SessaoAgendamentoInput): string | null {
    if (sessao.definirDepois || !sessao.dataHora) return null;
    const servico = this.servicoSelecionado();
    const config = this.config();
    if (!servico || !config) return null;

    const erroAgenda = validateSlot(
      sessao.dataHora,
      servico.duracaoMinutos,
      config.expediente,
      this.bookings(),
    );
    if (erroAgenda) return erroAgenda;

    const erroServidor = this.erroHorarioServidor(sessao.dataHora, servico.duracaoMinutos);
    if (erroServidor) return erroServidor;

    const outrasDatas = [
      this.formDataHora(),
      ...this.sessoesExtras()
        .filter((s) => s.sessaoNumero !== sessao.sessaoNumero && !s.definirDepois)
        .map((s) => s.dataHora),
    ].filter((d): d is Date => d instanceof Date && Number.isFinite(d.getTime()));

    const fimSessao = endTime(sessao.dataHora, servico.duracaoMinutos);
    const conflitoInterno = outrasDatas.some(
      (outra) => sessao.dataHora! < endTime(outra, servico.duracaoMinutos) && fimSessao > outra,
    );
    return conflitoInterno ? 'Conflito com outra sessão deste mesmo pacote.' : null;
  }

  private limparFormularioNovo(dataPreSelecionada?: Date): void {
    const funcionarioPadrao = this.config()?.funcionarios[0]?.id ?? '';
    let inicioPadrao: Date | null = null;
    if (dataPreSelecionada) {
      inicioPadrao = new Date(dataPreSelecionada);
      inicioPadrao.setHours(9, 0, 0, 0);
    }
    this.form.reset({
      idCliente: '',
      idServico: '',
      idFuncionario: funcionarioPadrao,
      totalSessoes: 1,
      dataHora: inicioPadrao,
      codigoCupom: null,
      usarDescontoManual: false,
      tipoDescontoManual: 'VALOR_FIXO',
      valorDescontoManual: null,
    });
    this.sessoesExtras.set([]);
    this.modoRepeticaoPacote.set('definir_depois');
    // Novo formulário: força nova consulta de horários livres no backend
    this.slotsServidor.set({});
    this.validacaoCupomServidor.set(null);
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const start = value.dataHora;
    if (!start) return;

    void this.state.run(async () => {
      const config = this.config();
      const service = this.servicos().find((item) => item.id === value.idServico && item.ativo);
      if (!config || !service) {
        throw new Error('Carregue a configuração e selecione um serviço ativo.');
      }
      if (!config.funcionarios.some((item) => item.id === value.idFuncionario)) {
        throw new Error('Selecione um profissional válido.');
      }
      if (!this.clientes().some((item) => item.id === value.idCliente)) {
        throw new Error('Selecione uma cliente válida.');
      }
      if (this.erroValidacaoCupom()) {
        throw new Error(this.erroValidacaoCupom()!);
      }

      // Confirma no backend os limites de uso do cupom antes de criar as sessões
      const chaveCupom = this.chaveCupomAtual();
      if (chaveCupom) {
        const erroCupomServidor = await this.validarCupomNoServidor(chaveCupom);
        if (erroCupomServidor) throw new Error(erroCupomServidor);
      }

      const dayStart = new Date(start);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      let existingBookings = this.bookings();
      try {
        existingBookings = await this.api.list(dayStart, dayEnd);
      } catch {
        // Usa os agendamentos atuais em memória se a API de listagem não responder
      }

      const error = validateSlot(
        start,
        service.duracaoMinutos,
        config.expediente,
        existingBookings,
      );
      if (error) throw new Error(error);

      for (const extra of this.sessoesExtras()) {
        if (!extra.definirDepois && extra.dataHora) {
          const extraError = this.validarDataSessaoExtra(extra);
          if (extraError) {
            throw new Error(`${extra.sessaoNumero}ª sessão: ${extraError}`);
          }
        }
      }

      const totalSessoes = Math.max(1, value.totalSessoes);
      const financeiro = this.resumoFinanceiro();
      const idPacote = totalSessoes > 1 ? `pkg-${Date.now()}` : undefined;
      const tipoDesconto = value.usarDescontoManual
        ? value.tipoDescontoManual === 'PORCENTAGEM'
          ? ('MANUAL_PORCENTAGEM' as const)
          : ('MANUAL_VALOR' as const)
        : value.codigoCupom
          ? ('CUPOM' as const)
          : null;

      const basePayload: NovoAgendamento = {
        idCliente: value.idCliente,
        idServico: value.idServico,
        idFuncionario: value.idFuncionario,
        dataHora: start.toISOString(),
        status: 'Confirmado',
        duracaoMinutos: service.duracaoMinutos,
        valor: totalSessoes > 1 ? financeiro.valorPorSessao : financeiro.valorFinal,
        valorOriginal: financeiro.valorOriginal,
        valorDesconto: financeiro.valorDesconto,
        tipoDesconto,
        codigoCupom: value.usarDescontoManual ? null : value.codigoCupom,
        idPacote,
        sessaoNumero: 1,
        totalSessoes,
        dataDefinida: true,
        criadoPor: 'ADMIN',
      };

      // Erros do backend (horário ocupado, cupom esgotado etc.) interrompem o fluxo
      // e são exibidos pelo RequestState; nada é adicionado à agenda sem ter sido salvo.
      await this.api.create(basePayload);

      let sessoesCriadas = 1;
      try {
        for (const extra of this.sessoesExtras()) {
          const extraPayload: NovoAgendamento = {
            ...basePayload,
            sessaoNumero: extra.sessaoNumero,
            dataDefinida: !extra.definirDepois && Boolean(extra.dataHora),
            dataHora:
              !extra.definirDepois && extra.dataHora
                ? extra.dataHora.toISOString()
                : start.toISOString(),
          };
          await this.api.create(extraPayload);
          sessoesCriadas++;
        }
      } catch (error: unknown) {
        // Parte do pacote já foi salva: fecha o formulário (evita duplicar ao salvar de novo)
        // e recarrega a agenda para refletir o que existe no banco
        this.fecharDialogNovoAgendamento();
        this.limparFormularioNovo();
        await this.fetch();
        throw new Error(
          `${sessoesCriadas} de ${totalSessoes} sessões foram criadas. A ${sessoesCriadas + 1}ª falhou: ${errorMessage(error)} Defina-a pelo pacote na agenda.`,
        );
      }

      this.fecharDialogNovoAgendamento();
      this.limparFormularioNovo();
      await this.fetch();
    }, 'Agendamento criado.');
  }

  // --- Detalhes / Concluir / Reagendar / Cancelar Modal Logic ---
  protected abrirDetalhes(
    item: Agendamento,
    painelInicial: PainelDetalheAgendamento = 'nenhum',
  ): void {
    this.selectedBooking.set(item);
    this.detalhePainelAtivo.set(painelInicial);
    this.limparFotoSelecionada();
    this.concluirForm.reset({
      metodoPagamento: item.metodoPagamento ?? 'PIX',
      anotacoesFinais: item.anotacoesFinais ?? '',
    });

    const dataInicialReagendar = item.dataDefinida === false ? new Date() : new Date(item.dataHora);
    this.reagendarForm.reset({
      novaDataHora: dataInicialReagendar,
      idFuncionario: item.idFuncionario,
    });
    this.reagendarDataHoraSignal.set(dataInicialReagendar);

    const dialog = this.detalhesDialogRef()?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
      this.modalAberto.set(true);
    }
  }

  protected fecharDetalhes(): void {
    if (this.state.busy()) return;
    this.limparFotoSelecionada();
    this.selectedBooking.set(null);
    this.detalhePainelAtivo.set('nenhum');
    const dialog = this.detalhesDialogRef()?.nativeElement;
    if (dialog?.open) dialog.close();
    this.modalAberto.set(false);
  }

  protected handleDetalhesDialogCancel(event: Event): void {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.fecharDetalhes();
  }

  protected handleDetalhesDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.fecharDetalhes();
    }
  }

  protected alternarPainelDetalhe(painel: PainelDetalheAgendamento): void {
    this.detalhePainelAtivo.update((atual) => (atual === painel ? 'nenhum' : painel));
  }

  protected selecionarSessaoDoPacote(sessao: Agendamento): void {
    const painel: PainelDetalheAgendamento =
      sessao.dataDefinida === false && this.isAtendimentoAtivo(sessao.status)
        ? 'reagendar'
        : 'nenhum';
    this.abrirDetalhes(sessao, painel);
  }

  protected irParaDataSessaoDoPacote(sessao: Agendamento, event: Event): void {
    event.stopPropagation();
    if (sessao.dataDefinida === false) {
      this.abrirDetalhes(sessao, 'reagendar');
      return;
    }
    this.fecharDetalhes();
    this.jumpToBookingDate(sessao);
  }

  protected onFileSelected(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const files = input.files ? Array.from(input.files) : [];
    this.adicionarFotosSelecionadas(files);
    input.value = '';
  }

  protected adicionarFotosSelecionadas(files: File[]): void {
    if (!files.length) return;
    const novosItens: FotoPreviewItem[] = [];
    for (const file of files) {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024 ||
        file.size === 0
      ) {
        this.state.error.set(
          `Arquivo "${file.name}" inválido. Selecione apenas imagens JPEG, PNG ou WebP de até 5 MB.`,
        );
        continue;
      }
      const previewUrl =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(file)
          : null;
      novosItens.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
      });
    }
    if (novosItens.length) {
      this.photos.update((atuais) => [...atuais, ...novosItens]);
    }
  }

  protected removerFotoSelecionada(id: string): void {
    this.photos.update((atuais) => {
      const alvo = atuais.find((item) => item.id === id);
      if (alvo?.previewUrl && this.imagemExpandida()?.url === alvo.previewUrl) {
        this.fecharImagemExpandida();
      }
      if (
        alvo?.previewUrl &&
        typeof URL !== 'undefined' &&
        typeof URL.revokeObjectURL === 'function'
      ) {
        URL.revokeObjectURL(alvo.previewUrl);
      }
      return atuais.filter((item) => item.id !== id);
    });
  }

  protected limparFotoSelecionada(revogarUrls = true): void {
    this.fecharImagemExpandida();
    if (revogarUrls && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      for (const item of this.photos()) {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    }
    this.photos.set([]);
  }

  protected expandirImagem(
    url: string | null | undefined,
    titulo = 'Visualização da imagem',
  ): void {
    if (!url) return;
    this.imagemExpandida.set({ url, titulo });
    const dialog = this.imagemPreviewDialogRef()?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  protected fecharImagemExpandida(): void {
    const dialog = this.imagemPreviewDialogRef()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
    }
    this.imagemExpandida.set(null);
  }

  protected handleImagemDialogCancel(event: Event): void {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    event.stopPropagation();
    this.fecharImagemExpandida();
  }

  protected handleImagemDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.fecharImagemExpandida();
    }
  }

  protected confirmarAgendamento(item: Agendamento): void {
    void this.state.run(async () => {
      const res = await this.api.confirm(item.id);
      this.atualizarBookingNaLista({ ...item, ...res });
    }, 'Horário confirmado com sucesso.');
  }

  protected marcarAlertaVisto(item: Agendamento): void {
    void this.state.run(async () => {
      const res = await this.api.markAlertSeen(item.id);
      this.atualizarBookingNaLista({ ...item, ...res, alteracaoVistaPeloAdmin: true });
    }, 'Alteração marcada como ciente.');
  }

  protected salvarReagendamento(): void {
    this.reagendarForm.markAllAsTouched();
    const booking = this.selectedBooking();
    const valor = this.reagendarForm.getRawValue();
    if (!booking || this.reagendarForm.invalid || !valor.novaDataHora) return;

    const erroSlot = this.validacaoReagendamento();
    if (erroSlot) {
      this.state.error.set(erroSlot);
      return;
    }

    const novaDataIso = valor.novaDataHora.toISOString();
    const eraDataEmAberto = booking.dataDefinida === false;

    void this.state.run(
      async () => {
        const res = await this.api.reschedule(booking.id, {
          novaDataHora: novaDataIso,
          idFuncionario: valor.idFuncionario || booking.idFuncionario,
          reagendadoPor: 'ADMIN',
        });
        this.atualizarBookingNaLista({ ...booking, ...res });
        this.detalhePainelAtivo.set('nenhum');
        // Horários livres mudaram com o reagendamento
        this.slotsServidor.set({});
      },
      eraDataEmAberto
        ? 'Data e horário definidos para a sessão.'
        : 'Agendamento reagendado com sucesso.',
    );
  }

  protected concluirAtendimento(): void {
    this.concluirForm.markAllAsTouched();
    if (this.concluirForm.invalid) return;
    const booking = this.selectedBooking();
    if (!booking || !this.isAtendimentoAtivo(booking.status)) {
      this.state.error.set('Somente agendamentos ativos podem ser concluídos.');
      return;
    }

    void this.state.run(async () => {
      const selecionadas = this.photos();
      // Se o upload falhar, o erro é exibido e as fotos continuam selecionadas para nova tentativa
      const novasUrls =
        selecionadas.length > 0
          ? await this.api.uploadMany(
              booking.id,
              selecionadas.map((item) => item.file),
            )
          : [];

      const fotosExistentes = this.fotosDoAgendamento(booking);
      const todasFotos = [...fotosExistentes, ...novasUrls];
      const formVal = this.concluirForm.getRawValue();

      const res = await this.api.complete(booking.id, {
        metodoPagamento: formVal.metodoPagamento,
        anotacoesFinais: formVal.anotacoesFinais,
        fotoResultadoUrl: todasFotos[0],
        fotosResultadoUrls: todasFotos.length ? todasFotos : undefined,
      });

      this.atualizarBookingNaLista({ ...booking, ...res });
      this.limparFotoSelecionada();
      this.detalhePainelAtivo.set('nenhum');
    }, 'Atendimento concluído e pagamento registrado.');
  }

  protected cancelarAgendamentoConfirmado(): void {
    const booking = this.selectedBooking();
    if (!booking || !this.isAtendimentoAtivo(booking.status)) {
      this.state.error.set('Somente agendamentos ativos podem ser cancelados.');
      return;
    }

    void this.state.run(async () => {
      const res = await this.api.cancel(booking.id);
      this.atualizarBookingNaLista({ ...booking, ...res });
      this.detalhePainelAtivo.set('nenhum');
      // O horário cancelado volta a ficar livre
      this.slotsServidor.set({});
    }, 'Agendamento cancelado.');
  }

  private atualizarBookingNaLista(atualizado: Agendamento): void {
    this.bookings.update((lista) =>
      lista.map((item) => (item.id === atualizado.id ? atualizado : item)),
    );
    if (this.selectedBooking()?.id === atualizado.id) {
      this.selectedBooking.set(atualizado);
    }
  }
}
