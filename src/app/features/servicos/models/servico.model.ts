export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMinutos: number;
  ativo: boolean;
  diasParaRetorno?: number;
}

export type SalvarServico = Omit<Servico, 'id'>;
