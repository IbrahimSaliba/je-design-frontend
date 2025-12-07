import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton as MatButton } from '@angular/material/button';
import { MatProgressBar as MatProgressBar } from '@angular/material/progress-bar';
import { Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { AppLoaderService } from '../../../shared/services/app-loader/app-loader.service';
import { JwtAuthService } from '../../../shared/services/auth/jwt-auth.service';
import { egretAnimations } from 'app/shared/animations/egret-animations';

@Component({
    selector: 'app-signin2',
    templateUrl: './signin2.component.html',
    styleUrls: ['./signin2.component.css'],
    animations: egretAnimations,
    standalone: false
})
export class Signin2Component implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;

  signinForm: UntypedFormGroup;
  errorMsg = '';
  // return: string;

  private _unsubscribeAll: Subject<any>;

  constructor(
    private jwtAuth: JwtAuthService,
    private egretLoader: AppLoaderService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.signinForm = new UntypedFormGroup({
      username: new UntypedFormControl('Watson', Validators.required),
      password: new UntypedFormControl('12345678', Validators.required),
      remember: new UntypedFormControl(true)
    });

    // this.route.queryParams
    //   .pipe(takeUntil(this._unsubscribeAll))
    //   .subscribe(params => this.return = params['return'] || '/');
  }

  ngAfterViewInit() {
    // this.autoSignIn();
  }

  ngOnDestroy() {
    this._unsubscribeAll.next(1);
    this._unsubscribeAll.complete();
  }

  signin() {
    const signinData = this.signinForm.value

    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
    
    this.jwtAuth.signin(signinData.username, signinData.password)
    .subscribe({
      next: (response) => {
        this.router.navigateByUrl(this.jwtAuth.return);
      },
      error: (err) => {
        this.submitButton.disabled = false;
        this.progressBar.mode = 'determinate';
        this.errorMsg = err.message;
      }
    });
  }

  autoSignIn() {    
    if(this.jwtAuth.return === '/') {
      return
    }
    this.egretLoader.open(`Automatically Signing you in! \n Return url: ${this.jwtAuth.return.substring(0, 20)}...`, {width: '320px'});
    setTimeout(() => {
      this.signin();
      console.log('autoSignIn');
      this.egretLoader.close()
    }, 2000);
  }

}
