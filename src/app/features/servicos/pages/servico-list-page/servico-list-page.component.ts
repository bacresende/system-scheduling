import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ServicosService } from '../../services/servicos.service';
import { Servico } from '../../models/servico.model';
import { FieldError } from '../../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-servico-list-page',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    SkeletonModule,
    TableModule,
    FieldError,
    RequestFeedback,
  ],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './servico-list-page.component.html',
  styleUrl: './servico-list-page.component.css',
})
export class ServicoListPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(ServicosService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('serviceDialog');
  private readonly deleteDialogRef = viewChild<ElementRef<HTMLDialogElement>>('deleteDialog');
  protected readonly servicos = signal<Servico[]>([]);
  protected readonly loadCycle = signal(0);
  protected readonly editing = signal<string | undefined>(undefined);
  protected readonly pendingDelete = signal<Servico | null>(null);
  protected readonly novaSessaoControl = new FormControl<number | null>(null, [
    Validators.min(1),
    Validators.pattern(/^\d+$/),
  ]);
  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]],
    descricao: [''],
    preco: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    duracaoMinutos: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^\d+$/),
    ]),
    ativo: [true],
    diasParaRetorno: this.fb.control<number | null>(null, [
      Validators.min(1),
      Validators.pattern(/^\d+$/),
    ]),
    sessoesDisponiveis: this.fb.nonNullable.control<number[]>(
      [1],
      [Validators.required, Validators.minLength(1)],
    ),
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loadCycle.update((cycle) => cycle + 1);
    void this.state.run(async () => {
      this.servicos.set(await this.api.list());
    });
  }

  protected addSessao(): void {
    const valor = this.novaSessaoControl.value;
    if (this.novaSessaoControl.invalid || valor === null || !Number.isInteger(valor) || valor < 1) {
      this.novaSessaoControl.markAsTouched();
      this.novaSessaoControl.setErrors({ invalidSession: true });
      return;
    }
    const atuais = this.form.controls.sessoesDisponiveis.value;
    const atualizadas = Array.from(new Set([...atuais, valor])).sort((a, b) => a - b);
    this.form.controls.sessoesDisponiveis.setValue(atualizadas);
    this.form.controls.sessoesDisponiveis.markAsDirty();
    this.form.controls.sessoesDisponiveis.markAsTouched();
    this.novaSessaoControl.reset(null);
  }

  protected removeSessao(sessao: number): void {
    const atualizadas = this.form.controls.sessoesDisponiveis.value.filter(
      (item) => item !== sessao,
    );
    this.form.controls.sessoesDisponiveis.setValue(atualizadas);
    this.form.controls.sessoesDisponiveis.markAsDirty();
    this.form.controls.sessoesDisponiveis.markAsTouched();
  }

  protected handleSessaoEnter(event: Event): void {
    event.preventDefault();
    this.addSessao();
  }

  protected sessoesDoServico(item: Servico): number[] {
    return item.sessoesDisponiveis?.length ? item.sessoesDisponiveis : [1];
  }

  protected edit(item: Servico): void {
    this.editing.set(item.id);
    this.novaSessaoControl.reset(null);
    this.form.reset({
      ...item,
      descricao: item.descricao ?? '',
      diasParaRetorno: item.diasParaRetorno ?? null,
      sessoesDisponiveis: item.sessoesDisponiveis?.length
        ? Array.from(new Set(item.sessoesDisponiveis)).sort((a, b) => a - b)
        : [1],
    });
    this.openDialog();
  }

  protected newService(): void {
    this.clearForm();
    this.openDialog();
  }

  protected reset(): void {
    this.clearForm();
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog?.open) dialog.close();
  }

  private clearForm(): void {
    this.editing.set(undefined);
    this.novaSessaoControl.reset(null);
    this.form.reset({
      nome: '',
      descricao: '',
      preco: null,
      duracaoMinutos: null,
      ativo: true,
      diasParaRetorno: null,
      sessoesDisponiveis: [1],
    });
  }

  private openDialog(): void {
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog && !dialog.open) dialog.showModal();
  }

  protected handleDialogCancel(event: Event): void {
    event.preventDefault();
    if (!this.state.busy()) this.reset();
  }

  protected handleDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.state.busy()) this.reset();
  }

  protected save(): void {
    if (this.novaSessaoControl.value !== null && this.novaSessaoControl.valid) {
      this.addSessao();
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.state.run(async () => {
      const value = this.form.getRawValue();
      const preco = value.preco;
      const duracaoMinutos = value.duracaoMinutos;
      if (preco === null || duracaoMinutos === null) {
        throw new Error('Informe o preço e a duração do serviço.');
      }
      const saved = await this.api.save(
        {
          ...value,
          preco,
          duracaoMinutos,
          diasParaRetorno: value.diasParaRetorno,
          sessoesDisponiveis: value.sessoesDisponiveis,
        },
        this.editing(),
      );
      this.servicos.update((items) => [...items.filter((item) => item.id !== saved.id), saved]);
      this.reset();
    }, 'Serviço salvo.');
  }

  protected deactivate(item: Servico): void {
    void this.state.run(async () => {
      const saved = await this.api.deactivate(item.id);
      this.servicos.update((items) =>
        items.map((current) => (current.id === saved.id ? saved : current)),
      );
    }, 'Serviço inativado.');
  }

  protected requestDelete(item: Servico): void {
    this.pendingDelete.set(item);
    const dialog = this.deleteDialogRef()?.nativeElement;
    if (dialog && !dialog.open) dialog.showModal();
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
    const dialog = this.deleteDialogRef()?.nativeElement;
    if (dialog?.open) dialog.close();
  }

  protected handleDeleteDialogCancel(event: Event): void {
    event.preventDefault();
    if (!this.state.busy()) this.cancelDelete();
  }

  protected handleDeleteDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.state.busy()) this.cancelDelete();
  }

  protected confirmDelete(): void {
    const item = this.pendingDelete();
    if (!item) return;
    void this.state.run(async () => {
      await this.api.delete(item.id);
      this.servicos.update((items) => items.filter((current) => current.id !== item.id));
      this.cancelDelete();
    }, 'Serviço excluído.');
  }
}
