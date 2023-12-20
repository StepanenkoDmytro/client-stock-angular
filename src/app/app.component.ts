import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NavigationComponent } from './core/UI/components/navigation/navigation.component';


@Component({
  selector: 'pgz-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatSlideToggleModule, NavigationComponent],
})
export class AppComponent {
  title = 'PEGAZZO';
}
