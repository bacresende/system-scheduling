export interface AnamneseBase {
  id?: string;
  idCliente: string;
  dataPreenchimento: Date | string;
}

export interface Anamnese extends AnamneseBase {
  tipoPele: 'Seca' | 'Oleosa' | 'Mista' | 'Normal';
  usaAcidos: boolean;
  quaisAcidos?: string;
  sensibilidadeSol: boolean;
  temVarizes: boolean;
  fezCirurgiaRecente: boolean;
  praticaAtividadeFisica: boolean;
  alergiaCosmeticos: boolean;
}
