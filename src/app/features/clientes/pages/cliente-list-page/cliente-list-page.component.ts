import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ClientesService } from '../../services/clientes.service';
import { Cliente } from '../../models/cliente.model';
import { FieldError } from '../../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-cliente-list-page',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TableModule, FieldError, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cliente-list-page.component.html',
  styleUrl: './cliente-list-page.component.css'
})
export class ClienteListPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(ClientesService);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{9,14}$/)]]
  });
  ngOnInit(): void { this.load(); }
  protected load(): void { void this.state.run(async () => { this.clientes.set(await this.api.list()); }); }
  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.state.run(async () => {
      const saved = await this.api.create(this.form.getRawValue());
      this.clientes.update(items => [...items, saved]);
      this.form.reset();
    }, 'Cliente cadastrado. O backend é responsável pelo convite de acesso.');
  }
}
