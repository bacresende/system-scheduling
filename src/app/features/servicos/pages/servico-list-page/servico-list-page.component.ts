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
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('serviceDialog');
  protected readonly servicos = signal<Servico[]>([]);
  protected readonly editing = signal<string | undefined>(undefined);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]],
    descricao: [''],
    preco: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    duracaoMinutos: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^\d+$/),
    ]),
    ativo: [true],
    diasParaRetorno: inject(FormBuilder).control<number | null>(null, [
      Validators.min(1),
      Validators.pattern(/^\d+$/),
    ]),
  });
  ngOnInit(): void {
    this.load();
  }
  protected load(): void {
    void this.state.run(async () => {
      this.servicos.set(await this.api.list());
    });
  }
  protected edit(item: Servico): void {
    this.editing.set(item.id);
    this.form.reset({
      ...item,
      descricao: item.descricao ?? '',
      diasParaRetorno: item.diasParaRetorno ?? null,
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
    this.form.reset();
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
        { ...value, preco, duracaoMinutos, diasParaRetorno: value.diasParaRetorno ?? undefined },
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
}
