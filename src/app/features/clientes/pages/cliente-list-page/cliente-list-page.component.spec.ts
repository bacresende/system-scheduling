import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ApiClient } from '../../../../core/api/api-client';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { ClienteListPageComponent } from './cliente-list-page.component';

describe('ClienteListPageComponent search', () => {
  const clientes: Usuario[] = [
    {
      id: 'iris',
      nome: 'Íris Almeida',
      email: 'iris@gmail.com',
      telefone: '61999991111',
      cadastroCompleto: true,
      perfil: 'CLIENTE',
    },
    {
      id: 'bruno',
      nome: 'Bruno Souza',
      email: 'bruno@exemplo.com',
      telefone: '61988887777',
      cadastroCompleto: false,
      perfil: 'CLIENTE',
    },
    {
      id: 'celia',
      nome: 'Célia Resende',
      email: 'celia@outlook.com',
      telefone: '11977776666',
      cadastroCompleto: true,
      perfil: 'CLIENTE',
    },
  ];
  const request = vi.fn().mockResolvedValue(clientes);

  async function setup() {
    TestBed.configureTestingModule({
      imports: [ClienteListPageComponent],
      providers: [
        provideRouter([]),
        { provide: ApiClient, useValue: { configured: true, request } },
      ],
    });
    const fixture = TestBed.createComponent(ClienteListPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  async function search(
    fixture: Awaited<ReturnType<typeof setup>>,
    value: string,
  ): Promise<void> {
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('#buscar-cliente');
    if (!input) throw new Error('Campo de busca não encontrado');
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function visibleClientNames(root: HTMLElement): string[] {
    return Array.from(root.querySelectorAll<HTMLElement>('article h3')).map(
      (heading) => heading.textContent?.trim() ?? '',
    );
  }

  beforeEach(() => {
    request.mockClear();
    request.mockResolvedValue(clientes);
  });

  it('offers an accessible search for name, email or telephone', async () => {
    const fixture = await setup();
    const root: HTMLElement = fixture.nativeElement;
    const input = root.querySelector<HTMLInputElement>('#buscar-cliente');

    expect(input?.placeholder).toBe('Buscar por nome, e-mail ou telefone');
    expect(root.querySelector('label[for="buscar-cliente"]')?.textContent).toContain(
      'Buscar clientes',
    );

    await search(fixture, 'iris');
    expect(visibleClientNames(root)).toEqual(['Íris Almeida']);

    await search(fixture, 'bruno@exemplo');
    expect(visibleClientNames(root)).toEqual(['Bruno Souza']);

    await search(fixture, '(61) 9 8888');
    expect(visibleClientNames(root)).toEqual(['Bruno Souza']);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('matches multiple terms across the client fields', async () => {
    const fixture = await setup();
    const root: HTMLElement = fixture.nativeElement;

    await search(fixture, 'celia outlook');

    expect(visibleClientNames(root)).toEqual(['Célia Resende']);
    expect(root.textContent).toContain('1 de 3 clientes');
  });

  it('shows a no-results state and restores the list when search is cleared', async () => {
    const fixture = await setup();
    const root: HTMLElement = fixture.nativeElement;

    await search(fixture, 'cliente inexistente');
    expect(visibleClientNames(root)).toEqual([]);
    expect(root.textContent).toContain('Nenhum cliente encontrado');
    expect(root.textContent).toContain('0 de 3 clientes');

    root.querySelector<HTMLButtonElement>('button[aria-label="Limpar busca"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(visibleClientNames(root)).toEqual(['Íris Almeida', 'Bruno Souza', 'Célia Resende']);
    expect(root.querySelector<HTMLInputElement>('#buscar-cliente')?.value).toBe('');
  });
});
