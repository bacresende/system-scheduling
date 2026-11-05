import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { READING_PREFERENCES_KEY, ReadingPreferencesService } from './reading-preferences.service';
import { ReadingControlsComponent } from './reading-controls.component';

describe('Preferências de leitura', () => {
  beforeEach(() => localStorage.removeItem(READING_PREFERENCES_KEY));
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem(READING_PREFERENCES_KEY);
    document.documentElement.removeAttribute('data-reading-size');
    document.documentElement.classList.remove('reading-contrast', 'reading-enlarged');
  });

  it('aplica e persiste o tamanho e o contraste, inclusive em uma nova sessão', () => {
    const reading = TestBed.inject(ReadingPreferencesService);
    reading.setTextSize(200);
    reading.setStrongContrast(true);
    expect(document.documentElement.dataset['readingSize']).toBe('200');
    expect(document.documentElement.classList.contains('reading-contrast')).toBe(true);
    expect(document.documentElement.classList.contains('reading-enlarged')).toBe(true);
    TestBed.resetTestingModule();
    const restored = TestBed.inject(ReadingPreferencesService);
    expect(restored.textSize()).toBe(200);
    expect(restored.strongContrast()).toBe(true);
    restored.reset();
    expect(restored.textSize()).toBe(100);
    expect(document.documentElement.classList.contains('reading-enlarged')).toBe(false);
  });

  it('ignora preferências inválidas e mantém os controles funcionando sem armazenamento', () => {
    localStorage.setItem(READING_PREFERENCES_KEY, '{');
    const reading = TestBed.inject(ReadingPreferencesService);
    expect(reading.textSize()).toBe(100);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Bloqueado'); });
    expect(() => reading.setTextSize(150)).not.toThrow();
    expect(reading.textSize()).toBe(150);
    expect(document.documentElement.dataset['readingSize']).toBe('150');
  });

  it('não aceita uma escala fora das opções disponíveis', () => {
    localStorage.setItem(READING_PREFERENCES_KEY, JSON.stringify({ textSize: 900, strongContrast: 'sim' }));
    expect(TestBed.inject(ReadingPreferencesService).textSize()).toBe(100);
  });

  it('permite ajustar e restaurar a leitura pelos controles rotulados', async () => {
    const fixture = TestBed.createComponent(ReadingControlsComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const radio = root.querySelector<HTMLInputElement>('input[value="150"]')!;
    radio.click();
    fixture.detectChanges();
    expect(radio.checked).toBe(true);
    expect(document.documentElement.dataset['readingSize']).toBe('150');
    root.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('reading-contrast')).toBe(true);
    root.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    expect(root.querySelector<HTMLInputElement>('input[value="100"]')!.checked).toBe(true);
    expect(root.querySelectorAll('label')).toHaveLength(5);
  });
});
