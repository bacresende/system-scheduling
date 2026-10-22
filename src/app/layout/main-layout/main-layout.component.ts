import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../features/auth/services/auth.service';
import { RequestFeedback, RequestState } from '../../shared/ui/request-feedback';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ButtonModule, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly state = inject(RequestState);
  private readonly router = inject(Router);
  protected readonly navItems = [
    { label: 'Dashboard', path: '/dashboard' }, { label: 'Agendamentos', path: '/agendamentos' },
    { label: 'Clientes', path: '/clientes' }, { label: 'Serviços', path: '/servicos' },
    { label: 'Oportunidades', path: '/oportunidades' }
  ];
  protected logout(): void {
    void this.state.run(async () => {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    });
  }
}
