// Gerado por system-scheduling-wr/scripts/generate-anamnese-models.js.
export interface InformacoesGerais {
  estadoCivil: "Solteiro(a)" | "Casado(a)" | "Divorciado(a)" | "Viúvo(a)" | "Outros";
  planoSaude: boolean;
  qualPlanoSaude?: string;
  comoConheceu: "Redes sociais" | "Clientes" | "Amigos" | "Outros";
}

export interface ContraindicacoesAbsolutas {
  convulsao: boolean;
  epilepsia: boolean;
  gestante: boolean;
  marcaPasso: boolean;
  problemasCardiacos: boolean;
  problemasNeurologicos: boolean;
  trombose: boolean;
}

export interface ContraindicacoesRelativas {
  herniaInguinal: boolean;
  herniaUmbilical: boolean;
  hidrogel: boolean;
  localHidrogel?: string;
  pmma: boolean;
  localPmma?: string;
}

export interface Queixas {
  principaisQueixas: string;
  procedimentosEsteticos: boolean;
  quaisProcedimentos?: string;
  melhora?: string;
  acompanhamentoMedico: boolean;
  qualAcompanhamento?: string;
}

export interface SaudePessoal {
  sexo: "Feminino" | "Masculino" | "Prefiro não informar";
}

export interface SaudeFeminina {
  temFilhos: boolean;
  partoNormal?: boolean;
  cesarea?: boolean;
  quantidadeFilhos?: number;
  idadesFilhos?: string;
  amamentando: boolean;
  diu: boolean;
  desejoSexual: "Normal" | "Muito" | "Pouco" | "Nenhum";
  cicloMenstrual: "Regular" | "Irregular" | "Não tenho";
  contraceptivo: boolean;
  qualContraceptivo?: string;
  menopausa: boolean;
  ultimaMenstruacao?: string;
}

export interface SaudeMasculina {
  ejaculacao: "Normal" | "Tardia" | "Precoce";
  disfuncaoEretil: boolean;
}

export interface Alimentacao {
  frequenciaIntestinal: string;
  ingereAgua: boolean;
  aguaPorDia?: "500 ml" | "1 L" | "2 L" | "3 L" | "Mais de 3 L";
  desjejum?: string;
  lancheManha?: string;
  almoco?: string;
  lancheTarde?: string;
  jantar?: string;
  lanchePosJantar?: string;
  nutricionista: boolean;
  intoleranciaAlimentar: boolean;
  alimentosIntolerancia?: string;
  sintomasIntolerancia?: string;
  ganhaPesoFacil: boolean;
  perdePesoFacil: boolean;
  retencaoLiquido: boolean;
  problemasDigestivos: boolean;
  tratamentoDigestivo?: string;
  gastriteRefluxo: boolean;
}

export interface Habitos {
  bebidaAlcoolica: boolean;
  fuma: boolean;
  cigarrosDia?: number;
  qualidadeSono: string;
  horasSono: number;
  atividadeFisica: boolean;
  qualAtividade?: string;
  frequenciaAtividade?: string;
}

export interface Historico {
  cirurgia: boolean;
  localCirurgia?: string;
  tempoCirurgia?: string;
  silicone: boolean;
  localSilicone?: string;
  protese: boolean;
  localProtese?: string;
  alergias: boolean;
  quaisAlergias?: string;
  medicamentosSuplementos: string;
  desmaiou: boolean;
  causaDesmaio?: string;
  examesSangue: boolean;
  ultimoExameSangue?: string;
  anemia: boolean;
  tireoide: boolean;
  qualTireoide?: string;
  tratamentoTireoide: boolean;
  qualTratamentoTireoide?: string;
  diabetes: boolean;
  tipoDiabetes?: string;
  tratamentoDiabetes?: string;
  disturbioHormonal: boolean;
  tratamentoHormonal?: string;
  disturbioRenal: boolean;
  tratamentoRenal?: string;
  disturbioHepatico: boolean;
  tratamentoHepatico?: string;
  problemaCirculatorio: boolean;
  tratamentoCirculatorio?: string;
  pressao: "Hipertensão" | "Hipotensão" | "Normal";
  pressaoHabitual?: string;
  pressaoHoje?: string;
  medicacaoPressao: boolean;
  qualMedicacaoPressao?: string;
  problemaCicatrizacao: boolean;
  cabelosUnhasQuebradicos: boolean;
  tratamentoCabelosUnhas?: string;
  sangramentoGengiva: boolean;
  causaSangramentoGengiva?: string;
  dermatite: boolean;
  qualDermatite?: string;
}

export interface RespostasAnamneseCorporal {
  informacoesGerais: InformacoesGerais;
  contraindicacoesAbsolutas: ContraindicacoesAbsolutas;
  contraindicacoesRelativas: ContraindicacoesRelativas;
  queixas: Queixas;
  saudePessoal: SaudePessoal;
  saudeFeminina?: SaudeFeminina;
  saudeMasculina?: SaudeMasculina;
  alimentacao: Alimentacao;
  habitos: Habitos;
  historico: Historico;
}

export interface CriarAnamneseCorporal {
  tipo: 'CORPORAL';
  respostas: RespostasAnamneseCorporal;
  declaracao: { informacoesVerdadeiras: true };
}
