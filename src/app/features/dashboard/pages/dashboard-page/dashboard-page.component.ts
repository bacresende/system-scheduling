import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DashboardService, ResumoDashboard } from '../../services/dashboard.service';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-dashboard-page',
  imports: [CurrencyPipe, RouterLink, ButtonModule, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(DashboardService);
  protected readonly summary = signal<ResumoDashboard | null>(null);
  ngOnInit(): void { this.load(); }
  protected load(): void { void this.state.run(async () => { this.summary.set(await this.api.get()); }); }
}
