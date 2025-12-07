import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-report-explanation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="dialog-icon">info</mat-icon>
      {{ data.reportName }} - Calculation Details
    </h2>
    
    <mat-dialog-content class="mat-typography">
      <div class="explanation-content" [innerHTML]="formattedExplanation"></div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">
        <mat-icon>close</mat-icon>
        Close
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-icon {
      vertical-align: middle;
      margin-right: 8px;
      color: #1976d2;
    }
    
    .explanation-content {
      line-height: 1.6;
      color: #333;
    }
    
    .explanation-content h3 {
      margin-top: 16px;
      margin-bottom: 8px;
      color: #1976d2;
      font-size: 1.1em;
    }
    
    .explanation-content ul {
      margin: 8px 0;
      padding-left: 24px;
    }
    
    .explanation-content li {
      margin: 4px 0;
    }
    
    .explanation-content strong {
      color: #1976d2;
    }
    
    mat-dialog-content {
      max-width: 600px;
      min-width: 400px;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
    }
  `]
})
export class ReportExplanationDialogComponent {
  formattedExplanation: string;

  constructor(
    public dialogRef: MatDialogRef<ReportExplanationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reportName: string; explanation: string }
  ) {
    // Convert markdown-style formatting to HTML
    this.formattedExplanation = this.formatExplanation(data.explanation);
  }

  private formatExplanation(text: string): string {
    if (!text) return '';
    
    // Convert markdown bold (**text**) to HTML strong
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Split into paragraphs (double newlines)
    const paragraphs = text.split(/\n\n+/);
    let html = '';
    
    for (const para of paragraphs) {
      const lines = para.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) continue;
      
      // Check if paragraph starts with a header
      if (lines[0].startsWith('**') && lines[0].endsWith('**') && lines[0].includes(':')) {
        html += `<h3>${lines[0]}</h3>`;
        lines.shift();
      }
      
      // Check if all lines are bullet points
      const allBullets = lines.every(line => /^[-•]\s+/.test(line));
      
      if (allBullets && lines.length > 0) {
        html += '<ul>';
        for (const line of lines) {
          const content = line.replace(/^[-•]\s+/, '').trim();
          html += `<li>${content}</li>`;
        }
        html += '</ul>';
      } else {
        // Regular paragraph
        for (const line of lines) {
          if (line.trim()) {
            html += `<p>${line}</p>`;
          }
        }
      }
    }
    
    return html;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

