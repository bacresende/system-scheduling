import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { TimelineModule } from 'primeng/timeline';
import { Agendamento } from '../../agendamentos/models/agendamento.model';
import { AuthService } from '../../auth/services/auth.service';
import { ApiClient } from '../../../core/api/api-client';
import { RequestFeedback, RequestState } from '../../../shared/ui/request-feedback';

export interface AtendimentoPortal extends Agendamento {
  nomeServico: string;
}

@Component({
  selector: 'app-portal-page',
  imports: [DatePipe, CurrencyPipe, RouterLink, ButtonModule, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portal-page.html',
})
export class PortalPage implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly cadastroIncompleto = computed(() => !this.auth.session()?.cadastroCompleto);
  protected readonly items = signal<AtendimentoPortal[]>([]);
  protected readonly pending = computed(() =>
    this.items()
      .filter((item) => item.status === 'Pendente')
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()),
  );
  protected readonly history = computed(() =>
    this.items()
      .filter((item) => item.status === 'Concluido')
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()),
  );
  ngOnInit(): void {
    this.load();
  }
  protected load(): void {
    void this.state.run(async () => {
      this.items.set(await this.api.request('GET', '/usuarios/me/linha-do-tempo'));
    });
  }
  protected logout(): void {
    void this.state.run(async () => {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    });
  }
}
