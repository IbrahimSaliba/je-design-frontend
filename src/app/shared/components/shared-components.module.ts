import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerfectScrollbarModule } from 'app/shared/components/perfect-scrollbar';
import { SearchModule } from '../search/search.module';
import { SharedPipesModule } from '../pipes/shared-pipes.module';
import { SharedDirectivesModule } from '../directives/shared-directives.module';

// ONLY REQUIRED FOR **SIDE** NAVIGATION LAYOUT
import { HeaderSideComponent } from './header-side/header-side.component';
import { SidebarSideComponent } from './sidebar-side/sidebar-side.component';

// ONLY REQUIRED FOR **TOP** NAVIGATION LAYOUT
import { HeaderTopComponent } from './header-top/header-top.component';
import { SidebarTopComponent } from './sidebar-top/sidebar-top.component';

// ONLY FOR DEMO
import { CustomizerComponent } from './customizer/customizer.component';

// ALWAYS REQUIRED 
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { FooterComponent } from './footer/footer.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { AppComfirmComponent } from '../services/app-confirm/app-confirm.component';
import { AppLoaderComponent } from '../services/app-loader/app-loader.component';
import { ButtonLoadingComponent } from './button-loading/button-loading.component';
import { EgretSidebarComponent, EgretSidebarTogglerDirective } from './egret-sidebar/egret-sidebar.component';
import { BottomSheetShareComponent } from './bottom-sheet-share/bottom-sheet-share.component';
import { EgretExampleViewerComponent } from './example-viewer/example-viewer.component';
import { EgretExampleViewerTemplateComponent } from './example-viewer-template/example-viewer-template.component';
import { EgretNotifications2Component } from './egret-notifications2/egret-notifications2.component';
import { DividerComponent } from './divider/divider.component';
import { allMaterialModules, commonMaterialModules } from '../material-imports';
// Components that are NOT standalone
const nonStandaloneComponents = [
  ButtonLoadingComponent,
  EgretSidebarComponent,
  EgretSidebarTogglerDirective,
  BottomSheetShareComponent,
  EgretExampleViewerComponent,
  EgretExampleViewerTemplateComponent
];

// Standalone components that need to be imported
const standaloneComponents = [
  HeaderTopComponent,
  SidebarTopComponent,
  SidenavComponent,
  NotificationsComponent,
  SidebarSideComponent,
  HeaderSideComponent,
  AdminLayoutComponent,
  AuthLayoutComponent,
  BreadcrumbComponent,
  EgretNotifications2Component,
  CustomizerComponent,
  FooterComponent,
  AppLoaderComponent,
  AppComfirmComponent,
  DividerComponent
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    PerfectScrollbarModule,
    SearchModule,
    SharedPipesModule,
    SharedDirectivesModule,
    ...commonMaterialModules,
    ...allMaterialModules,
    // Import all standalone components
    ...standaloneComponents
  ],
  declarations: [
    // Only declare non-standalone components
    ...nonStandaloneComponents
  ],
  exports: [
    // Export both standalone and non-standalone components
    ...standaloneComponents,
    ...nonStandaloneComponents
  ]
})
export class SharedComponentsModule { }