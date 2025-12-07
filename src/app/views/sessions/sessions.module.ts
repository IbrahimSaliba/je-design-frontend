import { PerfectScrollbarModule } from 'app/shared/components/perfect-scrollbar';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";

import { TranslateModule } from '@ngx-translate/core';

import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LockscreenComponent } from './lockscreen/lockscreen.component';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { SessionsRoutes } from "./sessions.routing";
import { NotFoundComponent } from './not-found/not-found.component';
import { ErrorComponent } from './error/error.component';
import { Signup2Component } from './signup2/signup2.component';
import { Signup3Component } from './signup3/signup3.component';
import { Signin3Component } from './signin3/signin3.component';
import { Signin2Component } from './signin2/signin2.component';
import { commonMaterialModules, allMaterialModules } from 'app/shared/material-imports';
import { DividerComponent } from 'app/shared/components/divider/divider.component';
import { ForgotPassword2Component } from './forgot-password2/forgot-password2.component';
import { OtpComponent } from './otp/otp.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    ...commonMaterialModules,
    ...allMaterialModules,
    PerfectScrollbarModule,
    DividerComponent,
    RouterModule.forChild(SessionsRoutes)
  ],
  declarations: [
    ForgotPasswordComponent,
    ForgotPassword2Component,
    LockscreenComponent, 
    SigninComponent, 
    SignupComponent, 
    NotFoundComponent, 
    ErrorComponent, 
    Signup2Component, 
    Signup3Component, 
    Signin3Component, 
    Signin2Component,
    OtpComponent
  ]
})
export class SessionsModule { }