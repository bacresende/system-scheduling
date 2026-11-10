import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SearchFieldComponent } from './search-field.component';

describe('SearchFieldComponent', () => {
  function setup(value = '') {
    const fixture = TestBed.createComponent(SearchFieldComponent);
    fixture.componentRef.setInput('inputId', 'busca-teste');
    fixture.componentRef.setInput('label', 'Buscar registros');
    fixture.componentRef.setInput('placeholder', 'Buscar por nome');
    fixture.componentRef.setInput('controls', 'resultados-teste');
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    return fixture;
  }

  it('renders an accessible search field', () => {
    const fixture = setup();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input');

    expect(root.querySelector('label')?.textContent).toContain('Buscar registros');
    expect(input?.id).toBe('busca-teste');
    expect(input?.role).toBe('searchbox');
    expect(input?.placeholder).toBe('Buscar por nome');
    expect(input?.getAttribute('aria-controls')).toBe('resultados-teste');
  });

  it('emits changes and clears the value through one custom control', () => {
    const fixture = setup('termo');
    const root = fixture.nativeElement as HTMLElement;
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    const input = root.querySelector<HTMLInputElement>('input');
    if (!input) throw new Error('Campo de busca não encontrado');

    input.value = 'novo termo';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    root.querySelector<HTMLButtonElement>('button[aria-label="Limpar busca"]')?.click();

    expect(emitted).toEqual(['novo termo', '']);
    expect(root.querySelectorAll('button[aria-label="Limpar busca"]')).toHaveLength(1);
  });
});
