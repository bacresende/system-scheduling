import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-anamnese-pendente-page',
  imports: [RouterLink, MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-4 text-3xl font-bold">Ficha aguardando especificação</h1>
    <p-message severity="warn">Os campos das fichas capilar e de sobrancelha ainda precisam ser definidos pela clínica. Nenhuma resposta será salva nesta tela.</p-message>
    <a routerLink="/" class="mt-4 inline-block underline">Voltar</a>
  `
})
export class AnamnesePendentePage {}
