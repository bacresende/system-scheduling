export type TipoAnamnese = 'FACIAL' | 'CORPORAL' | 'CAPILAR' | 'SOBRANCELHA';

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMinutos: number;
  ativo: boolean;
  tipoAnamneseExigida: TipoAnamnese;
  diasParaRetorno?: number;
}

export type SalvarServico = Omit<Servico, 'id'>;
