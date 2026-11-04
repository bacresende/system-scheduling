import { Agendamento } from '../../agendamentos/models/agendamento.model';
import { Anamnese } from '../../anamnese/models/anamnese.model';
import { Usuario } from '../../usuarios/models/usuario.model';

export interface AtendimentoCliente extends Agendamento {
  nomeServico: string;
}

export interface ClienteProntuario {
  cliente: Usuario;
  agendamentos: AtendimentoCliente[];
  anamnesesAvulsas: Anamnese[];
}
