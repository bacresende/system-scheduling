import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { Agendamento } from '../../agendamentos/models/agendamento.model';
import { AgendamentosService } from '../../agendamentos/services/agendamentos.service';
import { Servico, TipoAnamnese } from '../../servicos/models/servico.model';
import { AuthService } from '../../auth/services/auth.service';
import { AnamneseCorporal, AnamneseFacial } from '../models/anamnese.model';

export type RespostasFacial = Omit<AnamneseFacial, 'id' | 'idCliente' | 'idServico' | 'idAgendamento' | 'dataPreenchimento'>;
export type RespostasCorporal = Omit<AnamneseCorporal, 'id' | 'idCliente' | 'idServico' | 'idAgendamento' | 'dataPreenchimento'>;

@Injectable({ providedIn: 'root' })
export class AnamneseService {
  private readonly api = inject(ApiClient);
  facial(id: string): Observable<AnamneseFacial | null> {
    return this.api.request('GET', `/anamnese/facial?agendamento=${encodeURIComponent(id)}`);
  }
  corporal(id: string): Observable<AnamneseCorporal | null> {
    return this.api.request('GET', `/anamnese/corporal?agendamento=${encodeURIComponent(id)}`);
  }
  saveFacial(id: string, respostas: RespostasFacial): Observable<AnamneseFacial> {
    return this.api.request('PUT', `/anamnese/facial/${encodeURIComponent(id)}`, respostas);
  }
  saveCorporal(id: string, respostas: RespostasCorporal): Observable<AnamneseCorporal> {
    return this.api.request('PUT', `/anamnese/corporal/${encodeURIComponent(id)}`, respostas);
  }
}

@Injectable()
export class AnamneseContext {
  private readonly api = inject(ApiClient);
  private readonly bookings = inject(AgendamentosService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly booking = signal<Agendamento | null>(null);
  readonly editable = signal(false);

  load(tipo: TipoAnamnese): Observable<string> {
    const id = this.route.snapshot.queryParamMap.get('agendamento');
    if (!id) return throwError(() => new Error('Abra a ficha a partir de um agendamento para identificar cliente e serviço.'));
    return this.bookings.get(id).pipe(
      switchMap(booking => this.api.request<Servico>('GET', `/servicos/${encodeURIComponent(booking.idServico)}`).pipe(
        map(service => {
          const session = this.auth.session();
          if (session?.papel !== 'ADMIN' && session?.cliente?.id !== booking.idCliente) {
            throw new Error('Esta ficha não pertence à sua conta.');
          }
          if (service.tipoAnamneseExigida !== tipo) {
            throw new Error('O serviço deste agendamento exige outro tipo de ficha.');
          }
          this.booking.set(booking);
          return id;
        })
      ))
    );
  }

  editableId(): string {
    const booking = this.booking();
    if (!booking || !this.editable()) throw new Error('A ficha está indisponível ou o atendimento já foi encerrado.');
    return booking.id;
  }
}
