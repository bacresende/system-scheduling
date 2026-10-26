import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';
import { FieldError } from '../../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';
import { ElegantButton } from '../../../../shared/components/elegant-button/elegant-button';
import { homeFor } from '../../services/auth.guard';

@Component({
  selector: 'app-pre-cadastro-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    NgxMaskDirective,
    FieldError,
    RequestFeedback,
    ElegantButton,
  ],
  providers: [RequestState, provideNgxMask()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pre-cadastro-page.html',
})
export class PreCadastroPage {
  protected readonly state = inject(RequestState);
  protected readonly showPassword = signal(false);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{9,14}$/)]],
    senha: ['', Validators.required],
  });

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    void this.state.run(async () => {
      await this.auth.register(this.form.getRawValue());
      this.form.reset();
      this.showPassword.set(false);

      const urlDestino = this.route.snapshot.queryParamMap.get('returnUrl');
      const perfil = this.auth.session()?.perfil;

      const direcionamento = homeFor(urlDestino, perfil);
      const navigated = await this.router.navigateByUrl(direcionamento);
      if (!navigated) throw new Error('Não foi possível concluir a navegação após o cadastro.');
    });
  }
}
