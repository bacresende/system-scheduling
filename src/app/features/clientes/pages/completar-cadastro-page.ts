import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../auth/services/auth.service';
import { FieldError } from '../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../shared/ui/request-feedback';
import { Endereco } from '../../usuarios/models/usuario.model';
import { cpfValidator } from '../models/cliente-validators';
import { localDay } from '../../../shared/utils/date';

@Component({
  selector: 'app-completar-cadastro-page',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, FieldError, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-2xl p-4 md:p-8">
      <h1 class="text-3xl font-bold">Complete seu cadastro</h1>
      <p class="my-4">Precisamos destes dados antes de liberar o portal.</p>
      <app-request-feedback />
      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="grid grid-cols-1 gap-4 md:grid-cols-2"
        novalidate
      >
        <label
          >CPF (11 dígitos)
          <input pInputText formControlName="cpf" inputmode="numeric" class="mt-1 w-full" />
          <app-field-error [control]="form.controls.cpf" />
        </label>
        <label
          >Data de nascimento
          <input pInputText type="date" formControlName="nasc" [max]="today" class="mt-1 w-full" />
          <app-field-error [control]="form.controls.nasc" />
        </label>
        <fieldset formGroupName="endereco" class="grid gap-4 md:col-span-2 md:grid-cols-2">
          <legend class="mb-2 font-semibold">Endereço</legend>
          @for (field of fields; track field.key) {
            <label
              >{{ field.label }}
              <input pInputText [formControlName]="field.key" class="mt-1 w-full" />
              <app-field-error [control]="form.controls.endereco.controls[field.key]" />
            </label>
          }
        </fieldset>
        <p-button
          type="submit"
          label="Salvar e acessar portal"
          [loading]="state.busy()"
          styleClass="w-full md:w-auto bg-estetica-primary text-estetica-text border-estetica-primary"
        />
      </form>
      <p-button
        label="Sair"
        severity="secondary"
        (onClick)="logout()"
        styleClass="mt-4"
        [disabled]="state.busy()"
      />
    </main>
  `,
})
export class CompletarCadastroPage {
  protected readonly state = inject(RequestState);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly today = localDay(new Date());
  protected readonly form = this.fb.group({
    cpf: ['', [Validators.required, cpfValidator]],
    nasc: [
      '',
      [
        Validators.required,
        (control: AbstractControl) => {
          const value = String(control.value);
          return value && (value > this.today || !Number.isFinite(Date.parse(value)))
            ? { data: true }
            : null;
        },
      ],
    ],
    endereco: this.fb.group({
      cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      logradouro: ['', Validators.required],
      numeroResidencia: ['', Validators.required],
      bairro: ['', Validators.required],
      complemento: [''],
      cidade: ['', Validators.required],
      estado: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
      pais: ['Brasil', Validators.required],
    }),
  });
  protected readonly fields: { key: keyof Endereco; label: string }[] = [
    { key: 'cep', label: 'CEP (8 dígitos)' },
    { key: 'logradouro', label: 'Logradouro' },
    { key: 'numeroResidencia', label: 'Número' },
    { key: 'bairro', label: 'Bairro' },
    { key: 'complemento', label: 'Complemento (opcional)' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'UF' },
    { key: 'pais', label: 'País' },
  ];
  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.state.run(async () => {
      await this.auth.complete(this.form.getRawValue());
      if (!this.auth.session()?.cadastroCompleto) {
        throw new Error('O backend ainda não confirmou a conclusão do cadastro.');
      }
      await this.router.navigateByUrl('/portal');
    });
  }
  protected logout(): void {
    void this.state.run(async () => {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    });
  }
}
