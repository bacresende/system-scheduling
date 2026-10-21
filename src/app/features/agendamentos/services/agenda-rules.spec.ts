import { Agendamento, Expediente } from '../models/agendamento.model';
import { endTime, validateSlot, whatsappLink } from './agenda-rules';

describe('Agenda business rules', () => {
  const hours: Expediente[] = [{ diaSemana: 1, inicio: '09:00', fim: '18:00' }];
  const date = (time: string) => new Date(`2026-10-19T${time}:00`);
  const booking: Agendamento = {
    id: 'a', idCliente: 'c', idServico: 's', idFuncionario: 'f', dataHora: date('10:00'),
    duracaoMinutos: 60, valor: 100, status: 'Pendente'
  };
  it.each(['09:30', '10:00', '10:30'])('rejects overlapping slot at %s', time => {
    expect(validateSlot(date(time), 60, hours, [booking])).toContain('sobrepõe');
  });
  it.each(['09:00', '11:00'])('allows touching boundaries at %s', time => {
    expect(validateSlot(date(time), 60, hours, [booking])).toBeNull();
  });
  it('ignores cancelled bookings, but blocks completed ones', () => {
    expect(validateSlot(date('10:00'), 60, hours, [{ ...booking, status: 'Cancelado' }])).toBeNull();
    expect(validateSlot(date('10:00'), 60, hours, [{ ...booking, status: 'Concluido' }])).toContain('sobrepõe');
  });
  it('reserves the full service duration', () => {
    expect(endTime(date('09:00'), 90)).toEqual(date('10:30'));
    expect(validateSlot(date('09:00'), 90, hours, [booking])).toContain('sobrepõe');
  });
  it.each(['08:59', '17:01'])('rejects slots outside working hours at %s', time => {
    expect(validateSlot(date(time), 60, hours, [])).toContain('expediente');
  });
  it('accepts ending exactly at closing time', () => {
    expect(validateSlot(date('17:00'), 60, hours, [])).toBeNull();
  });
  it('rejects closed days and crossing midnight', () => {
    expect(validateSlot(new Date('2026-10-18T10:00:00'), 60, hours, [])).toContain('expediente');
    expect(validateSlot(date('17:00'), 480, hours, [])).toContain('expediente');
  });
  it.each([0, -1, 1.5, NaN])('rejects invalid duration %s', duration => {
    expect(validateSlot(date('10:00'), duration, hours, [])).toContain('válidas');
  });
  it('encodes WhatsApp messages and validates DDI', () => {
    expect(whatsappLink('+55 (11) 99999-9999', 'Olá & tudo bem?')).toBe(
      `https://wa.me/5511999999999?text=${encodeURIComponent('Olá & tudo bem?')}`);
    expect(() => whatsappLink('123', 'Oi')).toThrow('DDI');
  });
});
