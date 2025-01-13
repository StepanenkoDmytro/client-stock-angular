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

    const textarea = this.el.nativeElement.querySelector('textarea');
    if (textarea) {
      this.renderer.setStyle(textarea, 'width', '100%');
      this.renderer.setStyle(textarea, 'border', 'none');
      this.renderer.setStyle(textarea, 'text-align', 'start');
      this.renderer.setStyle(textarea, 'color', '#333');
      this.renderer.setStyle(textarea, 'padding-top', '15px');
      this.renderer.setStyle(textarea, 'padding-left', '10px');
      this.renderer.setStyle(textarea, 'margin', '0');
    }
  }
}
