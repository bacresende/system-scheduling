import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Anamnese } from '../../models/anamnese.model';
import { AnamneseContext, AnamneseService } from '../../services/anamnese.service';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';
import { FieldError } from '../../../../shared/ui/field-error';

@Component({
  selector: 'app-anamnese-page',
  imports: [ReactiveFormsModule, ButtonModule, CheckboxModule, InputTextModule, SelectModule, RequestFeedback, FieldError],
  providers: [RequestState, AnamneseContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anamnese-page.component.html',
})
export class AnamnesePageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  protected readonly context = inject(AnamneseContext);
  private readonly api = inject(AnamneseService);
  protected readonly tipos: Anamnese['tipoPele'][] = ['Seca', 'Oleosa', 'Mista', 'Normal'];
  protected readonly form = inject(FormBuilder).nonNullable.group({
    tipoPele: ['Normal' as Anamnese['tipoPele'], Validators.required],
    usaAcidos: [false],
    quaisAcidos: ['', Validators.maxLength(500)],
    sensibilidadeSol: [false],
    temVarizes: [false],
    fezCirurgiaRecente: [false],
    praticaAtividadeFisica: [false],
    alergiaCosmeticos: [false],
  }, {
    validators: control => control.get('usaAcidos')?.value && !String(control.get('quaisAcidos')?.value ?? '').trim()
      ? { acidos: true } : null
  });
  ngOnInit(): void {
    void this.state.run(async () => {
      this.context.load();
    });
  }
  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.context.editable()) return;
    void this.state.run(async () => {
      const value = this.form.getRawValue();
      const respostas = {
        ...value,
        quaisAcidos: value.usaAcidos ? value.quaisAcidos.trim() : undefined,
      };
      await this.api.saveStandalone(respostas);
    }, 'Ficha de anamnese salva.');
  }
}
