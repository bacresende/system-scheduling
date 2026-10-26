import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'birthdate',
})
export class BirthdatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return 'Não informado';

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
  }
}
