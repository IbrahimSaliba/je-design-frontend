import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButton as MatButton } from '@angular/material/button';
import { MatProgressBar as MatProgressBar } from '@angular/material/progress-bar';
import { egretAnimations } from 'app/shared/animations/egret-animations';

@Component({
    selector: 'app-forgot-password2',
    templateUrl: './forgot-password2.component.html',
    styleUrls: ['./forgot-password2.component.css'],
    animations: egretAnimations,
    standalone: false
})
export class ForgotPassword2Component implements OnInit {
  userEmail: string;
  errorMsg: string = '';
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;
  
  constructor() { }

  ngOnInit() {
  }
  
  submitEmail() {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }
}
