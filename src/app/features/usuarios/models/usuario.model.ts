export type PerfilUsuario = 'ADMIN' | 'CLIENTE';

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

export type EnderecoCep = Pick<
  Endereco,
  'cep' | 'logradouro' | 'complemento' | 'bairro' | 'cidade' | 'estado'
>;

export interface Usuario {
  sessionToken?: string;
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf?: string;
  nasc?: string;
  endereco?: Endereco;
  ocupacaoProfissional?: string;
  cadastroCompleto: boolean;
  perfil: PerfilUsuario;
}

export type CadastroUsuario = Pick<Usuario, 'nome' | 'email' | 'telefone'>;
export type NovoUsuario = CadastroUsuario & { perfil: PerfilUsuario };
export type CompletarPerfil = Required<Pick<Usuario, 'cpf' | 'nasc' | 'endereco'>> &
  Pick<Usuario, 'ocupacaoProfissional'>;
export type PreCadastro = CadastroUsuario & { senha: string };
