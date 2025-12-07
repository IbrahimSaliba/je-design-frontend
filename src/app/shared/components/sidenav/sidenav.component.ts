import { Component, OnInit, OnChanges, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppDropdownDirective } from '../../directives/dropdown.directive';
import { DropdownAnchorDirective } from '../../directives/dropdown-anchor.directive';
import { DropdownLinkDirective } from '../../directives/dropdown-link.directive';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-sidenav',
    templateUrl: './sidenav.template.html',
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      MatIconModule,
      MatButtonModule,
      MatDividerModule,
      MatTooltipModule,
      AppDropdownDirective,
      DropdownAnchorDirective,
      DropdownLinkDirective,
      TranslateModule
    ]
})
export class SidenavComponent implements OnInit, OnChanges {
  @Input('items') public menuItems: any[] = [];
  @Input('hasIconMenu') public hasIconTypeMenuItem: boolean;
  @Input('iconMenuTitle') public iconTypeMenuTitle: string;
  @ViewChild('sidenav') sidenav:ElementRef;
  
  constructor() {

  }
  ngOnInit() {
  }
  
  ngOnChanges() {
  }
  ngAfterViewInit() {}
}