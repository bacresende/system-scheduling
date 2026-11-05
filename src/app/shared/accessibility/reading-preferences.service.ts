import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

export const READING_TEXT_SIZES = [100, 125, 150, 200] as const;
export type ReadingTextSize = typeof READING_TEXT_SIZES[number];
export const READING_PREFERENCES_KEY = 'wr.reading-preferences';

interface ReadingPreferences {
  textSize: ReadingTextSize;
  strongContrast: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReadingPreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly preferences = signal<ReadingPreferences>(this.load());
  readonly textSize = computed(() => this.preferences().textSize);
  readonly strongContrast = computed(() => this.preferences().strongContrast);

  constructor() {
    this.apply();
  }

  setTextSize(textSize: ReadingTextSize): void {
    this.update({ ...this.preferences(), textSize });
  }

  setStrongContrast(strongContrast: boolean): void {
    this.update({ ...this.preferences(), strongContrast });
  }

  reset(): void {
    this.update(this.defaults());
  }

  private defaults(): ReadingPreferences {
    return {
      textSize: 100,
      strongContrast: this.document.defaultView?.matchMedia?.('(prefers-contrast: more)').matches ?? false,
    };
  }

  private load(): ReadingPreferences {
    const defaults = this.defaults();
    try {
      const saved = JSON.parse(this.document.defaultView?.localStorage.getItem(READING_PREFERENCES_KEY) ?? 'null');
      return {
        textSize: READING_TEXT_SIZES.includes(saved?.textSize) ? saved.textSize : defaults.textSize,
        strongContrast: typeof saved?.strongContrast === 'boolean' ? saved.strongContrast : defaults.strongContrast,
      };
    } catch {
      return defaults;
    }
  }

  private update(preferences: ReadingPreferences): void {
    this.preferences.set(preferences);
    this.apply();
    try {
      this.document.defaultView?.localStorage.setItem(READING_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      // Os ajustes continuam funcionando quando o navegador bloqueia o armazenamento.
    }
  }

  private apply(): void {
    const root = this.document.documentElement;
    root.dataset['readingSize'] = String(this.textSize());
    root.classList.toggle('reading-enlarged', this.textSize() >= 150);
    root.classList.toggle('reading-contrast', this.strongContrast());
  }
}
