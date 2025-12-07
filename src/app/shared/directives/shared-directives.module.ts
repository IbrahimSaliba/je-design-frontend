import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutModule } from '@angular/cdk/layout';

import { FontSizeDirective } from './font-size.directive';
import { ScrollToDirective } from './scroll-to.directive';
import { AppDropdownDirective } from './dropdown.directive';
import { DropdownAnchorDirective } from './dropdown-anchor.directive';
import { DropdownLinkDirective } from './dropdown-link.directive';
import { EgretSideNavToggleDirective } from './egret-side-nav-toggle.directive';
import { EgretSidenavHelperDirective, EgretSidenavTogglerDirective } from './egret-sidenav-helper/egret-sidenav-helper.directive';
import { EgretHighlightDirective } from './egret-highlight.directive';
import { AutoFocusDirective } from './auto-focus.directive';

// Standalone directives that need to be imported
const standaloneDirectives = [
  AppDropdownDirective,
  DropdownAnchorDirective,
  DropdownLinkDirective
];

// Non-standalone directives that need to be declared
const nonStandaloneDirectives = [
  AutoFocusDirective,
  FontSizeDirective,
  ScrollToDirective,
  EgretSideNavToggleDirective,
  EgretSidenavHelperDirective,
  EgretSidenavTogglerDirective,
  EgretHighlightDirective
];

@NgModule({
  imports: [
    CommonModule,
    LayoutModule,
    // Import all standalone directives
    ...standaloneDirectives
  ],
  declarations: [
    // Only declare non-standalone directives
    ...nonStandaloneDirectives
  ],
  exports: [
    // Export both standalone and non-standalone directives
    ...standaloneDirectives,
    ...nonStandaloneDirectives
  ]
})
export class SharedDirectivesModule { }