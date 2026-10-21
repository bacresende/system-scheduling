import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="flex min-h-dvh items-center justify-center bg-estetica-bg p-4 text-estetica-text sm:p-8 lg:p-12"
    >
      <div
        class="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-estetica-secondary bg-white shadow-[0_24px_90px_-35px_rgba(102,52,59,0.25)] lg:min-h-180 lg:grid-cols-2"
      >
        <aside
          class="relative isolate hidden overflow-hidden bg-estetica-secondary p-12 lg:flex lg:flex-col lg:justify-between"
          aria-label="WR Estética"
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -right-28 top-32 -z-10 size-96 rounded-full border border-estetica-primary/40"
          ></div>
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -right-16 top-44 -z-10 size-72 rounded-full bg-estetica-primary/20"
          ></div>
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -bottom-32 -left-24 -z-10 size-96 rounded-full bg-estetica-tertiary/20 blur-2xl"
          ></div>

          <div class="flex items-center gap-3">
            <span
              aria-hidden="true"
              class="flex size-12 items-center justify-center rounded-2xl border border-white/70 bg-white/60"
            >
              <i class="pi pi-sparkles text-xl"></i>
            </span>
            <div>
              <p class="text-lg font-semibold tracking-tight">WR Estética</p>
              <p class="text-xs tracking-[0.18em] uppercase">Cuidado em cada detalhe</p>
            </div>
          </div>

          <div class="relative my-14">
            <span
              class="mb-7 inline-flex items-center gap-2 rounded-full border border-white bg-white/60 px-4 py-2 text-xs font-medium tracking-wide"
            >
              <i aria-hidden="true" class="pi pi-compass"></i>
              Expedição 404
            </span>
            <h2 class="max-w-sm font-serif text-5xl leading-tight tracking-tight xl:text-6xl">
              Ops, saímos<br />
              da rota.<br />
              <span class="italic">Acontece!</span>
            </h2>

            <div
              class="relative mt-8 flex h-36 max-w-sm items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/40"
              aria-hidden="true"
            >
              <span
                class="absolute -left-8 top-1/2 h-px w-40 rotate-[-25deg] border-t-2 border-dashed border-estetica-primary"
              ></span>
              <span
                class="absolute right-8 top-1/2 h-px w-40 rotate-[25deg] border-t-2 border-dashed border-estetica-primary"
              ></span>
              <span class="absolute left-8 top-7 size-3 rounded-full bg-estetica-tertiary"></span>
              <span
                class="absolute right-8 bottom-7 size-3 rounded-full bg-estetica-tertiary"
              ></span>
              <span
                class="relative flex size-16 -rotate-6 items-center justify-center rounded-2xl border border-estetica-primary/40 bg-white text-estetica-text shadow-sm"
              >
                <i class="pi pi-map-marker text-2xl"></i>
              </span>
              <span
                class="absolute right-1/4 top-5 rounded-full bg-estetica-secondary px-3 py-1 text-xs font-semibold"
                >você está aqui?</span
              >
            </div>
          </div>

          <div class="flex items-start gap-3 border-t border-estetica-primary/40 pt-6">
            <i aria-hidden="true" class="pi pi-directions mt-1"></i>
            <p class="max-w-xs text-sm leading-relaxed">
              Nosso mapa também se confunde às vezes. A gente encontra o caminho de volta juntos.
            </p>
          </div>
        </aside>

        <section
          class="flex flex-col justify-center px-6 py-10 sm:px-12 sm:py-14 lg:px-14 xl:px-20"
          aria-labelledby="not-found-title"
        >
          <div class="mb-10 flex items-center gap-3 lg:hidden">
            <span
              aria-hidden="true"
              class="flex size-10 items-center justify-center rounded-xl bg-estetica-secondary"
            >
              <i class="pi pi-sparkles"></i>
            </span>
            <span class="font-semibold tracking-tight">WR Estética</span>
          </div>

          <div class="mb-9">
            <p class="mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
              Caminho não encontrado
            </p>

            <p class="mt-4 text-sm leading-relaxed">
              O endereço pode estar incorreto ou a página foi movida. Mas estamos aqui para ajudar
              você a encontrar o caminho de volta.
            </p>
          </div>

          <div
            class="relative mb-9 flex min-h-40 items-center justify-center overflow-hidden rounded-2xl bg-estetica-bg sm:min-h-48"
            aria-hidden="true"
          >
            <span
              class="absolute size-36 rounded-full border border-estetica-primary/40 sm:size-44"
            ></span>
            <span class="absolute size-28 rounded-full bg-estetica-primary/15 sm:size-36"></span>
            <span
              class="relative font-serif text-7xl leading-none tracking-tight text-estetica-text/80 sm:text-8xl"
              >404</span
            >
          </div>

          <a
            routerLink="/"
            class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-estetica-primary px-4 text-sm font-semibold text-estetica-text transition-colors hover:bg-estetica-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-estetica-text"
          >
            Voltar ao início
            <i aria-hidden="true" class="pi pi-arrow-right"></i>
          </a>

          <p
            class="mt-8 flex items-center justify-center gap-2 text-center text-xs leading-relaxed"
          >
            <i aria-hidden="true" class="pi pi-heart text-xs"></i>
            Um espaço de cuidado, do seu jeito.
          </p>
        </section>
      </div>
    </main>
  `,
})
export class NotFoundPage {}
