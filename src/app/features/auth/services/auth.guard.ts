import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService, Sessao } from './auth.service';
import { errorMessage } from '../../../core/api/api-client';

export function homeFor(session: Sessao): string {
  if (session.papel === 'ADMIN') return '/dashboard';
  return session.cliente?.cadastroCompleto ? '/portal' : '/completar-cadastro';
}

export const sessionGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    const session = await auth.restore();
    if (!session) return router.createUrlTree(['/login'], { queryParams: { retorno: state.url } });
    if (session.papel === 'CLIENTE' && !session.cliente?.cadastroCompleto &&
        state.url.split('?')[0] !== '/completar-cadastro') {
      return router.createUrlTree(['/completar-cadastro']);
    }
    return true;
  } catch (error: unknown) {
    return router.createUrlTree(['/login'], { queryParams: { erro: errorMessage(error) } });
  }
};

export const adminGuard: CanActivateChildFn = () => {
  const session = inject(AuthService).session();
  const router = inject(Router);
  return session?.papel === 'ADMIN' || router.createUrlTree([session ? homeFor(session) : '/login']);
};

export const clientGuard: CanActivateFn = () => {
  const session = inject(AuthService).session();
  return session?.papel === 'CLIENTE' || inject(Router).createUrlTree(['/dashboard']);
};
