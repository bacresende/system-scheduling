import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AnamneseCorporal } from '../models/anamnese.model';
import { SECOES_ANAMNESE } from '../models/anamnese-corporal.config';

@Component({
  selector: 'app-anamnese-respostas',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (section of sections; track section.key) {
      @if (hasSection(section.key)) {
      <details class="mt-3 rounded-lg border border-estetica-secondary p-3">
        <summary class="cursor-pointer font-semibold">{{ section.label }}</summary>
        <dl class="mt-3 grid gap-3 sm:grid-cols-2">
          @for (field of section.fields; track field.key) {
            @if (value(section.key, field.key) !== undefined) {
              <div><dt class="text-xs text-estetica-text/70">{{ field.label }}</dt>
                <dd class="whitespace-pre-wrap break-words text-sm">{{ display(value(section.key, field.key)) }}</dd></div>
            }
          }
        </dl>
      </details>
      }
    }
    <p class="mt-3 text-sm">{{ anamnese().declaracao.texto }}
      Confirmado em {{ anamnese().declaracao.aceitaEm | date: 'dd/MM/yyyy HH:mm' }}.</p>
  `,
})
export class AnamneseRespostasComponent {
  readonly anamnese = input.required<AnamneseCorporal>();
  protected readonly sections = SECOES_ANAMNESE;
  protected hasSection(section: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.anamnese().respostas, section);
  }
  protected value(section: string, field: string): unknown {
    const respostas = this.anamnese().respostas as unknown as Record<string, Record<string, unknown>>;
    return respostas[section]?.[field];
  }
  protected display(value: unknown): string {
    if (value === true) return 'Sim';
    if (value === false) return 'Não';
    return value === null || value === '' ? 'Não informado' : String(value);
  }
}
