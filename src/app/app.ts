import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Shell } from './layout/shell/shell';

@Component({
  selector: 'mi-root',
  imports: [Shell],
  template: '<mi-shell />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
