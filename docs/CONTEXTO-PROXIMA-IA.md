# Contexto de retomada — WR Estética

Atualização: 03/11/2026. Compare este documento com o código antes de alterar o sistema. Leia também o README, os requisitos, as regras de desenvolvimento, as diretrizes visuais e o registro da auditoria.

## Organização

Frontend Angular 21 em src/app, por funcionalidade, com ApiClient centralizado. Backend em C:/Users/bacre/system-scheduling-wr/cloud, fora do repositório Angular. O main.js desse backend carrega os módulos. Não restaurar automaticamente o antigo arquivo excluído no frontend.

## Decisões do usuário

- Anamnese somente pelo link /anamnese, associada à CLIENTE autenticada. Não implementar ficha por agendamento ou serviço.
- O ADMIN copia o link no dashboard e consulta fichas no prontuário. Fichas antigas com o mesmo idCliente continuam na coleção anamnesesAvulsas, sem interface por atendimento.
- Não há tela separada de oportunidades. A rota antiga redireciona para o dashboard; a futura funcionalidade será incorporada ao dashboard e está fora desta entrega.
- Preservar acesso da cliente com cadastro incompleto ao portal e à anamnese. A conclusão posterior exige CPF válido, nascimento e endereço.

## Implementação atual

- sessionGuard e adminGuard ativos. Retorno de autenticação usa returnUrl.
- Os endpoints administrativos principais existem no backend separado e usam POST. Autorização pelo campo perfil de \_User.
- Agenda propaga falhas essenciais e não usa configuração presumida após erro HTTP.
- Novo agendamento/pacote usa createPacoteAgendamentos com chave estável, repetição e rollback compensatório. Locks locais não comprovam atomicidade distribuída.
- Rateio distribui centavos sem alterar o total. Preço e duração são snapshots do servidor.
- Upload exige registro ativo com data, verifica assinatura/tamanho e vincula fotos antes da conclusão. A interface conserva URLs para não reenviar fotos quando a conclusão falha.
- Agenda e sessões irmãs têm paginação no servidor.
- Serviço referenciado não pode ser excluído; código de cupom utilizado não pode ser renomeado.
- Cadastro pelo ADMIN exige CPF válido e único. O cadastro progressivo preserva o CPF e valida os demais dados antes de confirmar cadastroCompleto.
- Anamnese salva exclusivamente por createAnamnese; não há chamadas GET/PUT por atendimento.

## Verificação e publicação

Frontend: npm run build e npm test -- --watch=false. Backend: npm test na pasta separada. No PowerShell, usar npm.cmd quando necessário.

Testes locais usam HTTP/Parse simulados. Não houve publicação no Back4App nem comprovação de ACL/CLP, e-mail, Storage real ou WCAG em navegador. Publicar o backend junto ao frontend: o formulário depende de createPacoteAgendamentos.

A configuração padrão de expediente/profissionais permanece no servidor quando não há ConfiguracaoAgenda; cadastrar os dados reais da clínica no destino. O portal ainda tem contrato de linha do tempo sem backend, fora do escopo ADMIN.
