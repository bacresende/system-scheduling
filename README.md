# WrEstetica

## Estado do MVP

Frontend Angular 21, zoneless, com componentes standalone, PrimeNG 21 e Tailwind 4.
As regras de [desenvolvimento](docs/regras-desenvolvimento.md) complementam a
[especificação funcional](docs/especificacao-requisito.md).
As diretrizes de interface estão em
[especificação visual](docs/especificacao-visual.md).
Para retomar o trabalho com outra IA, consulte o
[handoff de contexto](docs/CONTEXTO-PROXIMA-IA.md), que registra o estado
observado do código, as lacunas de integração e as prioridades de continuidade.

**A integração com o backend está parcial.** `cloud/main.js` contém as Cloud
Functions de pré-cadastro, login, sessão, consulta de CEP e conclusão do perfil.
As operações administrativas de usuários e serviços, agendamentos, anamneses,
dashboard e oportunidades ainda precisam de funções/endpoints.
Não há autenticação simulada nem contas de demonstração.

### Organização

```text
src/app/
  core/api/                  # transporte HTTP e configuração de integração
  shared/ui/                 # feedback de requisições e validação de campos
  shared/utils/              # utilitários sem regras de negócio
  layout/main-layout/        # navegação exclusiva da administração
  features/
    auth/                    # sessão, guards, login, cadastro e redefinição de senha
    usuarios/                # modelo único Usuario e operações administrativas
    clientes/                # telas de clientes e conclusão progressiva do perfil
    servicos/                # cadastro, edição e inativação
    agendamentos/            # agenda diária/semanal, horários, pagamento e upload
    anamnese/                # contratos e formulários facial e corporal
    dashboard/               # indicadores gerenciais retornados pela API
    oportunidades/           # prazo de retorno e convites via WhatsApp
    portal/                  # agenda e linha do tempo da própria cliente
```

Os componentes externos usam arquivos `.css` vazios; os layouts usam Tailwind
mobile-first e as cores `estetica-*` já definidas em [src/styles.css](src/styles.css).
Controles interativos são PrimeNG. Componentes recebem `styleClass`; diretivas
como `pInputText`/`pTextarea`, aplicadas em elementos nativos, recebem `class`
(não possuem a mesma API `styleClass`). Imagens da linha do tempo são dinâmicas,
não imagens estáticas do projeto.

### Rotas

- Públicas, sem layout administrativo: `/login` (inclui redefinição de senha) e
  `/pre-cadastro` (cadastro próprio do usuário).
- `/completar-cadastro` não tem guard ativado atualmente. `/portal` tem
  `clientGuard`, que verifica a sessão já carregada.
- `/anamnese?agendamento=ID` é a rota da ficha única vinculada ao agendamento,
  mas não tem guard ativado atualmente.
- Administração: `/dashboard`, `/clientes`, `/servicos`, `/agendamentos`,
  `/agendamentos/:id`, `/oportunidades`.
- As proteções `sessionGuard` na raiz e `adminGuard` na área administrativa estão
  comentadas em `src/app/app.routes.ts`; por isso, as rotas administrativas não
  estão protegidas por esses guards no estado atual. O `sessionGuard` contém a
  lógica de restauração/redirecionamento, mas precisa ser ligado às rotas.

São usados imports estáticos e `component`, conforme a preferência do projeto.
O bundle inicial medido é de aproximadamente 1,22 MB (235 kB de transferência
estimada). Com autorização, o orçamento passou a aviso em 1,25 MB e erro em
1,35 MB; não foi introduzido lazy loading.

### Conectar uma API real

O [ApiClient](src/app/core/api/api-client.ts) usa
`https://parseapi.back4app.com/functions` e adiciona os cabeçalhos do Parse.
Essa URL está definida diretamente no serviço; não há atualmente um provider
`API_BASE_URL` funcional. Publique `cloud/main.js` como Cloud Code no Back4App.
A pessoa pode criar sua própria conta pela rota `/pre-cadastro`; o fluxo de
criação administrativa de usuários ainda depende de endpoint a implementar.
O cadastro usa o e-mail normalizado como `username`, cuja unicidade no Parse
impede contas duplicadas. Se a clínica criar uma conta por outro meio, a pessoa
deve usar “Esqueci minha senha” para definir seu acesso. Após o login, o fluxo de
perfil leva a pessoa para
`/completar-cadastro`. O token fica em `sessionStorage` e é enviado nas próximas
requisições como `X-Parse-Session-Token`. O logout invalida a sessão pelo endpoint
REST do Parse. A REST API Key usada no cliente é visível no navegador; não coloque
a Master Key no frontend e configure ACL/CLP e permissões no Back4App.

