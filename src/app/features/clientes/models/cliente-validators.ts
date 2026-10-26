import { AbstractControl, ValidationErrors } from '@angular/forms';

export function cpfValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!/^[\d.-]*$/.test(value)) return { cpf: true };
  const cpf = value.replace(/\D/g, '');
  if (!cpf) return null;
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return { cpf: true };
  for (const size of [9, 10]) {
    let sum = 0;
    for (let index = 0; index < size; index++) sum += Number(cpf[index]) * (size + 1 - index);
    const digit = (sum * 10) % 11 % 10;
    if (digit !== Number(cpf[size])) return { cpf: true };
  }
  return null;
}
