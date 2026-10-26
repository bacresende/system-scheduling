export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMinutos: number;
  ativo: boolean;
  diasParaRetorno?: number;
  sessoesDisponiveis?: number[];
}

export type SalvarServico = Omit<Servico, 'id' | 'diasParaRetorno' | 'sessoesDisponiveis'> & {
  diasParaRetorno?: number | null;
  sessoesDisponiveis: number[];
};
