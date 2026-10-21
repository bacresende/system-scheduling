import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { Agendamento, MetodoPagamento } from '../../models/agendamento.model';
import { AgendamentosService } from '../../services/agendamentos.service';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { ServicosService } from '../../../servicos/services/servicos.service';
import { whatsappLink } from '../../services/agenda-rules';
import { FieldError } from '../../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-agendamento-detail-page',
  imports: [DatePipe, CurrencyPipe, ReactiveFormsModule, RouterLink, ButtonModule, SelectModule,
    TextareaModule, FileUploadModule, FieldError, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agendamento-detail-page.component.html',
  styleUrl: './agendamento-detail-page.component.css'
})
export class AgendamentoDetailPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(AgendamentosService);
  private readonly clientsApi = inject(ClientesService);
  private readonly servicesApi = inject(ServicosService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly booking = signal<Agendamento | null>(null);
  protected readonly clientName = signal('');
  protected readonly serviceName = signal('');
  protected readonly reminder = signal('');
  protected readonly anamnese = signal('');
  protected readonly photo = signal<File | null>(null);
  protected readonly cancelConfirmation = signal(false);
  protected readonly pagamentos: MetodoPagamento[] = ['PIX', 'Cartao', 'Dinheiro'];
  protected readonly form = inject(FormBuilder).nonNullable.group({
    metodoPagamento: ['PIX' as MetodoPagamento, Validators.required],
    anotacoesFinais: ['']
  });
  ngOnInit(): void {
    void this.state.run(async () => {
      if (!this.id) throw new Error('Agendamento não informado.');
      const [booking, clients, services] = await Promise.all([
        firstValueFrom(this.api.get(this.id)),
        firstValueFrom(this.clientsApi.list()),
        firstValueFrom(this.servicesApi.list())
      ]);
      this.booking.set(booking);
      const client = clients.find(item => item.id === booking.idCliente);
      const service = services.find(item => item.id === booking.idServico);
      this.clientName.set(client?.nome ?? booking.idCliente);
      this.serviceName.set(service?.nome ?? booking.idServico);
      if (service) this.anamnese.set(`/anamnese/${service.tipoAnamneseExigida.toLowerCase()}`);
      if (client) this.reminder.set(whatsappLink(client.telefone,
        `Olá, ${client.nome}! Lembramos seu agendamento de ${service?.nome ?? 'procedimento'} em ${new Date(booking.dataHora).toLocaleString('pt-BR')}.`));
    });
  }
  protected choose(files: File[]): void { this.photo.set(files[0] ?? null); }
  protected cancel(): void {
    const booking = this.booking();
    if (!booking || booking.status !== 'Pendente') {
      this.state.error.set('Somente agendamentos pendentes podem ser cancelados.'); return;
    }
    void this.state.run(async () => {
      this.booking.set(await firstValueFrom(this.api.cancel(booking.id)));
      this.cancelConfirmation.set(false);
    }, 'Agendamento cancelado.');
  }
  protected complete(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const booking = this.booking();
    if (!booking || booking.status !== 'Pendente') {
      this.state.error.set('Somente agendamentos pendentes podem ser concluídos.'); return;
    }
    void this.state.run(async () => {
      const file = this.photo();
      const fotoResultadoUrl = file ? await firstValueFrom(this.api.upload(booking.id, file)) : undefined;
      this.booking.set(await firstValueFrom(this.api.complete(booking.id, {
        ...this.form.getRawValue(), fotoResultadoUrl
      })));
      this.photo.set(null);
    }, 'Agendamento concluído e pagamento registrado.');
  }
}
