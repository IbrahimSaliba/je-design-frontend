import { Component, OnInit } from '@angular/core';
import { Validators, UntypedFormControl, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { egretAnimations } from 'app/shared/animations/egret-animations';

@Component({
    selector: 'app-signup3',
    templateUrl: './signup3.component.html',
    styleUrls: ['./signup3.component.scss'],
    animations: egretAnimations,
    standalone: false
})
export class Signup3Component implements OnInit {

  signupForm: UntypedFormGroup;
  hidePassword = true;

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit() {

    const password = new UntypedFormControl('', Validators.required);

    this.signupForm = this.fb.group(
      {
        username: ["",Validators.required],
        email: ["",[Validators.required,Validators.email]],
        password: password,
        agreed: [false,Validators.required]
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
