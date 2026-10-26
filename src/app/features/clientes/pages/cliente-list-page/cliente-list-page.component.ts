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
import { CepPipe } from '../../../../shared/pipes/cep.pipe';
import { TelefonePipe } from '../../../../shared/pipes/telefone.pipe';
import { CpfPipe } from '../../../../shared/pipes/cpf.pipe';
import { BirthdatePipe } from '../../../../shared/pipes/birthdate.pipe';

@Component({
  selector: 'app-cliente-list-page',
  imports: [
    ReactiveFormsModule,
    NgxMaskDirective,
    ButtonModule,
    InputTextModule,
    FieldError,
    RequestFeedback,
    CepPipe,
    TelefonePipe,
    CpfPipe,
    BirthdatePipe,
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
  protected readonly selectedClient = signal<Usuario | null>(null);
  private readonly detailsDialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('clientDetailsDialog');
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
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
  protected showDetails(cliente: Usuario): void {
    this.selectedClient.set(cliente);
    const dialog = this.detailsDialogRef()?.nativeElement;
    if (dialog && !dialog.open) dialog.showModal();
  }
  protected closeDetails(): void {
    const dialog = this.detailsDialogRef()?.nativeElement;
    if (dialog?.open) dialog.close();
    this.selectedClient.set(null);
  }
  protected handleDetailsDialogCancel(event: Event): void {
    event.preventDefault();
    this.closeDetails();
  }
  protected handleDetailsDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeDetails();
  }
  protected whatsappUrl(phone?: string): string | null {
    const digits = phone?.replace(/\D/g, '') ?? '';
    if (/^\d{10,11}$/.test(digits)) return `https://wa.me/55${digits}`;
    if (/^55\d{10,11}$/.test(digits)) return `https://wa.me/${digits}`;
    return null;
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
