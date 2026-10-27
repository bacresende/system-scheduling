export interface NovoCupomPayload {
  codigo: string;
  tipoDesconto: 'PORCENTAGEM' | 'VALOR_FIXO';
  valor: number;
  dataMinima?: string | null;
  dataMaxima?: string | null;
  limiteUsoGlobal?: number | null;
  limitePorCliente?: number | null;
  servicosValidos: string[];
  minimoSessoes?: number | null;
  maximoSessoes?: number | null;
  ativo: boolean;
}

export interface Cupom extends NovoCupomPayload {
  id: string;
}
