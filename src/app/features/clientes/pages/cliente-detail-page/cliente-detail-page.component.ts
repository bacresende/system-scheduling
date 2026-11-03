import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BirthdatePipe } from '../../../../shared/pipes/birthdate.pipe';
import { CepPipe } from '../../../../shared/pipes/cep.pipe';
import { CpfPipe } from '../../../../shared/pipes/cpf.pipe';
import { TelefonePipe } from '../../../../shared/pipes/telefone.pipe';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { AtendimentoCliente, ClienteProntuario } from '../../models/cliente-prontuario.model';
import { ClienteProntuarioService } from '../../services/cliente-prontuario.service';

interface FotoTimelineItem {
  id: string;
  url: string;
  dataHora: Date;
  nomeServico: string;
  idAgendamento: string;
}

@Component({
  selector: 'app-cliente-detail-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    BirthdatePipe,
    CepPipe,
    CpfPipe,
    TelefonePipe,
    RequestFeedback,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cliente-detail-page.component.html',
})
export class ClienteDetailPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(ClienteProntuarioService);
  private readonly route = inject(ActivatedRoute);
  protected readonly prontuario = signal<ClienteProntuario | null>(null);

  protected readonly agendamentos = computed(() =>
    [...(this.prontuario()?.agendamentos ?? [])].sort(
      (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
    ),
  );

  protected readonly fotos = computed(() => {
    const items: FotoTimelineItem[] = [];

    for (const atendimento of this.agendamentos()) {
      const urls = atendimento.fotosResultadoUrls?.length
        ? atendimento.fotosResultadoUrls
        : atendimento.fotoResultadoUrl
          ? [atendimento.fotoResultadoUrl]
          : [];
      const dataHora = new Date(atendimento.dataHora);
      if (!Number.isFinite(dataHora.getTime())) continue;

      for (const [index, url] of [...new Set(urls)].entries()) {
        items.push({
          id: `${atendimento.id}:${index}`,
          url,
          dataHora,
          nomeServico: atendimento.nomeServico,
          idAgendamento: atendimento.id,
        });
      }
    }

    return items.sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime());
  });

  ngOnInit(): void {
    void this.state.run(async () => {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) throw new Error('Cliente não informado.');
      this.prontuario.set(await this.api.get(id));
    });
  }

  protected statusAgendamento(item: AtendimentoCliente): string {
    switch (item.status) {
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

  protected simNao(value: boolean): string {
    return value ? 'Sim' : 'Não';
  }
}
