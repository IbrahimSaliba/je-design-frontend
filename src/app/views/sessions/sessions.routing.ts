import { Signup3Component } from './signup3/signup3.component';
import { Signup2Component } from './signup2/signup2.component';
import { Routes } from "@angular/router";

import { ForgotPasswordComponent } from "./forgot-password/forgot-password.component";
import { LockscreenComponent } from "./lockscreen/lockscreen.component";
import { SigninComponent } from "./signin/signin.component";
import { SignupComponent } from "./signup/signup.component";
import { NotFoundComponent } from "./not-found/not-found.component";
import { ErrorComponent } from "./error/error.component";
import { Signin3Component } from './signin3/signin3.component';
import { Signin2Component } from './signin2/signin2.component';
import { ForgotPassword2Component } from './forgot-password2/forgot-password2.component';
import { OtpComponent } from './otp/otp.component';

export const SessionsRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "signin",
        component: SigninComponent,
        data: { title: "Signin" }
      },
      {
        path: "signup",
        component: SignupComponent,
        data: { title: "Signup" }
      },
      {
        path: "signup2",
        component: Signup2Component,
        data: { title: "Signup2" }
      },
      {
        path: "signin2",
        component: Signin2Component,
        data: { title: "Signin2" }
      },
      {
        path: "signup3",
        component: Signup3Component,
        data: { title: "Signup3" }
      },
      {
        path: "signin3",
        component: Signin3Component,
        data: { title: "sign-in-3" }
      },
      {
        path: "forgot-password",
        component: ForgotPasswordComponent,
        data: { title: "Forgot password" }
      },
      {
        path: "forgot-password2",
        component: ForgotPassword2Component,
        data: { title: "Forgot password" }
      },
      {
        path: "otp",
        component: OtpComponent,
        data: { title: "Two-Factor Authentication" }
      },
      {
        path: "lockscreen",
        component: LockscreenComponent,
        data: { title: "Lockscreen" }
      },
      {
        path: "404",
        component: NotFoundComponent,
        data: { title: "Not Found" }
      },
      {
        path: "error",
        component: ErrorComponent,
        data: { title: "Error" }
      }
    ]
  }
];
