import { CriarAnamneseCorporal } from '../models/anamnese-corporal.model';

export const fichaCorporal = {
  "tipo": "CORPORAL",
  "respostas": {
    "informacoesGerais": {
      "estadoCivil": "Solteiro(a)",
      "planoSaude": false,
      "comoConheceu": "Amigos"
    },
    "contraindicacoesAbsolutas": {
      "convulsao": false,
      "epilepsia": false,
      "gestante": false,
      "marcaPasso": false,
      "problemasCardiacos": false,
      "problemasNeurologicos": false,
      "trombose": false
    },
    "contraindicacoesRelativas": {
      "herniaInguinal": false,
      "herniaUmbilical": false,
      "hidrogel": false,
      "pmma": false
    },
    "queixas": {
      "principaisQueixas": "Avaliação corporal",
      "procedimentosEsteticos": false,
      "acompanhamentoMedico": false
    },
    "saudeFeminina": {
      "aplicavel": false
    },
    "saudeMasculina": {
      "aplicavel": false
    },
    "alimentacao": {
      "frequenciaIntestinal": "Uma vez ao dia",
      "ingereAgua": true,
      "aguaPorDia": "2 L",
      "desjejum": "Frutas",
      "almoco": "Arroz e feijão",
      "jantar": "Sopa",
      "nutricionista": false,
      "intoleranciaAlimentar": false,
      "ganhaPesoFacil": false,
      "perdePesoFacil": false,
      "retencaoLiquido": false,
      "problemasDigestivos": false,
      "gastriteRefluxo": false
    },
    "habitos": {
      "bebidaAlcoolica": false,
      "fuma": false,
      "qualidadeSono": "Boa",
      "horasSono": 8,
      "atividadeFisica": true,
      "qualAtividade": "Caminhada",
      "frequenciaAtividade": "3 vezes por semana"
    },
    "historico": {
      "cirurgia": false,
      "silicone": false,
      "protese": false,
      "alergias": false,
      "medicamentosSuplementos": "Nenhum",
      "desmaiou": false,
      "examesSangue": true,
      "ultimoExameSangue": "Outubro de 2026",
      "anemia": false,
      "tireoide": false,
      "tratamentoTireoide": false,
      "diabetes": false,
      "disturbioHormonal": false,
      "disturbioRenal": false,
      "disturbioHepatico": false,
      "problemaCirculatorio": false,
      "pressao": "Normal",
      "medicacaoPressao": false,
      "problemaCicatrizacao": false,
      "cabelosUnhasQuebradicos": false,
      "sangramentoGengiva": false,
      "dermatite": false
    }
  },
  "declaracao": {
    "informacoesVerdadeiras": true
  }
} satisfies CriarAnamneseCorporal;
