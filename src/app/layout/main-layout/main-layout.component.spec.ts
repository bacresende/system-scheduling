import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { MainLayoutComponent } from './main-layout.component';
import { afterEach, vi } from 'vitest';

describe('Navegação principal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('usa o menu somente quando os itens não cabem e restaura a barra quando há espaço', async () => {
    const visualViewport = new EventTarget();
    let visibleWidth = 1024;
    Object.defineProperty(visualViewport, 'width', { get: () => visibleWidth });
    vi.stubGlobal('visualViewport', visualViewport);
    let resized = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { resized = callback; }
      observe() {}
      disconnect = disconnect;
    });
    TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: {} }],
    });
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const probe = root.querySelector<HTMLElement>('.bottom-navigation-probe')!;
    let requiredWidth = 300;
    let viewportWidth = 390;
    vi.spyOn(probe, 'getBoundingClientRect').mockImplementation(() => ({ width: requiredWidth }) as DOMRect);
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockImplementation(() => viewportWidth);
    resized();
    fixture.detectChanges();
    expect(root.classList.contains('compact-navigation')).toBe(false);
    expect(root.querySelectorAll('.bottom-navigation a')).toHaveLength(5);

    requiredWidth = 550;
    resized();
    fixture.detectChanges();
    expect(root.classList.contains('compact-navigation')).toBe(true);
    root.querySelector<HTMLButtonElement>('.layout-menu-toggle')!.click();
    fixture.detectChanges();
    expect(root.querySelector('.layout-menu-toggle')!.getAttribute('aria-expanded')).toBe('true');

    viewportWidth = 768;
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(root.classList.contains('compact-navigation')).toBe(false);
    expect(root.querySelector('.layout-menu-toggle')!.getAttribute('aria-expanded')).toBe('false');

    viewportWidth = 390;
    requiredWidth = 300;
    resized();
    fixture.detectChanges();
    expect(root.classList.contains('compact-navigation')).toBe(false);
    visibleWidth = 280;
    visualViewport.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(root.classList.contains('compact-navigation')).toBe(true);
    visibleWidth = 390;
    visualViewport.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(root.classList.contains('compact-navigation')).toBe(false);
    fixture.destroy();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('permite expandir e recolher o menu com nomes completos', () => {
    TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: {} }],
    });
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const toggle = root.querySelector<HTMLButtonElement>('button[aria-controls="navegacao-principal"]')!;
    const nav = root.querySelector<HTMLElement>('#navegacao-principal')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(nav.classList.contains('navigation-open')).toBe(true);
    expect(nav.textContent).toContain('Agendamentos');
    expect(nav.querySelectorAll('a')).toHaveLength(5);
    toggle.click();
    fixture.detectChanges();
    expect(nav.classList.contains('navigation-open')).toBe(false);
  });
});
