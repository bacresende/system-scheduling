import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { FieldError } from '../../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-cliente-list-page',
  imports: [
    ReactiveFormsModule,
    NgxMaskDirective,
    ButtonModule,
    InputTextModule,
    FieldError,
    RequestFeedback,
  ],
  providers: [RequestState, provideNgxMask()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cliente-list-page.component.html',
  styleUrl: './cliente-list-page.component.css',
})
export class ClienteListPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(UsuariosService);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('clientDialog');
  protected readonly clientes = signal<Usuario[]>([]);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{9,14}$/)]],
  });
  ngOnInit(): void {
    this.load();
  }
  protected load(): void {
    void this.state.run(async () => {
      this.clientes.set(await this.api.listByProfile('CLIENTE'));
    });
  }
  protected newClient(): void {
    this.form.reset();
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog && !dialog.open) dialog.showModal();
  }
  protected reset(): void {
    this.form.reset();
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog?.open) dialog.close();
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
      const saved = await this.api.create({ ...this.form.getRawValue(), perfil: 'CLIENTE' });
      this.clientes.update((items) => [saved, ...items]);
      this.reset();
    }, 'Usuário cadastrado com perfil de cliente.');
  }
}
