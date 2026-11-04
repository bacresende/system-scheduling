import { inject, Injectable, signal } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { AuthService } from '../../auth/services/auth.service';
import { Anamnese, AnamneseCorporal, DetalheAnamnese } from '../models/anamnese.model';
import { CriarAnamneseCorporal } from '../models/anamnese-corporal.model';

export type RespostasAnamnese = CriarAnamneseCorporal;

@Injectable({ providedIn: 'root' })
export class AnamneseService {
  private readonly api = inject(ApiClient);

  saveStandalone(respostas: RespostasAnamnese): Promise<AnamneseCorporal> {
    return this.api.request('POST', '/createAnamnese', respostas);
  }

  get(id: string): Promise<DetalheAnamnese> {
    return this.api.request('POST', '/getAnamnese', { id });
  }

  list(params: { idCliente?: string; limit?: number; skip?: number } = {}): Promise<Anamnese[]> {
    return this.api.request('POST', '/listAnamneses', params);
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
