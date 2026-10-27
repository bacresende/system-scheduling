import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../core/api/api-client';
import { Cupom, NovoCupomPayload } from '../models/cupom.model';

type CupomApiResponse = Omit<Cupom, 'dataMinima' | 'dataMaxima'> & {
  dataMinima: unknown;
  dataMaxima: unknown;
};

@Injectable({ providedIn: 'root' })
export class CuponsService {
  private readonly api = inject(ApiClient);

  create(payload: NovoCupomPayload): Promise<Cupom> {
    return this.api
      .request<CupomApiResponse>('POST', '/createCupom', payload)
      .then((cupom) => this.normalizeCupom(cupom));
  }

  list(): Promise<Cupom[]> {
    return this.api
      .request<CupomApiResponse[]>('POST', '/listCupons')
      .then((cupons) => cupons.map((cupom) => this.normalizeCupom(cupom)));
  }

  private normalizeCupom(cupom: CupomApiResponse): Cupom {
    return {
      ...cupom,
      dataMinima: this.normalizeDate(cupom.dataMinima),
      dataMaxima: this.normalizeDate(cupom.dataMaxima),
    };
  }

  private normalizeDate(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;

    let dateValue: unknown = value;
    if (typeof value === 'object' && value !== null && '__type' in value && 'iso' in value) {
      const parseDate = value as { __type?: unknown; iso?: unknown };
      if (parseDate.__type !== 'Date' || typeof parseDate.iso !== 'string') {
        throw new Error('A API retornou uma data em formato inválido para o cupom.');
      }
      dateValue = parseDate.iso;
    }

    const date =
      dateValue instanceof Date
        ? dateValue
        : typeof dateValue === 'string' || typeof dateValue === 'number'
          ? new Date(dateValue)
          : null;

    if (!date || Number.isNaN(date.getTime())) {
      throw new Error('A API retornou uma data em formato inválido para o cupom.');
    }

    return date.toISOString().slice(0, 10);
  }
}
