import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pgz-feedback',
  standalone: true,
  imports: [],
  templateUrl: './feedback.component.html',
  styleUrl: '../../profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedbackComponent {

}
