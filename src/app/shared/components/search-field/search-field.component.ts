import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-search-field',
  imports: [InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <label [for]="inputId()" class="sr-only">{{ label() }}</label>
    <div class="relative">
      <i
        class="pi pi-search pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-estetica-primary-dark"
        aria-hidden="true"
      ></i>
      <input
        pInputText
        [id]="inputId()"
        type="text"
        role="searchbox"
        autocomplete="off"
        [value]="value()"
        (input)="handleInput($event)"
        [disabled]="disabled()"
        [attr.aria-controls]="controls() || null"
        [placeholder]="placeholder()"
        class="min-h-12 w-full rounded-xl border-estetica-secondary bg-white pr-12 pl-11 text-estetica-text shadow-xs placeholder:text-estetica-text/65 focus:border-estetica-primary focus:ring-1 focus:ring-estetica-primary"
      />
      @if (value()) {
        <button
          type="button"
          [attr.aria-label]="clearLabel()"
          (click)="clear()"
          class="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-estetica-primary-dark hover:bg-estetica-secondary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-estetica-primary"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
})
export class SearchFieldComponent {
  readonly inputId = input.required<string>();
  readonly label = input('Buscar');
  readonly placeholder = input('Buscar');
  readonly clearLabel = input('Limpar busca');
  readonly controls = input<string>();
  readonly disabled = input(false);
  readonly value = input('');
  readonly valueChange = output<string>();

  protected handleInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  protected clear(): void {
    this.valueChange.emit('');
  }
}
