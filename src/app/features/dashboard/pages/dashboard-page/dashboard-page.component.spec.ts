import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  const getSummary = vi.fn();

  beforeEach(async () => {
    getSummary.mockReset();
    getSummary.mockResolvedValue({
      agendamentosHoje: 0,
      clientes: 0,
      receitaConcluidaHoje: 0,
      oportunidades: 0,
      agendaHoje: [],
    });

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: { get: getSummary } },
      ],
    }).compileComponents();
  });

  it('shows today appointments and agenda attention indicators', async () => {
    const appointmentTime = new Date();
    appointmentTime.setHours(8, 0, 0, 0);
    getSummary.mockResolvedValue({
      agendamentosHoje: 1,
      clientes: 1,
      receitaConcluidaHoje: 0,
      oportunidades: 0,
      agendaHoje: [{
        id: 'booking-1',
        dataHora: appointmentTime.toISOString(),
        idServico: 'service-1',
        idCliente: 'client-1',
        status: 'AguardandoConfirmacao',
        duracaoMinutos: 30,
        cliente: 'Ana',
        servico: 'Limpeza de pele',
      }],
    });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Agenda de hoje');
    expect(root.textContent).toContain('Ana');
    expect(root.textContent).toContain('Limpeza de pele');
    expect(root.textContent).toContain('Aguardando confirmação');
    expect(root.querySelector('[aria-labelledby="attention-title"]')?.textContent).toContain('1');
  });

  it('shows a standalone anamnesis link and copies it to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('sem associação inicial a serviço ou agendamento');
    const link = root.querySelector('.font-mono');
    expect(link?.textContent).toContain('/anamnese');
    expect(link?.textContent).not.toContain('/avulsa');

    const component = fixture.componentInstance as unknown as {
      anamneseLink: string;
      copyAnamneseLink(): void;
    };
    component.copyAnamneseLink();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith(component.anamneseLink);
    expect(root.textContent).toContain('Link da anamnese copiado.');
    vi.unstubAllGlobals();
  });
});
