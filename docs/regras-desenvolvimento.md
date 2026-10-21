# Regras de Desenvolvimento - Sistema de Estética

## Stack Tecnológico
- Angular 21 (Standalone Components, arquitetura Zoneless, nova sintaxe de Control Flow `@if`, `@for`).
- PrimeNG v21 (Componentes base de UI).
- Tailwind CSS v4 (Sistema de estilização estrutural).
- Estilos em `.css` puro (sem SCSS).

## Diretrizes de UI/UX (Mobile-First)
- **NÃO use CSS manual ou PrimeFlex para layouts.** Utilize estritamente as classes utilitárias do Tailwind CSS.
- Adote a abordagem **Mobile-First**: as classes base sem prefixo devem ser sempre para celulares (ex: `w-full`, `flex-col`, `p-4`).
- Use os prefixos de responsividade (`md:`, `lg:`) apenas para adaptar a tela para tablets e computadores (ex: `md:w-auto`, `md:flex-row`).
- Utilize as variáveis de cores personalizadas do domínio de estética (ex: `bg-estetica-primary`, `text-estetica-texto`, `border-estetica-secondary`).

## Diretrizes do PrimeNG
- Use os componentes do PrimeNG para elementos interativos (Inputs, Tabelas, Modais, Dropdowns, Calendários).
- Para estilizar ou alterar a largura dos componentes do PrimeNG, utilize sempre a propriedade `styleClass` injetando o Tailwind.
- Exemplo correto: `<p-button label="Salvar" styleClass="w-full md:w-auto bg-estetica-primary rounded-xl" />`
- O projeto utiliza CSS Layers na configuração do PrimeNG (`theme, base, primeng`), portanto, o Tailwind tem prioridade natural. Evite usar `!important`.

## Boas Práticas do Angular
- Desenvolva usando *Feature-Driven Architecture*. Componentes, serviços e interfaces de um mesmo domínio (ex: Agendamentos) devem ficar na mesma pasta.
- Mantenha os arquivos `.css` dos componentes o mais vazios possível, delegando o visual para o Tailwind no HTML.