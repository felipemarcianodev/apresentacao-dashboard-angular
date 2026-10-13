import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Página provisória de um painel que ainda não foi construído. Recebe os dados da rota como inputs. */
@Component({
  selector: 'mi-em-breve',
  template: `
    <section
      class="grid place-items-center rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center"
    >
      <i class="fa-solid fa-person-digging mb-3 text-3xl text-muted" aria-hidden="true"></i>
      <h2 class="text-lg font-semibold">{{ titulo() }} em construção</h2>
      <p class="mt-1 max-w-md text-sm text-muted">{{ descricao() }}</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmBreve {
  readonly titulo = input.required<string>();
  readonly descricao = input('');
}
