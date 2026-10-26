import { TelefonePipe } from './telefone.pipe';

describe('TelefonePipe', () => {
  const pipe = new TelefonePipe();

  it('formats an 11-digit mobile number', () => {
    expect(pipe.transform('61999999999')).toBe('(61) 9 9999-9999');
  });

  it('formats a 10-digit landline number', () => {
    expect(pipe.transform('6133334444')).toBe('(61) 3333-4444');
  });

  it('preserves invalid input and handles missing values', () => {
    expect(pipe.transform('123')).toBe('123');
    expect(pipe.transform(undefined)).toBe('Não informado');
  });
});
