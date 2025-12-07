import { Injectable } from '@angular/core';

@Injectable()
export class AppInboxService {
  public messages: any[] = [];
  
  constructor() {
    // Mock data removed - implement real API calls when backend is ready
    // TODO: Fetch messages from backend API
  }
}
