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
    quaisAcidos: [''],
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
      const id = await this.context.load();
      const existing = await this.api.get(id);
      if (existing) {
        this.form.patchValue({ ...existing, quaisAcidos: existing.quaisAcidos ?? '' });
      }
      this.context.editable.set(this.context.booking()?.status === 'Pendente');
      if (!this.context.editable()) this.form.disable();
    });
  }
  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.state.run(async () => {
      const value = this.form.getRawValue();
      await this.api.save(this.context.editableId(), {
        ...value,
        quaisAcidos: value.usaAcidos ? value.quaisAcidos.trim() : undefined,
      });
    }, 'Ficha de anamnese salva.');
  }
}
