import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { CompletarCadastroPage } from './completar-cadastro-page';
import { AuthService } from '../../auth/services/auth.service';

describe('Cadastro progressivo de cliente criada pelo administrador', () => {
  it('exige CPF e envia os dígitos normalizados junto com nascimento/endereço', async () => {
    const session = vi.fn().mockReturnValue({ perfil: 'CLIENTE', cadastroCompleto: false });
    const complete = vi.fn().mockImplementation(async () => {
      session.mockReturnValue({ perfil: 'CLIENTE', cadastroCompleto: true });
    });
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      imports: [CompletarCadastroPage],
      providers: [
        { provide: AuthService, useValue: { session, complete } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    }).overrideComponent(CompletarCadastroPage, { set: { template: '' } });
    const fixture = TestBed.createComponent(CompletarCadastroPage);
    const page = fixture.componentInstance as unknown as {
      form: CompletarCadastroPage['form']; submit(): void;
    };
    page.form.patchValue({ nasc: new Date(1990, 0, 1), endereco: {
      cep: '70000000', logradouro: 'Rua', numeroResidencia: '1', bairro: 'Centro',
      cidade: 'Brasília', estado: 'DF', pais: 'Brasil',
    } });
    page.submit();
    expect(complete).not.toHaveBeenCalled();
    expect(page.form.controls.cpf.hasError('required')).toBe(true);
    page.form.controls.cpf.setValue('111.111.111-11');
    page.submit();
    expect(complete).not.toHaveBeenCalled();
    page.form.controls.cpf.setValue('529.982.247-25');
    page.submit();
    await fixture.whenStable();
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ cpf: '52998224725', nasc: '1990-01-01' }));
    expect(navigateByUrl).toHaveBeenCalledWith('/portal');
  });
});
