import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-pricing',
    templateUrl: './app-pricing.component.html',
    styleUrls: ['./app-pricing.component.css'],
    standalone: false
})
export class AppPricingComponent implements OnInit {
  isAnnualSelected: boolean = false;
  
  constructor() { }

  ngOnInit() {
  }

}
