# WrEstetica

## Estado do MVP

Frontend Angular 21, zoneless, com componentes standalone, PrimeNG 21 e Tailwind 4.
As regras de [desenvolvimento](docs/regras-desenvolvimento.md) complementam a
[especificação funcional](docs/especificacao-requisito.md).

**A integração com o backend está parcial.** `cloud/main.js` contém as Cloud
Functions de cadastro, login e restauração de sessão do Back4App. As demais
operações de clientes, serviços e agendamentos ainda precisam de funções/endpoints.
Não há autenticação simulada nem contas de demonstração.

### Organização

```text
src/app/
  core/api/                  # transporte HTTP e configuração de integração
  shared/ui/                 # feedback de requisições e validação de campos
  shared/utils/              # utilitários sem regras de negócio
  layout/main-layout/        # navegação exclusiva da administração
  features/
    auth/                    # sessão, guards, login e pré-cadastro público
    clientes/                # modelos, cadastro administrativo e perfil progressivo
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

- Públicas, sem layout administrativo: `/login` e `/pre-cadastro`.
- Cliente autenticada: `/completar-cadastro` e `/portal`.
- Compartilhadas e autenticadas: `/anamnese/facial?agendamento=ID` e
  `/anamnese/corporal?agendamento=ID`.
- Administração: `/dashboard`, `/clientes`, `/servicos`, `/agendamentos`,
  `/agendamentos/:id`, `/oportunidades`.
- `/` encaminha ao dashboard; os guards encaminham clientes ao portal ou à
  conclusão obrigatória do perfil. Usuários sem sessão vão ao login.

São usados imports estáticos e `component`, conforme a preferência do projeto.
O bundle inicial medido é de aproximadamente 1,22 MB (235 kB de transferência
estimada). Com autorização, o orçamento passou a aviso em 1,25 MB e erro em
1,35 MB; não foi introduzido lazy loading.

### Conectar uma API real

O [ApiClient](src/app/core/api/api-client.ts) já usa
`https://parseapi.back4app.com/functions` por padrão e adiciona os cabeçalhos do
Parse. `API_BASE_URL` ainda pode ser sobrescrito nos providers de
[app.config.ts](src/app/app.config.ts), por exemplo:

```ts
import { API_BASE_URL } from './core/api/api-client';

// Dentro de providers:
{ provide: API_BASE_URL, useValue: '/api' }
```

Publique `cloud/main.js` como Cloud Code no Back4App. O pré-cadastro cria `_User`,
retorna o token Parse, inicia a sessão no frontend e encaminha para
`/completar-cadastro`. O token fica em `sessionStorage` e é enviado nas próximas
requisições como `X-Parse-Session-Token`. O logout invalida a sessão pelo endpoint
REST do Parse. A REST API Key usada no cliente é visível no navegador; não coloque
a Master Key no frontend e configure ACL/CLP e permissões no Back4App.

### Cloud Functions implementadas

As respostas das Cloud Functions Parse vêm no envelope `{ result: ... }`; o
`ApiClient` remove esse envelope antes de entregar os dados aos serviços.

| Método e caminho | Corpo / resposta |
|---|---|
| `POST /functions/preCadastro` | `{ nome, email, telefone, senha }` -> `{ sessionToken, session }`; cria `_User` e autentica |
| `POST /functions/login` | `{ email, senha }` -> `{ sessionToken, session }` |
| `POST /functions/sessao` | Requer `X-Parse-Session-Token`; retorna `Sessao` atual |
| `POST /logout` | Endpoint REST do Parse; invalida a sessão autenticada |

O pré-cadastro associa a conta ao papel `CLIENTE`; crie esse papel em `_Role`
antes de publicar/usar a função. As funções de sessão consultam o papel `ADMIN`
em `_Role`; usuários sem esse papel são tratados como `CLIENTE`. O perfil `Cliente`
é opcional até sua criação e, quando existe, a função carrega o Pointer `endereco`.

### Contrato HTTP proposto (integração pendente)

As rotas a seguir ainda não foram implementadas como Cloud Functions ou endpoints.
O servidor deve validar as entradas, autorização e propriedade dos registros.
Datas de eventos devem ser ISO 8601 com offset/UTC; nascimento usa `YYYY-MM-DD`.
| `POST /clientes` | `{ nome, email, telefone }` -> `Cliente`; backend define mecanismo de convite |
| `PUT /clientes/me/perfil` | `{ cpf, nasc, endereco }` -> `Cliente` com conclusão calculada no servidor |
| `GET /servicos` | `Servico[]`, incluindo inativos para consulta histórica |
| `GET /servicos/:id` | `Servico`; permitido ao dono de agendamento vinculado |
| `POST /servicos` | `SalvarServico` -> `Servico` |
| `PUT /servicos/:id` | `SalvarServico` -> `Servico` |
| `PATCH /servicos/:id/ativo` | `{ ativo: false }` -> `Servico` |
| `GET /clinica/agenda` | `ConfiguracaoAgenda` com fuso IANA, janelas de expediente e profissionais |
| `GET /agendamentos?inicio=ISO&fim=ISO` | `Agendamento[]`; intervalo `[inicio, fim)`, incluindo eventos que interceptem a janela |
| `GET /agendamentos/:id` | `Agendamento`; admin ou cliente proprietária |
| `POST /agendamentos` | `NovoAgendamento` -> `Agendamento`; servidor calcula duração, valor e status pendente |
| `POST /agendamentos/:id/cancelar` | `{}` -> `Agendamento` cancelado |
| `POST /agendamentos/:id/concluir` | `{ metodoPagamento, anotacoesFinais, fotoResultadoUrl? }` -> `Agendamento` concluído |
| `POST /agendamentos/:id/foto` | Multipart `foto` -> `{ url: "https://..." }`; upload autorizado para Storage |
| `GET /anamnese/facial?agendamento=ID` | `AnamneseFacial` ou `null` se ainda não preenchida |
| `PUT /anamnese/facial/:idAgendamento` | `RespostasFacial` -> `AnamneseFacial` |
| `GET /anamnese/corporal?agendamento=ID` | `AnamneseCorporal` ou `null` |
| `PUT /anamnese/corporal/:idAgendamento` | `RespostasCorporal` -> `AnamneseCorporal` |
| `GET /clientes/me/linha-do-tempo` | `AtendimentoPortal[]`; somente dados da sessão, com nome e tipo do serviço |
| `GET /dashboard` | `{ agendamentosHoje, clientes, receitaConcluidaHoje, oportunidades }` |
| `GET /oportunidades` | `CandidatoRetorno[]`: `{ agendamento, cliente, servico }` |

`Sessao` contém `{ id, nome, papel: 'ADMIN' | 'CLIENTE', cliente? }`; o objeto
`cliente` é obrigatório para sessões de cliente. Não devolver senha em nenhuma
resposta. A política de senha, confirmação de e-mail e provisão de administradores
ainda deve ser definida pelo backend.

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
