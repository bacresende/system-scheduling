import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { errorMessage } from '../../../core/api/api-client';

export function homeFor(urlDestino: string | null, perfil: string | undefined): string {
  if (urlDestino) {
    return urlDestino;
  } else if (perfil === 'ADMIN') {
    return '/dashboard';
  } else if (perfil === 'CLIENTE') {
    return '/portal';
  } else {
    return '/login';
  }
}

export const sessionGuard: CanActivateFn = async (
  _route,
  state,
): Promise<boolean | ReturnType<Router['createUrlTree']>> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    const session = await auth.restore();
    if (!session) {
      return router.createUrlTree(['/login']);
    }
    if (
      session.perfil === 'CLIENTE' &&
      !session?.cadastroCompleto &&
      !['/completar-cadastro', '/portal', '/anamnese'].includes(state.url.split('?')[0])
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
    session?.perfil === 'ADMIN' ||
    router.createUrlTree([session ? homeFor(null, session.perfil) : '/login'])
  );
};

export const clientGuard: CanActivateFn = () => {
  const session = inject(AuthService).session();
  const router = inject(Router);
  return (
    session?.perfil === 'CLIENTE' ||
    router.createUrlTree([session ? homeFor(null, session.perfil) : '/login'])
  );
};

export const clientAnamneseGuard: CanActivateFn = (_route, state) => {
  const session = inject(AuthService).session();
  const router = inject(Router);
  if (session?.perfil === 'CLIENTE') return true;
  if (session) return router.createUrlTree(['/dashboard']);
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
