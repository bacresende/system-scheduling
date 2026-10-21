import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService, Sessao } from './auth.service';
import { errorMessage } from '../../../core/api/api-client';

export function homeFor(session: Sessao): string {
  if (session.papel === 'ADMIN') return '/dashboard';
  return session.cliente?.cadastroCompleto ? '/portal' : '/completar-cadastro';
}

export const sessionGuard: CanActivateFn = (_route, state): Observable<boolean | ReturnType<Router['createUrlTree']>> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.restore().pipe(
    map(session => {
      if (!session) return router.createUrlTree(['/login'], { queryParams: { retorno: state.url } });
      if (session.papel === 'CLIENTE' && !session.cliente?.cadastroCompleto &&
          state.url.split('?')[0] !== '/completar-cadastro') {
        return router.createUrlTree(['/completar-cadastro']);
      }
      return true;
    }),
    catchError((error: unknown) => of(router.createUrlTree(['/login'], {
      queryParams: { erro: errorMessage(error) }
    })))
  );
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
