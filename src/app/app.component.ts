import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Theme, ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'Todo-List';

  constructor(public themeService: ThemeService) {}

  get theme(): Theme {
    return this.themeService.theme;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
