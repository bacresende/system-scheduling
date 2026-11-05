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
    expect(sections.length).toBe(5);
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

  it('agrupa todas as respostas nos mesmos cinco assuntos do preenchimento', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;
    const sections = Array.from(element.querySelectorAll('details'));
    expect(sections.map(section => section.querySelector('summary')!.textContent!.trim().replace(/^\d+\s*/, '')))
      .toEqual(['Sobre você', 'Segurança', 'Saúde pessoal', 'Sua rotina', 'Histórico']);
    const subtitles = sections.map(section => Array.from(section.querySelectorAll('h4'))
      .map(title => title.textContent!.trim()));
    expect(subtitles).toEqual([
      ['Informações gerais', 'Queixas e acompanhamento'],
      ['Contraindicações absolutas — conforme a ficha', 'Contraindicações relativas — conforme a ficha'],
      ['Saúde pessoal'],
      ['Alimentação e digestão', 'Hábitos e rotina'],
      ['Histórico de saúde'],
    ]);
    const storedAnswers = Object.values(ficha.respostas).reduce(
      (total, answers) => total + Object.keys(answers).length, 0,
    );
    expect(element.querySelectorAll('dt').length).toBe(storedAnswers);
  });

  it('mantém cinco grupos ao exibir as respostas de saúde masculina', async () => {
    const fixture = await render({
      ...ficha,
      respostas: {
        ...ficha.respostas,
        saudePessoal: { sexo: 'Masculino' },
        saudeMasculina: { ejaculacao: 'Normal', disfuncaoEretil: false },
      },
    });
    const sections = fixture.nativeElement.querySelectorAll('details') as NodeListOf<HTMLDetailsElement>;
    expect(sections.length).toBe(5);
    expect(sections[2].textContent).toContain('Saúde masculina');
    expect(sections[2].textContent).toContain('Disfunção erétil');
    expect(sections[2].textContent).not.toContain('Saúde feminina');
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
    expect(element.querySelectorAll('details').length).toBe(5);
    expect(element.querySelectorAll('details')[2].textContent).toContain('Saúde feminina');
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