Configure um `emailAdapter` válido no app Back4App/Parse Server para o envio dos
e-mails de redefinição. A solicitação usa diretamente
`POST https://parseapi.back4app.com/requestPasswordReset`; o Parse processa o
pedido e envia o link. Revise a URL de redefinição e os domínios permitidos na
configuração do app antes de liberar o fluxo em produção.

### Cloud Functions implementadas

As respostas das Cloud Functions Parse vêm no envelope `{ result: ... }`; o
`ApiClient` remove esse envelope antes de entregar os dados aos serviços.

| Método e caminho | Corpo / resposta |
|---|---|
| `POST /functions/preCadastro` | `{ nome, email, telefone, senha }` -> `Usuario` com `sessionToken`; cria `_User`, username=email e autentica |
| `POST /functions/login` | `{ email, senha }` -> `Usuario` com `sessionToken` |
| `POST /functions/sessao` | Requer `X-Parse-Session-Token`; retorna `Usuario` atual |
| `POST /logout` | Endpoint REST do Parse; invalida a sessão autenticada |
| `POST /functions/completarCadastro` | Requer sessão; `{ cpf, nasc, endereco, ocupacaoProfissional? }` -> atualiza o perfil do usuário autenticado, cliente ou admin, e calcula a conclusão no servidor; endereço pode ser preenchido manualmente mesmo se a consulta do CEP falhar |
| `POST /functions/consultarCep` | Requer sessão; `{ cep }` -> consulta ViaCEP e retorna CEP, logradouro, complemento, bairro, cidade e UF |

O Cloud Code atual determina o perfil pela associação do usuário aos papéis
`ADMIN`/`CLIENTE`; o fluxo de pré-cadastro associa novos usuários ao papel
`CLIENTE`. Nome, e-mail, telefone, CPF e nascimento permanecem em `_User`. O
endereço é salvo na classe `Endereco` e associado ao usuário pelo ponteiro
`_User.endereco`.

### Contratos de integração pendentes

As integrações abaixo ainda aguardam implementação. Datas de eventos devem ser
ISO 8601 com offset/UTC; nascimento usa `YYYY-MM-DD`.
| `POST /functions/listUsuarios` | `{ perfil: 'CLIENTE' }` -> `Usuario[]`; somente admin |
| `POST /functions/createUsuario` | `{ nome, email, telefone, perfil: 'CLIENTE' }` -> `Usuario`; somente admin |
| `POST /functions/listServicos` | `{}` -> `Servico[]`, incluindo inativos; somente admin |
| `POST /functions/createServico` | `SalvarServico` -> `Servico`; somente admin |
| `POST /functions/updateServico` | `{ id, ...SalvarServico }` -> `Servico`; somente admin |
| `POST /functions/deactivateServico` | `{ id }` -> `Servico` inativado; somente admin |
| `GET /clinica/agenda` | `ConfiguracaoAgenda` com fuso IANA, janelas de expediente e profissionais |
| `GET /agendamentos?inicio=ISO&fim=ISO` | `Agendamento[]`; intervalo `[inicio, fim)`, incluindo eventos que interceptem a janela |
| `GET /agendamentos/:id` | `Agendamento`; admin ou cliente proprietária |
| `POST /agendamentos` | `NovoAgendamento` -> `Agendamento`; servidor calcula duração, valor e status pendente |
| `POST /agendamentos/:id/cancelar` | `{}` -> `Agendamento` cancelado |
| `POST /agendamentos/:id/concluir` | `{ metodoPagamento, anotacoesFinais, fotoResultadoUrl? }` -> `Agendamento` concluído |
| `POST /agendamentos/:id/foto` | Multipart `foto` -> `{ url: "https://..." }`; upload autorizado para Storage |
| `GET /anamnese?agendamento=ID` | `Anamnese` única ou `null` se ainda não preenchida |
| `PUT /anamnese/:idAgendamento` | Respostas da ficha única -> `Anamnese` |
| `GET /usuarios/me/linha-do-tempo` | `AtendimentoPortal[]`; somente dados da sessão, incluindo nome do serviço sem tipo de ficha |
| `GET /dashboard` | `{ agendamentosHoje, clientes, receitaConcluidaHoje, oportunidades }` |
| `GET /oportunidades` | `CandidatoRetorno[]`: `{ agendamento, usuario, servico }` |

