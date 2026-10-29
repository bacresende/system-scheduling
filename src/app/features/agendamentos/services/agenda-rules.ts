import { localDay } from '../../../shared/utils/date';
import { Cupom } from '../../cupons/models/cupom.model';
import { Agendamento, Expediente } from '../models/agendamento.model';

export function endTime(start: Date | string, duration: number): Date {
  return new Date(new Date(start).getTime() + duration * 60_000);
}

export function validateSlot(
  start: Date,
  duration: number,
  hours: Expediente[],
  bookings: Agendamento[],
  ignoreBookingId?: string,
): string | null {
  if (!Number.isFinite(start.getTime()) || !Number.isInteger(duration) || duration <= 0) {
    return 'Informe uma data e duração válidas.';
  }
  const end = endTime(start, duration);
  const minutes = start.getHours() * 60 + start.getMinutes() + start.getSeconds() / 60;
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const withinHours =
    end.toDateString() === start.toDateString() &&
    hours.some(
      (window) =>
        window.diaSemana === start.getDay() &&
        minutes >= toMinutes(window.inicio) &&
        minutes + duration <= toMinutes(window.fim),
    );
  if (!withinHours) return 'O serviço deve começar e terminar dentro do expediente da clínica.';
  const overlaps = bookings.some(
    (booking) =>
      booking.id !== ignoreBookingId &&
      booking.status !== 'Cancelado' &&
      booking.dataDefinida !== false &&
      start < endTime(booking.dataHora, booking.duracaoMinutos) &&
      end > new Date(booking.dataHora),
  );
  return overlaps ? 'Este intervalo se sobrepõe a outro agendamento.' : null;
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!/^[1-9]\d{9,14}$/.test(digits)) {
    throw new Error('O WhatsApp deve incluir DDI e um telefone válido.');
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function validateCupomForBooking(
  cupom: Cupom,
  idServico: string,
  totalSessoes: number,
  referenceDate: Date | null,
): string | null {
  if (!cupom.ativo) {
    return 'Este cupom está inativo.';
  }
  if (cupom.servicosValidos.length > 0 && idServico && !cupom.servicosValidos.includes(idServico)) {
    return 'Este cupom não é válido para o serviço selecionado.';
  }
  if (cupom.minimoSessoes !== null && cupom.minimoSessoes !== undefined && totalSessoes < cupom.minimoSessoes) {
    return `Este cupom exige no mínimo ${cupom.minimoSessoes} ${cupom.minimoSessoes === 1 ? 'sessão' : 'sessões'}.`;
  }
  if (cupom.maximoSessoes !== null && cupom.maximoSessoes !== undefined && totalSessoes > cupom.maximoSessoes) {
    return `Este cupom é válido para no máximo ${cupom.maximoSessoes} ${cupom.maximoSessoes === 1 ? 'sessão' : 'sessões'}.`;
  }
  if (referenceDate && Number.isFinite(referenceDate.getTime())) {
    const refDay = localDay(referenceDate);
    if (cupom.dataMinima && refDay < cupom.dataMinima) {
      return 'A data do agendamento é anterior ao início da validade do cupom.';
    }
    if (cupom.dataMaxima && refDay > cupom.dataMaxima) {
      return 'Este cupom está fora do período de validade para a data selecionada.';
    }
  }
  return null;
}

export interface ResumoFinanceiroAgendamento {
  valorOriginal: number;
  valorDesconto: number;
  valorFinal: number;
  valorPorSessao: number;
}

export function calculateBookingPricing(
  precoUnitario: number,
  totalSessoes: number,
  usarDescontoManual: boolean,
  cupom: Cupom | null,
  cupomValido: boolean,
  tipoDescontoManual: 'PORCENTAGEM' | 'VALOR_FIXO',
  valorDescontoManual: number | null,
): ResumoFinanceiroAgendamento {
  const sessoes = Math.max(1, totalSessoes || 1);
  const valorOriginal = Math.max(0, (precoUnitario || 0) * sessoes);
  let valorDesconto = 0;

  if (usarDescontoManual) {
    const manual = Math.max(0, valorDescontoManual ?? 0);
    if (tipoDescontoManual === 'PORCENTAGEM') {
      const pct = Math.min(100, manual);
      valorDesconto = (valorOriginal * pct) / 100;
    } else {
      valorDesconto = Math.min(valorOriginal, manual);
    }
  } else if (cupom && cupomValido) {
    if (cupom.tipoDesconto === 'PORCENTAGEM') {
      const pct = Math.min(100, Math.max(0, cupom.valor));
      valorDesconto = (valorOriginal * pct) / 100;
    } else {
      valorDesconto = Math.min(valorOriginal, Math.max(0, cupom.valor));
    }
  }

  valorDesconto = Math.round(valorDesconto * 100) / 100;
  const valorFinal = Math.max(0, Math.round((valorOriginal - valorDesconto) * 100) / 100);
  const valorPorSessao = Math.round((valorFinal / sessoes) * 100) / 100;

  return {
    valorOriginal,
    valorDesconto,
    valorFinal,
    valorPorSessao,
  };
}

export function suggestPackageDates(
  firstSessionDate: Date,
  totalSessoes: number,
  frequency: '1x_semana' | '2x_semana',
): Date[] {
  const result: Date[] = [];
  if (!Number.isFinite(firstSessionDate.getTime()) || totalSessoes <= 1) {
    return result;
  }

  for (let i = 1; i < totalSessoes; i++) {
    const next = new Date(firstSessionDate);
    if (frequency === '1x_semana') {
      next.setDate(firstSessionDate.getDate() + i * 7);
    } else {
      const weekOffset = Math.floor(i / 2) * 7;
      const isSecondInWeek = i % 2 === 1;
      let extraDays = isSecondInWeek ? 3 : 0;
      const candidateDayOfWeek = (firstSessionDate.getDay() + extraDays) % 7;
      if (isSecondInWeek && candidateDayOfWeek === 0) {
        extraDays = 2;
      }
      next.setDate(firstSessionDate.getDate() + weekOffset + extraDays);
    }
    result.push(next);
  }

  return result;
}

export interface HorarioDisponivelSlot {
  label: string;
  fimLabel: string;
  date: Date;
}

export function availableSlotsForDay(
  day: Date | null,
  duration: number,
  hours: Expediente[],
  bookings: Agendamento[],
  stepMinutes = 30,
  ignoreBookingId?: string,
  extraReservedDates: Date[] = [],
): HorarioDisponivelSlot[] {
  if (!day || !Number.isFinite(day.getTime()) || !Number.isInteger(duration) || duration <= 0) {
    return [];
  }

  const dayWindows = hours.filter((w) => w.diaSemana === day.getDay());
  if (!dayWindows.length) return [];

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTime = (d: Date): string =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const slots: HorarioDisponivelSlot[] = [];

  for (const window of dayWindows) {
    const startMin = toMinutes(window.inicio);
    const endMin = toMinutes(window.fim);

    for (let currentMin = startMin; currentMin + duration <= endMin; currentMin += stepMinutes) {
      const candidate = new Date(day);
      candidate.setHours(Math.floor(currentMin / 60), currentMin % 60, 0, 0);

      const error = validateSlot(candidate, duration, hours, bookings, ignoreBookingId);
      if (error) continue;

      const candidateEnd = endTime(candidate, duration);
      const conflictsWithExtra = extraReservedDates.some(
        (other) =>
          Number.isFinite(other.getTime()) &&
          candidate < endTime(other, duration) &&
          candidateEnd > other,
      );
      if (conflictsWithExtra) continue;

      slots.push({
        label: formatTime(candidate),
        fimLabel: formatTime(candidateEnd),
        date: candidate,
      });
    }
  }

  return slots;
}

