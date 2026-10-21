import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MessageModule } from 'primeng/message';
import { ApiClient } from './core/api/api-client';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly api = inject(ApiClient);
  constructor() {
    inject(Router).events.pipe(
      filter(event => event instanceof NavigationEnd), takeUntilDestroyed()
    ).subscribe(() => {
      requestAnimationFrame(() => {
        const heading = document.querySelector<HTMLElement>('h1');
        if (heading) {
          heading.tabIndex = -1;
          heading.focus();
        }
      });
    });
  }
}
