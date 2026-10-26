import { CandidatoRetorno, opportunities } from './oportunidades.service';

describe('Return opportunities', () => {
  const candidate: CandidatoRetorno = {
    usuario: { id: 'c', nome: 'Cliente', email: 'cliente@example.test', telefone: '5511999999999', cadastroCompleto: true, perfil: 'CLIENTE' },
    servico: { id: 's', nome: 'Facial', ativo: true, preco: 100, duracaoMinutos: 60, diasParaRetorno: 30 },
    agendamento: { id: 'a', idCliente: 'c', idServico: 's', idFuncionario: 'f', dataHora: '2026-09-20T10:00:00', duracaoMinutos: 60, valor: 100, status: 'Concluido' }
  };
  it('includes due and overdue completed appointments', () => {
    const result = opportunities([candidate], new Date('2026-10-20T00:00:00'));
    expect(result).toHaveLength(1);
    expect(result[0].whatsapp).toContain('https://wa.me/5511999999999?text=');
  });
  it('does not alert before the configured return day', () => {
    expect(opportunities([candidate], new Date('2026-10-19T23:59:59'))).toHaveLength(0);
  });
  it.each(['Pendente', 'Cancelado'] as const)('excludes %s appointments', status => {
    expect(opportunities([{ ...candidate, agendamento: { ...candidate.agendamento, status } }], new Date('2026-10-21'))).toHaveLength(0);
  });
  it.each([undefined, 0, -1])('excludes missing or invalid return interval %s', diasParaRetorno => {
    expect(opportunities([{ ...candidate, servico: { ...candidate.servico, diasParaRetorno } }], new Date('2026-10-21'))).toHaveLength(0);
  });
});
