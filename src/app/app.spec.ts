import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ApiClient } from './core/api/api-client';

describe('App', () => {
  const configure = async (configured: boolean) => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ApiClient, useValue: { configured } },
      ],
    }).compileComponents();
  };

  it('should create the app', async () => {
    await configure(true);
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should explicitly disclose the missing backend', async () => {
    await configure(false);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Frontend sem backend configurado');
  });

  it('should not show the missing backend warning when configured', async () => {
    await configure(true);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Frontend sem backend configurado');
  });
});
