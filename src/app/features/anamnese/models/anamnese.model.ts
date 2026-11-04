import { CriarAnamneseCorporal } from './anamnese-corporal.model';
import { Usuario } from '../../usuarios/models/usuario.model';

export interface AnamneseBase {
  id?: string;
  idCliente: string;
  dataPreenchimento: Date | string;
}

export interface AnamneseCorporal extends AnamneseBase, Omit<CriarAnamneseCorporal, 'declaracao'> {
  declaracao: { informacoesVerdadeiras: true; texto: string; aceitaEm: string; idUsuario: string };
}
export type Anamnese = AnamneseCorporal;
export interface DetalheAnamnese { anamnese: Anamnese; cliente: Usuario; }
