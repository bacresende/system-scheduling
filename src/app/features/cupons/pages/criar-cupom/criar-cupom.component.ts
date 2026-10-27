import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';
import { Cupom, NovoCupomPayload } from '../../models/cupom.model';
import { ServicosService } from '../../../servicos/services/servicos.service';
import { ServicoCupom } from '../../../servicos/models/servico.model';
import { CuponsService } from '../../services/cupons.service';
import { localDay } from '../../../../shared/utils/date';

@Component({
  selector: 'app-criar-cupom',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    PanelModule,
    SelectModule,
    SkeletonModule,
    ToggleSwitchModule,
    RequestFeedback,
  ],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './criar-cupom.component.html',
})
export class CriarCupomComponent implements OnInit {
  private readonly apiServicos = inject(ServicosService);
  private readonly apiCupons = inject(CuponsService);
  protected readonly state = inject(RequestState);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('cupomDialog');
  private readonly deleteDialogRef = viewChild<ElementRef<HTMLDialogElement>>('deleteCupomDialog');

  protected readonly cupons = signal<Cupom[]>([]);
  protected readonly loadCycle = signal(0);
  protected readonly hoje = new Date(new Date().setHours(0, 0, 0, 0));
  protected readonly modalAberto = signal(false);
  protected readonly painelAvancadoRecolhido = signal(true);
  protected readonly editing = signal<string | null>(null);
  protected readonly pendingDelete = signal<Cupom | null>(null);

  protected readonly tiposDesconto = [
    { label: 'Porcentagem', value: 'PORCENTAGEM' as const },
    { label: 'Valor fixo', value: 'VALOR_FIXO' as const },
  ];

  protected readonly servicos = signal<ServicoCupom[]>([]);

