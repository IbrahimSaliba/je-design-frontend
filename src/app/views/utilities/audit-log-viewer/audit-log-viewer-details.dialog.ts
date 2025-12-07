import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuditLogRecord } from 'app/shared/services/audit-log.service';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-audit-log-viewer-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatChipsModule,
    MatTabsModule,
    MatButtonModule
  ],
  templateUrl: './audit-log-viewer-details.dialog.html',
  styleUrls: ['./audit-log-viewer-details.dialog.scss']
})
export class AuditLogDetailsDialogComponent {

  formattedRequest: string | null;
  formattedResponse: string | null;

  constructor(
    private dialogRef: MatDialogRef<AuditLogDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AuditLogRecord
  ) {
    this.formattedRequest = this.formatPayload(data.requestPayload);
    this.formattedResponse = this.formatPayload(data.responsePayload);
  }

  close(): void {
    this.dialogRef.close();
  }

  private formatPayload(payload?: string): string | null {
    if (!payload) {
      return null;
    }
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return payload;
    }
  }
}

