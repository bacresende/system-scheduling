import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cep',
  standalone: true,
})
export class CepPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return 'Não informado';

    const digits = value.replace(/\D/g, '');
    return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : value;
  }
}
