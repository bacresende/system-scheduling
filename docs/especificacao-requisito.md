# Sistema de Agendamentos de Estética

MVP para administrar clientes, serviços, agenda, pagamentos, histórico visual e fichas da clínica. Escopo atualizado em 03/11/2026 conforme decisões do usuário.

## Requisitos funcionais

- **RF01 — Serviços:** cadastrar, editar e inativar procedimentos com nome, preço, duração, opções de sessões e dias para retorno opcionais. Serviço com agendamentos não pode ser excluído.
- **RF02 — Clientes:** ADMIN cadastra nome, e-mail, telefone e CPF válido e único. A cliente define a senha pela redefinição de e-mail e completa nascimento e endereço depois.
- **RF03 — Agenda:** visões diária/semanal, busca, detalhes, confirmação, reagendamento, cancelamento e pacotes com sessões futuras em aberto.
- **RF04 — Horários:** um serviço por sessão; duração inteira dentro do expediente, sem sobreposição.
- **RF05 — Financeiro:** concluir atendimento ativo com data definida exige PIX, Cartao ou Dinheiro. Valor e duração são snapshots; rateio preserva o total em centavos.
- **RF06 — WhatsApp:** gerar link com mensagem preenchida; envio iniciado pelo usuário, sem automação ou garantia de entrega.
- **RF07 — Acesso:** autenticação Parse real, restauração, redefinição de senha e autorização ADMIN/CLIENTE no servidor e nas rotas.
- **RF08 — Cadastro progressivo:** cliente acessa portal e anamnese mesmo incompleta e pode completar o perfil depois. cadastroCompleto exige CPF válido, nascimento e endereço; o CPF informado pelo ADMIN é preservado.
- **RF09 — Anamnese:** ficha de perguntas pelo link /anamnese após login como CLIENTE. Cada envio registra respostas no perfil autenticado, sem serviço ou agendamento. ADMIN compartilha o link e consulta o histórico no prontuário.
- **RF10 — Histórico e fotos:** ADMIN consulta dados da cliente, fichas, atendimentos, anotações e fotos. Upload vincula fotos ao atendimento ativo com data e preserva o vínculo se a conclusão falhar.
- **RF11 — Retornos:** futura inclusão no dashboard, fora desta entrega. Não há tela separada de oportunidades; o contador legado da API pode permanecer por compatibilidade.

## Requisitos não funcionais

- Angular standalone, zoneless, TypeScript estrito, Reactive Forms, PrimeNG e Tailwind mobile-first.
- Erros HTTP visíveis; não presumir sucesso/dados quando consultas essenciais falharem.
- Eventos em ISO 8601; nascimento em YYYY-MM-DD; expediente no fuso da clínica.
- JPEG/PNG/WebP até 5 MB por arquivo, com validação de tamanho/assinatura no servidor. Base64 apenas no transporte para Storage; persistir URLs.
- Não retornar senhas/Master Key. Autorizar por perfil/propriedade no servidor; configurar ACL/CLP no ambiente real.
- Validar responsividade, teclado, foco e contraste em navegador; testes unitários não certificam acessibilidade.

## Regras de negócio

- **RN01:** um serviço por sessão. Pacote contém a quantidade total de sessões informada e primeira data definida.
- **RN02:** proibir sobreposição; permitir intervalos adjacentes; cancelados não bloqueiam. Revalidar no servidor.
- **RN03:** começo e fim na mesma janela de expediente do dia.
- **RN04:** concluídos/cancelados não são alteráveis como ativos. Sessão sem data não pode receber pagamento ou fotos.
- **RN05:** distribuir o restante dos centavos entre as sessões; soma igual ao total líquido contratado.
- **RN06:** pacote em uma requisição com idPacote estável. Repetição não duplica reservas. Falha intermediária desfaz registros ou informa falha de compensação com retomada pela mesma chave. Locks locais não equivalem a transações distribuídas.
- **RN07:** preservar histórico: inativar serviços referenciados e impedir renomear códigos de cupons utilizados. Cancelados não contam no limite, mas preservam referência histórica ao código.
- **RN08:** idCliente da anamnese vem da sessão. Parâmetros de serviço/agendamento não criam associações.

## Modelos e contratos

Os tipos atuais estão em src/app/features/*/models; funções e payloads no README.

Usuario contém perfil ADMIN/CLIENTE, nome, e-mail, telefone, cadastroCompleto e dados progressivos. Agendamento contém AguardandoConfirmacao, Confirmado, Pendente (legado), Concluido ou Cancelado; duração/valor reservados e dados opcionais de pacote, pagamento e fotos.

Anamnese contém id, idCliente, dataPreenchimento, tipoPele (Seca/Oleosa/Mista/Normal), usaAcidos, quaisAcidos opcional, sensibilidadeSol, temVarizes, fezCirurgiaRecente, praticaAtividadeFisica e alergiaCosmeticos. Quando usaAcidos é verdadeiro, quaisAcidos é obrigatório, até 500 caracteres. O modelo não contém idServico/idAgendamento.
