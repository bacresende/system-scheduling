# WR Estética

MVP em Angular 21, standalone, zoneless, PrimeNG 21 e Tailwind CSS 4. Consulte [requisitos](docs/especificacao-requisito.md), [regras de desenvolvimento](docs/regras-desenvolvimento.md), [diretrizes visuais](docs/especificacao-visual.md) e [contexto de retomada](docs/CONTEXTO-PROXIMA-IA.md).

## Execução e backend

Frontend: `npm run build`, `npm test -- --watch=false` e `npm start`. No PowerShell, usar `npm.cmd` se a política bloquear `npm.ps1`.

O Cloud Code está em `C:/Users/bacre/system-scheduling-wr/cloud`; o `main.js` dessa pasta carrega os módulos de funções. Execute `npm test` na pasta do backend. A exclusão preexistente do antigo `cloud/main.js` no repositório Angular foi preservada.

O ApiClient usa `https://parseapi.back4app.com/functions`, envia os cabeçalhos Parse e remove o envelope `{ result: ... }`. A sessão fica em `sessionStorage`. O papel é o campo `perfil` de `_User`, com ADMIN ou CLIENTE. Configurar ACL/CLP e provisionamento de administradores no ambiente publicado; nunca colocar Master Key no frontend.

## Rotas e decisões de produto

- Login e pré-cadastro são públicos. O pré-cadastro exige nome, e-mail, telefone, CPF válido e senha.
- `sessionGuard` restaura a sessão; `adminGuard` protege a administração.
- Rotas ADMIN: dashboard, agendamentos, clientes, serviços, cupons e detalhes de atendimento/prontuário.
- `/anamnese` é o link compartilhado com a CLIENTE autenticada. Cada envio registra uma ficha no perfil da sessão, sem serviço ou agendamento. O ADMIN consulta as fichas na aba Anamneses do prontuário.
- O parâmetro antigo `agendamento` não seleciona nem associa registros. Não existem GET/PUT de anamnese por atendimento. As rotas antigas de tipos de ficha redirecionam para a ficha única.
- A cliente pode acessar portal e anamnese com cadastro incompleto e completar o perfil depois. O ADMIN informa um CPF válido e único no cadastro inicial; a conclusão posterior exige nascimento e endereço e preserva esse CPF.
- A tela separada de oportunidades foi retirada. `/oportunidades` redireciona para o dashboard. A futura apresentação dos retornos ficará no dashboard e está fora desta entrega. O contador legado da resposta do dashboard foi preservado.

## Cloud Functions locais

Todas usam `POST /functions/NOME`. A publicação no Back4App não é automática.

| Área                | Funções                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Autenticação        | preCadastro, login, sessao                                                                                         |
| Perfil              | completarCadastro, consultarCep                                                                                    |
| Dashboard           | dashboard                                                                                                          |
| Clientes            | listUsuarios, createUsuario, getClienteProntuario                                                                  |
| Serviços            | listServicos, createServico, updateServico, deactivateServico, deleteServico                                       |
| Cupons              | listCupons, createCupom, updateCupom, deactivateCupom, deleteCupom, validarCupom                                   |
| Agenda              | getConfiguracaoAgenda, listAgendamentos, getAgendamento, createAgendamento, createPacoteAgendamentos               |
| Operações           | confirmarAgendamento, reagendarAgendamento, marcarAlertaVistoAgendamento, cancelarAgendamento, concluirAgendamento |
| Consultas da agenda | listarHorariosDisponiveis, calcularResumoFinanceiroAgendamento                                                     |
| Arquivos            | uploadFotoAgendamento                                                                                              |
| Anamnese            | createAnamnese (CLIENTE), getAnamnese e listAnamneses (dono ou ADMIN)                                               |

Logout e redefinição usam REST Parse `/logout` e `/requestPasswordReset`; o envio de e-mail exige configuração de `emailAdapter`.

Contratos principais:

