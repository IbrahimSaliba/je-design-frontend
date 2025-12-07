import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { EgretCalendarEvent } from '../../shared/models/event.model';
import { map, catchError, tap } from 'rxjs/operators';
import { JwtAuthService } from '../../shared/services/auth/jwt-auth.service';

@Injectable()
export class AppCalendarService {
  public events: EgretCalendarEvent[] = [];
  private baseUrl = 'http://localhost:8080/api/calendar';
  
  constructor(
    private http: HttpClient,
    private jwtAuth: JwtAuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtAuth.getJwtToken();
    
    if (!this.jwtAuth.isLoggedIn()) {
      console.warn('User is not logged in');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  public getEvents(): Observable<EgretCalendarEvent[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any[]>(`${this.baseUrl}/events`, { headers }).pipe(
      map((response) => {
        console.log('Calendar events response:', response);
        
        // Map backend CalendarEventResponseDTO to frontend EgretCalendarEvent
        this.events = response.map(event => new EgretCalendarEvent({
          _id: String(event.id),
          title: event.title,
          start: new Date(event.startDate),
          end: event.endDate ? new Date(event.endDate) : null,
          allDay: event.allDay || false,
          color: {
            primary: event.primaryColor || '#247ba0',
            secondary: event.secondaryColor || '#D1E8FF'
          },
          meta: {
            location: event.location || '',
            notes: event.notes || ''
          }
        }));
        
        return this.events;
      }),
      catchError(error => {
        console.error('Error fetching calendar events:', error);
        return of([]);
      })
    );
  }

  public addEvent(event: EgretCalendarEvent): Observable<EgretCalendarEvent[]> {
    const headers = this.getAuthHeaders();
    
    const eventDTO = {
      title: event.title,
      startDate: event.start.toISOString(),
      endDate: event.end ? event.end.toISOString() : null,
      allDay: event.allDay || false,
      primaryColor: event.color?.primary || '#247ba0',
      secondaryColor: event.color?.secondary || '#D1E8FF',
      location: event.meta?.location || '',
      notes: event.meta?.notes || ''
    };

    console.log('Creating calendar event:', eventDTO);
    
    return this.http.post<any>(`${this.baseUrl}/events`, eventDTO, { headers }).pipe(
      tap(response => {
        console.log('Event created:', response);
      }),
      map(() => {
        // Reload all events after creation
        return this.getEventsSync();
      }),
      catchError(error => {
        console.error('Error creating event:', error);
        alert('Failed to create event. Please try again.');
        return of(this.events);
      })
    );
  }

  public updateEvent(event: EgretCalendarEvent): Observable<EgretCalendarEvent[]> {
    const headers = this.getAuthHeaders();
    
    const eventDTO = {
      title: event.title,
      startDate: event.start.toISOString(),
      endDate: event.end ? event.end.toISOString() : null,
      allDay: event.allDay || false,
      primaryColor: event.color?.primary || '#247ba0',
      secondaryColor: event.color?.secondary || '#D1E8FF',
      location: event.meta?.location || '',
      notes: event.meta?.notes || ''
    };

    console.log('Updating calendar event:', event._id, eventDTO);
    
    return this.http.put<any>(`${this.baseUrl}/events/${event._id}`, eventDTO, { headers }).pipe(
      tap(response => {
        console.log('Event updated:', response);
      }),
      map(() => {
        // Reload all events after update
        return this.getEventsSync();
      }),
      catchError(error => {
        console.error('Error updating event:', error);
        alert('Failed to update event. Please try again.');
        return of(this.events);
      })
    );
  }

  public deleteEvent(eventID: string): Observable<EgretCalendarEvent[]> {
    const headers = this.getAuthHeaders();
    
    console.log('Deleting calendar event:', eventID);
    
    return this.http.delete<any>(`${this.baseUrl}/events/${eventID}`, { headers }).pipe(
      tap(response => {
        console.log('Event deleted:', response);
      }),
      map(() => {
        // Remove event from local cache
        this.events = this.events.filter((e) => e._id !== eventID);
        return this.events;
      }),
      catchError(error => {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
        return of(this.events);
      })
    );
  }

  // Get today's events
  public getTodayEvents(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any[]>(`${this.baseUrl}/events/today`, { headers }).pipe(
      map((response) => {
        console.log('Today\'s calendar events:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching today\'s events:', error);
        return of([]);
      })
    );
  }

  // Helper method to return events synchronously (after fetch)
  private getEventsSync(): EgretCalendarEvent[] {
    return this.events;
  }
}

