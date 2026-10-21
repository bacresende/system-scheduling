import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { ServicosService } from '../../services/servicos.service';
import { Servico, TipoAnamnese } from '../../models/servico.model';
import { FieldError } from '../../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-servico-list-page',
  imports: [CurrencyPipe, ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule,
    SelectModule, CheckboxModule, TableModule, FieldError, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './servico-list-page.component.html',
  styleUrl: './servico-list-page.component.css'
})
export class ServicoListPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(ServicosService);
  protected readonly servicos = signal<Servico[]>([]);
  protected readonly editing = signal<string | undefined>(undefined);
  protected readonly tipos: TipoAnamnese[] = ['FACIAL', 'CORPORAL', 'CAPILAR', 'SOBRANCELHA'];
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]], descricao: [''],
    preco: [0, [Validators.required, Validators.min(0)]],
    duracaoMinutos: [30, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    ativo: [true], tipoAnamneseExigida: ['FACIAL' as TipoAnamnese, Validators.required],
    diasParaRetorno: inject(FormBuilder).control<number | null>(null, [Validators.min(1), Validators.pattern(/^\d+$/)])
  });
  ngOnInit(): void { this.load(); }
  protected load(): void { void this.state.run(async () => { this.servicos.set(await this.api.list()); }); }
  protected edit(item: Servico): void {
    this.editing.set(item.id);
    this.form.reset({ ...item, descricao: item.descricao ?? '', diasParaRetorno: item.diasParaRetorno ?? null });
  }
  protected reset(): void { this.editing.set(undefined); this.form.reset(); }
  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.state.run(async () => {
      const value = this.form.getRawValue();
      const saved = await this.api.save({ ...value, diasParaRetorno: value.diasParaRetorno ?? undefined }, this.editing());
      this.servicos.update(items => [...items.filter(item => item.id !== saved.id), saved]);
      this.reset();
    }, 'Serviço salvo.');
  }
  protected deactivate(item: Servico): void {
    void this.state.run(async () => {
      const saved = await this.api.deactivate(item.id);
      this.servicos.update(items => items.map(current => current.id === saved.id ? saved : current));
    }, 'Serviço inativado.');
  }
}
