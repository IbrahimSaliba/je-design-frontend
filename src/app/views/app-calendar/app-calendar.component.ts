import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent } from 'angular-calendar';
import { Subject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { isSameDay, isSameMonth } from 'date-fns';
import { egretAnimations } from '../../shared/animations/egret-animations';
import { EgretCalendarEvent } from '../../shared/models/event.model';
import { AppCalendarService } from './app-calendar.service';
import { CalendarFormDialogComponent } from './calendar-form-dialog/calendar-form-dialog.component';
import { AppConfirmService } from '../../shared/services/app-confirm/app-confirm.service';

@Component({
    selector: 'app-calendar',
    templateUrl: './app-calendar.component.html',
    styleUrls: ['./app-calendar.component.css'],
    animations: egretAnimations,
    standalone: false
})
export class AppCalendarComponent implements OnInit {
  public view = 'month';
  public viewDate = new Date();
  private dialogRef: MatDialogRef<CalendarFormDialogComponent>;
  public activeDayIsOpen: boolean = true;
  public refresh: Subject<any> = new Subject();
  public events: EgretCalendarEvent[];
  private actions: CalendarEventAction[];
  public todayEvents: any[] = [];
  public showTodayNotification: boolean = false;

  constructor(
    public dialog: MatDialog,
    private calendarService: AppCalendarService,
    private confirmService: AppConfirmService
  ) {
    this.actions = [
      {
        label: '<i class="material-icons icon-sm">edit</i>',
        onClick: ({ event }: { event: CalendarEvent }): void => {
          this.handleEvent('edit', event);
        },
      },
      {
        label: '<i class="material-icons icon-sm">close</i>',
        onClick: ({ event }: { event: CalendarEvent }): void => {
          this.removeEvent(event);
        },
      },
    ];
  }

  ngOnInit() {
    this.loadEvents();
    this.loadTodayEvents();
  }

  private loadTodayEvents() {
    this.calendarService.getTodayEvents().subscribe((events) => {
      this.todayEvents = events;
      this.showTodayNotification = events.length > 0;
      
      if (events.length > 0) {
        console.log(`🔔 You have ${events.length} event(s) today:`, events);
      }
    });
  }

  public dismissTodayNotification() {
    this.showTodayNotification = false;
  }

  public showTodayNotificationAgain() {
    if (this.todayEvents.length > 0) {
      this.showTodayNotification = true;
    }
  }

  private initEvents(events): EgretCalendarEvent[] {
    return events.map((event) => {
      event.actions = this.actions;
      return new EgretCalendarEvent(event);
    });
  }

  public loadEvents() {
    this.calendarService.getEvents().subscribe((events: CalendarEvent[]) => {
      this.events = this.initEvents(events);
      // Also reload today's events
      this.loadTodayEvents();
    });
  }

  public removeEvent(event) {
    this.confirmService
      .confirm({
        title: 'Delete Event?',
        message: 'Are you sure you want to delete this event?'
      })
      .subscribe((res) => {
        if (!res) {
          return;
        }

        this.calendarService.deleteEvent(event._id).subscribe(() => {
          // Reload all events from backend
          this.loadEvents();
        });
      });
  }

  public addEvent() {
    this.dialogRef = this.dialog.open(CalendarFormDialogComponent, {
      panelClass: 'calendar-form-dialog',
      data: {
        action: 'add',
        date: new Date(),
      },
      width: '450px',
    });
    this.dialogRef.afterClosed().subscribe((res) => {
      if (!res) {
        return;
      }
      let dialogAction = res.action;
      let responseEvent = res.event;
      
      // Create the event object with proper structure
      const newEvent = new EgretCalendarEvent(responseEvent);
      
      this.calendarService.addEvent(newEvent).subscribe(() => {
        // Reload all events from backend
        this.loadEvents();
      });
    });
  }

  public handleEvent(action: string, event: EgretCalendarEvent): void {
    // console.log(event)
    this.dialogRef = this.dialog.open(CalendarFormDialogComponent, {
      panelClass: 'calendar-form-dialog',
      data: { event, action },
      width: '450px',
    });

    this.dialogRef.afterClosed().subscribe((res) => {
      if (!res) {
        return;
      }
      let dialogAction = res.action;
      let responseEvent = res.event;

      if (dialogAction === 'save') {
        // Merge the updated fields with the original event ID
        const updatedEvent = new EgretCalendarEvent({
          ...responseEvent,
          _id: event._id // Preserve the original ID
        });
        
        this.calendarService.updateEvent(updatedEvent).subscribe(() => {
          // Reload all events from backend
          this.loadEvents();
        });
      } else if (dialogAction === 'delete') {
        this.removeEvent(event);
      }
    });
  }

  public dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if ((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) || events.length === 0) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  public eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;

    this.calendarService.updateEvent(event as EgretCalendarEvent).subscribe(() => {
      // Reload all events from backend
      this.loadEvents();
    });
  }
}
