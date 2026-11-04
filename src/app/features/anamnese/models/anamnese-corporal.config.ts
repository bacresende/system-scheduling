// Gerado por system-scheduling-wr/scripts/generate-anamnese-models.js.
export interface CampoAnamnese {
  key: string; label: string; type: 'boolean' | 'text' | 'select' | 'number' | 'date';
  required: boolean; when?: string; options?: string[]; maxLength?: number;
  min?: number; max?: number; integer?: boolean;
}
export interface SecaoAnamnese { key: string; label: string; fields: CampoAnamnese[]; when?: { section: string; field: string; equals: string }; }
export const SECOES_ANAMNESE: SecaoAnamnese[] = [
  {
    "key": "informacoesGerais",
    "label": "Informações gerais",
    "fields": [
      {
        "key": "estadoCivil",
        "label": "Estado civil",
        "type": "select",
        "options": [
          "Solteiro(a)",
          "Casado(a)",
          "Divorciado(a)",
          "Viúvo(a)",
          "Outros"
        ],
        "required": true
      },
      {
        "key": "planoSaude",
        "label": "Possui plano de saúde?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "qualPlanoSaude",
        "label": "Qual plano de saúde?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "planoSaude"
      },
      {
        "key": "comoConheceu",
        "label": "Como conheceu a clínica?",
        "type": "select",
        "options": [
          "Redes sociais",
          "Clientes",
          "Amigos",
          "Outros"
        ],
        "required": true
      }
    ]
  },
  {
    "key": "contraindicacoesAbsolutas",
    "label": "Contraindicações absolutas — conforme a ficha",
    "fields": [
      {
        "key": "convulsao",
        "label": "Convulsão",
        "type": "boolean",
        "required": true
      },
      {
        "key": "epilepsia",
        "label": "Epilepsia",
        "type": "boolean",
        "required": true
      },
      {
        "key": "gestante",
        "label": "Gestante",
        "type": "boolean",
        "required": true
      },
      {
        "key": "marcaPasso",
        "label": "Marca-passo",
        "type": "boolean",
        "required": true
      },
      {
        "key": "problemasCardiacos",
        "label": "Problemas cardíacos",
        "type": "boolean",
        "required": true
      },
      {
        "key": "problemasNeurologicos",
        "label": "Problemas neurológicos",
        "type": "boolean",
        "required": true
      },
      {
        "key": "trombose",
        "label": "Trombose",
        "type": "boolean",
        "required": true
      }
    ]
  },
  {
    "key": "contraindicacoesRelativas",
    "label": "Contraindicações relativas — conforme a ficha",
    "fields": [
      {
        "key": "herniaInguinal",
        "label": "Hérnia inguinal",
        "type": "boolean",
        "required": true
      },
      {
        "key": "herniaUmbilical",
        "label": "Hérnia umbilical",
        "type": "boolean",
        "required": true
      },
      {
        "key": "hidrogel",
        "label": "Possui hidrogel?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "localHidrogel",
        "label": "Local do hidrogel",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "hidrogel"
      },
      {
        "key": "pmma",
        "label": "Possui PMMA?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "localPmma",
        "label": "Local do PMMA",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "pmma"
      }
    ]
  },
  {
    "key": "queixas",
    "label": "Queixas e acompanhamento",
    "fields": [
      {
        "key": "principaisQueixas",
        "label": "2. Principais queixas",
        "type": "text",
        "maxLength": 2000,
        "required": true
      },
      {
        "key": "procedimentosEsteticos",
        "label": "3. Já realizou procedimentos estéticos?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "quaisProcedimentos",
        "label": "Quais procedimentos?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "procedimentosEsteticos"
      },
      {
        "key": "melhora",
        "label": "4. Houve melhora?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "procedimentosEsteticos"
      },
      {
        "key": "acompanhamentoMedico",
        "label": "5. Faz acompanhamento médico?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "qualAcompanhamento",
        "label": "Qual acompanhamento?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "acompanhamentoMedico"
      }
    ]
  },
  {
    "key": "saudePessoal",
    "label": "Saúde pessoal",
    "fields": [
      {
        "key": "sexo",
        "label": "Sexo",
        "type": "select",
        "options": [
          "Feminino",
          "Masculino",
          "Prefiro não informar"
        ],
        "required": true
      }
    ]
  },
  {
    "key": "saudeFeminina",
    "label": "Saúde feminina",
    "fields": [
      {
        "key": "temFilhos",
        "label": "6a. Tem filhos?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "partoNormal",
        "label": "Parto normal?",
        "type": "boolean",
        "required": true,
        "when": "temFilhos"
      },
      {
        "key": "cesarea",
        "label": "Cesárea?",
        "type": "boolean",
        "required": true,
        "when": "temFilhos"
      },
      {
        "key": "quantidadeFilhos",
        "label": "Quantos filhos?",
        "type": "number",
        "min": 1,
        "max": 30,
        "integer": true,
        "required": true,
        "when": "temFilhos"
      },
      {
        "key": "idadesFilhos",
        "label": "Idades dos filhos",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "temFilhos"
      },
      {
        "key": "amamentando",
        "label": "6b. Está amamentando?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "diu",
        "label": "6c. Faz uso de DIU?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "desejoSexual",
        "label": "6d. Desejo sexual",
        "type": "select",
        "options": [
          "Normal",
          "Muito",
          "Pouco",
          "Nenhum"
        ],
        "required": true
      },
      {
        "key": "cicloMenstrual",
        "label": "7. Ciclo menstrual",
        "type": "select",
        "options": [
          "Regular",
          "Irregular",
          "Não tenho"
        ],
        "required": true
      },
      {
        "key": "contraceptivo",
        "label": "8. Usa contraceptivo?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "qualContraceptivo",
        "label": "Qual contraceptivo?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "contraceptivo"
      },
      {
        "key": "menopausa",
        "label": "9. Menopausa?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "ultimaMenstruacao",
        "label": "Data da última menstruação (se souber)",
        "type": "date",
        "required": false
      }
    ],
    "when": {
      "section": "saudePessoal",
      "field": "sexo",
      "equals": "Feminino"
    }
  },
  {
    "key": "saudeMasculina",
    "label": "Saúde masculina",
    "fields": [
      {
        "key": "ejaculacao",
        "label": "10a. Ejaculação",
        "type": "select",
        "options": [
          "Normal",
          "Tardia",
          "Precoce"
        ],
        "required": true
      },
      {
        "key": "disfuncaoEretil",
        "label": "10b. Disfunção erétil?",
        "type": "boolean",
        "required": true
      }
    ],
    "when": {
      "section": "saudePessoal",
      "field": "sexo",
      "equals": "Masculino"
    }
  },
  {
    "key": "alimentacao",
    "label": "Alimentação e digestão",
    "fields": [
      {
        "key": "frequenciaIntestinal",
        "label": "11. Funcionamento do intestino / frequência",
        "type": "text",
        "maxLength": 2000,
        "required": true
      },
      {
        "key": "ingereAgua",
        "label": "12. Ingere água?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "aguaPorDia",
        "label": "Quantidade de água por dia",
        "type": "select",
        "options": [
          "500 ml",
          "1 L",
          "2 L",
          "3 L",
          "Mais de 3 L"
        ],
        "required": true,
        "when": "ingereAgua"
      },
      {
        "key": "desjejum",
        "label": "13. Desjejum",
        "type": "text",
        "maxLength": 2000,
        "required": false
      },
      {
        "key": "lancheManha",
        "label": "Lanche da manhã",
        "type": "text",
        "maxLength": 2000,
        "required": false
      },
      {
        "key": "almoco",
        "label": "Almoço",
        "type": "text",
        "maxLength": 2000,
        "required": false
      },
      {
        "key": "lancheTarde",
        "label": "Lanche da tarde",
        "type": "text",
        "maxLength": 2000,
        "required": false
      },
      {
        "key": "jantar",
        "label": "Jantar",
        "type": "text",
        "maxLength": 2000,
        "required": false
      },
      {
        "key": "lanchePosJantar",
        "label": "Lanche após o jantar",
        "type": "text",
        "maxLength": 2000,
        "required": false
      },
      {
        "key": "nutricionista",
        "label": "14. Faz acompanhamento com nutricionista?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "intoleranciaAlimentar",
        "label": "15. Possui intolerância alimentar?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "alimentosIntolerancia",
        "label": "Quais alimentos?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "intoleranciaAlimentar"
      },
      {
        "key": "sintomasIntolerancia",
        "label": "16. Quais sintomas apresenta ao ingerir?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "intoleranciaAlimentar"
      },
      {
        "key": "ganhaPesoFacil",
        "label": "17. Ganha peso com facilidade?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "perdePesoFacil",
        "label": "18. Perde peso com facilidade?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "retencaoLiquido",
        "label": "19. Retenção de líquido frequente?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "problemasDigestivos",
        "label": "20. Teve problemas digestivos?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "tratamentoDigestivo",
        "label": "Faz tratamento? Descreva ou informe que não faz.",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "problemasDigestivos"
      },
      {
        "key": "gastriteRefluxo",
        "label": "21. Gastrite ou refluxo?",
        "type": "boolean",
        "required": true
      }
    ]
  },
  {
    "key": "habitos",
    "label": "Hábitos e rotina",
    "fields": [
      {
        "key": "bebidaAlcoolica",
        "label": "22. Ingere bebida alcoólica?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "fuma",
        "label": "23. Fuma?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "cigarrosDia",
        "label": "Quantos cigarros por dia?",
        "type": "number",
        "min": 1,
        "max": 200,
        "integer": true,
        "required": true,
        "when": "fuma"
      },
      {
        "key": "qualidadeSono",
        "label": "24. Qualidade do sono",
        "type": "text",
        "maxLength": 2000,
        "required": true
      },
      {
        "key": "horasSono",
        "label": "25. Horas de sono por dia",
        "type": "number",
        "min": 0,
        "max": 24,
        "integer": false,
        "required": true
      },
      {
        "key": "atividadeFisica",
        "label": "26. Faz atividade física?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "qualAtividade",
        "label": "Qual atividade?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "atividadeFisica"
      },
      {
        "key": "frequenciaAtividade",
        "label": "27. Frequência da atividade",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "atividadeFisica"
      }
    ]
  },
  {
    "key": "historico",
    "label": "Histórico de saúde",
    "fields": [
      {
        "key": "cirurgia",
        "label": "28. Já fez cirurgia?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "localCirurgia",
        "label": "29. Em que parte do corpo?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "cirurgia"
      },
      {
        "key": "tempoCirurgia",
        "label": "30. Há quanto tempo?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "cirurgia"
      },
      {
        "key": "silicone",
        "label": "31. Possui prótese de silicone?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "localSilicone",
        "label": "32. Em que parte do corpo?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "silicone"
      },
      {
        "key": "protese",
        "label": "33. Possui outra prótese?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "localProtese",
        "label": "Onde?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "protese"
      },
      {
        "key": "alergias",
        "label": "34. Alergias ou irritações?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "quaisAlergias",
        "label": "Quais?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "alergias"
      },
      {
        "key": "medicamentosSuplementos",
        "label": "35. Medicamentos de uso contínuo ou suplementos (ou nenhum)",
        "type": "text",
        "maxLength": 2000,
        "required": true
      },
      {
        "key": "desmaiou",
        "label": "36. Já desmaiou?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "causaDesmaio",
        "label": "Causa, se conhecida (ou não sei)",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "desmaiou"
      },
      {
        "key": "examesSangue",
        "label": "37. Faz exames de sangue periodicamente?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "ultimoExameSangue",
        "label": "Quando fez o último exame?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "examesSangue"
      },
      {
        "key": "anemia",
        "label": "38. Já teve anemia?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "tireoide",
        "label": "39. Já teve disfunção da tireoide?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "qualTireoide",
        "label": "Qual disfunção?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "tireoide"
      },
      {
        "key": "tratamentoTireoide",
        "label": "40. Fez tratamento para tireoide?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "qualTratamentoTireoide",
        "label": "Qual tratamento?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "tratamentoTireoide"
      },
      {
        "key": "diabetes",
        "label": "41. Possui diabetes?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "tipoDiabetes",
        "label": "Tipo de diabetes",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "diabetes"
      },
      {
        "key": "tratamentoDiabetes",
        "label": "Tratamento para diabetes (ou não faz)",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "diabetes"
      },
      {
        "key": "disturbioHormonal",
        "label": "42. Distúrbio hormonal?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "tratamentoHormonal",
        "label": "Qual distúrbio e tratamento (ou não faz)?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "disturbioHormonal"
      },
      {
        "key": "disturbioRenal",
        "label": "43. Distúrbio renal?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "tratamentoRenal",
        "label": "Qual distúrbio e tratamento (ou não faz)?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "disturbioRenal"
      },
      {
        "key": "disturbioHepatico",
        "label": "44. Distúrbio hepático, como gordura no fígado?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "tratamentoHepatico",
        "label": "Faz tratamento? Qual (ou não faz)?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "disturbioHepatico"
      },
      {
        "key": "problemaCirculatorio",
        "label": "45. Problema circulatório?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "tratamentoCirculatorio",
        "label": "Faz tratamento? Qual (ou não faz)?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "problemaCirculatorio"
      },
      {
        "key": "pressao",
        "label": "46. Pressão arterial",
        "type": "select",
        "options": [
          "Hipertensão",
          "Hipotensão",
          "Normal"
        ],
        "required": true
      },
      {
        "key": "pressaoHabitual",
        "label": "Pressão habitual (se souber)",
        "type": "text",
        "maxLength": 2000,
        "required": false
      },
      {
        "key": "pressaoHoje",
        "label": "Pressão hoje (se medida)",
        "type": "text",
        "maxLength": 2000,
        "required": false
      },
      {
        "key": "medicacaoPressao",
        "label": "47. Controla a pressão com medicação?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "qualMedicacaoPressao",
        "label": "Qual medicação?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "medicacaoPressao"
      },
      {
        "key": "problemaCicatrizacao",
        "label": "48. Problemas de cicatrização?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "cabelosUnhasQuebradicos",
        "label": "49. Cabelos e unhas quebradiços?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "tratamentoCabelosUnhas",
        "label": "Faz tratamento? Qual (ou não faz)?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "cabelosUnhasQuebradicos"
      },
      {
        "key": "sangramentoGengiva",
        "label": "50. Gengiva costuma sangrar?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "causaSangramentoGengiva",
        "label": "Por quê? (ou não sei)",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "sangramentoGengiva"
      },
      {
        "key": "dermatite",
        "label": "51. Possui dermatite?",
        "type": "boolean",
        "required": true
      },
      {
        "key": "qualDermatite",
        "label": "Qual dermatite?",
        "type": "text",
        "maxLength": 2000,
        "required": true,
        "when": "dermatite"
      }
    ]
  }
];
