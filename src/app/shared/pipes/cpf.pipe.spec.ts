import { CpfPipe } from './cpf.pipe';

describe('CpfPipe', () => {
  const pipe = new CpfPipe();

  it('formats an 11-digit CPF', () => {
    expect(pipe.transform('52998224725')).toBe('529.982.247-25');
  });

  it('preserves invalid input and handles missing values', () => {
    expect(pipe.transform('123')).toBe('123');
    expect(pipe.transform(undefined)).toBe('Não informado');
  });
});