- `dashboard({ timeZone })` retorna agendamentosHoje, clientes, receitaConcluidaHoje, oportunidades e agendaHoje. O fuso IANA define os limites do dia.
- `getClienteProntuario({ id })` retorna cliente, agendamentos e anamnesesAvulsas. As fichas ficam no nível da cliente; todas as fichas corporais do mesmo idCliente são retornadas.
- `listAgendamentos({ inicio, fim })` retorna reservas do período, pendências e sessões irmãs, com paginação interna. Datas usam ISO 8601; nascimento usa YYYY-MM-DD.
- `createPacoteAgendamentos` recebe a base de NovoAgendamento, idPacote, totalSessoes e sessoes: `{ dataHora, dataDefinida }[]`; retorna Agendamento[]. A primeira sessão precisa de data e são permitidas até 100 sessões.
- `concluirAgendamento` recebe id, metodoPagamento (PIX/Cartao/Dinheiro), anotacoesFinais e URLs opcionais. Somente ADMIN, atendimento ativo com data definida.
- `uploadFotoAgendamento` recebe id e arquivos: `{ nomeArquivo, mimeType, base64 }[]`; retorna `{ url, urls }`. O envio de um único arquivo também é aceito.
- `createAnamnese` recebe `{ tipo: 'CORPORAL', respostas, declaracao: { informacoesVerdadeiras: true } }`. idCliente e data vêm do servidor. O formulário em `/anamnese` segue a avaliação corporal completa, com cabeçalho do cadastro e blocos condicionais. A ficha corporal é o único formato de anamnese. Consulte [o contrato e a geração dos modelos](C:/Users/bacre/system-scheduling-wr/docs/anamnese-corporal.md).
- `createUsuario` exige CPF válido e único, normalizado no servidor. `completarCadastro` recebe CPF opcional se já existente, nascimento, endereço e ocupação profissional opcional.
- Serviço referenciado por agendamentos não pode ser excluído: usar inativação. Código de cupom utilizado não pode ser renomeado.

## Integridade

A agenda propaga falhas essenciais; não substitui erro HTTP por expediente/profissionais presumidos ou listagem bem-sucedida. O dispositivo administrativo deve usar o fuso da clínica.

O formulário envia todas as sessões em uma requisição, inclusive no agendamento simples. idPacote é estável por tentativa: perder a resposta e repetir os mesmos dados reutiliza a chave. Uma chave com dados diferentes é rejeitada. Falha intermediária dispara rollback compensatório; tentativas parciais cuja limpeza falhou podem ser retomadas com a mesma chave. Locks são locais ao processo; isso não equivale a uma transação distribuída entre instâncias reais do Parse.

Valores e duração são snapshots calculados no servidor. O rateio distribui centavos restantes sem alterar o total contratado. Concluídos/cancelados não podem ser alterados como ativos. Sessões sem data precisam ser agendadas antes de receber pagamento ou fotos.

JPEG/PNG/WebP de até 5 MB são transmitidos como base64 para Parse.File; somente URLs são persistidas no agendamento. O servidor verifica assinatura e estrutura básica do formato, sem decodificação completa. O upload vincula fotos imediatamente, preservando-as se a conclusão falhar. Arquivos de um lote que falhar antes do vínculo são removidos por compensação; uma falha de limpeza também é informada. A interface conserva URLs já recebidas para não repetir o upload na nova tentativa de conclusão.

## Verificação e limites

Testes locais usam HTTP simulado e Parse em memória. Publicação, ACL/CLP, e-mail, Storage real e fluxos em navegador precisam ser verificados no ambiente autorizado. O frontend atualizado depende da publicação de createPacoteAgendamentos.

O portal da cliente ainda chama `GET /functions/usuarios/me/linha-do-tempo`, sem implementação no backend local, fora do escopo desta correção administrativa. Consulte o [registro das correções](docs/auditoria-admin-2026-11-03.md).
