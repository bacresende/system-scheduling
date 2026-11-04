import { inject, Injectable, signal } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { AuthService } from '../../auth/services/auth.service';
import { Anamnese } from '../models/anamnese.model';

export type RespostasAnamnese = Omit<Anamnese, 'id' | 'idCliente' | 'dataPreenchimento'>;

@Injectable({ providedIn: 'root' })
export class AnamneseService {
  private readonly api = inject(ApiClient);

  saveStandalone(respostas: RespostasAnamnese): Promise<Anamnese> {
    return this.api.request('POST', '/createAnamnese', respostas);
  }
}

@Injectable()
export class AnamneseContext {
  private readonly auth = inject(AuthService);
  readonly editable = signal(false);
  load(): void {
    if (this.auth.session()?.perfil !== 'CLIENTE') {
      throw new Error('Entre como cliente para preencher a ficha de anamnese.');
    }
    this.editable.set(true);
  }
}
