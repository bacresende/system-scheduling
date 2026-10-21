export interface AnamneseBase {
  id?: string;
  idCliente: string;
  idServico: string;
  idAgendamento: string;
  dataPreenchimento: Date | string;
}

export interface AnamneseFacial extends AnamneseBase {
  tipoPele: 'Seca' | 'Oleosa' | 'Mista' | 'Normal';
  usaAcidos: boolean;
  quaisAcidos?: string;
  sensibilidadeSol: boolean;
}

export interface AnamneseCorporal extends AnamneseBase {
  temVarizes: boolean;
  fezCirurgiaRecente: boolean;
  praticaAtividadeFisica: boolean;
  alergiaCosmeticos: boolean;
}
