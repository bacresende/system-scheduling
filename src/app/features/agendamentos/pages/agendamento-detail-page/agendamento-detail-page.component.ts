import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { Agendamento, MetodoPagamento, StatusAgendamento } from '../../models/agendamento.model';
import { AgendamentosService } from '../../services/agendamentos.service';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { ServicosService } from '../../../servicos/services/servicos.service';
import { endTime, whatsappLink } from '../../services/agenda-rules';
import { FieldError } from '../../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-agendamento-detail-page',
  imports: [
    DatePipe,
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    TextareaModule,
    FileUploadModule,
    FieldError,
    RequestFeedback,
  ],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agendamento-detail-page.component.html',
  styleUrl: './agendamento-detail-page.component.css',
})
export class AgendamentoDetailPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(AgendamentosService);
  private readonly usuariosApi = inject(UsuariosService);
  private readonly servicesApi = inject(ServicosService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly canRetryLoad = Boolean(this.id);
  protected readonly booking = signal<Agendamento | null>(null);
  protected readonly clientName = signal('');
  protected readonly serviceName = signal('');
  protected readonly professionalName = signal('');
  protected readonly reminder = signal('');

  protected readonly photos = signal<File[]>([]);
  protected readonly cancelConfirmation = signal(false);
  protected readonly pagamentos: MetodoPagamento[] = ['PIX', 'Cartao', 'Dinheiro'];
  protected readonly form = inject(FormBuilder).nonNullable.group({
    metodoPagamento: ['PIX' as MetodoPagamento, Validators.required],
    anotacoesFinais: [''],
  });
  ngOnInit(): void {
    this.load();
  }
  protected load(): void {
    void this.state.run(async () => {
      if (!this.id) throw new Error('Agendamento não informado.');
      const [booking, clients, services, config] = await Promise.all([
        this.api.get(this.id),
        this.usuariosApi.listByProfile('CLIENTE'),
        this.servicesApi.list(),
        this.api.config(),
      ]);
      this.booking.set(booking);
      const client = clients.find((item) => item.id === booking.idCliente);
      const service = services.find((item) => item.id === booking.idServico);
      const professional = config.funcionarios.find((item) => item.id === booking.idFuncionario);
      this.clientName.set(client?.nome ?? booking.idCliente);
      this.serviceName.set(service?.nome ?? booking.idServico);
      this.professionalName.set(professional?.nome ?? booking.idFuncionario);

      if (client && booking.dataDefinida !== false)
        this.reminder.set(
          whatsappLink(
            client.telefone,
            `Olá, ${client.nome}! Lembramos seu agendamento de ${service?.nome ?? 'procedimento'} em ${new Date(booking.dataHora).toLocaleString('pt-BR')}.`,
          ),
        );
    });
  }
  protected choose(files: File[]): void {
    this.photos.set(files);
  }
  protected removePhoto(file: File): void {
    this.photos.update((photos) => photos.filter((photo) => photo !== file));
  }
  protected photoNames(): string {
    return this.photos()
      .map((photo) => photo.name)
      .join(', ');
  }
  protected statusLabel(status: StatusAgendamento): string {
    switch (status) {
      case 'AguardandoConfirmacao':
        return 'Aguardando confirmação';
      case 'Confirmado':
      case 'Pendente':
        return 'Confirmado';
      case 'Concluido':
        return 'Concluído';
      case 'Cancelado':
        return 'Cancelado';
    }
  }
  protected statusBadgeClass(status: StatusAgendamento): string {
    switch (status) {
      case 'AguardandoConfirmacao':
        return 'border-amber-300 bg-amber-100 text-amber-900';
      case 'Confirmado':
      case 'Pendente':
        return 'border-estetica-primary/40 bg-estetica-secondary text-estetica-primary';
      case 'Concluido':
        return 'border-estetica-tertiary/50 bg-estetica-tertiary/25 text-estetica-text';
      case 'Cancelado':
        return 'border-neutral-300 bg-neutral-100 text-estetica-text';
    }
  }
  protected statusMessage(status: StatusAgendamento): string {
    switch (status) {
      case 'AguardandoConfirmacao':
        return 'Este horário aguarda confirmação da equipe. Confirme o agendamento ou entre em contato com a cliente.';
      case 'Confirmado':
        return 'Horário reservado. O atendimento ainda não foi realizado.';
      case 'Pendente':
        return 'Horário reservado. Registre o pagamento e conclua o atendimento após realizá-lo.';
      case 'Concluido':
        return 'Atendimento concluído. Os dados do serviço e do valor ficam disponíveis para consulta.';
      case 'Cancelado':
        return 'Este agendamento foi cancelado.';
    }
  }
  protected isActive(status: StatusAgendamento): boolean {
    return (
      status === 'AguardandoConfirmacao' ||
      status === 'Confirmado' ||
      status === 'Pendente'
    );
  }
  protected endTime = endTime;
  protected paymentLabel(method: MetodoPagamento): string {
    switch (method) {
      case 'PIX':
        return 'Pix';
      case 'Cartao':
        return 'Cartão';
      case 'Dinheiro':
        return 'Dinheiro';
    }
  }
  protected resultPhotos(booking: Agendamento): string[] {
    return [...new Set([booking.fotoResultadoUrl, ...(booking.fotosResultadoUrls ?? [])])]
      .filter((url): url is string => Boolean(url));
  }
  protected confirm(): void {
    const booking = this.booking();
    if (!booking || booking.status !== 'AguardandoConfirmacao') {
      this.state.error.set('Somente agendamentos aguardando confirmação podem ser confirmados.');
      return;
    }
    void this.state.run(async () => {
      this.booking.set(await this.api.confirm(booking.id));
    }, 'Agendamento confirmado.');
  }
  protected cancel(): void {
    const booking = this.booking();
    if (!booking || !this.isActive(booking.status)) {
      this.state.error.set('Somente agendamentos ativos podem ser cancelados.');
      return;
    }
    void this.state.run(async () => {
      this.booking.set(await this.api.cancel(booking.id));
      this.cancelConfirmation.set(false);
    }, 'Agendamento cancelado.');
  }
  protected complete(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const booking = this.booking();
    if (!booking || !this.isActive(booking.status)) {
      this.state.error.set('Somente agendamentos ativos podem ser concluídos.');
      return;
    }
    void this.state.run(async () => {
      const existingPhotos = this.resultPhotos(booking);
      const uploadedPhotos = this.photos().length
        ? await this.api.uploadMany(booking.id, this.photos())
        : [];
      const resultPhotos = [...existingPhotos, ...uploadedPhotos];
      this.booking.set(
        await this.api.complete(booking.id, {
          ...this.form.getRawValue(),
          fotoResultadoUrl: resultPhotos[0],
          fotosResultadoUrls: resultPhotos.length ? resultPhotos : undefined,
        }),
      );
      this.photos.set([]);
    }, 'Agendamento concluído e pagamento registrado.');
  }
}
