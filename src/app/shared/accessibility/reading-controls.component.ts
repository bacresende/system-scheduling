import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { READING_TEXT_SIZES, ReadingPreferencesService } from './reading-preferences.service';

@Component({
  selector: 'app-reading-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-b border-estetica-secondary bg-white px-4 py-2 text-estetica-text">
      <details class="group/reading mx-auto max-w-7xl">
        <summary class="ml-auto flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-sm font-semibold text-estetica-primary hover:bg-estetica-secondary [&::-webkit-details-marker]:hidden">
          <i class="pi pi-eye shrink-0" aria-hidden="true"></i>
          <span class="min-w-0 break-words">Leitura e contraste</span>
          <i class="pi pi-chevron-down shrink-0 text-xs group-open/reading:rotate-180" aria-hidden="true"></i>
        </summary>
        <div class="grid gap-5 border-t border-estetica-secondary py-4 sm:grid-cols-2">
          <fieldset class="min-w-0">
            <legend class="mb-2 font-semibold">Tamanho do texto</legend>
            <div class="flex flex-wrap gap-2">
              @for (size of sizes; track size) {
                <label class="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-estetica-primary/50 px-3 py-2 text-sm has-[:checked]:bg-estetica-secondary">
                  <input type="radio" name="reading-text-size" [value]="size"
                    [checked]="reading.textSize() === size" (change)="reading.setTextSize(size)"
                    class="size-5 shrink-0 accent-estetica-primary" />
                  {{ size }}%
                </label>
              }
            </div>
          </fieldset>
          <div class="flex flex-col items-start gap-3">
            <label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-estetica-primary/50 px-3 py-2">
              <input #contrast type="checkbox" [checked]="reading.strongContrast()"
                (change)="reading.setStrongContrast(contrast.checked)" class="size-5 shrink-0 accent-estetica-primary" />
              <span class="font-semibold">Reforçar contraste</span>
            </label>
            <button type="button" (click)="reading.reset()" class="min-h-11 rounded-lg px-3 text-sm font-semibold text-estetica-primary underline underline-offset-4">
              Restaurar ajustes de leitura
            </button>
          </div>
          <p class="text-sm text-estetica-text/75 sm:col-span-2">
            Ajuste a leitura como preferir. Você também pode usar o zoom do navegador ou ampliar com dois dedos no celular.
          </p>
        </div>
      </details>
    </div>
  `,
})
export class ReadingControlsComponent {
  protected readonly reading = inject(ReadingPreferencesService);
  protected readonly sizes = READING_TEXT_SIZES;
}
