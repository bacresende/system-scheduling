import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { AnamneseContext, AnamneseService, RespostasCorporal } from '../../services/anamnese.service';
import { RequestFeedback, RequestState } from '../../../../shared/ui/request-feedback';

@Component({
  selector: 'app-anamnese-corporal-page',
  imports: [ReactiveFormsModule, ButtonModule, CheckboxModule, RequestFeedback],
  providers: [RequestState, AnamneseContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anamnese-corporal-page.component.html',
  styleUrl: './anamnese-corporal-page.component.css'
})
export class AnamneseCorporalPageComponent implements OnInit {
  protected readonly state = inject(RequestState);
  protected readonly context = inject(AnamneseContext);
  private readonly api = inject(AnamneseService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    temVarizes: [false], fezCirurgiaRecente: [false], praticaAtividadeFisica: [false], alergiaCosmeticos: [false]
  });
  protected readonly fields: { key: keyof RespostasCorporal; label: string }[] = [
    { key: 'temVarizes', label: 'Tem varizes?' }, { key: 'fezCirurgiaRecente', label: 'Fez cirurgia recente?' },
    { key: 'praticaAtividadeFisica', label: 'Pratica atividade física?' }, { key: 'alergiaCosmeticos', label: 'Tem alergia a cosméticos?' }
  ];
  ngOnInit(): void {
    void this.state.run(async () => {
      const id = await firstValueFrom(this.context.load('CORPORAL'));
      const existing = await firstValueFrom(this.api.corporal(id));
      if (existing) this.form.patchValue(existing);
      this.context.editable.set(this.context.booking()?.status === 'Pendente');
      if (!this.context.editable()) this.form.disable();
    });
  }
  protected save(): void {
    void this.state.run(async () => {
      await firstValueFrom(this.api.saveCorporal(this.context.editableId(), this.form.getRawValue()));
    }, 'Ficha corporal salva.');
  }
}
