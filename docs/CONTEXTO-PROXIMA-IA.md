# Handoff para a próxima IA — WR Estética

**Atualizado em:** 26/10/2026  
**Repositório:** `bacresende/system-scheduling`  
**Branch observada:** `dev`  
**Último commit observado:** `9fd2463` — `corrigindo routelink banner`

## Como retomar

Leia este handoff e, em seguida, consulte a documentação funcional e visual
existente. Antes de alterar código, compare as afirmações deste documento com os
arquivos citados: o estado descrito é o que foi observado no repositório na data
acima, e o código pode ter mudado desde então.

Não foi possível recuperar um histórico de conversas/sessões anteriores para
este repositório. Este handoff foi elaborado a partir do código, dos documentos
versionados e do histórico Git disponível; portanto, não deve ser tratado como
transcrição de decisões que não estejam registradas nesses materiais.

## O que é o produto

O WR Estética é um MVP para administração de uma clínica de estética: clientes,
serviços, agenda, pagamentos, anamnese e histórico visual da cliente, com
oportunidades de retorno e atalhos de contato por WhatsApp/e-mail. A interface é
em português (`pt-BR`) e prioriza uso mobile.

## Estado verificado do projeto

- Aplicação frontend em Angular 21, TypeScript estrito, componentes standalone,
  detecção de mudanças zoneless, PrimeNG 21 e Tailwind CSS 4.
- Organização por funcionalidades em `src/app/features`; transporte HTTP
  centralizado em `src/app/core/api/api-client.ts`.
- Integração real com Parse/Back4App iniciada; **o backend está incompleto**.
  Não há contas de demonstração nem autenticação simulada.
- No momento da inspeção, a árvore de trabalho estava limpa antes das alterações
  deste handoff.
- O histórico Git observado registra a estrutura inicial em outubro de 2026 e,
  mais recentemente, autenticação, cadastro progressivo, validações/formatadores
  e atalhos de contato. Commits relevantes recentes incluem `bc96114`
  (cadastro progressivo), `5b53452` (pipes), `4717e31` (atalho de WhatsApp),
  `09d0d62` (atalho de e-mail), `faf7279` (dias para retorno opcionais) e
  `9fd2463` (link do banner).

## Funcionalidades presentes no frontend

| Área | Estado observado |
|---|---|
| Autenticação | Telas de login e pré-cadastro; restauração de sessão Parse; redefinição de senha via REST Parse; logout; preenchimento progressivo do perfil e consulta de CEP. |
| Clientes/usuários | Listagem e criação de clientes pelo frontend; validação de CPF; pipes de exibição para nascimento, CEP, CPF e telefone; links de contato por WhatsApp/e-mail. |
| Serviços | Tela de listagem e manutenção (criar, editar, inativar), incluindo duração, preço e dias para retorno. |
| Agendamentos | Lista/calendário e detalhe; regra de duração, expediente, conflitos e cancelamentos; fluxo de conclusão com pagamento e foto. |
| Anamnese | Ficha facial/corporal associada ao identificador de agendamento; validação de acesso e edição conforme status no contexto da tela. Rotas capilar/sobrancelha ainda não têm campos especificados. |
| Portal da cliente | Próximos atendimentos, histórico e banner para concluir o cadastro. |
| Dashboard/oportunidades | Telas e serviços de carregamento; oportunidades calculadas a partir de atendimentos concluídos e dias para retorno; WhatsApp abre um link pré-preenchido, não envia mensagem automaticamente. |

Os serviços frontend que chamam a API estão em `src/app/features/*/services`.
Interfaces importantes: `Usuario`, `Servico`, `Agendamento`,
`ConfiguracaoAgenda`, `Anamnese` e `CandidatoRetorno`.

## Integração disponível no Cloud Code

`cloud/main.js` define atualmente apenas estas cinco funções:

- `preCadastro`
- `login`
- `sessao`
- `consultarCep`
- `completarCadastro`

O fluxo de cadastro usa `_User`/Parse, normaliza e-mail, associa o novo usuário
ao papel `CLIENTE` e valida telefone. O perfil progressivo valida CPF,
nascimento e endereço no servidor. `consultarCep` chama ViaCEP com timeout. A
resposta de autenticação inclui token de sessão; o frontend o guarda em
`sessionStorage`. Não copie para documentos nem mensagens valores de
configuração/credenciais existentes no código.

## Lacunas de integração — prioridade principal

O frontend já chama endpoints que **não estão definidos em `cloud/main.js`**.
Sem backend correspondente, essas telas não representam uma integração
completa. Implementar/confirmar os contratos e autorização no servidor antes de
considerar esses fluxos prontos:

- Administração de usuários: `listUsuarios`, `createUsuario`.
- Administração de serviços: `listServicos`, `createServico`, `updateServico`,
  `deactivateServico`.
- Agenda: configuração da clínica, listagem/detalhe/criação/cancelamento/
  conclusão de agendamentos e upload de fotos.
- Anamnese: leitura e gravação por agendamento.
- Portal: endpoint de linha do tempo da cliente.
- Indicadores e retornos: dashboard e oportunidades.

Os contratos esperados e as regras de payload estão detalhados em
[README.md](../README.md), seção “Contratos de integração pendentes”. Datas de
eventos devem preservar fuso/offset; nascimento usa `YYYY-MM-DD`. O servidor
precisa validar permissões por registro, validar entrada e aplicar as regras de
agenda de forma atômica. Não colocar Master Key no frontend.

