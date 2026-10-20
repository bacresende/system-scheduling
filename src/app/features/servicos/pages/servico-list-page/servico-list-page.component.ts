import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-servico-list-page',
  standalone: true,
  templateUrl: './servico-list-page.component.html',
  styleUrl: './servico-list-page.component.scss'
})
export class ServicoListPageComponent {
  protected readonly servicos = signal([
    { nome: 'Corte masculino', duracao: '45 min', preco: '€45' },
    { nome: 'Coloração', duracao: '90 min', preco: '€95' },
    { nome: 'Tratamento facial', duracao: '60 min', preco: '€70' }
  ]);
}
