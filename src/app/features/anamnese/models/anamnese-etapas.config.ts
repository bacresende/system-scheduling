export interface EtapaAnamnese {
  key: string;
  title: string;
  icon: string;
  description: string;
  sections: string[];
}

// Organização compartilhada pelo preenchimento e pela consulta do prontuário.
export const ETAPAS_ANAMNESE: EtapaAnamnese[] = [
  {
    key: 'sobreVoce',
    title: 'Sobre você',
    icon: 'pi-user',
    description: 'Conte o que você busca e como podemos cuidar de você.',
    sections: ['informacoesGerais', 'queixas'],
  },
  {
    key: 'seguranca',
    title: 'Segurança',
    icon: 'pi-shield',
    description: 'Estas informações ajudam o profissional a avaliar os cuidados necessários.',
    sections: ['contraindicacoesAbsolutas', 'contraindicacoesRelativas'],
  },
  {
    key: 'saudePessoal',
    title: 'Saúde pessoal',
    icon: 'pi-heart',
    description: 'Selecione seu sexo para exibir as perguntas correspondentes. Você também pode optar por não informar.',
    sections: ['saudePessoal', 'saudeFeminina', 'saudeMasculina'],
  },
  {
    key: 'rotina',
    title: 'Sua rotina',
    icon: 'pi-sun',
    description: 'Vamos conhecer sua alimentação, seu sono e seus hábitos.',
    sections: ['alimentacao', 'habitos'],
  },
  {
    key: 'historico',
    title: 'Histórico',
    icon: 'pi-file',
    description: 'Compartilhe seu histórico de saúde e os cuidados que já realiza.',
    sections: ['historico'],
  },
];
