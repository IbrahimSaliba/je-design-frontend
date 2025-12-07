import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar as MatSnackBar } from '@angular/material/snack-bar';
import { driver } from "driver.js";

@Component({
    selector: 'app-app-tour',
    templateUrl: './app-tour.component.html',
    styleUrls: ['./app-tour.component.css'],
    standalone: false
})
export class AppTourComponent implements OnInit, OnDestroy {
  driverObj: any;
  
  // Code example strings for the template
  tourStepsCode: string = `tourSteps(): any {
  return {
    showProgress: true,
    onDeselected: () => {
      this.snackBar.open('You just closed User Tour!', 'close', { duration: 3000 });
    },
    onDestroyed: () => {
      this.snackBar.open('User tour ended!', 'close', { duration: 3000 });
    },
    steps: [
      {
        element: '#areaOne',
        popover: {
          title: 'Step one',
          description: 'This is step description.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '#areaOne code',
        popover: {
          title: 'Define your steps',
          description: 'This is step description.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '#areaTwo code',
        popover: {
          title: 'Invoke startTour function',
          description: 'This is step description.',
          side: 'left',
          align: 'start'
        }
      }
    ]
  }
}`;

  initTourCode: string = `// Initialize new tour with the configured steps
this.driverObj = driver(this.tourSteps());
this.driverObj.drive();`;
  
  constructor(public snackBar: MatSnackBar) {
    this.driverObj = driver();
  }

  ngOnInit() {
   
  }
  
  ngOnDestroy() {
    // Clean up the driver instance if it exists
    if (this.driverObj) {
      this.driverObj.destroy();
    }
  }

  tourSteps(): any {
    return {
      showProgress: true,
      onDeselected: () => {
        this.snackBar.open('You just closed User Tour!', 'close', { duration: 3000 });
      },
      onDestroyed: () => {
        this.snackBar.open('User tour ended!', 'close', { duration: 3000 });
      },
      steps: [
        {
          element: '#areaOne',
          popover: {
            title: 'Define your steps',
            description: 'Provide necessary options to define your steps.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: 'code.tourStepsCode .hljs-keyword:nth-child(3)',
          popover: {
            title: 'onDeselected callback',
            description: 'You can run code on tour step change',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#areaTwo code',
          popover: {
            title: 'Initialize tour',
            description: 'Initialize the tour with the configured steps',
            side: 'left',
            align: 'start'
          }
        }
      ]
    }
  }
  
  startTour() {
    // Destroy any running tour
    if (this.driverObj) {
      this.driverObj.destroy();
    }
    
    // Initialize new tour with the configured steps
    this.driverObj = driver(this.tourSteps());
    this.driverObj.drive();
  }
}
