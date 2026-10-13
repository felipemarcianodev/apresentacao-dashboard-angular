import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Tema = 'light' | 'dark' | 'system';

const CHAVE = 'mirante.tema';

/**
 * Preferência de tema do usuário (claro, escuro ou do sistema).
 * Aplica a classe .dark no <html> e guarda a escolha no localStorage, único dado salvo pelo app.
 */
@Injectable({ providedIn: 'root' })
export class ThemePreference {
  private readonly document = inject(DOCUMENT);
  private readonly midiaEscura = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');

  readonly tema = signal<Tema>(this.lerPreferencia());
  private readonly sistemaEscuro = signal(this.midiaEscura?.matches ?? false);

  constructor() {
    this.midiaEscura?.addEventListener('change', (evento) => this.sistemaEscuro.set(evento.matches));

    effect(() => {
      const tema = this.tema();
      const escuro = tema === 'dark' || (tema === 'system' && this.sistemaEscuro());
      this.document.documentElement.classList.toggle('dark', escuro);
      this.gravarPreferencia(tema);
    });
  }

  definir(tema: Tema): void {
    this.tema.set(tema);
  }

  private lerPreferencia(): Tema {
    try {
      const salvo = this.document.defaultView?.localStorage.getItem(CHAVE);
      return salvo === 'light' || salvo === 'dark' ? salvo : 'system';
    } catch {
      return 'system';
    }
  }

  private gravarPreferencia(tema: Tema): void {
    try {
      this.document.defaultView?.localStorage.setItem(CHAVE, tema);
    } catch {
      // Storage bloqueado (janela privada, política do navegador): o tema vale só nesta sessão.
    }
  }
}
