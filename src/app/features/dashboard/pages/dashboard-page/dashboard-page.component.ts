import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  protected readonly stats = signal([
    { label: 'Agendamentos hoje', value: '42', tone: 'blue' },
    { label: 'Clientes ativos', value: '128', tone: 'green' },
    { label: 'Serviços concluídos', value: '96%', tone: 'purple' }
  ]);

  protected readonly activities = signal([
    'Novo agendamento confirmado para João Ferreira',
    'Cliente Ana Paula revisou o plano de tratamento',
    'Atendimento de beleza foi concluído com sucesso'
  ]);
}
