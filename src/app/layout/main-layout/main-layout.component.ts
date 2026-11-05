import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
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
  host: { '[class.compact-navigation]': 'compactNavigation()' },
})
export class MainLayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly state = inject(RequestState);
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);
  protected readonly compactNavigation = signal(false);
  private readonly navigationProbe = viewChild.required<ElementRef<HTMLElement>>('navigationProbe');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const probe = this.navigationProbe().nativeElement;
      const document = probe.ownerDocument;
      const window = document.defaultView;
      if (!window) return;
      let focusFrame = 0;
      const measure = () => {
        const requiredWidth = Math.ceil(probe.getBoundingClientRect().width);
        if (!requiredWidth) return;
        const availableWidth = Math.min(
          document.documentElement.clientWidth,
          window.visualViewport?.width ?? document.documentElement.clientWidth,
        );
        const compact = requiredWidth > Math.floor(availableWidth);
        if (compact === this.compactNavigation()) return;
        const focusedNavigation = this.host.nativeElement.contains(document.activeElement) &&
          document.activeElement?.closest('nav, .layout-menu-toggle');
        this.compactNavigation.set(compact);
        this.menuOpen.set(false);
        if (focusedNavigation) {
          window.cancelAnimationFrame(focusFrame);
          focusFrame = window.requestAnimationFrame(() => {
            const candidates = this.host.nativeElement.querySelectorAll<HTMLElement>(
              '.layout-menu-toggle, .bottom-navigation a, #navegacao-principal a',
            );
            Array.from(candidates).find(element => element.getClientRects().length)?.focus();
          });
        }
      };
      const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
      observer?.observe(probe);
      observer?.observe(document.documentElement);
      window.addEventListener('resize', measure);
      window.visualViewport?.addEventListener('resize', measure);
      measure();
      this.destroyRef.onDestroy(() => {
        observer?.disconnect();
        window.removeEventListener('resize', measure);
        window.visualViewport?.removeEventListener('resize', measure);
        window.cancelAnimationFrame(focusFrame);
      });
    });
  }
  protected readonly navItems = [
    { label: 'Dashboard', mobileLabel: 'Painel', icon: 'pi pi-chart-pie', path: '/dashboard' },
    { label: 'Agendamentos', mobileLabel: 'Agenda', icon: 'pi pi-calendar', path: '/agendamentos' },
    { label: 'Clientes', mobileLabel: 'Clientes', icon: 'pi pi-users', path: '/clientes' },
    { label: 'Serviços', mobileLabel: 'Serviços', icon: 'pi pi-briefcase', path: '/servicos' },

    { label: 'Cupons', mobileLabel: 'Cupons', icon: 'pi pi-gift', path: '/cupons' },
  ];
  protected logout(): void {
    void this.state.run(async () => {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    });
  }
}
