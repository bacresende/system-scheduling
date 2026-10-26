import { CepPipe } from './cep.pipe';

describe('CepPipe', () => {
  const pipe = new CepPipe();

  it('formats an eight-digit CEP', () => {
    expect(pipe.transform('01001000')).toBe('01001-000');
  });

  it('preserves invalid input and handles missing values', () => {
    expect(pipe.transform('123')).toBe('123');
    expect(pipe.transform(undefined)).toBe('Não informado');
  });
});
