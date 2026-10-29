export type StatusAgendamento =
  | 'AguardandoConfirmacao'
  | 'Confirmado'
  | 'Pendente'
  | 'Concluido'
  | 'Cancelado';

export type MetodoPagamento = 'PIX' | 'Cartao' | 'Dinheiro';

export type TipoDescontoAgendamento = 'CUPOM' | 'MANUAL_VALOR' | 'MANUAL_PORCENTAGEM' | null;

export interface Agendamento {
  id: string;
  dataHora: Date | string;
  idServico: string;
  idCliente: string;
  idFuncionario: string;
  status: StatusAgendamento;
  duracaoMinutos: number;
  valor: number;
  valorOriginal?: number;
  valorDesconto?: number;
  tipoDesconto?: TipoDescontoAgendamento;
  codigoCupom?: string | null;
  idPacote?: string;
  sessaoNumero?: number;
  totalSessoes?: number;
  dataDefinida?: boolean;
  reagendado?: boolean;
  dataHoraAnterior?: Date | string | null;
  reagendadoPor?: 'CLIENTE' | 'ADMIN';
  alteracaoVistaPeloAdmin?: boolean;
  criadoPor?: 'CLIENTE' | 'ADMIN';
  metodoPagamento?: MetodoPagamento;
  fotoResultadoUrl?: string;
  fotosResultadoUrls?: string[];
  anotacoesFinais?: string;
}

export interface SessaoAgendamentoInput {
  sessaoNumero: number;
  definirDepois: boolean;
  dataHora: Date | null;
}

export type NovoAgendamento = Pick<
  Agendamento,
  'dataHora' | 'idServico' | 'idCliente' | 'idFuncionario'
> &
  Partial<
    Pick<
      Agendamento,
      | 'status'
      | 'duracaoMinutos'
      | 'valor'
      | 'valorOriginal'
      | 'valorDesconto'
      | 'tipoDesconto'
      | 'codigoCupom'
      | 'idPacote'
      | 'sessaoNumero'
      | 'totalSessoes'
      | 'dataDefinida'
      | 'criadoPor'
    >
  >;

export interface ConcluirAgendamento {
  metodoPagamento: MetodoPagamento;
  anotacoesFinais: string;
  fotoResultadoUrl?: string;
  fotosResultadoUrls?: string[];
}

export interface ReagendarAgendamento {
  novaDataHora: string;
  idFuncionario?: string;
  reagendadoPor: 'CLIENTE' | 'ADMIN';
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
