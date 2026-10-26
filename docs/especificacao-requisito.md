# Sistema de Agendamentos de Estética

## 1. Visão do Projeto
Sistema de Produto Mínimo Viável (MVP) para gerenciar e otimizar a rotina de agendamentos e fichas de anamnese de uma clínica de estética, substituindo o controle manual e de papel, com foco na fidelização de clientes e construção de histórico visual (Linha do Tempo).

## 2. Requisitos Funcionais (RF)
* **RF01 - Gestão de Serviços:** O sistema deve permitir cadastrar, editar e inativar procedimentos estéticos (nome, preço, duração em minutos, flag ativo e tempo médio para retorno).
* **RF02 - Gestão de Clientes:** Cadastro de clientes.
* **RF03 - Calendário Interativo:** Exibição da agenda em visões diária e semanal para o administrador.
* **RF04 - Bloqueio Automático:** O sistema bloqueia a agenda automaticamente usando a `duração em minutos` do serviço escolhido. Apenas 1 serviço por agendamento.
* **RF05 - Controle Financeiro:** Agendamentos devem ter status (Pendente, Cancelado, Concluído). Ao concluir, registrar método de pagamento.
* **RF06 - Lembretes via WhatsApp:** Geração de link pré-formatado para disparar mensagem via API do WhatsApp web/mobile.
* **RF07 - Acesso do Usuário:** O administrador pode cadastrar uma pessoa como `Usuario` com perfil `CLIENTE`. A pessoa pode solicitar redefinição de senha pelo e-mail cadastrado para definir sua senha de acesso.
* **RF08 - Cadastro Progressivo:** Quando a cliente logar no sistema, se o perfil estiver incompleto (`cadastroCompleto: false`), o sistema deve solicitar a conclusão do cadastro (Endereço, CPF, Nasc) antes de liberar outras funcionalidades.
* **RF09 - Ficha de Anamnese Única:** O sistema deve disponibilizar uma ficha única por agendamento, reunindo informações de pele, saúde e rotina, sem selecionar a ficha por serviço.
* **RF10 - Linha do Tempo e Histórico Visual:** Ao concluir um agendamento, o sistema deve permitir o upload de uma fotografia de resultado (salvando a URL atrelada ao agendamento). A interface da cliente deve exibir essas fotos em formato de "Linha do Tempo", permitindo visualizar a evolução dos procedimentos passados.
* **RF11 - Alertas de Retorno (Fidelização):** Um painel gerencial ("Oportunidades do Dia") que lista clientes que atingiram o tempo de manutenção de um serviço passado, gerando um atalho para envio de convite via WhatsApp.

## 3. Requisitos Não Funcionais (RNF)
* **RNF01 - Responsividade (Mobile First):** Interface otimizada para uso em smartphones.
* **RNF02 - Validação Imediata:** Uso de Reactive Forms no Angular para impedir salvamentos de dados inválidos com feedback instantâneo.
* **RNF03 - Rota de Anamnese:** A ficha única deve ser acessada pela rota `/anamnese?agendamento=ID`, com validação tipada e contrato de API único.
* **RNF04 - Otimização de Storage:** O sistema não deve salvar imagens em base64 no banco relacional. Deve-se fazer upload para um Storage em nuvem e salvar apenas a URL pública/assinada na tabela de agendamento.

## 4. Regras de Negócio (RN)
* **RN01 - Agendamento Simples:** Cada agendamento comporta estritamente 1 serviço (para facilitar cálculo de agenda e cancelamentos).
* **RN02 - Prevenção de Choque de Agenda:** Proibida a sobreposição de horários. A lógica deve calcular o `horário de início + duração média do serviço` para garantir que o bloco de tempo esteja 100% livre.
* **RN03 - Limite de Expediente:** O sistema só deve aceitar horários que comecem e terminem dentro da janela de funcionamento da clínica.
* **RN04 - Integridade Financeira:** Agendamentos marcados como "Concluídos" (com pagamento registrado) ou "Cancelados" não podem ter serviços ou valores alterados posteriormente.
* **RN05 - Gatilho de Fidelização:** O alerta de retorno (RF11) só é acionado se o serviço configurado tiver os "dias para retorno" preenchidos e se o agendamento original estiver com status "Concluído".

## 5. Modelagem de Dados (Interfaces TypeScript)

```typescript
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

export interface Usuario {
  id?: string;
  perfil: 'ADMIN' | 'CLIENTE';
  // --- Campos do Pré-cadastro (Obrigatórios) ---
  nome: string;
  email: string;                 // Chave de login (Unique)
  telefone: string;              // Para lembretes via WhatsApp
  senha?: string;                // Opcional no retorno da API, mas obrigatório na criação da conta
  
  // --- Campos do Cadastro Progressivo (Opcionais no início) ---
  nasc?: Date | string;          
  cpf?: string;                  
  ocupacaoProfissional?: string; 
  endereco?: Endereco;           
  
  // --- Controle de Estado ---
  cadastroCompleto: boolean;     // Flag: true se já preencheu CPF/Endereço
}

export interface Servico {
  id?: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMinutos: number; // Tempo para o cálculo de bloqueio de agenda
  ativo: boolean;         // Soft delete
  // --- Módulo de Fidelização (RF11) ---
  diasParaRetorno?: number; // Ex: 30 dias. Usado para sugerir novo agendamento.
}

export interface Agendamento {
  id?: string;
  dataHora: Date | string;
  idServico: string;       // Restrito a 1 serviço por agendamento (RN01)
  idCliente: string;
  idFuncionario: string;
  status: 'Pendente' | 'Concluido' | 'Cancelado';
  metodoPagamento?: 'PIX' | 'Cartao' | 'Dinheiro';
  
  // --- Linha do Tempo e Histórico Visual (RF10) ---
  fotoResultadoUrl?: string; // URL da imagem salva em Storage em nuvem (S3, Firebase, etc.)
  anotacoesFinais?: string;  // Comentários da sessão sobre a reação da pele, produtos indicados, etc.
}

// --- Estrutura de Anamnese com Herança ---

// A base que toda anamnese obrigatoriamente tem
export interface AnamneseBase {
  id?: string;
  idCliente: string;
  idServico: string; 
  idAgendamento: string;
  dataPreenchimento: Date | string;
}

// Ficha única com informações de pele, saúde e rotina
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