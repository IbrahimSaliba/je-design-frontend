import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-colors',
    templateUrl: './colors.component.html',
    styleUrls: ['./colors.component.scss'],
    standalone: false
})
export class ColorsComponent implements OnInit {
  colors = {
    "primary": {},
    "accent": {},
    "warn": {}
  }
  constructor() { }

  ngOnInit() {
    // console.log(Object.keys(this.colors).length)
  }

}
