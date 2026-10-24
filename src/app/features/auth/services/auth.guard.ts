import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService, Usuario } from './auth.service';
import { errorMessage } from '../../../core/api/api-client';

export function homeFor(session: Usuario): string {
  if (session.perfil === 'ADMIN') return '/dashboard';
  return '/portal';
}

export const sessionGuard: CanActivateFn = async (
  _route,
  state,
): Promise<boolean | ReturnType<Router['createUrlTree']>> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    const session = await auth.restore();
    if (!session) return router.createUrlTree(['/login'], { queryParams: { retorno: state.url } });
    if (
      session.perfil === 'CLIENTE' &&
      !session?.cadastroCompleto &&
      !['/completar-cadastro', '/portal'].includes(state.url.split('?')[0])
    ) {
      return router.createUrlTree(['/portal']);
    }
    return true;
  } catch (error: unknown) {
    return router.createUrlTree(['/login'], {
      queryParams: { erro: errorMessage(error) },
    });
  }
};

export const adminGuard: CanActivateChildFn = () => {
  const session = inject(AuthService).session();
  const router = inject(Router);
  return (
    session?.perfil === 'ADMIN' || router.createUrlTree([session ? homeFor(session) : '/login'])
  );
};

export const clientGuard: CanActivateFn = () => {
  const session = inject(AuthService).session();
  return session?.perfil === 'CLIENTE' || inject(Router).createUrlTree(['/dashboard']);
};
