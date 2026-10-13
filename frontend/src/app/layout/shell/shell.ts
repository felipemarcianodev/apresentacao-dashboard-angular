import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { telaLarga } from '../../core/layout/tela-larga';
import { VERSAO } from '../../core/versao/versao';
import { MenuHamburguer } from '../../ui/menu-hamburguer/menu-hamburguer';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { NAVEGACAO } from './navegacao';
import { OUTROS_PROJETOS } from './outros-projetos';

/**
 * Estrutura da aplicação: barra lateral com os painéis e o kit, barra superior e área de conteúdo.
 * O menu hambúrguer abre a gaveta no celular e, no desktop, recolhe a barra para uma faixa de ícones.
 */
@Component({
  selector: 'mi-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle, MenuHamburguer],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-dvh' },
})
export class Shell {
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  protected readonly navegacao = NAVEGACAO;
  protected readonly outrosProjetos = OUTROS_PROJETOS;
  protected readonly versao = VERSAO;
  protected readonly urlDaVersao = `https://github.com/felipemarcianodev/apresentacao-dashboard-angular/tree/v${VERSAO}`;
  protected readonly larga = telaLarga();

  /** Gaveta aberta (celular). */
  protected readonly menuAberto = signal(false);
  /** Barra recolhida em faixa de ícones (desktop). */
  protected readonly recolhida = signal(false);
  /** A barra está em faixa de ícones agora: recolhida e numa tela larga. */
  protected readonly compacta = computed(() => this.larga() && this.recolhida());
  /**
   * Gaveta fechada no celular: a barra sai da tela e fica inert, para os links dela não receberem
   * foco pelo Tab nem serem lidos pelo leitor de tela enquanto não aparecem.
   */
  protected readonly gavetaFechada = computed(() => !this.larga() && !this.menuAberto());
  /** O que o menu hambúrguer anuncia em aria-expanded, conforme o tamanho da tela. */
  protected readonly menuExpandido = computed(() => (this.larga() ? !this.recolhida() : this.menuAberto()));
  protected readonly classeDoConteudo = computed(
    () => `transition-[padding] duration-200 motion-reduce:transition-none ${this.compacta() ? 'lg:pl-16' : 'lg:pl-64'}`,
  );
  protected readonly titulo = signal('');

  constructor() {
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((evento) => {
        // A navegação inicial (id 1) pode terminar depois de a pessoa abrir o menu num aparelho
        // lento; só uma navegação feita depois fecha a gaveta.
        if (evento.id > 1) {
          this.menuAberto.set(false);
        }
        this.titulo.set(this.tituloDaRotaAtual());
      });
  }

  protected alternarMenu(): void {
    if (this.larga()) {
      this.recolhida.update((recolhida) => !recolhida);
    } else {
      this.menuAberto.update((aberto) => !aberto);
    }
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
