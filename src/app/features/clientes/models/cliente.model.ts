export interface Endereco {
  cep: string;
  logradouro: string;
  numeroResidencia: string;
  bairro: string;
  complemento?: string;
  cidade: string;
  estado: string;
  pais: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  nasc?: Date | string;
  cpf?: string;
  ocupacaoProfissional?: string;
  endereco?: Endereco;
  cadastroCompleto: boolean;
}

export type CadastroCliente = Pick<Cliente, 'nome' | 'email' | 'telefone'>;
export type CompletarPerfil = Required<Pick<Cliente, 'cpf' | 'nasc' | 'endereco'>>;
