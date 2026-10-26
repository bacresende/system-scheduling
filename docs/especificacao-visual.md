# Especificação visual — WR Estética

## Objetivo

Definir uma direção visual consistente para o sistema a partir das telas de
login e pré-cadastro já desenvolvidas: uma interface clean, acolhedora e
sofisticada, com cards como estrutura principal e detalhes inovadores usados com
moderação. A inovação deve valorizar a experiência e a leitura das informações,
sem competir com o conteúdo nem comprometer a usabilidade.

## Referências existentes

As telas de autenticação estabelecem os seguintes elementos como base:

- Fundo claro, cartões brancos e paleta suave em tons rosados.
- Um painel de boas-vindas com círculos decorativos discretos e transparências.
- Cantos arredondados, bordas delicadas e sombras difusas.
- Títulos expressivos em serifada combinados com textos funcionais em sans-serif.
- Campos confortáveis, com rótulos visíveis, foco evidente e estados de erro.
- Ícones pontuais, microtextos e realces usados para orientar, não decorar em
  excesso.

Essa linguagem deve ser reaproveitada nas áreas autenticadas, adaptando o tom
mais editorial das telas públicas para uma interface operacional e objetiva.

## Princípios visuais

1. **Leveza:** priorizar espaço em branco, fundos claros e agrupamentos simples.
2. **Hierarquia:** destacar primeiro a ação ou informação mais importante da
   tela.
3. **Acolhimento:** usar cores quentes e mensagens humanas sem infantilizar a
   interface.
4. **Inovação com propósito:** usar composição, profundidade, dados visuais e
   pequenas animações para melhorar a compreensão ou dar personalidade.
5. **Consistência:** manter os mesmos tokens, padrões de card, controles e
   interações em todas as funcionalidades.
6. **Acessibilidade:** não depender apenas da cor, do hover ou de ícones para
   comunicar significado.

## Paleta de cores

Os valores abaixo correspondem aos tokens atualmente definidos em
`src/styles.css`:

| Token | Valor atual | Uso recomendado |
|---|---|---|
| `estetica-primary` | `#E5989B` | Destaques, estados ativos e pequenos acentos visuais. Usar com parcimônia em superfícies grandes. |
| `estetica-secondary` | `#F6EBEC` | Superfícies suaves, painéis, fundos de ícones, seleções e bordas discretas. |
| `estetica-tertiary` | `#9EB3A6` | Acentos secundários e indicadores positivos, sempre acompanhados de texto ou ícone. |
| `estetica-bg` | `#FCFAFA` | Fundo geral da aplicação e das páginas públicas. |
| `estetica-text` | `#4A4A4A` | Texto principal, títulos funcionais, ícones e contornos de foco. |

### Regras de aplicação

- Usar `estetica-text` para texto corrido sobre superfícies claras.
- Usar `estetica-primary` como acento, não como cor padrão para texto pequeno.
- Manter texto e controles com contraste suficiente em todos os estados.
- Reservar cores de sucesso, alerta e erro para seus significados funcionais;
  não substituir a paleta de estado por tons decorativos.
- Preferir tokens `estetica-*` a valores de cor isolados nos templates.

## Tipografia

- **Títulos de marca e chamadas principais:** serifada, como nas telas de
  autenticação; usar em poucas áreas de destaque.
- **Navegação, formulários, dados, tabelas e conteúdo funcional:** sans-serif
  legível e consistente com a tipografia padrão do sistema.
- Diferenciar títulos por tamanho, peso e espaçamento, não apenas por cor.
- Usar textos curtos, linguagem direta e rótulos explícitos nos controles.
- Reservar caixa alta e tracking amplo para etiquetas pequenas, como categorias
  ou mensagens introdutórias.

## Sistema de cards

Cards são a unidade principal para organizar resumos, agenda, clientes,
serviços, oportunidades e etapas de formulários.

### Card padrão

- Fundo branco sobre `estetica-bg`.
- Borda fina em tom de `estetica-secondary`.
- Cantos arredondados entre `rounded-xl` e `rounded-2xl`; cards de composição
  especial podem usar arredondamento maior.
- Espaçamento interno confortável, proporcional à densidade da informação.
- Sombra leve e difusa apenas quando necessária para separar planos; evitar
  sombras escuras ou múltiplas camadas pesadas.
- Título claro, conteúdo principal bem destacado e ações agrupadas em posição
  previsível.
- Área clicável indicada por estados de hover, foco e cursor; não fazer o card
  inteiro parecer interativo se apenas uma ação interna for clicável.

### Hierarquia de cards

- **Card de métrica:** rótulo curto, valor em destaque, contexto temporal e,
  quando aplicável, variação com texto ou ícone. Exemplo: “Agendamentos hoje”.
- **Card de conteúdo:** título, resumo e ação relacionada, mantendo o conteúdo
  mais importante visível sem abrir detalhes.
- **Card de ação:** ação primária evidente e poucas ações secundárias.
- **Card de estado vazio:** ícone simples, explicação útil e chamada para a
  próxima ação; evitar ilustração decorativa sem função.
