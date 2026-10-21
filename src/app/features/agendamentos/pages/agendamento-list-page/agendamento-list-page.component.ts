import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { Agendamento, ConfiguracaoAgenda } from '../../models/agendamento.model';
import { AgendamentosService } from '../../services/agendamentos.service';
import { endTime, validateSlot } from '../../services/agenda-rules';
import { localDay } from '../../../../shared/utils/date';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ServicosService } from '../../../servicos/services/servicos.service';
import { Servico } from '../../../servicos/models/servico.model';
import { FieldError } from '../../../../shared/ui/field-error';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-agendamento-list-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ButtonModule, DatePickerModule, SelectModule, FieldError, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agendamento-list-page.component.html',
  styleUrl: './agendamento-list-page.component.css'
})
export class AgendamentoListPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(AgendamentosService);
  private readonly clientsApi = inject(ClientesService);
  private readonly servicesApi = inject(ServicosService);
  private readonly fb = inject(FormBuilder);
  protected readonly config = signal<ConfiguracaoAgenda | null>(null);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly servicos = signal<Servico[]>([]);
  protected readonly bookings = signal<Agendamento[]>([]);
  protected readonly selectedDay = signal(new Date());
  protected readonly mode = signal<'dia' | 'semana'>('dia');
  protected readonly filter = this.fb.nonNullable.group({ data: [new Date()], modo: ['dia' as 'dia' | 'semana'] });
  protected readonly modos = [{ label: 'Diária', value: 'dia' }, { label: 'Semanal', value: 'semana' }];
  protected readonly days = computed(() => {
    const date = new Date(this.selectedDay());
    date.setHours(0, 0, 0, 0);
    if (this.mode() === 'semana') date.setDate(date.getDate() - (date.getDay() + 6) % 7);
    return Array.from({ length: this.mode() === 'dia' ? 1 : 7 }, (_, index) => {
      const day = new Date(date);
      day.setDate(date.getDate() + index);
      return {
        date: day,
        items: this.bookings().filter(item => localDay(new Date(item.dataHora)) === localDay(day))
          .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
      };
    });
  });
  protected readonly form = this.fb.group({
    dataHora: this.fb.control<Date | null>(null, Validators.required),
    idServico: this.fb.nonNullable.control('', Validators.required),
    idCliente: this.fb.nonNullable.control('', Validators.required),
    idFuncionario: this.fb.nonNullable.control('', Validators.required)
  });
  protected readonly endTime = endTime;
  ngOnInit(): void {
    void this.state.run(async () => {
      const [config, clientes, servicos] = await Promise.all([
        firstValueFrom(this.api.config()),
        firstValueFrom(this.clientsApi.list()),
        firstValueFrom(this.servicesApi.list())
      ]);
      if (config.fusoHorario !== Intl.DateTimeFormat().resolvedOptions().timeZone) {
        throw new Error(`Configure seu dispositivo no fuso da clínica (${config.fusoHorario}) para operar a agenda.`);
      }
      this.config.set(config); this.clientes.set(clientes); this.servicos.set(servicos.filter(item => item.ativo));
      await this.fetch();
    });
  }
  private async fetch(): Promise<void> {
    const first = this.days()[0].date;
    const last = new Date(first);
    last.setDate(first.getDate() + this.days().length);
    this.bookings.set(await firstValueFrom(this.api.list(first, last)));
  }
  protected refresh(): void {
    if (!this.config()) {
      this.state.error.set('Não é possível consultar a agenda sem uma configuração válida da clínica.'); return;
    }
    if (this.filter.invalid || !this.filter.controls.data.value) {
      this.state.error.set('Selecione uma data para consultar a agenda.'); return;
    }
    this.selectedDay.set(this.filter.controls.data.value);
    this.mode.set(this.filter.controls.modo.value);
    void this.state.run(() => this.fetch());
  }
  protected serviceName(id: string): string { return this.servicos().find(item => item.id === id)?.nome ?? id; }
  protected clientName(id: string): string { return this.clientes().find(item => item.id === id)?.nome ?? id; }
  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const start = value.dataHora;
    if (!start) return;
    void this.state.run(async () => {
      const config = this.config();
      const service = this.servicos().find(item => item.id === value.idServico && item.ativo);
      if (!config || !service) throw new Error('Carregue a configuração e selecione um serviço ativo.');
      if (!config.funcionarios.some(item => item.id === value.idFuncionario)) throw new Error('Selecione um profissional válido.');
      if (!this.clientes().some(item => item.id === value.idCliente)) throw new Error('Selecione uma cliente válida.');
      const dayStart = new Date(start); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const bookings = await firstValueFrom(this.api.list(dayStart, dayEnd));
      const error = validateSlot(start, service.duracaoMinutos, config.expediente, bookings);
      if (error) throw new Error(error);
      await firstValueFrom(this.api.create({ ...value, dataHora: start.toISOString() }));
      this.form.reset();
      await this.fetch();
    }, 'Agendamento criado.');
  }
}
