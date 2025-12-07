import { Injectable } from '@angular/core';

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cid-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

@Injectable({
  providedIn: 'root'
})
export class CorrelationIdService {
  private currentCorrelationId: string | null = null;

  getCorrelationId(): string {
    if (!this.currentCorrelationId) {
      this.currentCorrelationId = generateCorrelationId();
    }
    return this.currentCorrelationId;
  }

  rotateCorrelationId(next?: string | null): void {
    if (next && next.trim().length > 0) {
      this.currentCorrelationId = next;
    } else {
      this.currentCorrelationId = generateCorrelationId();
    }
  }
}

