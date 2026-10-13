import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { NAVEGACAO } from './navegacao';

/** Estrutura da aplicação: barra lateral com os painéis e o kit, barra superior e área de conteúdo. */
@Component({
  selector: 'mi-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-dvh' },
})
export class Shell {
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  protected readonly navegacao = NAVEGACAO;
  protected readonly menuAberto = signal(false);
  protected readonly titulo = signal('');

  constructor() {
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuAberto.set(false);
        this.titulo.set(this.tituloDaRotaAtual());
      });
  }

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  protected fecharMenu(): void {
    this.menuAberto.set(false);
  }

  private tituloDaRotaAtual(): string {
    let atual = this.rota.snapshot;
    while (atual.firstChild) {
      atual = atual.firstChild;
    }
    return (atual.data['titulo'] as string | undefined) ?? '';
  }
}
