import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TimelineModule } from 'primeng/timeline';
import { Agendamento } from '../../agendamentos/models/agendamento.model';
import { AuthService } from '../../auth/services/auth.service';
import { ApiClient } from '../../../core/api/api-client';
import { TipoAnamnese } from '../../servicos/models/servico.model';
import { RequestFeedback, RequestState } from '../../../shared/ui/request-feedback';

export interface AtendimentoPortal extends Agendamento {
  nomeServico: string;
  tipoAnamneseExigida: TipoAnamnese;
}

@Component({
  selector: 'app-portal-page',
  imports: [DatePipe, CurrencyPipe, RouterLink, ButtonModule, TimelineModule, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl p-4 md:p-8">
      <header class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 class="text-3xl font-bold">Meu portal</h1>
        <p-button label="Sair" severity="secondary" (onClick)="logout()" [disabled]="state.busy()" />
      </header>
      <app-request-feedback />
      <p-button label="Atualizar" severity="secondary" (onClick)="load()" [disabled]="state.busy()" styleClass="mb-4" />
      <h2 class="mb-4 text-2xl font-semibold">Próximos atendimentos</h2>
      <section class="mb-8 grid gap-4 md:grid-cols-2">
        @for (item of pending(); track item.id) {
          <article class="rounded-xl border border-estetica-secondary bg-white p-4">
            <h3 class="font-bold">{{ item.nomeServico }}</h3>
            <p>{{ item.dataHora | date:'dd/MM/yyyy HH:mm' }}</p>
            <a [routerLink]="['/anamnese', item.tipoAnamneseExigida.toLowerCase()]" [queryParams]="{ agendamento: item.id }" class="mt-3 inline-block underline">Preencher anamnese</a>
          </article>
        } @empty { <p>Nenhum atendimento pendente carregado.</p> }
      </section>
      <h2 class="mb-4 text-2xl font-semibold">Minha evolução</h2>
      <p-timeline [value]="history()" styleClass="w-full">
        <ng-template #content let-item>
          <article class="mb-6 rounded-xl bg-white p-4">
            <h3 class="font-bold">{{ item.nomeServico }}</h3>
            <p>{{ item.dataHora | date:'dd/MM/yyyy HH:mm' }} · {{ item.valor | currency:'BRL' }}</p>
            @if (item.fotoResultadoUrl) {
              <img [src]="item.fotoResultadoUrl" [alt]="'Resultado de ' + item.nomeServico + ' em ' + (item.dataHora | date:'dd/MM/yyyy')" loading="lazy" width="480" height="360" class="mt-3 h-auto w-full rounded-lg object-contain" />
            } @else { <p class="mt-3">Sem fotografia de resultado.</p> }
            @if (item.anotacoesFinais) { <p class="mt-3">{{ item.anotacoesFinais }}</p> }
          </article>
        </ng-template>
      </p-timeline>
      @if (!history().length) { <p>Nenhum atendimento concluído carregado.</p> }
    </main>
  `
})
export class PortalPage implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly items = signal<AtendimentoPortal[]>([]);
  protected readonly pending = computed(() => this.items().filter(item => item.status === 'Pendente')
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()));
  protected readonly history = computed(() => this.items().filter(item => item.status === 'Concluido')
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()));
  ngOnInit(): void { this.load(); }
  protected load(): void {
    void this.state.run(async () => {
      this.items.set(await this.api.request('GET', '/clientes/me/linha-do-tempo'));
    });
  }
  protected logout(): void {
    void this.state.run(async () => {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    });
  }
}
