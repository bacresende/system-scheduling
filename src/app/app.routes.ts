import { Routes } from '@angular/router';
import { adminGuard, clientGuard, sessionGuard } from './features/auth/services/auth.guard';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { PreCadastroPage } from './features/auth/pages/pre-cadastro-page/pre-cadastro-page';
import { CompletarCadastroPage } from './features/clientes/pages/completar-cadastro-page';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page/dashboard-page.component';
import { AgendamentoListPageComponent } from './features/agendamentos/pages/agendamento-list-page/agendamento-list-page.component';
import { AgendamentoDetailPageComponent } from './features/agendamentos/pages/agendamento-detail-page/agendamento-detail-page.component';
import { ClienteListPageComponent } from './features/clientes/pages/cliente-list-page/cliente-list-page.component';
import { ServicoListPageComponent } from './features/servicos/pages/servico-list-page/servico-list-page.component';
import { OportunidadePageComponent } from './features/oportunidades/pages/oportunidade-page/oportunidade-page.component';
import { AnamnesePageComponent } from './features/anamnese/pages/anamnese-page/anamnese-page.component';
import { PortalPage } from './features/portal/pages/portal-page';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { NotFoundPage } from './not-found-page';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'pre-cadastro', component: PreCadastroPage },
  {
    path: 'completar-cadastro',
    component: CompletarCadastroPage,
    //canActivate: [sessionGuard],
  },
  {
    path: '',
    //canActivate: [sessionGuard],
    //canActivateChild: [sessionGuard],
    children: [
      {
        path: 'portal',
        component: PortalPage,
        canActivate: [clientGuard],
      },
      { path: 'anamnese/facial', pathMatch: 'full', redirectTo: 'anamnese' },
      { path: 'anamnese/corporal', pathMatch: 'full', redirectTo: 'anamnese' },
      { path: 'anamnese/capilar', pathMatch: 'full', redirectTo: 'anamnese' },
      { path: 'anamnese/sobrancelha', pathMatch: 'full', redirectTo: 'anamnese' },
      { path: 'anamnese', component: AnamnesePageComponent },
      {
        path: '',
        component: MainLayoutComponent,
        //canActivateChild: [adminGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', component: DashboardPageComponent },
          { path: 'agendamentos', component: AgendamentoListPageComponent },
          { path: 'agendamentos/:id', component: AgendamentoDetailPageComponent },
          { path: 'clientes', component: ClienteListPageComponent },
          { path: 'servicos', component: ServicoListPageComponent },
          { path: 'oportunidades', component: OportunidadePageComponent },
        ],
      },
    ],
  },
  { path: '**', component: NotFoundPage },
];
