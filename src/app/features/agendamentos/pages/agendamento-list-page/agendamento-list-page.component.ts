import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-agendamento-list-page',
  standalone: true,
  templateUrl: './agendamento-list-page.component.html',
  styleUrl: './agendamento-list-page.component.scss'
})
export class AgendamentoListPageComponent {
  protected readonly list = signal([
    { cliente: 'João Ferreira', servico: 'Corte + barba', data: '20/10/2026', status: 'Confirmado' },
    { cliente: 'Ana Paula', servico: 'Coloração', data: '22/10/2026', status: 'Pendente' },
    { cliente: 'Marcos Silva', servico: 'Tratamento facial', data: '24/10/2026', status: 'Em análise' }
  ]);
}
