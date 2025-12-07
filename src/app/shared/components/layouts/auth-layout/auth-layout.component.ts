import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-auth-layout',
    templateUrl: './auth-layout.component.html',
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class AuthLayoutComponent implements OnInit {

  constructor(
    public translate: TranslateService,
  ) { 
    // Translator init
    const browserLang: string = translate.getBrowserLang();
    translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
  }

  ngOnInit() {
  }

}
