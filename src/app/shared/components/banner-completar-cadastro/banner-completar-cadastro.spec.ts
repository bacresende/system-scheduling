import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BannerCompletarCadastro } from './banner-completar-cadastro';

describe('BannerCompletarCadastro', () => {
  let component: BannerCompletarCadastro;
  let fixture: ComponentFixture<BannerCompletarCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerCompletarCadastro],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerCompletarCadastro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
