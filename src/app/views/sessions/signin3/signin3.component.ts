import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl } from '@angular/forms';
import { egretAnimations } from 'app/shared/animations/egret-animations';

@Component({
    selector: 'app-signin3',
    templateUrl: './signin3.component.html',
    styleUrls: ['./signin3.component.scss'],
    animations: egretAnimations,
    standalone: false
})
export class Signin3Component implements OnInit {

  signupForm: UntypedFormGroup;
  hidePassword = true;

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit() {

    const password = new UntypedFormControl('', Validators.required);

    this.signupForm = this.fb.group(
      {
        email: ["",[Validators.required,Validators.email]],
        password: password,
        remember: [false,Validators.required]
      }
    );
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit() {
    if (!this.signupForm.invalid) {
      // do what you wnat with your data
      console.log(this.signupForm.value);
    }
  }

}
