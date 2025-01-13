import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'pgz-form-input',
  standalone: true,
  imports: [],
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss', '../form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormInputComponent implements AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  public ngAfterViewInit(): void {
    const input = this.el.nativeElement.querySelector('input');
    if (input) {
      this.renderer.setStyle(input, 'width', '100%');
    }
  }
}
