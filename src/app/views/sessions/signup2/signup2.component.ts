import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButton as MatButton } from '@angular/material/button';
import { MatProgressBar as MatProgressBar } from '@angular/material/progress-bar';
import { Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { egretAnimations } from 'app/shared/animations/egret-animations';
@Component({
    selector: 'app-signup2',
    templateUrl: './signup2.component.html',
    styleUrls: ['./signup2.component.css'],
    animations: egretAnimations,
    standalone: false
})
export class Signup2Component implements OnInit {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;

  signupForm: UntypedFormGroup;
  errorMsg: string = '';
  
  constructor() {}

  ngOnInit() {
    const password = new UntypedFormControl('', Validators.required);

    this.signupForm = new UntypedFormGroup({
      email: new UntypedFormControl('', [Validators.required, Validators.email]),
      password: password,
      agreed: new UntypedFormControl('', (control: UntypedFormControl) => {
        const agreed = control.value;
        if(!agreed) {
          return { agreed: true }
        }
        return null;
      })
    })
  }

  signup() {
    const signupData = this.signupForm.value;
    console.log(signupData);

    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }

}
