import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { vi } from 'vitest';
import { ApiClient } from '../../../../core/api/api-client';
import { AuthService } from '../../../auth/services/auth.service';
import { AnamnesePageComponent } from './anamnese-page.component';

describe('AnamnesePageComponent avulsa', () => {
  const request = vi.fn<(method: string, path: string, body?: unknown) => Promise<unknown>>();

  beforeEach(async () => {
    request.mockReset();
    request.mockResolvedValue({});

    await TestBed.configureTestingModule({
      imports: [AnamnesePageComponent],
      providers: [
        { provide: ApiClient, useValue: { configured: true, request } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              routeConfig: { path: 'anamnese' },
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            session: () => ({ id: 'cliente-1', perfil: 'CLIENTE' }),
          },
        },
      ],
    }).compileComponents();
  });

  it('saves an authenticated client anamnesis without a booking or service id', async () => {
    const fixture = TestBed.createComponent(AnamnesePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      form: AnamnesePageComponent['form'];
      save(): void;
      context: AnamnesePageComponent['context'];
    };
    expect(component.context.editable()).toBe(true);

    component.form.patchValue({
      tipoPele: 'Mista',
      usaAcidos: true,
      quaisAcidos: 'Ácido glicólico',
      sensibilidadeSol: false,
      temVarizes: false,
      fezCirurgiaRecente: false,
      praticaAtividadeFisica: true,
      alergiaCosmeticos: false,
    });
    component.save();
    await fixture.whenStable();

    expect(request).toHaveBeenCalledWith('POST', '/createAnamnese', {
      tipoPele: 'Mista',
      usaAcidos: true,
      quaisAcidos: 'Ácido glicólico',
      sensibilidadeSol: false,
      temVarizes: false,
      fezCirurgiaRecente: false,
      praticaAtividadeFisica: true,
      alergiaCosmeticos: false,
    });
  });
});
