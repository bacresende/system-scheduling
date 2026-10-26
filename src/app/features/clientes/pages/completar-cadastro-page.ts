import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { AuthService } from '../../auth/services/auth.service';
import { FieldError } from '../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../shared/ui/request-feedback';
import { Endereco } from '../../usuarios/models/usuario.model';
import { cpfValidator } from '../models/cliente-validators';
import { localDay } from '../../../shared/utils/date';
import { homeFor } from '../../auth/services/auth.guard';

@Component({
  selector: 'app-completar-cadastro-page',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    NgxMaskDirective,
    FieldError,
    RequestFeedback,
  ],
  providers: [RequestState, provideNgxMask()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './completar-cadastro-page.html',
})
export class CompletarCadastroPage {
  protected readonly state = inject(RequestState);
  protected readonly cepLookupBusy = signal(false);
  protected readonly cepLookupMessage = signal('');
  protected readonly cepLookupFailed = signal(false);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  private cepLookupRequest = 0;
  private activeCepLookup = '';
  private lastSuccessfulCepLookup = '';
  protected readonly today = localDay(new Date());
  protected readonly maxBirthDate = new Date();
  protected readonly form = this.fb.group({
    cpf: ['', [Validators.required, cpfValidator]],
    ocupacaoProfissional: ['', Validators.maxLength(120)],
    nasc: this.fb.control<Date | null>(null, [
      Validators.required,
      (control: AbstractControl) => {
        const value: unknown = control.value;
        if (value === null || value === '') return null;
        if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return { data: true };
        return localDay(value) > this.today ? { data: true } : null;
      },
    ]),
    endereco: this.fb.group({
      cep: ['', Validators.required],
      logradouro: ['', Validators.required],
      numeroResidencia: ['', Validators.required],
      bairro: ['', Validators.required],
      complemento: [''],
      cidade: ['', Validators.required],
      estado: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
      pais: ['Brasil', Validators.required],
    }),
  });
  protected readonly fields: { key: keyof Endereco; label: string; autocomplete: string }[] = [
    { key: 'cep', label: 'CEP (8 dígitos)', autocomplete: 'postal-code' },
    { key: 'logradouro', label: 'Logradouro', autocomplete: 'address-line1' },
    { key: 'numeroResidencia', label: 'Número', autocomplete: 'address-line2' },
    { key: 'bairro', label: 'Bairro', autocomplete: 'address-level3' },
    { key: 'complemento', label: 'Complemento (opcional)', autocomplete: 'address-line3' },
    { key: 'cidade', label: 'Cidade', autocomplete: 'address-level2' },
    { key: 'estado', label: 'UF', autocomplete: 'address-level1' },
    { key: 'pais', label: 'País', autocomplete: 'country-name' },
  ];

  protected lookupCepOnInput(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      const cep = input.value.replace(/\D/g, '');
      if (cep.length === 8 || this.cepLookupBusy()) this.lookupCep(input.value);
    }
  }

  protected lookupCep(enteredCep?: string): void {
    const cepControl = this.form.controls.endereco.controls.cep;
    const cep = (enteredCep ?? cepControl.value).replace(/\D/g, '');
    if (
      /^\d{8}$/.test(cep) &&
      ((this.cepLookupBusy() && this.activeCepLookup === cep) ||
        this.lastSuccessfulCepLookup === cep)
    ) {
      return;
    }

    const requestId = ++this.cepLookupRequest;
    this.cepLookupMessage.set('');
    this.cepLookupFailed.set(false);
    if (!/^\d{8}$/.test(cep)) {
      this.activeCepLookup = '';
      this.lastSuccessfulCepLookup = '';
      this.cepLookupBusy.set(false);
      if (cep) {
        this.cepLookupFailed.set(true);
        this.cepLookupMessage.set(
          'CEP fora do formato esperado. Preencha o endereço manualmente para continuar.',
        );
      }
      return;
    }

    this.activeCepLookup = cep;
    this.lastSuccessfulCepLookup = '';
    this.cepLookupBusy.set(true);
    void this.auth
      .lookupCep(cep)
      .then((address) => {
        if (
          requestId !== this.cepLookupRequest ||
          cep !== this.form.controls.endereco.controls.cep.value.replace(/\D/g, '')
        ) {
          return;
        }
        this.lastSuccessfulCepLookup = cep;
        this.form.controls.endereco.patchValue({
          cep: address.cep.replace(/\D/g, ''),
          logradouro: address.logradouro,
          complemento: address.complemento ?? '',
          bairro: address.bairro,
          cidade: address.cidade,
          estado: address.estado,
          pais: 'Brasil',
        });
        this.cepLookupMessage.set('Endereço encontrado. Confira os dados e informe o número.');
      })
      .catch(() => {
        if (requestId !== this.cepLookupRequest) return;
        this.cepLookupFailed.set(true);
        this.cepLookupMessage.set(
          'Não foi possível localizar o CEP. Confira o número ou preencha o endereço manualmente.',
        );
      })
      .finally(() => {
        if (requestId === this.cepLookupRequest) {
          this.activeCepLookup = '';
          this.cepLookupBusy.set(false);
        }
      });
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.cepLookupBusy()) {
      this.cepLookupRequest++;
      this.activeCepLookup = '';
      this.cepLookupBusy.set(false);
    }
    void this.state.run(async () => {
      const payload = this.form.getRawValue();
      if (!payload.nasc) throw new Error('Informe uma data de nascimento válida.');
      await this.auth.complete({
        ...payload,
        cpf: payload.cpf.replace(/\D/g, ''),
        nasc: localDay(payload.nasc),
      });
      if (!this.auth.session()?.cadastroCompleto) {
        throw new Error('O backend ainda não confirmou a conclusão do cadastro.');
      }
      const perfil = this.auth.session()?.perfil;
      const navigated = await this.router.navigateByUrl(homeFor(null, perfil));
      if (!navigated) throw new Error('Não foi possível acessar a página inicial da sua conta.');
    });
  }
  protected logout(): void {
    void this.state.run(async () => {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    });
  }
}
