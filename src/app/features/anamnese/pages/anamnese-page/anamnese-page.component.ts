import { DatePipe } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { AnamneseContext, AnamneseService } from '../../services/anamnese.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CampoAnamnese, SecaoAnamnese, SECOES_ANAMNESE } from '../../models/anamnese-corporal.config';
import { RespostasAnamneseCorporal } from '../../models/anamnese-corporal.model';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';
import { FieldError } from '../../../../shared/ui/field-error';
import { CpfPipe } from '../../../../shared/pipes/cpf.pipe';
import { TelefonePipe } from '../../../../shared/pipes/telefone.pipe';

type Answer = string | number | boolean | null;
type SectionForm = FormGroup<Record<string, FormControl<Answer>>>;

@Component({
  selector: 'app-anamnese-page',
  imports: [DatePipe, CpfPipe, TelefonePipe, ReactiveFormsModule, ButtonModule, SelectModule, SelectButtonModule, CheckboxModule, InputTextModule, TextareaModule, DatePickerModule, RequestFeedback, FieldError],
  providers: [RequestState, AnamneseContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anamnese-page.component.html',
  styleUrl: './anamnese-page.component.css',
})
export class AnamnesePageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  protected readonly context = inject(AnamneseContext);
  protected readonly usuario = inject(AuthService).session;
  private readonly api = inject(AnamneseService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly sections = SECOES_ANAMNESE;
  protected readonly saved = signal(false);
  protected readonly showProfile = signal(false);
  protected readonly currentStep = signal(0);
  protected readonly steps = [
    { title: 'Sobre você', icon: 'pi-user', description: 'Conte o que você busca e como podemos cuidar de você.', sections: ['informacoesGerais', 'queixas'] },
    { title: 'Segurança', icon: 'pi-shield', description: 'Estas informações ajudam o profissional a avaliar os cuidados necessários.', sections: ['contraindicacoesAbsolutas', 'contraindicacoesRelativas'] },
    { title: 'Saúde pessoal', icon: 'pi-heart', description: 'Selecione seu sexo para exibir as perguntas correspondentes. Você também pode optar por não informar.', sections: ['saudePessoal', 'saudeFeminina', 'saudeMasculina'] },
    { title: 'Sua rotina', icon: 'pi-sun', description: 'Vamos conhecer sua alimentação, seu sono e seus hábitos.', sections: ['alimentacao', 'habitos'] },
    { title: 'Histórico', icon: 'pi-file', description: 'Compartilhe seu histórico de saúde e os cuidados que já realiza.', sections: ['historico'] },
    { title: 'Revisão', icon: 'pi-check-circle', description: 'Confira as etapas e confirme suas informações para enviar a ficha.', sections: [] },
  ];
  protected readonly activeStep = computed(() => this.steps[this.currentStep()]);
  private readonly validationVersion = signal(0);
  protected readonly simNao = [{ label: 'Sim', value: true }, { label: 'Não', value: false }];
  protected readonly maxDate = new Date();
  protected readonly today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  protected readonly form = new FormGroup({
    respostas: new FormGroup<Record<string, SectionForm>>(
      Object.fromEntries(this.sections.map(section => [section.key, new FormGroup(
        Object.fromEntries(section.fields.map(field => [field.key, new FormControl<Answer>(null)])),
      )])),
    ),
    informacoesVerdadeiras: new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }),
  });
  private readonly formEvents = toSignal(this.form.events);
  protected readonly progress = computed(() => {
    this.formEvents();
    this.validationVersion();
    let total = 1;
    let answered = this.form.controls.informacoesVerdadeiras.valid ? 1 : 0;
    for (const section of this.sections) {
      for (const field of section.fields) {
        if (!field.required || !this.visible(section.key, field)) continue;
        total++;
        if (this.control(section.key, field.key).valid) answered++;
      }
    }
    return { total, answered, percent: Math.round(answered / total * 100) };
  });

  constructor() { this.refreshValidation(); }

  protected get idade(): number | null {
    const nascimento = this.usuario()?.nasc;
    if (!nascimento) return null;
    const [ano, mes, dia] = nascimento.slice(0, 10).split('-').map(Number);
    const [anoAtual, mesAtual, diaAtual] = this.today.split('-').map(Number);
    if (!ano || !mes || !dia) return null;
    return anoAtual - ano - (mesAtual < mes || (mesAtual === mes && diaAtual < dia) ? 1 : 0);
  }

  ngOnInit(): void {
    void this.state.run(async () => { this.context.load(); });
  }

  protected stepComplete(index: number): boolean {
    this.formEvents();
    this.validationVersion();
    const keys = this.steps[index].sections;
    return keys.length ? keys.every(key => this.group(key).valid) : this.form.controls.informacoesVerdadeiras.valid;
  }

  protected goToStep(index: number): void {
    if (this.state.busy() || index < 0 || index >= this.steps.length) return;
    this.currentStep.set(index);
    afterNextRender(() => {
      this.element.nativeElement.querySelector<HTMLElement>('#anamnese-step-title')?.focus();
    }, { injector: this.injector });
  }

  protected next(): void {
    this.refreshValidation();
    for (const key of this.activeStep().sections) this.group(key).markAllAsTouched();
    if (!this.stepComplete(this.currentStep())) {
      this.state.error.set('Revise os campos obrigatórios desta etapa para continuar.');
      this.goToStep(this.currentStep());
      return;
    }
    this.state.error.set('');
    this.goToStep(this.currentStep() + 1);
  }

  protected submit(): void {
    if (this.currentStep() < this.steps.length - 1) this.next();
    else this.save();
  }

  protected fieldLabel(field: CampoAnamnese): string {
    return field.label.replace(/^\d+[a-z]?\.\s*/, '');
  }

  protected group(section: string): SectionForm {
    return this.form.controls.respostas.controls[section];
  }

  protected control(section: string, field: string): FormControl<Answer> {
    return this.group(section).controls[field];
  }

  protected visible(section: string, field: CampoAnamnese): boolean {
    const definition = this.sections.find(item => item.key === section)!;
    return this.sectionVisible(definition) && (!field.when || this.control(section, field.when).value === true);
  }

  protected sectionVisible(section: SecaoAnamnese): boolean {
    return !section.when || this.control(section.when.section, section.when.field).value === section.when.equals;
  }

  protected refreshValidation(): void {
    for (const section of this.sections) {
      for (const field of section.fields) {
        const control = this.control(section.key, field.key);
        if (!this.visible(section.key, field)) {
          control.reset(null, { emitEvent: false });
          control.clearValidators();
        } else {
          const validators: ValidatorFn[] = [];
          if (field.required) validators.push(c => c.value === null || c.value === undefined ||
            (typeof c.value === 'string' && !c.value.trim()) ? { required: true } : null);
          if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));
          if (field.min !== undefined) validators.push(Validators.min(field.min));
          if (field.max !== undefined) validators.push(Validators.max(field.max));
          if (field.integer) validators.push(c => c.value !== null && !Number.isInteger(c.value) ? { integer: true } : null);
          if (field.type === 'date') validators.push(c => !c.value || (/^\d{4}-\d{2}-\d{2}$/.test(c.value) &&
            Number.isFinite(Date.parse(c.value)) && new Date(c.value).toISOString().slice(0, 10) === c.value && c.value <= this.today)
            ? null : { date: true });
          control.setValidators(validators);
        }
        control.updateValueAndValidity({ emitEvent: false });
      }
    }
    this.validationVersion.update(version => version + 1);
  }

  protected save(): void {
    if (this.state.busy() || this.saved()) return;
    this.refreshValidation();
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.context.editable()) {
      this.state.error.set('Revise os campos obrigatórios e confirme a declaração.');
      const incomplete = this.steps.findIndex((_, index) => !this.stepComplete(index));
      if (incomplete >= 0) this.goToStep(incomplete);
      return;
    }
    const respostas = Object.fromEntries(this.sections.filter(section => this.sectionVisible(section)).map(section => [section.key,
      Object.fromEntries(section.fields.filter(field => this.visible(section.key, field))
        .map(field => [field.key, this.control(section.key, field.key).value])
        .filter(([, value]) => value !== null && value !== '')),
    ])) as unknown as RespostasAnamneseCorporal;
    void this.state.run(async () => {
      await this.api.saveStandalone({ tipo: 'CORPORAL', respostas, declaracao: { informacoesVerdadeiras: true } });
      this.saved.set(true);
    }, 'Ficha de avaliação corporal salva.');
  }
}