  protected readonly form = this.fb.group({
    codigo: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[A-Z0-9_-]+$/),
    ]),
    tipoDesconto: this.fb.nonNullable.control<'PORCENTAGEM' | 'VALOR_FIXO'>('PORCENTAGEM'),
    valor: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    dataMinima: this.fb.control<Date | null>(null),
    dataMaxima: this.fb.control<Date | null>(null),
    limitarGlobal: this.fb.nonNullable.control(false),
    limiteUsoGlobal: this.fb.control<number | null>(null, [Validators.min(1)]),
    limitarPorCliente: this.fb.nonNullable.control(true),
    limitePorCliente: this.fb.control<number | null>(1, [Validators.min(1)]),
    restringirServicos: this.fb.nonNullable.control(false),
    servicosValidos: this.fb.nonNullable.control<string[]>([]),
    restringirSessoes: this.fb.nonNullable.control(false),
    minimoSessoes: this.fb.control<number | null>(null, [Validators.min(1)]),
    maximoSessoes: this.fb.control<number | null>(null, [Validators.min(1)]),
    ativo: this.fb.nonNullable.control(true),
  });

  constructor() {
    this.form.controls.codigo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((codigo) => {
        const normalizado = codigo.toUpperCase();
        if (normalizado !== codigo) {
          this.form.controls.codigo.setValue(normalizado, { emitEvent: false });
        }
      });

    this.configurarCampoCondicional('limitarGlobal', 'limiteUsoGlobal');
    this.configurarCampoCondicional('limitarPorCliente', 'limitePorCliente');
    this.configurarCampoCondicional('restringirSessoes', 'minimoSessoes');
    this.configurarCampoCondicional('restringirSessoes', 'maximoSessoes');
  }

  ngOnInit(): void {
    this.loadEndpoints();
  }

  protected loadEndpoints(): void {
    this.loadCycle.update((cycle) => cycle + 1);
    void this.state.run(async () => {
      this.cupons.set(await this.apiCupons.list());
      this.servicos.set(await this.apiServicos.list());
    });
  }

  protected normalizarCodigo(event: Event): void {
    const input = event.currentTarget;
    if (input instanceof HTMLInputElement) {
      input.value = input.value.toUpperCase();
      this.form.controls.codigo.setValue(input.value);
    }
  }

  protected gerarCodigo(): void {
    const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codigosExistentes = new Set(
      this.cupons().map((cupom) => cupom.codigo.toUpperCase()),
    );

    for (let tentativa = 0; tentativa < 20; tentativa++) {
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(10));
      const codigo = Array.from(bytes, (byte) => alfabeto[byte & 31]).join('');

      if (!codigosExistentes.has(codigo)) {
        this.form.controls.codigo.setValue(codigo);
        this.form.controls.codigo.markAsDirty();
        this.state.error.set('');
        this.state.success.set('');
        return;
      }
    }

    this.state.error.set('Não foi possível gerar um código disponível. Tente novamente.');
  }

  protected novoCupom(): void {
    this.limparFormulario();

    const dialog = this.dialogRef()?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
      this.modalAberto.set(true);
    }
  }

  protected edit(cupom: Cupom): void {
    this.editing.set(cupom.id);
    this.painelAvancadoRecolhido.set(
      !cupom.dataMinima &&
        !cupom.dataMaxima &&
        cupom.limiteUsoGlobal === null &&
        cupom.limitePorCliente === null &&
        cupom.servicosValidos.length === 0 &&
        cupom.minimoSessoes === null &&
        cupom.maximoSessoes === null,
    );
    this.form.reset({
      codigo: cupom.codigo,
      tipoDesconto: cupom.tipoDesconto,
      valor: cupom.valor,
      dataMinima: this.dateForForm(cupom.dataMinima),
      dataMaxima: this.dateForForm(cupom.dataMaxima),
      limitarGlobal: cupom.limiteUsoGlobal !== null,
      limiteUsoGlobal: cupom.limiteUsoGlobal,
      limitarPorCliente: cupom.limitePorCliente !== null,
      limitePorCliente: cupom.limitePorCliente,
      restringirServicos: cupom.servicosValidos.length > 0,
      servicosValidos: [...cupom.servicosValidos],
      restringirSessoes: cupom.minimoSessoes !== null || cupom.maximoSessoes !== null,
      minimoSessoes: cupom.minimoSessoes,
      maximoSessoes: cupom.maximoSessoes,
      ativo: cupom.ativo,
    });

    const dialog = this.dialogRef()?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
      this.modalAberto.set(true);
    }
  }

  protected cancelar(): void {
    if (this.state.busy()) return;
    this.limparFormulario();
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog?.open) dialog.close();
    this.modalAberto.set(false);
  }

  protected requestDelete(cupom: Cupom): void {
    this.pendingDelete.set(cupom);
    const dialog = this.deleteDialogRef()?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
      this.modalAberto.set(true);
    }
  }

  protected cancelDelete(): void {
    if (this.state.busy()) return;
    this.pendingDelete.set(null);
    const dialog = this.deleteDialogRef()?.nativeElement;
    if (dialog?.open) dialog.close();
    this.modalAberto.set(false);
  }

  protected handleDeleteDialogCancel(event: Event): void {
    event.preventDefault();
    this.cancelDelete();
  }

  protected handleDeleteDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancelDelete();
  }

  protected handleDeleteDialogClose(): void {
    this.modalAberto.set(false);
  }

  protected confirmDelete(): void {
    const cupom = this.pendingDelete();
    if (!cupom) return;

    void this.state.run(async () => {
      await this.apiCupons.delete(cupom.id);
      this.cupons.update((items) => items.filter((item) => item.id !== cupom.id));
      this.pendingDelete.set(null);
      const dialog = this.deleteDialogRef()?.nativeElement;
      if (dialog?.open) dialog.close();
    }, 'Cupom excluído.');
  }

  protected handleDialogCancel(event: Event): void {
    event.preventDefault();
    this.cancelar();
  }

  protected handleDialogClose(): void {
    this.modalAberto.set(false);
  }

  protected handleDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancelar();
  }

  protected atualizarPainelAvancado(recolhido: boolean | undefined): void {
    this.painelAvancadoRecolhido.set(recolhido ?? true);
  }

  protected deactivate(cupom: Cupom): void {
    void this.state.run(async () => {
      const saved = await this.apiCupons.deactivate(cupom.id);
      this.cupons.update((items) =>
        items.map((item) => (item.id === saved.id ? saved : item)),
      );
    }, 'Cupom inativado.');
  }

  protected servicosDoCupom(cupom: Cupom): string[] {
    return cupom.servicosValidos.map(
      (id) => this.servicos().find((servico) => servico.id === id)?.nome ?? id,
    );
  }

  protected descontoFormatado(cupom: Cupom): string {
    return cupom.tipoDesconto === 'PORCENTAGEM'
      ? `${cupom.valor}%`
      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cupom.valor);
  }

  protected save(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid || value.valor === null) return;

    const payload: NovoCupomPayload = {
      codigo: value.codigo.trim().toUpperCase(),
      tipoDesconto: value.tipoDesconto,
      valor: value.valor,
      dataMinima: value.dataMinima ? localDay(value.dataMinima) : null,
      dataMaxima: value.dataMaxima ? localDay(value.dataMaxima) : null,
      limiteUsoGlobal: value.limitarGlobal ? value.limiteUsoGlobal : null,
      limitePorCliente: value.limitarPorCliente ? value.limitePorCliente : null,
      servicosValidos: value.restringirServicos ? value.servicosValidos : [],
      minimoSessoes: value.restringirSessoes ? value.minimoSessoes : null,
      maximoSessoes: value.restringirSessoes ? value.maximoSessoes : null,
      ativo: value.ativo,
    };

    void this.state.run(async () => {
      this.loadCycle.update((cycle) => cycle + 1);
      const id = this.editing();
      const saved = id
        ? await this.apiCupons.update(id, payload)
        : await this.apiCupons.create(payload);
      this.cupons.update((items) => [...items.filter((item) => item.id !== saved.id), saved]);

      this.limparFormulario();
      const dialog = this.dialogRef()?.nativeElement;
      if (dialog?.open) dialog.close();
    }, this.editing() ? 'Cupom atualizado.' : 'Cupom salvo.');
  }

  private limparFormulario(): void {
    this.editing.set(null);
    this.painelAvancadoRecolhido.set(true);
    this.form.reset({
      codigo: '',
      tipoDesconto: 'PORCENTAGEM',
      valor: null,
      dataMinima: null,
      dataMaxima: null,
      limitarGlobal: false,
      limiteUsoGlobal: null,
      limitarPorCliente: true,
      limitePorCliente: 1,
      restringirServicos: false,
      servicosValidos: [],
      restringirSessoes: false,
      minimoSessoes: null,
      maximoSessoes: null,
      ativo: true,
    });
  }

  private dateForForm(value: string | null | undefined): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private configurarCampoCondicional(
    switchName: 'limitarGlobal' | 'limitarPorCliente' | 'restringirSessoes',
    controlName: 'limiteUsoGlobal' | 'limitePorCliente' | 'minimoSessoes' | 'maximoSessoes',
  ): void {
    const control = this.form.controls[controlName];
    const atualizarValidacao = (habilitado: boolean): void => {
      if (habilitado) {
        if (controlName === 'limitePorCliente' && control.value === null) {
          control.setValue(1, { emitEvent: false });
        }
        control.addValidators(Validators.required);
      } else {
        control.setValue(null, { emitEvent: false });
        control.removeValidators(Validators.required);
      }
      control.updateValueAndValidity({ emitEvent: false });
    };

    atualizarValidacao(this.form.controls[switchName].value);
    this.form.controls[switchName].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(atualizarValidacao);
  }
}
