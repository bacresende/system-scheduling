import { Component, input } from '@angular/core';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-elegant-button',
  imports: [Button],
  templateUrl: './elegant-button.html',
})
export class ElegantButton {
  public label = input.required<string>();
  public loading = input.required<boolean>();
  public disabled = input.required<boolean>();
}
