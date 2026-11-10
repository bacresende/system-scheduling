import { matchesSearch } from './search';

describe('matchesSearch', () => {
  it('ignores accents, case and punctuation', () => {
    expect(matchesSearch('iris 61 9999', ['Íris Almeida', '(61) 9 9999-1111'])).toBe(true);
  });

  it('requires every search term to match', () => {
    expect(matchesSearch('limpeza facial', ['Limpeza de pele', 'Procedimento facial'])).toBe(true);
    expect(matchesSearch('limpeza corporal', ['Limpeza de pele', 'Procedimento facial'])).toBe(false);
  });
});
