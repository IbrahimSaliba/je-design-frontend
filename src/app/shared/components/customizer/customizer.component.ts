import { Component, OnInit, Input, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../../shared/services/navigation.service';
import { LayoutService } from '../../../shared/services/layout.service';
import { CustomizerService } from 'app/shared/services/customizer.service';
import { ThemeService } from 'app/shared/services/theme.service';
import { AppTheme } from 'app/shared/models/app-theme.model';
import { PerfectScrollbarModule } from '../../components/perfect-scrollbar/perfect-scrollbar.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SharedDirectivesModule } from 'app/shared/directives/shared-directives.module';

@Component({
    selector: 'app-customizer',
    templateUrl: './customizer.component.html',
    styleUrls: ['./customizer.component.scss'],
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      MatButtonModule,
      MatRadioModule,
      MatCheckboxModule,
      MatSlideToggleModule,
      MatCardModule,
      MatExpansionModule,
      MatTabsModule,
      MatIconModule,
      PerfectScrollbarModule,
      SharedDirectivesModule
    ]
})
export class CustomizerComponent implements OnInit {
  isCustomizerOpen = false;
  sidebarColors: any[] = [];
  topbarColors: any[] = [];

  layoutConf:any = {};
  selectedLayout: string = '';
  themes: any[] = [];
  activeTheme: any;

  constructor(
    private navService: NavigationService,
    public layout: LayoutService,
    private themeService: ThemeService,
    public customizer: CustomizerService,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.layoutConf = this.layout.layoutConf;
    this.selectedLayout = this.layoutConf.navigationPos;
    this.themes = this.themeService.getAvailableThemes();
    this.activeTheme = this.themeService.getActiveTheme();
  }
  
  changeTheme(theme: AppTheme) {
    this.themeService.setActiveThemeById(theme.id);
    this.layout.publishLayoutChange({ matTheme: theme.id });
  }
  
  isThemeActive(theme: AppTheme): boolean {
    return theme.id === this.activeTheme.id;
  }
  
  changeLayoutStyle(data: any) {
    this.layout.publishLayoutChange({ navigationPos: this.selectedLayout });
    // When switching to side navigation, ensure the menu type is set
    if (this.selectedLayout === 'side') {
      this.navService.publishNavigationChange('icon-menu');
    }
  }

}

