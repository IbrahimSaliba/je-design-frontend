import { ErrorStateMatcher } from '@angular/material/core';
import { Validators, UntypedFormGroup, NgForm, FormGroupDirective, UntypedFormControl, AbstractControl, ValidationErrors } from "@angular/forms";
import { UntypedFormBuilder } from "@angular/forms";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { egretAnimations } from 'app/shared/animations/egret-animations';

@Component({
    selector: "app-signup",
    templateUrl: "./signup.component.html",
    styleUrls: ["./signup.component.scss"],
    animations: egretAnimations,
    standalone: false
})
export class SignupComponent implements OnInit {
  signupForm: UntypedFormGroup;
  hidePassword = true;
  isLoading = false;
  
  constructor(
    private fb: UntypedFormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.signupForm = this.fb.group({
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
      agreed: [false, Validators.required]
    });
  }

  onSubmit() {
    if (this.signupForm.valid) {
      // Handle form submission
      console.log(this.signupForm.value);
    }
  }
}