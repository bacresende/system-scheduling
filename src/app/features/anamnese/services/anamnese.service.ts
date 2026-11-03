import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiClient } from '../../../core/api/api-client';
import { Agendamento } from '../../agendamentos/models/agendamento.model';
import { AgendamentosService } from '../../agendamentos/services/agendamentos.service';
import { AuthService } from '../../auth/services/auth.service';
import { Anamnese } from '../models/anamnese.model';

export type RespostasAnamnese = Omit<
  Anamnese,
  'id' | 'idCliente' | 'idServico' | 'idAgendamento' | 'dataPreenchimento'
>;

@Injectable({ providedIn: 'root' })
export class AnamneseService {
  private readonly api = inject(ApiClient);

  get(id: string): Promise<Anamnese | null> {
    return this.api.request('GET', `/anamnese?agendamento=${encodeURIComponent(id)}`);
  }

  save(id: string, respostas: RespostasAnamnese): Promise<Anamnese> {
    return this.api.request('PUT', `/anamnese/${encodeURIComponent(id)}`, respostas);
  }

  saveStandalone(respostas: RespostasAnamnese): Promise<Anamnese> {
    return this.api.request('POST', '/createAnamneseAvulsa', respostas);
  }
}

@Injectable()
export class AnamneseContext {
  private readonly bookings = inject(AgendamentosService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly booking = signal<Agendamento | null>(null);
  readonly editable = signal(false);
  readonly standalone = signal(false);

  async load(): Promise<string | null> {
    if (
      this.route.snapshot.routeConfig?.path === 'anamnese' &&
      !this.route.snapshot.queryParamMap.get('agendamento')
    ) {
      if (this.auth.session()?.perfil !== 'CLIENTE') {
        throw new Error('Entre como cliente para preencher a ficha de anamnese.');
      }
      this.standalone.set(true);
      this.editable.set(true);
      return null;
    }

    const id = this.route.snapshot.queryParamMap.get('agendamento');
    if (!id)
      throw new Error(
        'Abra a ficha a partir de um agendamento para identificar cliente e serviço.',
      );
    const booking = await this.bookings.get(id);
    const session = this.auth.session();
    if (session?.perfil !== 'ADMIN' && session?.id !== booking.idCliente) {
      throw new Error('Esta ficha não pertence à sua conta.');
    }
    this.booking.set(booking);
    return id;
  }

  editableId(): string {
    const booking = this.booking();
    if (!booking || !this.editable())
      throw new Error('A ficha está indisponível ou o atendimento já foi encerrado.');
    return booking.id;
  }
}
