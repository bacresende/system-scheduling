import { ChangeDetectionStrategy, Component, inject, Injectable, PendingTasks, signal } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { errorMessage } from '../../core/api/api-client';

@Injectable()
export class RequestState {
  private readonly pendingTasks = inject(PendingTasks);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  async run(action: () => Promise<void>, success = ''): Promise<void> {
    if (this.busy()) return;
    const complete = this.pendingTasks.add();
    this.busy.set(true);
    this.error.set('');
    this.success.set('');
    try {
      await action();
      this.success.set(success);
    } catch (error: unknown) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
      complete();
    }
  }
}

@Component({
  selector: 'app-request-feedback',
  imports: [MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state.busy()) { <p role="status" class="my-3">Processando…</p> }
    @if (state.error()) {
      <p-message severity="error" styleClass="my-3 w-full" role="alert">{{ state.error() }}</p-message>
    }
    @if (state.success()) {
      <p-message severity="success" styleClass="my-3 w-full" role="status">{{ state.success() }}</p-message>
    }
  `
})
export class RequestFeedback {
  protected readonly state = inject(RequestState);
}
