import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ApiClient } from '../../../../core/api/api-client';
import { AuthService } from '../../../auth/services/auth.service';
import { AnamnesePageComponent } from './anamnese-page.component';
import { fichaCorporal } from '../../testing/anamnese.fixture';

describe('Avaliação corporal autenticada', () => {
  const request = vi.fn<(method: string, path: string, body?: unknown) => Promise<unknown>>();
  beforeEach(async () => {
    request.mockReset();
    request.mockResolvedValue({ id: 'ficha-1' });
    await TestBed.configureTestingModule({
      imports: [AnamnesePageComponent],
      providers: [
        { provide: ApiClient, useValue: { request } },
        { provide: AuthService, useValue: { session: () => ({ id: 'cliente-1', perfil: 'CLIENTE', nome: 'Ana Silva', email: 'ana@example.test', telefone: '61999999999', nasc: '1990-04-20' }) } },
      ],
    }).compileComponents();
  });

  async function setup() {
    const fixture = TestBed.createComponent(AnamnesePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance as unknown as {
      form: AnamnesePageComponent['form'];
      save(): void;
      refreshValidation(): void;
      currentStep: AnamnesePageComponent['currentStep'];
      progress: AnamnesePageComponent['progress'];
      goToStep(index: number): void;
      next(): void;
      submit(): void;
    };
    return { fixture, component, root: fixture.nativeElement as HTMLElement };
  }

  it('mostra cabeçalho sem pedir contato e exige respostas explícitas', async () => {
    const { component, root, fixture } = await setup();
    expect(root.textContent).toContain('Ana Silva');
    expect(root.textContent).toContain('ana@example.test');
    expect(root.querySelector('[formControlName="email"]')).toBeNull();
    expect(component.form.controls.respostas.controls['habitos'].controls['fuma'].value).toBeNull();
    component.save();
    await fixture.whenStable();
    expect(request).not.toHaveBeenCalled();
    expect(component.form.invalid).toBe(true);
  });

  it('salva somente respostas e aceite, sem identidade/contato/data enviados pelo cliente', async () => {
    const { component, root, fixture } = await setup();
    component.form.controls.respostas.patchValue(structuredClone(fichaCorporal.respostas));
    component.form.controls.informacoesVerdadeiras.setValue(true);
    component.save();
    await fixture.whenStable();
    expect(request).toHaveBeenCalledExactlyOnceWith('POST', '/createAnamnese', fichaCorporal);
    expect(root.textContent).toContain('Sua ficha foi registrada');
    component.save();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('exibe e exige detalhes condicionais e descarta respostas ao ocultar um bloco', async () => {
    const { component, root, fixture } = await setup();
    component.form.controls.respostas.patchValue(structuredClone(fichaCorporal.respostas));
    component.form.controls.informacoesVerdadeiras.setValue(true);
    const historico = component.form.controls.respostas.controls['historico'];
    historico.controls['diabetes'].setValue(true);
    component.refreshValidation();
    fixture.detectChanges();
    expect(root.querySelector('#historico-tipoDiabetes')).not.toBeNull();
    component.save();
    expect(request).not.toHaveBeenCalled();
    historico.controls['tipoDiabetes'].setValue('Tipo 2');
    historico.controls['diabetes'].setValue(false);
    component.refreshValidation();
    expect(historico.controls['tipoDiabetes'].value).toBeNull();
    component.save();
    await fixture.whenStable();
    expect(request).toHaveBeenCalledExactlyOnceWith('POST', '/createAnamnese', fichaCorporal);
  });

  it('envia números como números usando o campo na tela e aceita resposta afirmativa de contraindicação', async () => {
    const { component, root, fixture } = await setup();
    component.form.controls.respostas.patchValue(structuredClone(fichaCorporal.respostas));
    component.form.controls.informacoesVerdadeiras.setValue(true);
    component.form.controls.respostas.controls['contraindicacoesAbsolutas'].controls['epilepsia'].setValue(true);
    fixture.detectChanges();
    const input = root.querySelector<HTMLInputElement>('#habitos-horasSono')!;
    input.value = '7.5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    component.save();
    await fixture.whenStable();
    expect(request).toHaveBeenCalledWith('POST', '/createAnamnese', expect.objectContaining({
      respostas: expect.objectContaining({
        habitos: expect.objectContaining({ horasSono: 7.5 }),
        contraindicacoesAbsolutas: expect.objectContaining({ epilepsia: true }),
      }),
    }));
  });

  it('mantém respostas em caso de falha e permite tentar novamente', async () => {
    const { component, fixture, root } = await setup();
    component.form.controls.respostas.patchValue(structuredClone(fichaCorporal.respostas));
    component.form.controls.informacoesVerdadeiras.setValue(true);
    request.mockRejectedValueOnce(new Error('Sem conexão'));
    component.save();
    await fixture.whenStable();
    expect(root.textContent).toContain('Sem conexão');
    expect(component.form.controls.respostas.controls['habitos'].controls['horasSono'].value).toBe(8);
    component.save();
    await fixture.whenStable();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('valida a etapa atual, preserva respostas ao voltar e move o foco para o título', async () => {
    const { component, fixture, root } = await setup();
    component.next();
    expect(component.currentStep()).toBe(0);
    component.form.controls.respostas.patchValue({
      informacoesGerais: fichaCorporal.respostas.informacoesGerais,
      queixas: fichaCorporal.respostas.queixas,
    });
    component.next();
    await fixture.whenStable();
    expect(component.currentStep()).toBe(1);
    expect(document.activeElement?.id).toBe('anamnese-step-title');
    expect(root.querySelector('[aria-current="step"]')?.textContent).toContain('Segurança');
    expect(root.querySelector('fieldset:not([hidden])')?.textContent).toContain('Contraindicações absolutas');
    component.goToStep(0);
    await fixture.whenStable();
    expect(component.form.controls.respostas.controls['queixas'].controls['principaisQueixas'].value).toBe('Avaliação corporal');
    expect(request).not.toHaveBeenCalled();
  });

  it('mostra progresso e encaminha para a primeira etapa pendente ao finalizar', async () => {
    const { component, fixture, root } = await setup();
    expect(component.progress().answered).toBe(0);
    component.form.controls.respostas.patchValue(structuredClone(fichaCorporal.respostas));
    component.form.controls.informacoesVerdadeiras.setValue(true);
    component.refreshValidation();
    expect(component.progress().percent).toBe(100);
    component.form.controls.respostas.controls['habitos'].controls['fuma'].setValue(null);
    component.goToStep(5);
    await fixture.whenStable();
    expect(root.querySelector('#anamnese-step-title')?.textContent).toBe('Revisão');
    component.submit();
    await fixture.whenStable();
    expect(component.currentStep()).toBe(3);
    expect(component.progress().percent).toBeLessThan(100);
    expect(request).not.toHaveBeenCalled();
  });

  it('responde Sim/Não pelos botões e atualiza campos condicionais e progresso', async () => {
    const { component, fixture, root } = await setup();
    component.goToStep(3);
    await fixture.whenStable();
    const options = root.querySelectorAll<HTMLElement>('#habitos-fuma [role="button"]');
    expect(options.length).toBe(2);
    options[0].click();
    await fixture.whenStable();
    expect(component.form.controls.respostas.controls['habitos'].controls['fuma'].value).toBe(true);
    expect(root.querySelector('#habitos-cigarrosDia')).not.toBeNull();
    expect(component.progress().answered).toBe(1);
    options[1].click();
    await fixture.whenStable();
    expect(component.form.controls.respostas.controls['habitos'].controls['fuma'].value).toBe(false);
    expect(root.querySelector('#habitos-cigarrosDia')).toBeNull();
  });

  it('exibe o bloco correspondente ao sexo e limpa respostas ao mudar a seleção', async () => {
    const { component, fixture, root } = await setup();
    component.goToStep(2);
    await fixture.whenStable();
    expect(root.querySelector('#saudePessoal-sexo')).not.toBeNull();
    expect(root.querySelector('#saudeFeminina-temFilhos')).toBeNull();
    expect(root.querySelector('#saudeMasculina-ejaculacao')).toBeNull();
    component.next();
    expect(component.currentStep()).toBe(2);

    const respostas = component.form.controls.respostas;
    const sexo = respostas.controls['saudePessoal'].controls['sexo'];
    sexo.setValue('Feminino');
    component.refreshValidation();
    await fixture.whenStable();
    expect(root.querySelector('#saudeFeminina-temFilhos')).not.toBeNull();
    expect(root.querySelector('#saudeMasculina-ejaculacao')).toBeNull();
    component.next();
    expect(component.currentStep()).toBe(2);
    respostas.controls['saudeFeminina'].controls['temFilhos'].setValue(true);

    sexo.setValue('Masculino');
    component.refreshValidation();
    await fixture.whenStable();
    expect(respostas.controls['saudeFeminina'].controls['temFilhos'].value).toBeNull();
    expect(root.querySelector('#saudeFeminina-temFilhos')).toBeNull();
    expect(root.querySelector('#saudeMasculina-ejaculacao')).not.toBeNull();
    respostas.controls['saudeMasculina'].patchValue({ ejaculacao: 'Normal', disfuncaoEretil: false });
    component.next();
    expect(component.currentStep()).toBe(3);

    component.goToStep(2);
    sexo.setValue('Prefiro não informar');
    component.refreshValidation();
    component.next();
    expect(component.currentStep()).toBe(3);
    expect(respostas.controls['saudeMasculina'].controls['ejaculacao'].value).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });
});
