import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { NovoUsuario, PerfilUsuario, Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly api = inject(ApiClient);

  listByProfile(perfil: PerfilUsuario): Promise<Usuario[]> {
    return this.api.request('POST', '/listUsuarios', { perfil });
  }

  create(payload: NovoUsuario): Promise<Usuario> {
    return this.api.request('POST', '/createUsuario', payload);
  }
}
