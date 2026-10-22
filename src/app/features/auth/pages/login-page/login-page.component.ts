import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';
import { homeFor } from '../../services/auth.guard';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';
import { FieldError } from '../../../../shared/ui/field-error';
import { ElegantButton } from '../../../../shared/components/elegant-button/elegant-button';
import { ApiClient } from '../../../../core/api/api-client';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    RequestFeedback,
    FieldError,
    ElegantButton,
  ],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  protected readonly state = inject(RequestState);
  protected readonly showPassword = signal(false);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  constructor() {
    this.state.error.set(this.route.snapshot.queryParamMap.get('erro') ?? '');
  }

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  public submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.state.run(async () => {
      await this.auth.login(this.form.getRawValue());
      this.form.controls.senha.reset();
      const session = this.auth.session();
      if (!session) throw new Error('A API não retornou uma sessão válida.');
      const retorno = this.route.snapshot.queryParamMap.get('retorno');
      const target =
        retorno?.startsWith('/') && !retorno.startsWith('//') && !retorno.startsWith('/login')
          ? retorno
          : homeFor(session);
      await this.router.navigateByUrl(target);
    });
  }
}
