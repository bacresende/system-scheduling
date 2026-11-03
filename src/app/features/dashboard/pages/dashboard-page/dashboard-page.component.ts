import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DashboardService, ResumoDashboard } from '../../services/dashboard.service';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';
import { BannerCompletarCadastro } from '../../../../shared/components/banner-completar-cadastro/banner-completar-cadastro';

@Component({
  selector: 'app-dashboard-page',
  imports: [CurrencyPipe, RouterLink, ButtonModule, RequestFeedback, BannerCompletarCadastro],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(DashboardService);
  private readonly router = inject(Router);

  protected readonly summary = signal<ResumoDashboard | null>(null);
  protected readonly anamneseLink = new URL(
    this.router.serializeUrl(this.router.createUrlTree(['/anamnese'])),
    globalThis.location.origin,
  ).toString();

  ngOnInit(): void {
    this.load();
  }
  protected load(): void {
    void this.state.run(async () => {
      this.summary.set(await this.api.get());
    });
  }

  protected copyAnamneseLink(): void {
    void this.state.run(async () => {
      if (!navigator.clipboard) {
        throw new Error('A cópia do link não está disponível neste navegador.');
      }
      await navigator.clipboard.writeText(this.anamneseLink);
    }, 'Link da anamnese copiado.');
  }
}
