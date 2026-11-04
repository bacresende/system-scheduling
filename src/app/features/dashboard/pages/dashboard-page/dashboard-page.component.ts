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
import { StatusAgendamento } from '../../../agendamentos/models/agendamento.model';
import { endTime } from '../../../agendamentos/services/agenda-rules';
import { DashboardService, ResumoDashboard } from '../../services/dashboard.service';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';
import { BannerCompletarCadastro } from '../../../../shared/components/banner-completar-cadastro/banner-completar-cadastro';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    ButtonModule,
    RequestFeedback,
    BannerCompletarCadastro,
  ],
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
  protected readonly agendamentosHoje = computed(() => this.summary()?.agendaHoje ?? []);
  protected readonly endTime = endTime;
  protected readonly attention = computed(() => {
    const agendamentos = this.agendamentosHoje();
    const ativos = agendamentos.filter((item) => this.isAtivo(item.status));
    return {
      confirmacoes: agendamentos.filter((item) => item.status === 'AguardandoConfirmacao').length,
      alteracoes: agendamentos.filter(
        (item) =>
          item.status !== 'Cancelado' &&
          item.status !== 'Concluido' &&
          item.reagendado &&
          item.reagendadoPor === 'CLIENTE' &&
          !item.alteracaoVistaPeloAdmin,
      ).length,
      vencidos: ativos.filter((item) => {
        const inicio = new Date(item.dataHora);
        return (
          Number.isFinite(inicio.getTime()) &&
          endTime(inicio, item.duracaoMinutos).getTime() < Date.now()
        );
      }).length,
    };
  });
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

  protected statusLabel(status: StatusAgendamento): string {
    switch (status) {
      case 'AguardandoConfirmacao':
        return 'Aguardando confirmação';
      case 'Confirmado':
        return 'Confirmado';
      case 'Pendente':
        return 'Pendente';
      case 'Concluido':
        return 'Concluído';
      case 'Cancelado':
        return 'Cancelado';
    }
  }

  protected statusClass(status: StatusAgendamento): string {
    switch (status) {
      case 'AguardandoConfirmacao':
      case 'Pendente':
        return 'bg-amber-100 text-amber-900';
      case 'Confirmado':
        return 'bg-emerald-100 text-emerald-900';
      case 'Concluido':
        return 'bg-estetica-secondary text-estetica-text';
      case 'Cancelado':
        return 'bg-rose-100 text-rose-900';
    }
  }

  private isAtivo(status: StatusAgendamento): boolean {
    return status === 'AguardandoConfirmacao' || status === 'Confirmado' || status === 'Pendente';
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
