export type StatusAgendamento = 'Pendente' | 'Concluido' | 'Cancelado';
export type MetodoPagamento = 'PIX' | 'Cartao' | 'Dinheiro';

export interface Agendamento {
  id: string;
  dataHora: Date | string;
  idServico: string;
  idCliente: string;
  idFuncionario: string;
  status: StatusAgendamento;
  duracaoMinutos: number;
  valor: number;
  metodoPagamento?: MetodoPagamento;
  fotoResultadoUrl?: string;
  anotacoesFinais?: string;
}

export type NovoAgendamento = Pick<Agendamento, 'dataHora' | 'idServico' | 'idCliente' | 'idFuncionario'>;
export interface ConcluirAgendamento {
  metodoPagamento: MetodoPagamento;
  anotacoesFinais: string;
  fotoResultadoUrl?: string;
}
export interface Expediente {
  diaSemana: number;
  inicio: string;
  fim: string;
}
export interface ConfiguracaoAgenda {
  fusoHorario: string;
  expediente: Expediente[];
  funcionarios: { id: string; nome: string }[];
}
