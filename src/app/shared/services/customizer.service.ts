import { Injectable } from "@angular/core";
import { Router, NavigationStart } from "@angular/router";
import { filter } from "rxjs/operators";
import { LayoutService } from "./layout.service";

@Injectable({
  providedIn: "root"
})
export class CustomizerService {


  colors = [
    {
      class: "black",
      active: false
    },
    {
      class: "white",
      active: false
    },
    {
      class: "dark-blue",
      active: false
    },
    {
      class: "grey",
      active: false
    },
    {
      class: "brown",
      active: false
    },
    {
      class: "gray",
      active: false
    },
    {
      class: "purple",
      active: false
    },
    {
      class: "blue",
      active: false
    },
    
    {
      class: "indigo",
      active: false
    },
    {
      class: "yellow",
      active: false
    },
    {
      class: "green",
      active: false
    },
    {
      class: "pink",
      active: false
    },
    {
      class: "red",
      active: false
    },
    {
      class: "slate",
      active: false
    }
  ];
  selectedSidebarColor;
  topbarColors: any[];
  sidebarColors: any[];

  constructor(
    private router: Router,     
    private layout: LayoutService,
  ) {
    this.sidebarColors = this.getSidebarColors();
  }

  getSidebarColors() {
    let sidebarColors = [
      {
        class: "sidebar-dark",
        active: false
      },
      {
        class: "sidebar-light",
        active: false
      }
    ];
    return sidebarColors;
  }


  changeSidebarColor(color) {
    this.layout.publishLayoutChange({ sidebarColor: color.class });
    this.sidebarColors = this.getSidebarColors();
  }

  removeClass(el, className) {
    if (!el || el.length === 0) return;
    if (!el.length) {
      el.classList.remove(className);
    } else {
      for (var i = 0; i < el.length; i++) {
        el[i].classList.remove(className);
      }
    }
  }
  addClass(el, className) {
    if (!el) return;
    if (!el.length) {
      el.classList.add(className);
    } else {
      for (var i = 0; i < el.length; i++) {
        el[i].classList.add(className);
      }
    }
  }
  findClosest(el, className) {
    if (!el) return;
    while (el) {
      var parent = el.parentElement;
      if (parent && this.hasClass(parent, className)) {
        return parent;
      }
      el = parent;
    }
  }
  hasClass(el, className) {
    if (!el) return;
    return (
      ` ${el.className} `.replace(/[\n\t]/g, " ").indexOf(` ${className} `) > -1
    );
  }
  toggleClass(el, className) {
    if (!el) return;
    if (this.hasClass(el, className)) {
      this.removeClass(el, className);
    } else {
      this.addClass(el, className);
    }
  }

}