import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ApiClient } from '../../../../core/api/api-client';
import { Cupom } from '../../models/cupom.model';
import { CriarCupomComponent } from './criar-cupom.component';

describe('CriarCupomComponent', () => {
  const request = vi.fn<(method: string, path: string, body?: unknown) => Promise<unknown>>();

  beforeEach(async () => {
    const dialogProto = HTMLDialogElement.prototype;
    dialogProto.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    dialogProto.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };

    request.mockReset();
    request.mockImplementation((_method, path) => {
      if (path === '/listCupons' || path === '/listServicos') return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    await TestBed.configureTestingModule({
      imports: [CriarCupomComponent],
      providers: [{ provide: ApiClient, useValue: { configured: true, request } }],
    }).compileComponents();
  });

  async function createComponent() {
    const fixture = TestBed.createComponent(CriarCupomComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance as unknown as {
        cupons: CriarCupomComponent['cupons'];
        form: CriarCupomComponent['form'];
        save(): void;
        edit(cupom: Cupom): void;
        deactivate(cupom: Cupom): void;
        requestDelete(cupom: Cupom): void;
        confirmDelete(): void;
      },
    };
  }

  it('does not send invalid coupon forms', async () => {
    const { fixture, component } = await createComponent();
    request.mockClear();

    component.form.patchValue({ codigo: 'cupom inválido', valor: 0 });
    component.save();
    await fixture.whenStable();

    expect(component.form.invalid).toBe(true);
    expect(request).not.toHaveBeenCalled();
  });

  it('limits percentage discounts to 100 while allowing larger fixed discounts', async () => {
    const { component } = await createComponent();
    component.form.patchValue({ codigo: 'DESCONTO', valor: 100 });
    expect(component.form.controls.valor.valid).toBe(true);

    component.form.controls.valor.setValue(100.01);
    expect(component.form.controls.valor.hasError('max')).toBe(true);

    component.form.controls.tipoDesconto.setValue('VALOR_FIXO');
    expect(component.form.controls.valor.valid).toBe(true);
  });

  it('creates a normalized coupon with only enabled optional rules', async () => {
    const { fixture, component } = await createComponent();
    request.mockImplementation((_method, path, body) => {
      if (path === '/createCupom') return Promise.resolve({ id: 'cupom-1', ...(body as object) });
      if (path === '/listCupons' || path === '/listServicos') return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    component.form.patchValue({
      codigo: 'bemvinda10',
      tipoDesconto: 'PORCENTAGEM',
      valor: 10,
      dataMinima: new Date(2026, 9, 1),
      dataMaxima: new Date(2026, 9, 31),
      limitarGlobal: false,
      limitarPorCliente: false,
      restringirServicos: true,
      servicosValidos: ['servico-1'],
      restringirSessoes: false,
      ativo: true,
    });
    component.save();
    await fixture.whenStable();

    expect(request).toHaveBeenCalledWith('POST', '/createCupom', {
      codigo: 'BEMVINDA10',
      tipoDesconto: 'PORCENTAGEM',
      valor: 10,
      dataMinima: '2026-10-01',
      dataMaxima: '2026-10-31',
      limiteUsoGlobal: null,
      limitePorCliente: null,
      servicosValidos: ['servico-1'],
      minimoSessoes: null,
      maximoSessoes: null,
      ativo: true,
    });
    expect(component.cupons()).toMatchObject([{ id: 'cupom-1', codigo: 'BEMVINDA10' }]);
  });

  it('updates an existing coupon and preserves conditional constraints', async () => {
    const { fixture, component } = await createComponent();
    const cupom: Cupom = {
      id: 'cupom-1',
      codigo: 'ANTIGO',
      tipoDesconto: 'VALOR_FIXO',
      valor: 25,
      dataMinima: null,
      dataMaxima: null,
      limiteUsoGlobal: 10,
      limitePorCliente: 2,
      servicosValidos: [],
      minimoSessoes: 3,
      maximoSessoes: 5,
      ativo: false,
    };
    request.mockImplementation((_method, path, body) => {
      if (path === '/updateCupom') return Promise.resolve({ id: 'cupom-1', ...(body as object) });
      if (path === '/listCupons' || path === '/listServicos') return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    component.edit(cupom);
    component.form.controls.codigo.setValue('novo');
    component.save();
    await fixture.whenStable();

    expect(request).toHaveBeenCalledWith('POST', '/updateCupom', {
      codigo: 'NOVO',
      tipoDesconto: 'VALOR_FIXO',
      valor: 25,
      dataMinima: null,
      dataMaxima: null,
      limiteUsoGlobal: 10,
      limitePorCliente: 2,
      servicosValidos: [],
      minimoSessoes: 3,
      maximoSessoes: 5,
      ativo: false,
      id: 'cupom-1',
    });
    expect(component.cupons()).toMatchObject([{ id: 'cupom-1', codigo: 'NOVO' }]);
  });

  it('updates the displayed coupon after deactivation and removes it after deletion', async () => {
    const { fixture, component } = await createComponent();
    const cupom: Cupom = {
      id: 'cupom-1',
      codigo: 'BEMVINDA',
      tipoDesconto: 'PORCENTAGEM',
      valor: 10,
      servicosValidos: [],
      ativo: true,
    };
    component.cupons.set([cupom]);
    request.mockImplementation((_method, path) => {
      if (path === '/deactivateCupom') return Promise.resolve({ ...cupom, ativo: false });
      if (path === '/deleteCupom') return Promise.resolve({ id: cupom.id });
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    component.deactivate(cupom);
    await fixture.whenStable();
    expect(component.cupons()).toMatchObject([{ id: cupom.id, ativo: false }]);

    component.requestDelete(cupom);
    component.confirmDelete();
    await fixture.whenStable();

    expect(request).toHaveBeenCalledWith('POST', '/deleteCupom', { id: cupom.id });
    expect(component.cupons()).toEqual([]);
  });
});
