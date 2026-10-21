import { Agendamento, Expediente } from '../models/agendamento.model';

export function endTime(start: Date | string, duration: number): Date {
  return new Date(new Date(start).getTime() + duration * 60_000);
}

export function validateSlot(start: Date, duration: number, hours: Expediente[], bookings: Agendamento[]): string | null {
  if (!Number.isFinite(start.getTime()) || !Number.isInteger(duration) || duration <= 0) {
    return 'Informe uma data e duração válidas.';
  }
  const end = endTime(start, duration);
  const minutes = start.getHours() * 60 + start.getMinutes() + start.getSeconds() / 60;
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const withinHours = end.toDateString() === start.toDateString() &&
    hours.some(window => window.diaSemana === start.getDay() &&
      minutes >= toMinutes(window.inicio) &&
      minutes + duration <= toMinutes(window.fim));
  if (!withinHours) return 'O serviço deve começar e terminar dentro do expediente da clínica.';
  const overlaps = bookings.some(booking => booking.status !== 'Cancelado' &&
    start < endTime(booking.dataHora, booking.duracaoMinutos) && end > new Date(booking.dataHora));
  return overlaps ? 'Este intervalo se sobrepõe a outro agendamento.' : null;
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!/^[1-9]\d{9,14}$/.test(digits)) throw new Error('O WhatsApp deve incluir DDI e um telefone válido.');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
