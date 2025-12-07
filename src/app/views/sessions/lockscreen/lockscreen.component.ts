import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { egretAnimations } from 'app/shared/animations/egret-animations';

@Component({
    selector: 'app-lockscreen',
    templateUrl: './lockscreen.component.html',
    styleUrls: ['./lockscreen.component.scss'],
    animations: egretAnimations,
    standalone: false
})
export class LockscreenComponent implements OnInit {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;

  lockscreenData = {
    password: ''
  }

  constructor() { }

  ngOnInit() {
  }

  unlock() {
    console.log(this.lockscreenData);

    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }
}