`Usuario` contém os dados da conta e `perfil: 'ADMIN' | 'CLIENTE'`; não há uma
classe separada `Cliente`. Não devolver senha em nenhuma resposta. A política de
senha, confirmação de e-mail e provisão de administradores ainda deve ser definida
pelo backend.

`Agendamento` inclui `valor` e `duracaoMinutos` como snapshots do momento da
reserva, além dos campos da especificação. Alterar um serviço não pode alterar
retroativamente duração ou valor de reservas existentes.

`ConfiguracaoAgenda`:

```json
{
  "fusoHorario": "America/Sao_Paulo",
  "expediente": [
    { "diaSemana": 1, "inicio": "09:00", "fim": "18:00" }
  ],
  "funcionarios": [{ "id": "ID_REAL", "nome": "Profissional" }]
}
```

Este exemplo é de contrato, não uma configuração de funcionamento presumida.
`diaSemana` segue JavaScript (0 domingo, 6 sábado); várias janelas no mesmo dia
permitem intervalos. A versão atual exige que o dispositivo administrativo use
o fuso da clínica; divergências são bloqueadas com mensagem, sem converter
silenciosamente horários.

### Regras implementadas na interface e obrigações do backend

- Uma seleção de serviço por agendamento; duração reservada integralmente.
- Verificação de choque e expediente antes de criar. Intervalos adjacentes são
  permitidos; cancelados não bloqueiam. O servidor deve repetir isso de forma
  **atômica** para impedir concorrência entre operadores.
- Conclusão exige pagamento; atendimentos encerrados não exibem ações de
  alteração. API deve impedir transições inválidas e alteração financeira.
- Perfil incompleto bloqueia portal e anamnese; acesso administrativo depende
  de papel. Guards não substituem autorização nem proteção dos dados clínicos.
- Cadastro usa Reactive Forms, e-mail/telefone válidos e CPF com dígitos
  verificadores; servidor deve repetir as validações e garantir unicidade.
- Facial exige informar ácidos quando aplicável. Cliente/serviço da ficha vêm
  do agendamento, não de campos editáveis. Fichas encerradas são somente leitura.
- Fotos JPEG/PNG/WebP até 5 MB são enviadas em multipart, nunca base64. O backend
  valida conteúdo real, acesso, tamanho, Storage, URL e autorização. Uploads
  provisórios precisam expirar se a conclusão falhar; URLs assinadas precisam ser
  renovadas no endpoint de histórico. Fotos clínicas devem ter acesso autorizado.
- Oportunidades verificam conclusão, prazo positivo e data atingida. O endpoint
  deve definir a seleção de candidatos (por exemplo, último atendimento de cada
  cliente/serviço), evitando convites duplicados. WhatsApp abre um link com texto;
  **não há envio automático**, nem promessa de entrega.
- Falhas HTTP são exibidas: 401 sessão/credenciais, 403 permissão, 409 conflito;
  erros de rede têm mensagem e não são convertidos em sucesso/dados fictícios.

### Pendências explícitas

1. Implementar e integrar todos os endpoints acima, autenticação real, banco,
   Storage, autorização por registro, CSRF e validações transacionais.
2. Definir horários reais, profissionais, política de senha e retenção/consentimento
   para dados e fotos de saúde.
3. A especificação não define campos de capilar/sobrancelha. As respectivas
   rotas mostram essa pendência; não inventam formulários ou salvamentos.
4. Validar integração e acessibilidade em navegador com dados reais autorizados.
   Build e testes unitários não certificam conformidade WCAG/AXE ou segurança do
   backend.

### Validação local

```bash
npm run build
npm test -- --watch=false
```

Testes cobrem intervalos/expediente, conflitos, cancelamentos, retornos, CPF,
API sem configuração e guards de sessão, perfil e papel.

---

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
