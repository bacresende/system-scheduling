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
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly state = inject(RequestState);
  private readonly router = inject(Router);
  protected readonly navItems = [
    { label: 'Dashboard', mobileLabel: 'Painel', icon: 'pi pi-chart-pie', path: '/dashboard' },
    { label: 'Agendamentos', mobileLabel: 'Agenda', icon: 'pi pi-calendar', path: '/agendamentos' },
    { label: 'Clientes', mobileLabel: 'Clientes', icon: 'pi pi-users', path: '/clientes' },
    { label: 'Serviços', mobileLabel: 'Serviços', icon: 'pi pi-briefcase', path: '/servicos' },
    {
      label: 'Oportunidades',
      mobileLabel: 'Retornos',
      icon: 'pi pi-refresh',
      path: '/oportunidades',
    },
    { label: 'Cupons', mobileLabel: 'Cupons', icon: 'pi pi-gift', path: '/cupons' },
  ];
  protected logout(): void {
    void this.state.run(async () => {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    });
  }
}
