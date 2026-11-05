import { TestBed } from '@angular/core/testing';
import { AnamneseCorporal } from '../models/anamnese.model';
import { fichaCorporal } from '../testing/anamnese.fixture';
import { AnamneseRespostasComponent } from './anamnese-respostas.component';

describe('AnamneseRespostasComponent', () => {
  const ficha: AnamneseCorporal = {
    ...fichaCorporal,
    idCliente: 'cliente-1',
    dataPreenchimento: '2026-11-05T12:00:00Z',
    declaracao: {
      informacoesVerdadeiras: true,
      texto: 'Declaro que as informações são verdadeiras.',
      aceitaEm: '2026-11-05T12:00:00Z',
      idUsuario: 'cliente-1',
    },
  };

  async function render(anamnese = ficha) {
    await TestBed.configureTestingModule({
      imports: [AnamneseRespostasComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(AnamneseRespostasComponent);
    fixture.componentRef.setInput('anamnese', anamnese);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('inicia apenas com a primeira seção aberta e permite controlar a expansão', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;
    const sections = Array.from(element.querySelectorAll('details'));
    const buttons = Array.from(element.querySelectorAll('button'));
    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0].open).toBe(true);
    expect(sections.slice(1).every((section) => !section.open)).toBe(true);

    buttons.find((button) => button.textContent?.includes('Recolher'))!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(sections.every((section) => !section.open)).toBe(true);

    sections[0].open = true;
    sections[0].dispatchEvent(new Event('toggle'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(sections[0].open).toBe(true);
    expect(sections.slice(1).every((section) => !section.open)).toBe(true);

    buttons.find((button) => button.textContent?.includes('Expandir'))!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(sections.every((section) => section.open)).toBe(true);
  });

  it('preserva respostas negativas, zero e textos, distinguindo campos vazios', async () => {
    const fixture = await render({
      ...ficha,
      respostas: {
        ...ficha.respostas,
        habitos: { ...ficha.respostas.habitos, horasSono: 0 },
        alimentacao: { ...ficha.respostas.alimentacao, desjejum: '   ' },
        saudeFeminina: {
          temFilhos: false,
          amamentando: false,
          diu: false,
          desejoSexual: 'Normal',
          cicloMenstrual: 'Regular',
          contraceptivo: false,
          menopausa: false,
          ultimaMenstruacao: '2026-11-01',
        },
      },
    });
    const element: HTMLElement = fixture.nativeElement;
    const answer = (label: string) => Array.from(element.querySelectorAll('dt'))
      .find((dt) => dt.textContent?.includes(label))?.nextElementSibling?.textContent?.trim();

    expect(answer('Possui plano de saúde?')).toBe('Não');
    expect(answer('Horas de sono por dia')).toBe('0');
    expect(answer('Desjejum')).toBe('Não informado');
    expect(answer('última menstruação')).toBe('01/11/2026');
    expect(answer('Principais queixas')).toBe('Avaliação corporal');
    expect(element.textContent).toContain(ficha.declaracao.texto);
    expect(element.textContent).not.toContain('Qual plano de saúde?');
  });
});
