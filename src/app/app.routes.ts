import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page/dashboard-page.component';
import { AgendamentoListPageComponent } from './features/agendamentos/pages/agendamento-list-page/agendamento-list-page.component';
import { AgendamentoDetailPageComponent } from './features/agendamentos/pages/agendamento-detail-page/agendamento-detail-page.component';
import { ClienteListPageComponent } from './features/clientes/pages/cliente-list-page/cliente-list-page.component';
import { ServicoListPageComponent } from './features/servicos/pages/servico-list-page/servico-list-page.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'agendamentos', component: AgendamentoListPageComponent },
      { path: 'agendamentos/:id', component: AgendamentoDetailPageComponent },
      { path: 'clientes', component: ClienteListPageComponent },
      { path: 'servicos', component: ServicoListPageComponent }
    ]
  }
];
