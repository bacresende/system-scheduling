export function normalizeSearch(value: string | number | null | undefined): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '');
}

export function searchTerms(query: string): string[] {
  return query.trim().split(/\s+/).map(normalizeSearch).filter(Boolean);
}

export function matchesSearch(
  query: string,
  values: readonly (string | number | null | undefined)[],
): boolean {
  const terms = searchTerms(query);
  if (!terms.length) return true;

  const searchableContent = normalizeSearch(values.join(' '));
  return terms.every((term) => searchableContent.includes(term));
}
