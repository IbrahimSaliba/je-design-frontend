import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'egret-divider',
  templateUrl: './divider.component.html',
  styleUrls: ['./divider.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DividerComponent {
  @Input() text: string = 'OR';
  @Input() class: string = '';
} 