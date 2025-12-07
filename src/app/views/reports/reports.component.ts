import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { ReportsService, ReportDefinition, ReportParameter } from './reports.service';
import { ReportExplanationDialogComponent } from './report-explanation-dialog.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressBarModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {
  reportForm!: FormGroup;
  activeReport: ReportDefinition | null = null;
  filteredParameters: ReportParameter[] = [];
  isLoading = false;
  readonly reportDefinitions = this.reportsService.getDefinitionsGrouped();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportsService: ReportsService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.handleReportChanges();
  }

  private initForm(): void {
    this.reportForm = this.fb.group({
      reportId: ['', Validators.required],
      format: ['json', Validators.required],
      params: this.fb.group({})
    });
  }

  private handleReportChanges(): void {
    this.reportForm.get('reportId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((reportId: string) => {
        this.activeReport = this.reportsService.getDefinition(reportId);
        this.configureParameterControls();
        
        // If this is the user-invoices report, fetch users for the dropdown
        if (reportId === 'user-invoices') {
          this.loadUsersForDropdown();
        }
      });
  }

  private loadUsersForDropdown(): void {
    this.reportsService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userOptions) => {
          // Find the userId parameter and update its options
          const userIdParam = this.filteredParameters.find(p => p.key === 'userId');
          if (userIdParam) {
            userIdParam.options = userOptions;
          }
        },
        error: (error) => {
          console.error('Failed to load users:', error);
          this.snackBar.open('Failed to load users. Please refresh the page.', 'Close', { duration: 3000 });
        }
      });
  }

  private configureParameterControls(): void {
    const paramsGroup = this.reportForm.get('params') as FormGroup;
    Object.keys(paramsGroup.controls).forEach(control => paramsGroup.removeControl(control));

    if (!this.activeReport) {
      this.filteredParameters = [];
      this.reportForm.get('format')?.setValue('json');
      return;
    }

    const formatControl = this.reportForm.get('format');
    const defaultFormat = this.activeReport.supportedFormats?.[0] ?? 'json';
    formatControl?.setValue(defaultFormat);

    this.filteredParameters = this.activeReport.parameters ?? [];
    this.filteredParameters.forEach(param => {
      if (param.type === 'date-range') {
        const startKey = param.startKey || `${param.key}Start`;
        const endKey = param.endKey || `${param.key}End`;
        paramsGroup.addControl(
          startKey,
          this.fb.control(param.defaultValue ?? null, param.required ? Validators.required : undefined)
        );
        paramsGroup.addControl(
          endKey,
          this.fb.control(param.defaultValue ?? null, param.required ? Validators.required : undefined)
        );
      } else {
        paramsGroup.addControl(
          param.key,
          this.fb.control(param.defaultValue ?? null, param.required ? Validators.required : undefined)
        );
      }
    });
  }

  get availableFormats(): Array<'json' | 'csv' | 'pdf'> {
    if (this.activeReport?.supportedFormats?.length) {
      return this.activeReport.supportedFormats as Array<'json' | 'csv' | 'pdf'>;
    }
    return ['json', 'csv'];
  }

  download(): void {
    if (!this.reportForm.valid || !this.activeReport) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const { format, params } = this.reportForm.value;
    this.isLoading = true;

    this.reportsService.downloadReport(this.activeReport, params, format)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(result.blob);
          link.download = result.fileName;
          link.click();
          URL.revokeObjectURL(link.href);
          this.snackBar.open(`Report "${this.activeReport?.name}" downloaded`, 'Close', { duration: 3000 });
          this.isLoading = false;
        },
        error: error => {
          console.error('Failed to download report', error);
          this.snackBar.open(error?.message || 'Failed to download report', 'Dismiss', { duration: 4000 });
          this.isLoading = false;
        }
      });
  }

  resetParams(): void {
    if (!this.activeReport) {
      return;
    }
    const paramsGroup = this.reportForm.get('params') as FormGroup;
    this.filteredParameters.forEach(param => {
      if (param.type === 'date-range') {
        const startKey = param.startKey || `${param.key}Start`;
        const endKey = param.endKey || `${param.key}End`;
        paramsGroup.get(startKey)?.setValue(param.defaultValue ?? null);
        paramsGroup.get(endKey)?.setValue(param.defaultValue ?? null);
      } else {
        paramsGroup.get(param.key)?.setValue(param.defaultValue ?? null);
      }
    });
  }

  openExplanationDialog(report: ReportDefinition): void {
    if (!report.calculationExplanation) {
      this.snackBar.open('No calculation details available for this report.', 'Close', { duration: 3000 });
      return;
    }

    this.dialog.open(ReportExplanationDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        reportName: report.name,
        explanation: report.calculationExplanation
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

