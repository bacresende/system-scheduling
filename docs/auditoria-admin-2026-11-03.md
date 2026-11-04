**Auditoria e correções do perfil ADMIN — 03/11/2026**

As correções funcionais foram implementadas no frontend Angular e no Cloud Code de `C:/Users/bacre/system-scheduling-wr/cloud`. Nenhuma publicação no Back4App foi realizada.

**Decisões de escopo confirmadas**

- Anamnese somente pelo link `/anamnese`, associada à cliente autenticada. O fluxo por agendamento foi removido do formulário, serviço, guard, modelo e interface do prontuário. Fichas antigas da cliente são preservadas no histórico do perfil.
- A tela separada de oportunidades e seu serviço GET foram removidos. A rota antiga redireciona para o dashboard. Uma futura incorporação dos retornos ao dashboard está fora desta entrega; não é uma pendência de endpoint desta correção.

**Resultado das correções**

| Achado da auditoria | Implementação |
|---|---|
| Falhas ocultas e configuração presumida na agenda | Consultas essenciais propagam erros; configuração só é disponibilizada após sucesso; falha da listagem limpa as reservas anteriores; horários remotos e falhas de validação de cupom são sinalizados. |
| Pacotes parcialmente criados | Novo POST createPacoteAgendamentos recebe todas as sessões, executa compensação em falha e permite repetição com idPacote estável. O formulário não cria mais sessões por chamadas separadas. |
| Repetir após perder a resposta | A interface reutiliza a chave e o payload da tentativa; o servidor retorna o mesmo pacote já criado, rejeitando a chave com dados diferentes. |
| Diferença de centavos no rateio | Restante distribuído entre as sessões; a soma preserva o total líquido. Exemplo: R$ 100 em três sessões resulta em R$ 33,34 + R$ 33,33 + R$ 33,33. O resumo do formulário informa a faixa de valores. |
| Upload sem vínculo ou conteúdo validado | Exige agendamento existente, ativo e com data; valida base64, tamanho e assinatura/estrutura básica de PNG/JPEG/WebP. |
| Fotos sem vínculo após falhar a conclusão | Upload vincula URLs imediatamente ao agendamento. A interface retém essas URLs e não repete arquivos ao tentar concluir novamente. Falha antes do vínculo tenta remover todo o lote do Storage. |
| Paginação da agenda e sessões irmãs | Consultas percorrem todas as páginas e ordenam a resposta; 1.000 pendências antigas não excluem mais a reserva do dia solicitado. |
| Cupom renomeado perdia contagem | Servidor impede alterar o código depois de utilizado, inclusive quando a referência histórica está cancelada; demais campos continuam editáveis. |
| Concluir sessão sem data | Rejeitado no servidor e nas ações da interface. Upload também rejeita esse estado. |
| Exclusão de serviço usado prejudicava histórico | Exclusão rejeitada com orientação para inativar; serviço sem referências ainda pode ser excluído. Nomes de serviços inativos são preservados na consulta da agenda. |
| Cliente criada pelo ADMIN sem CPF | Cadastro administrativo passou a exigir CPF com máscara e validação; servidor normaliza, valida e rejeita duplicidade. O cadastro progressivo preserva o CPF salvo. |
| Testes e documentação desatualizados | Contratos, requisitos, contexto e testes foram sincronizados com o backend separado e as decisões de produto. |
| Cores locais e modificadores de prioridade | Templates administrativos passaram a usar tokens existentes e cores semânticas; modificadores de prioridade do Tailwind foram retirados. |

**Verificação final**

| Comando | Resultado |
|---|---|
| Frontend: npm.cmd test -- --watch=false | 120 testes passaram em 22 arquivos. |
| Frontend: npm.cmd run build | Passou; bundle inicial de 659,25 kB. |
| Backend: npm.cmd test | 156 testes passaram. |
| git diff --check | Sem erros de whitespace. |

As regressões cobrem rollback após falha de sessão e de consulta pós-gravação, repetição de pacote, requisições concorrentes no mesmo processo, rateio, paginação acima de 1.000 registros, proteção do histórico de serviços/cupons, arquivos inválidos, compensação de uploads e CPF. O frontend também cobre falhas essenciais da agenda, repetição após perda de resposta e preservação das fotos quando a conclusão falha.

**Arquivos principais**

- Frontend: `features/agendamentos/pages/agendamento-list-page`, `features/agendamentos/services`, `features/clientes/pages/completar-cadastro-page`, `features/anamnese`, guards e rotas.
- Backend: `cloud/functions/agendamentos.js`, `cupons.js`, `servicos.js`, `usuarios.js` e `clientes.js`.
- Testes novos: `cloud/tests/admin-integridade.test.js`, teste da lista administrativa de agendamentos e teste do cadastro progressivo.

**Limites e publicação**

Os testes são locais, com HTTP simulado e Parse em memória. Publicar o Cloud Code atualizado antes/junto do frontend, pois a criação depende do novo endpoint createPacoteAgendamentos. O schema precisa aceitar os campos de pacote e assinatura da tentativa em Agendamento.

O rollback é compensatório e os locks são locais ao processo; não se trata de uma transação distribuída comprovada. A inspeção de imagem verifica o contêiner básico, sem decodificação completa. Se o banco e o Storage estiverem indisponíveis, a compensação também pode falhar e informa erro para recuperação. Essas limitações não devem ser ocultadas como garantia de atomicidade ou validação integral do arquivo.

Esta entrega não certifica configuração remota de ACL/CLP, e-mail, Storage ou acessibilidade/responsividade em navegador. Os diálogos nativos existentes foram preservados; sua eventual migração geral para PrimeNG não foi tratada como correção de contrato de API.

O portal da cliente ainda possui contrato de linha do tempo sem backend correspondente, fora do escopo ADMIN. A exclusão local do antigo cloud/main.js no repositório Angular já existia e foi preservada.
