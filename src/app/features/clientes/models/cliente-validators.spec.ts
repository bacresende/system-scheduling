import { FormControl } from '@angular/forms';
import { cpfValidator } from './cliente-validators';

describe('CPF validation', () => {
  it('validates check digits', () => { expect(cpfValidator(new FormControl('52998224725'))).toBeNull(); });
  it.each(['11111111111', '52998224724', '123', 'abc'])('rejects %s', value => {
    expect(cpfValidator(new FormControl(value))).toEqual({ cpf: true });
  });
});
