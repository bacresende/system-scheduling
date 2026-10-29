import { Cupom } from '../../cupons/models/cupom.model';
import { Agendamento, Expediente } from '../models/agendamento.model';
import {
  availableSlotsForDay,
  calculateBookingPricing,
  endTime,
  suggestPackageDates,
  validateCupomForBooking,
  validateSlot,
  whatsappLink,
} from './agenda-rules';

describe('Agenda business rules', () => {
  const hours: Expediente[] = [
    { diaSemana: 1, inicio: '09:00', fim: '18:00' },
    { diaSemana: 4, inicio: '09:00', fim: '18:00' },
  ];
  const date = (time: string) => new Date(`2026-10-19T${time}:00`);
  const booking: Agendamento = {
    id: 'a',
    idCliente: 'c',
    idServico: 's',
    idFuncionario: 'f',
    dataHora: date('10:00'),
    duracaoMinutos: 60,
    valor: 100,
    status: 'Pendente',
  };

  it.each(['09:30', '10:00', '10:30'])('rejects overlapping slot at %s', (time) => {
    expect(validateSlot(date(time), 60, hours, [booking])).toContain('sobrepõe');
  });

  it.each(['09:00', '11:00'])('allows touching boundaries at %s', (time) => {
    expect(validateSlot(date(time), 60, hours, [booking])).toBeNull();
  });

  it('ignores cancelled bookings and open-date sessions, but blocks completed ones', () => {
    expect(
      validateSlot(date('10:00'), 60, hours, [{ ...booking, status: 'Cancelado' }]),
    ).toBeNull();
    expect(
      validateSlot(date('10:00'), 60, hours, [{ ...booking, dataDefinida: false }]),
    ).toBeNull();
    expect(validateSlot(date('10:00'), 60, hours, [booking], 'a')).toBeNull();
    expect(
      validateSlot(date('10:00'), 60, hours, [{ ...booking, status: 'Concluido' }]),
    ).toContain('sobrepõe');
  });

  it('reserves the full service duration', () => {
    expect(endTime(date('09:00'), 90)).toEqual(date('10:30'));
    expect(validateSlot(date('09:00'), 90, hours, [booking])).toContain('sobrepõe');
  });

  it.each(['08:59', '17:01'])('rejects slots outside working hours at %s', (time) => {
    expect(validateSlot(date(time), 60, hours, [])).toContain('expediente');
  });

  it('accepts ending exactly at closing time', () => {
    expect(validateSlot(date('17:00'), 60, hours, [])).toBeNull();
  });

  it('rejects closed days and crossing midnight', () => {
    expect(validateSlot(new Date('2026-10-18T10:00:00'), 60, hours, [])).toContain('expediente');
    expect(validateSlot(date('17:00'), 480, hours, [])).toContain('expediente');
  });

  it.each([0, -1, 1.5, NaN])('rejects invalid duration %s', (duration) => {
    expect(validateSlot(date('10:00'), duration, hours, [])).toContain('válidas');
  });

  it('encodes WhatsApp messages and validates DDI', () => {
    expect(whatsappLink('+55 (11) 99999-9999', 'Olá & tudo bem?')).toBe(
      `https://wa.me/5511999999999?text=${encodeURIComponent('Olá & tudo bem?')}`,
    );
    expect(() => whatsappLink('123', 'Oi')).toThrow('DDI');
  });

  it('validates coupon eligibility and calculates discounts accurately', () => {
    const cupom: Cupom = {
      id: 'cup-1',
      codigo: 'BEMVINDA10',
      tipoDesconto: 'PORCENTAGEM',
      valor: 10,
      servicosValidos: ['s'],
      minimoSessoes: 2,
      maximoSessoes: 8,
      dataMinima: '2026-10-01',
      dataMaxima: '2026-10-31',
      ativo: true,
    };

    expect(validateCupomForBooking(cupom, 's', 4, date('10:00'))).toBeNull();
    expect(validateCupomForBooking(cupom, 'outro', 4, date('10:00'))).toContain('serviço');
    expect(validateCupomForBooking(cupom, 's', 1, date('10:00'))).toContain('mínimo 2');

    const pricing = calculateBookingPricing(150, 4, false, cupom, true, 'VALOR_FIXO', null);
    expect(pricing.valorOriginal).toBe(600);
    expect(pricing.valorDesconto).toBe(60);
    expect(pricing.valorFinal).toBe(540);
    expect(pricing.valorPorSessao).toBe(135);
  });

  it('suggests weekly and twice-weekly session dates', () => {
    const first = new Date('2026-10-19T14:00:00');
    const weekly = suggestPackageDates(first, 4, '1x_semana');
    expect(weekly).toHaveLength(3);
    expect(weekly[0].getDate()).toBe(26);

    const twiceWeekly = suggestPackageDates(first, 4, '2x_semana');
    expect(twiceWeekly).toHaveLength(3);
    expect(twiceWeekly[0].getDate()).toBe(22);
    expect(twiceWeekly[1].getDate()).toBe(26);
  });

  it('generates available time slot chips excluding overlapping bookings', () => {
    const slots = availableSlotsForDay(date('09:00'), 60, hours, [booking], 30);
    const labels = slots.map((s) => s.label);
    expect(labels).toContain('09:00');
    expect(labels).not.toContain('09:30');
    expect(labels).not.toContain('10:00');
    expect(labels).not.toContain('10:30');
    expect(labels).toContain('11:00');
    expect(labels).toContain('17:00');
  });
});
