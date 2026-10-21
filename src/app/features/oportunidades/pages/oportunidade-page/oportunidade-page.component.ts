import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { firstValueFrom } from 'rxjs';
import { Oportunidade, OportunidadesService } from '../../services/oportunidades.service';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-oportunidade-page',
  imports: [DatePipe, ButtonModule, RequestFeedback],
  providers: [RequestState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './oportunidade-page.component.html',
  styleUrl: './oportunidade-page.component.css'
})
export class OportunidadePageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  private readonly api = inject(OportunidadesService);
  protected readonly items = signal<Oportunidade[]>([]);
  ngOnInit(): void { this.load(); }
  protected load(): void {
    void this.state.run(async () => { this.items.set(await firstValueFrom(this.api.list())); });
  }
}
