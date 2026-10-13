import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Tema, ThemePreference } from '../../core/theme/theme-preference';

interface OpcaoTema {
  readonly valor: Tema;
  readonly rotulo: string;
  readonly icone: string;
}

@Component({
  selector: 'mi-theme-toggle',
  templateUrl: './theme-toggle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  protected readonly preferencia = inject(ThemePreference);

  protected readonly opcoes: readonly OpcaoTema[] = [
    { valor: 'light', rotulo: 'Tema claro', icone: 'fa-sun' },
    { valor: 'dark', rotulo: 'Tema escuro', icone: 'fa-moon' },
    { valor: 'system', rotulo: 'Tema do sistema', icone: 'fa-desktop' },
  ];
}
