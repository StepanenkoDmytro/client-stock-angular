import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tools-manager',
  templateUrl: './tools-manager.component.html',
  styleUrls: ['./tools-manager.component.scss']
})
export class ToolsManagerComponent {
  @Input() component!: string;
}
