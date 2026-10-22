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
import { AnamneseFacialPageComponent } from './features/anamnese/pages/anamnese-facial-page/anamnese-facial-page.component';
import { AnamneseCorporalPageComponent } from './features/anamnese/pages/anamnese-corporal-page/anamnese-corporal-page.component';
import { AnamnesePendentePage } from './features/anamnese/pages/anamnese-pendente-page';
import { PortalPage } from './features/portal/pages/portal-page';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { NotFoundPage } from './not-found-page';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'pre-cadastro', component: PreCadastroPage },
  {
    path: '',
    //canActivate: [sessionGuard],
    //canActivateChild: [sessionGuard],
    children: [
      { path: 'completar-cadastro', component: CompletarCadastroPage, canActivate: [clientGuard] },
      {
        path: 'portal',
        component: PortalPage,
        //canActivate: [clientGuard],
      },
      { path: 'anamnese/facial', component: AnamneseFacialPageComponent },
      { path: 'anamnese/corporal', component: AnamneseCorporalPageComponent },
      { path: 'anamnese/capilar', component: AnamnesePendentePage },
      { path: 'anamnese/sobrancelha', component: AnamnesePendentePage },
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
