import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ApiClient } from '../../../core/api/api-client';
import { AgendamentosService } from './agendamentos.service';

describe('AgendamentosService', () => {
  const request = vi.fn<(method: string, path: string, body?: unknown) => Promise<unknown>>();
  let service: AgendamentosService;

  const imagem = (nome = 'foto.png', tipo = 'image/png', bytes = [1, 2, 3, 4]) =>
    new File([new Uint8Array(bytes)], nome, { type: tipo });

  beforeEach(() => {
    request.mockReset();
    request.mockResolvedValue({});
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { configured: true, request } }],
    });
    service = TestBed.inject(AgendamentosService);
  });

  describe('chamadas às Cloud Functions', () => {
    it('lista agendamentos do período via POST /listAgendamentos', async () => {
      const inicio = new Date('2026-10-19T00:00:00.000Z');
      const fim = new Date('2026-10-20T00:00:00.000Z');
      await service.list(inicio, fim);
      expect(request).toHaveBeenCalledWith('POST', '/listAgendamentos', {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
      });
    });

    it('busca um agendamento e a configuração da agenda', async () => {
      await service.get('ag-1');
      await service.config();
      expect(request).toHaveBeenNthCalledWith(1, 'POST', '/getAgendamento', { id: 'ag-1' });
      expect(request).toHaveBeenNthCalledWith(2, 'POST', '/getConfiguracaoAgenda', {});
    });

    it('envia o payload completo ao criar um agendamento', async () => {
      const payload = {
        idCliente: 'c1',
        idServico: 's1',
        idFuncionario: 'prof-1',
        dataHora: '2026-10-19T13:00:00.000Z',
        totalSessoes: 1,
      };
      await service.create(payload as never);
      expect(request).toHaveBeenCalledWith('POST', '/createAgendamento', payload);
    });

    it('mapeia confirmar, ciente, cancelar e reagendar para suas funções', async () => {
      await service.confirm('ag-1');
      await service.markAlertSeen('ag-2');
      await service.cancel('ag-3');
      await service.reschedule('ag-4', {
        novaDataHora: '2026-10-20T13:00:00.000Z',
        idFuncionario: 'prof-2',
        reagendadoPor: 'ADMIN',
      });

      expect(request).toHaveBeenNthCalledWith(1, 'POST', '/confirmarAgendamento', { id: 'ag-1' });
      expect(request).toHaveBeenNthCalledWith(2, 'POST', '/marcarAlertaVistoAgendamento', {
        id: 'ag-2',
      });
      expect(request).toHaveBeenNthCalledWith(3, 'POST', '/cancelarAgendamento', { id: 'ag-3' });
      expect(request).toHaveBeenNthCalledWith(4, 'POST', '/reagendarAgendamento', {
        id: 'ag-4',
        novaDataHora: '2026-10-20T13:00:00.000Z',
        idFuncionario: 'prof-2',
        reagendadoPor: 'ADMIN',
      });
    });

    it('conclui o atendimento enviando pagamento, anotações e lista de fotos', async () => {
      await service.complete('ag-1', {
        metodoPagamento: 'PIX',
        anotacoesFinais: 'Pele ótima',
        fotoResultadoUrl: 'https://f/1.png',
        fotosResultadoUrls: ['https://f/1.png', 'https://f/2.png'],
      });
      expect(request).toHaveBeenCalledWith('POST', '/concluirAgendamento', {
        id: 'ag-1',
        metodoPagamento: 'PIX',
        anotacoesFinais: 'Pele ótima',
        fotoResultadoUrl: 'https://f/1.png',
        fotosResultadoUrls: ['https://f/1.png', 'https://f/2.png'],
      });
    });
  });

  describe('horários disponíveis e resumo financeiro (regras no backend)', () => {
    it('converte os horários retornados pelo backend em Date', async () => {
      request.mockResolvedValueOnce([
        { label: '09:00', fimLabel: '10:00', date: '2026-10-19T12:00:00.000Z' },
      ]);
      const dia = new Date('2026-10-19T12:00:00.000Z');

      const slots = await service.listarHorariosDisponiveis({
        dia,
        duracaoMinutos: 60,
        ignoreBookingId: 'ag-9',
      });

      expect(request).toHaveBeenCalledWith('POST', '/listarHorariosDisponiveis', {
        dia: dia.toISOString(),
        duracaoMinutos: 60,
        ignoreBookingId: 'ag-9',
      });
      expect(slots).toHaveLength(1);
      expect(slots[0].date).toBeInstanceOf(Date);
      expect(slots[0].date.toISOString()).toBe('2026-10-19T12:00:00.000Z');
      expect(slots[0].label).toBe('09:00');
    });

    it('retorna lista vazia quando o backend não responde com horários', async () => {
      request.mockResolvedValueOnce(null);
      await expect(
        service.listarHorariosDisponiveis({ dia: new Date(), duracaoMinutos: 30 }),
      ).resolves.toEqual([]);
    });

    it('envia a data de referência como ISO ao calcular o resumo financeiro', async () => {
      request.mockResolvedValueOnce({ valorFinal: 90, erroCupom: null });
      const ref = new Date('2026-10-19T12:00:00.000Z');

      const resumo = await service.calcularResumoFinanceiro({
        idServico: 's1',
        idCliente: 'c1',
        totalSessoes: 2,
        codigoCupom: 'BEMVINDA10',
        usarDescontoManual: false,
        dataReferencia: ref,
      });

      expect(request).toHaveBeenCalledWith('POST', '/calcularResumoFinanceiroAgendamento', {
        idServico: 's1',
        idCliente: 'c1',
        totalSessoes: 2,
        codigoCupom: 'BEMVINDA10',
        usarDescontoManual: false,
        dataReferencia: ref.toISOString(),
      });
      expect(resumo.erroCupom).toBeNull();
    });

    it('envia dataReferencia nula quando não há data', async () => {
      await service.calcularResumoFinanceiro({
        idServico: 's1',
        totalSessoes: 1,
        usarDescontoManual: false,
      });
      expect(request.mock.calls[0][2]).toMatchObject({ dataReferencia: null });
    });
  });

  describe('upload de fotos (lista de imagens)', () => {
    it('envia várias imagens em UMA única requisição e devolve todas as URLs', async () => {
      request.mockResolvedValueOnce({
        url: 'https://f/1.png',
        urls: ['https://f/1.png', 'https://f/2.jpg'],
      });

      const urls = await service.uploadMany('ag-1', [
        imagem('a.png', 'image/png'),
        imagem('b.jpg', 'image/jpeg'),
      ]);

      expect(request).toHaveBeenCalledTimes(1);
      const [method, path, body] = request.mock.calls[0] as [
        string,
        string,
        { id: string; arquivos: { nomeArquivo: string; mimeType: string; base64: string }[] },
      ];
      expect(method).toBe('POST');
      expect(path).toBe('/uploadFotoAgendamento');
      expect(body.id).toBe('ag-1');
      expect(body.arquivos.map((a) => a.nomeArquivo)).toEqual(['a.png', 'b.jpg']);
      expect(body.arquivos.map((a) => a.mimeType)).toEqual(['image/png', 'image/jpeg']);
      expect(body.arquivos[0].base64).toMatch(/^data:image\/png;base64,/);
      expect(urls).toEqual(['https://f/1.png', 'https://f/2.jpg']);
    });

    it('upload de uma foto reutiliza o fluxo em lista e retorna a primeira URL', async () => {
      request.mockResolvedValueOnce({ url: 'https://f/1.png', urls: ['https://f/1.png'] });
      await expect(service.upload('ag-1', imagem())).resolves.toBe('https://f/1.png');
      expect(request.mock.calls[0][2]).toHaveProperty('arquivos');
    });

    it('aceita resposta antiga com apenas `url`', async () => {
      request.mockResolvedValueOnce({ url: 'https://f/unica.png' });
      await expect(service.uploadMany('ag-1', [imagem()])).resolves.toEqual([
        'https://f/unica.png',
      ]);
    });

    it('não faz requisição quando a lista está vazia', async () => {
      await expect(service.uploadMany('ag-1', [])).resolves.toEqual([]);
      expect(request).not.toHaveBeenCalled();
    });

    it('rejeita a lista inteira, sem requisição, se qualquer arquivo for inválido', async () => {
      await expect(
        service.uploadMany('ag-1', [imagem('ok.png'), imagem('doc.pdf', 'application/pdf')]),
      ).rejects.toThrow('doc.pdf');
      expect(request).not.toHaveBeenCalled();
    });

    it('rejeita arquivos vazios e maiores que 5 MB', async () => {
      await expect(service.uploadMany('ag-1', [imagem('vazio.png', 'image/png', [])])).rejects.toThrow(
        'vazio.png',
      );
      const grande = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.png', {
        type: 'image/png',
      });
      await expect(service.uploadMany('ag-1', [grande])).rejects.toThrow('grande.png');
      expect(request).not.toHaveBeenCalled();
    });

    it('rejeita URLs que não sejam HTTPS', async () => {
      request.mockResolvedValueOnce({ url: 'http://f/1.png', urls: ['http://f/1.png'] });
      await expect(service.uploadMany('ag-1', [imagem()])).rejects.toThrow('HTTPS');
    });

    it('rejeita resposta sem nenhuma URL', async () => {
      request.mockResolvedValueOnce({});
      await expect(service.uploadMany('ag-1', [imagem()])).rejects.toThrow('HTTPS');
    });
  });
});

