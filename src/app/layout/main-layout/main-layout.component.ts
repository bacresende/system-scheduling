import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  protected readonly navItems = signal([
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Agendamentos', path: '/agendamentos' },
    { label: 'Clientes', path: '/clientes' },
    { label: 'Serviços', path: '/servicos' }
  ]);
}
