import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AnamneseCorporal } from '../models/anamnese.model';
import { SECOES_ANAMNESE } from '../models/anamnese-corporal.config';

@Component({
  selector: 'app-anamnese-respostas',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anamnese-respostas.component.html',
})
export class AnamneseRespostasComponent {
  readonly anamnese = input.required<AnamneseCorporal>();
  protected readonly sections = computed(() => {
    const respostas = this.anamnese().respostas as unknown as Record<string, Record<string, unknown>>;
    return SECOES_ANAMNESE
      .map((section) => ({
        ...section,
        fields: section.fields
          .filter((field) => respostas[section.key]?.[field.key] !== undefined)
          .map((field) => ({ ...field, value: respostas[section.key][field.key] })),
      }))
      .filter((section) => section.fields.length > 0);
  });
  protected readonly collapsed = linkedSignal<ReadonlySet<string>>(
    () => new Set(this.sections().slice(1).map((section) => section.key)),
  );

  protected expandAll(): void {
    this.collapsed.set(new Set());
  }

  protected collapseAll(): void {
    this.collapsed.set(new Set(this.sections().map((section) => section.key)));
  }

  protected syncSection(key: string, event: Event): void {
    const open = (event.target as HTMLDetailsElement).open;
    if (this.collapsed().has(key) === !open) return;
    this.collapsed.update((current) => {
      const next = new Set(current);
      if (open) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected isEmpty(value: unknown): boolean {
    return value === null || value === undefined || (typeof value === 'string' && !value.trim());
  }

  protected display(value: unknown, type: string): string {
    if (this.isEmpty(value)) return 'Não informado';
    if (value === true) return 'Sim';
    if (value === false) return 'Não';
    if (type === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value.split('-').reverse().join('/');
    }
    return String(value);
  }
}