- **Card de destaque:** pode usar fundo secundário, faixa lateral, borda de
  acento ou um detalhe visual em camadas. Reservar para conteúdo realmente
  prioritário.

### Toques inovadores permitidos

- Indicadores ou pequenas faixas de cor associados a categorias e estados.
- Métricas com hierarquia tipográfica clara e variação contextual.
- Gradientes muito sutis, transparências ou formas circulares em áreas de
  destaque, inspirados no painel da tela de login.
- Ícones dentro de superfícies suaves e consistentes.
- Microinterações curtas ao focar ou selecionar um card: leve mudança de borda,
  sombra ou posição, sem deslocamentos bruscos.
- Composição assimétrica ou cards de tamanhos diferentes somente quando
  reforçarem a prioridade do conteúdo e continuarem responsivos.

### Evitar

- Glassmorphism forte, blur generalizado e excesso de transparência.
- Gradientes saturados, sombras pesadas e bordas decorativas em todos os cards.
- Muitos cards com a mesma cor de destaque competindo entre si.
- Informações essenciais escondidas em hover ou tooltip.
- Uso de cor isolado para identificar status.
- Animações longas, repetitivas ou que causem movimento excessivo.

## Layout e espaçamento

- Adotar layout mobile-first e adaptar a grade conforme o espaço disponível.
- Agrupar informações relacionadas e separar seções com espaçamento consistente.
- Em dashboards, usar uma grade de cards de métricas que se reorganize em telas
  menores; evitar largura fixa.
- Manter conteúdo dentro de uma largura confortável, com margens generosas nas
  páginas de formulário e autenticação.
- Priorizar alinhamentos e linhas de base consistentes entre cards, títulos e
  ações.
- Evitar rolagem horizontal para conteúdo essencial.

## Controles e interações

- Campos devem ter rótulo persistente, área de interação confortável, foco
  visível, placeholder auxiliar e mensagens de erro associadas ao campo.
- Botões primários devem ser facilmente identificáveis; ações secundárias devem
  ter menor peso visual.
- Ícones interativos precisam de nome acessível e tamanho de alvo adequado.
- Estados de hover devem complementar, e não substituir, estados de foco e
  pressionado. O foco por teclado deve ser sempre perceptível.
- Estados de carregamento, sucesso, erro, desabilitado e vazio devem ser
  explícitos e manter a estrutura da página estável.
- Transições devem ser curtas e respeitar a preferência por movimento reduzido.

## Responsividade

- Reorganizar grades de cards em uma coluna em telas estreitas e ampliar
  progressivamente em telas maiores.
- Preservar ordem de leitura e prioridade das ações entre breakpoints.
- Reduzir padding e tamanho de títulos em telas pequenas sem reduzir a área
  utilizável dos controles.
- Painéis decorativos podem desaparecer em telas menores se não forem essenciais
  ao conteúdo, como já ocorre na tela de login.
- A navegação administrativa mantém uma barra lateral em telas médias e
  grandes; em celulares, usa uma barra de navegação fixa na parte inferior com
  ícone e rótulo curto para cada área principal.
- A barra inferior deve respeitar a área segura do dispositivo, não cobrir o
  conteúdo e indicar a rota atual por mais de um sinal visual, mantendo nomes
  acessíveis para leitores de tela.
- Garantir que textos, valores e rótulos longos quebrem linha sem sobrepor
  botões ou ícones.

## Acessibilidade e movimento

- Cumprir WCAG AA, incluindo contraste de texto e foco visível.
- Usar elementos semânticos adequados para títulos, seções, listas e ações.
- Fornecer nomes acessíveis para controles compostos apenas por ícones.
- Associar erros e instruções aos respectivos campos e comunicar estados sem
  depender apenas de cor.
- Respeitar `prefers-reduced-motion` e não usar animações como requisito para
  entender uma informação.

## Diretrizes para implementação

- Reutilizar os tokens de cor existentes e os componentes compartilhados do
  projeto antes de criar variações locais.
- Manter componentes pequenos e focados, com templates legíveis e estados
  explícitos.
- Usar classes utilitárias e padrões já adotados pelo projeto, evitando estilos
  inline ou cores arbitrárias sem necessidade.
- Ao criar um novo padrão visual, conferir primeiro se ele pode ser construído
  com os tokens e componentes existentes.
- Validar cada tela em tamanhos móveis e desktop e conferir teclado, foco,
  contraste e estados vazios/carregando/erro.

## Checklist de revisão visual

- [ ] A ação ou informação prioritária é identificada rapidamente?
- [ ] Os cards têm hierarquia e espaçamento consistentes?
- [ ] O destaque visual está reservado para conteúdo importante?
- [ ] Há espaço suficiente em telas pequenas e não existe rolagem horizontal?
- [ ] Hover, foco por teclado e estado pressionado são perceptíveis?
- [ ] Ícones e estados têm alternativas textuais acessíveis?
- [ ] Contrastes e mensagens de erro continuam claros?
- [ ] A tela parece parte do mesmo sistema de login e pré-cadastro sem copiar
      literalmente o layout de autenticação?
