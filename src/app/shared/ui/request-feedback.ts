import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injectable,
  OnDestroy,
  PendingTasks,
  signal,
} from '@angular/core';
import { MessageModule } from 'primeng/message';
import { errorMessage } from '../../core/api/api-client';

const FEEDBACK_DURATION_MS = 5000;

@Injectable()
export class RequestState implements OnDestroy {
  private readonly pendingTasks = inject(PendingTasks);
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  async run(action: () => Promise<void>, success = ''): Promise<void> {
    if (this.busy()) return;
    this.clearFeedbackTimeout();
    const complete = this.pendingTasks.add();
    this.busy.set(true);
    this.error.set('');
    this.success.set('');
    try {
      await action();
      this.success.set(success);
      if (success) this.scheduleFeedbackClear();
    } catch (error: unknown) {
      this.error.set(errorMessage(error));
      this.scheduleFeedbackClear();
    } finally {
      this.busy.set(false);
      complete();
    }
  }

  ngOnDestroy(): void {
    this.clearFeedbackTimeout();
  }

  private scheduleFeedbackClear(): void {
    this.feedbackTimeout = setTimeout(() => {
      this.success.set('');
      this.feedbackTimeout = null;
    }, FEEDBACK_DURATION_MS);
  }

  private clearFeedbackTimeout(): void {
    if (this.feedbackTimeout === null) return;
    clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = null;
  }
}

@Component({
  selector: 'app-request-feedback',
  imports: [MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state.busy()) {
      <p role="status" class="my-3">Processando…</p>
    }
    @if (state.error()) {
      <p-message severity="error" styleClass="my-3 w-full" role="alert">{{
        state.error()
      }}</p-message>
    }
    @if (state.success()) {
      <p-message severity="success" styleClass="my-3 w-full" role="status">{{
        state.success()
      }}</p-message>
    }
  `,
})
export class RequestFeedback {
  protected readonly state = inject(RequestState);
}
