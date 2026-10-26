import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-banner-completar-cadastro',
  imports: [RouterLink],
  templateUrl: './banner-completar-cadastro.html',
  styleUrl: './banner-completar-cadastro.css',
})
export class BannerCompletarCadastro {
  private readonly auth = inject(AuthService);
  protected readonly cadastroIncompleto = computed(() => !this.auth.session()?.cadastroCompleto);
}