## Pontos a confirmar/corrigir na retomada

1. **Proteção de rotas:** guards existem em
   `src/app/features/auth/services/auth.guard.ts`, mas várias proteções estão
   comentadas em `src/app/app.routes.ts` (`sessionGuard` e `adminGuard`). Na
   configuração observada, `clientGuard` protege `/portal`, mas a anamnese e as
   rotas administrativas não têm as proteções correspondentes ativadas. Guard
   de frontend não substitui autorização no backend. Como `clientGuard` não
   restaura a sessão, o acesso ao portal após recarregar a página também precisa
   ser verificado. Além disso, o guard envia o destino em `retorno`, enquanto a
   tela de login lê `returnUrl`; alinhe o nome antes de ativar o fluxo de retorno.
2. **Documentação versus código:** o README foi corrigido junto com este
   handoff para refletir que `listUsuarios`, `createUsuario` e a configuração
   funcional de `API_BASE_URL` não existem no estado observado. Mantenha os
   contratos sincronizados ao implementar essas capacidades.
3. **Modelo de dados Back4App:** confira como dados legados em `Cliente`, `_User`,
   papéis e `Endereco` convivem. O Cloud Code atual mantém compatibilidade com
   registros `Cliente` preexistentes durante a sessão/conclusão de perfil;
   mudanças de schema precisam preservar ou migrar esses registros.
4. **Agenda:** validar com o fuso IANA real da clínica, janelas de expediente e
   profissionais definidos pelo backend. A interface bloqueia divergência de
   fuso em vez de converter silenciosamente. O servidor deve repetir a checagem
   de conflito atomicamente.
5. **Dados clínicos e fotos:** definir consentimento, retenção, ACLs, acesso às
   imagens e política de URLs públicas/assinadas. Upload deve usar multipart,
   nunca base64 no banco; validar conteúdo, tipo/tamanho e autorização no
   servidor.
6. **Acessibilidade/produção:** build e testes unitários não comprovam WCAG/AXE,
   segurança nem comportamento com backend real. Fazer validação manual/browser
   com teclado, foco, contraste e estados de carregamento/erro/vazio.

### Desalinhamentos funcionais importantes

- As rotas de anamnese capilar e sobrancelha redirecionam para a ficha geral, mas
  não há requisitos/campos de ficha específicos para esses serviços; não invente
  campos sem decisão de produto.
- `sessionGuard` tem lógica para restaurar sessão, mas é necessário ativá-lo
  explicitamente nas rotas apropriadas; `clientGuard` e `adminGuard` verificam a
  sessão carregada e não fazem, por si só, restauração. O nome do query param de
  retorno usado pelo guard (`retorno`) não coincide com o nome lido pelo login
  (`returnUrl`).
- Os requisitos e README descrevem serviços/endpoints que ainda não são
  implementados no arquivo Cloud Code observado. Confirme o ambiente Back4App
  antes de atribuir qualquer falha apenas ao frontend.

## Regras de produto que devem ser preservadas

- Um agendamento contém exatamente um serviço.
- Duração e preço da reserva são snapshots; alterações futuras do serviço não
  devem modificar reservas já existentes.
- Não permitir sobreposição; permitir horários adjacentes; cancelados não
  bloqueiam. A validação no servidor precisa ser atômica.
- Para concluir, exigir método de pagamento. Registros concluídos/cancelados não
  podem ser editados como se ainda estivessem pendentes.
- Oportunidades dependem de atendimento concluído e `diasParaRetorno` positivo
  com data já atingida. Evitar convites duplicados, idealmente no contrato
  backend.
- Não retornar senhas. Validar no servidor os dados que também são validados no
  frontend.
- WhatsApp/e-mail são links de contato iniciados pelo usuário, não envio
  automático.

## Diretrizes de implementação

Consulte [regras-desenvolvimento.md](regras-desenvolvimento.md),
[especificacao-visual.md](especificacao-visual.md) e
[especificacao-requisito.md](especificacao-requisito.md). Em resumo:

- Angular/TypeScript estrito; manter padrões de `inject()`, signals,
  `ChangeDetectionStrategy.OnPush` e Reactive Forms já usados.
- Tailwind mobile-first, tokens `estetica-*`, PrimeNG para controles
  interativos, CSS simples e acessibilidade WCAG AA.
- Não usar mocks ou fallbacks que pareçam sucesso quando uma API real falhar.
- Alterações pequenas, cobertas por testes focados, e manter a documentação de
  integração alinhada ao código.

## Comandos úteis

```bash
npm ci
npm start
npm run build
npm test -- --watch=false
```

O projeto fixa `npm@11.6.2`; os testes usam Vitest pelo builder Angular. Há testes
para regras de agenda, guards, autenticação, validações, pipes e fluxos de
frontend. Confira o comando e o resultado no ambiente atual antes de reportar
validação, pois não foram executados como parte deste handoff.

## Documentos de referência

- [README.md](../README.md) — visão da aplicação, rotas, integração e contratos.
- [Especificação funcional](especificacao-requisito.md) — escopo, requisitos e
  regras de negócio.
- [Especificação visual](especificacao-visual.md) — linguagem visual e
  checklist de interface.
- [Regras de desenvolvimento](regras-desenvolvimento.md) — stack e convenções.
- [Instruções do Copilot](../.github/copilot-instructions.md) e
  [instruções do Gemini](../.gemini/GEMINI.md) — diretrizes locais de código.
