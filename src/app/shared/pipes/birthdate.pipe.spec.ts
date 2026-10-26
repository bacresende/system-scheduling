import { BirthdatePipe } from './birthdate.pipe';

describe('BirthdatePipe', () => {
  const pipe = new BirthdatePipe();

  it('formats an ISO date as Brazilian date', () => {
    expect(pipe.transform('1990-01-02')).toBe('02/01/1990');
  });

  it('preserves invalid input and handles missing values', () => {
    expect(pipe.transform('01-02-1990')).toBe('01-02-1990');
    expect(pipe.transform(undefined)).toBe('Não informado');
  });
});
