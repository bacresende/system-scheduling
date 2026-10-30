import { Routes } from '@angular/router';
import { clientGuard } from './features/auth/services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (module) => module.LoginPageComponent,
      ),
  },
  {
    path: 'pre-cadastro',
    loadComponent: () =>
      import('./features/auth/pages/pre-cadastro-page/pre-cadastro-page').then(
        (module) => module.PreCadastroPage,
      ),
  },
  {
    path: 'completar-cadastro',
    loadComponent: () =>
      import('./features/clientes/pages/completar-cadastro-page').then(
        (module) => module.CompletarCadastroPage,
      ),
    //canActivate: [sessionGuard],
  },
  {
    path: '',
    //canActivate: [sessionGuard],
    //canActivateChild: [sessionGuard],
    children: [
      {
        path: 'portal',
        loadComponent: () =>
          import('./features/portal/pages/portal-page').then((module) => module.PortalPage),
        canActivate: [clientGuard],
      },
      { path: 'anamnese/facial', pathMatch: 'full', redirectTo: 'anamnese' },
      { path: 'anamnese/corporal', pathMatch: 'full', redirectTo: 'anamnese' },
      { path: 'anamnese/capilar', pathMatch: 'full', redirectTo: 'anamnese' },
      { path: 'anamnese/sobrancelha', pathMatch: 'full', redirectTo: 'anamnese' },
      {
        path: 'anamnese',
        loadComponent: () =>
          import('./features/anamnese/pages/anamnese-page/anamnese-page.component').then(
            (module) => module.AnamnesePageComponent,
          ),
      },
      {
        path: '',
        loadComponent: () =>
          import('./layout/main-layout/main-layout.component').then(
            (module) => module.MainLayoutComponent,
          ),
        //canActivateChild: [adminGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
                (module) => module.DashboardPageComponent,
              ),
          },
          {
            path: 'agendamentos',
            loadComponent: () =>
              import(
                './features/agendamentos/pages/agendamento-list-page/agendamento-list-page.component'
              ).then((module) => module.AgendamentoListPageComponent),
          },
          {
            path: 'agendamentos/:id',
            loadComponent: () =>
              import(
                './features/agendamentos/pages/agendamento-detail-page/agendamento-detail-page.component'
              ).then((module) => module.AgendamentoDetailPageComponent),
          },
          {
            path: 'clientes',
            loadComponent: () =>
              import('./features/clientes/pages/cliente-list-page/cliente-list-page.component').then(
                (module) => module.ClienteListPageComponent,
              ),
          },
          {
            path: 'servicos',
            loadComponent: () =>
              import('./features/servicos/pages/servico-list-page/servico-list-page.component').then(
                (module) => module.ServicoListPageComponent,
              ),
          },
          {
            path: 'oportunidades',
            loadComponent: () =>
              import(
                './features/oportunidades/pages/oportunidade-page/oportunidade-page.component'
              ).then((module) => module.OportunidadePageComponent),
          },
          {
            path: 'cupons',
            loadComponent: () =>
              import('./features/cupons/pages/criar-cupom/criar-cupom.component').then(
                (module) => module.CriarCupomComponent,
              ),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found-page').then((module) => module.NotFoundPage),
  },
];
