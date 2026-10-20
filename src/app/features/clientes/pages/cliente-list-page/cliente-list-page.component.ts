import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-cliente-list-page',
  standalone: true,
  templateUrl: './cliente-list-page.component.html',
  styleUrl: './cliente-list-page.component.scss'
})
export class ClienteListPageComponent {
  protected readonly clientes = signal([
    { nome: 'Maria Costa', email: 'maria@email.com', status: 'Ativo' },
    { nome: 'Rafael Torres', email: 'rafael@email.com', status: 'Em revisão' },
    { nome: 'Patrícia Lima', email: 'patricia@email.com', status: 'Ativo' }
  ]);
}
