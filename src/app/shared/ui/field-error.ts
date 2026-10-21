import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <small class="block text-red-600" role="alert">Preencha este campo com um valor válido.</small>
    }
  `
})
export class FieldError {
  readonly control = input.required<AbstractControl>();
  private readonly events = toSignal(toObservable(this.control).pipe(switchMap(control => control.events)));
  protected readonly visible = computed(() => {
    this.events();
    const control = this.control();
    return control.invalid && (control.dirty || control.touched);
  });
}
