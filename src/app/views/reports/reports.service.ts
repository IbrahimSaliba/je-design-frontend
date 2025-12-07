import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { formatDate } from '@angular/common';
import { Observable, map, catchError, of } from 'rxjs';
import { jsPDF } from 'jspdf';
import { environment } from '../../../environments/environment';
import { JwtAuthService } from '../../shared/services/auth/jwt-auth.service';

export interface ReportParameterOption {
  label: string;
  value: string | number | boolean;
}

export type ReportParameterType = 'text' | 'select' | 'date-range';

export interface ReportParameter {
  key: string;
  label: string;
  type: ReportParameterType;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  hint?: string;
  options?: ReportParameterOption[];
  startKey?: string;
  endKey?: string;
}

export interface ReportDefinition {
  id: string;
  category: string;
  icon: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  parameters?: ReportParameter[];
  supportedFormats?: Array<'json' | 'csv' | 'pdf'>;
  fileNameBuilder?: (payload: Record<string, any>) => string;
  extractData?: (response: any) => unknown;
  defaultPayload?: Record<string, any>;
  pdfBuilder?: (data: any, payload: Record<string, any>) => Blob;
  calculationExplanation?: string; // Business-friendly explanation of how the report is calculated
}

export interface ReportGroup {
  category: string;
  definitions: ReportDefinition[];
}

interface ReportDownloadResult {
  blob: Blob;
  fileName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly apiBase = `${(environment as any).apiUrl || (environment as any).apiURL || 'http://localhost:8080'}`;

  constructor(
    private readonly http: HttpClient,
    private readonly injector: Injector
  ) {}

  /**
   * Fetch all users for dropdown selection (includes current user)
   */
  getUsers(): Observable<ReportParameterOption[]> {
    const jwtAuth = this.injector.get(JwtAuthService);
    const token = jwtAuth.getJwtToken();
    
    // Use the new endpoint that includes all users (including current user)
    return this.http.get<any[]>(`${this.apiBase}/api/users/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      map((response: any) => {
        // Handle ResponseModel wrapper if present
        let users: any[] = [];
        if (response && Array.isArray(response)) {
          users = response;
        } else if (response && response.responseData && Array.isArray(response.responseData)) {
          users = response.responseData;
        }
        
        // Convert to ReportParameterOption format
        return users.map((user: any) => ({
          label: `${user.username}${user.firstName || user.lastName ? ` (${user.firstName || ''} ${user.lastName || ''})`.trim() : ''}`,
          value: user.id
        }));
      }),
      catchError(error => {
        console.error('Error fetching users:', error);
        return of([]);
      })
    );
  }

  private readonly definitions: ReportDefinition[] = [
    {
      id: 'profit-loss',
      category: 'Finance & Accounting',
      icon: 'account_balance',
      name: 'Profit & Loss Statement',
      description: 'Summarise revenue, expenses, and net profit for a chosen date range.',
      endpoint: '/api/accounting/profit-loss',
      method: 'GET',
      parameters: [
        {
          key: 'period',
          label: 'Reporting Period',
          type: 'date-range',
          required: true,
          startKey: 'start',
          endKey: 'end',
          hint: 'Select the start and end date for the P&L calculation.'
        }
      ],
      supportedFormats: ['json', 'csv'],
      fileNameBuilder: payload => {
        const start = payload.start ? formatDate(payload.start, 'yyyyMMdd', 'en-US') : 'start';
        const end = payload.end ? formatDate(payload.end, 'yyyyMMdd', 'en-US') : 'end';
        return `profit-loss_${start}-${end}`;
      },
      calculationExplanation: `**How This Report is Calculated:**

**Total Income:**
• Sums all income entries recorded within your selected date range
• Includes revenue from invoices, sales, and other income sources
• Only includes entries marked as "INCOME" type

**Total Expense:**
• Sums all expense entries within the selected period
• Includes: salaries, rent, taxes, and other operational expenses
• Excludes reversal entries (corrections/adjustments)

**Net Profit:**
• Calculated as: Total Income minus Total Expense
• Shows your actual profit or loss for the period
• Positive values indicate profit, negative values indicate loss

**Important Notes:**
• Only transactions within your selected date range are included
• Reversal entries (corrections) are automatically excluded to prevent double-counting
• The report reflects actual accounting entries, not pending transactions`
    },
    {
      id: 'accounting-dashboard',
      category: 'Finance & Accounting',
      icon: 'insights',
      name: 'Accounting Dashboard Snapshot',
      description: 'Download current revenue, expenses, inventory value, and top-line KPI metrics.',
      endpoint: '/api/accounting/dashboard',
      method: 'GET',
      supportedFormats: ['json', 'csv', 'pdf'],
      parameters: [
        {
          key: 'period',
          label: 'Reporting Period',
          type: 'date-range',
          startKey: 'startDate',
          endKey: 'endDate',
          hint: 'Optional range to narrow metrics.'
        }
      ],
      fileNameBuilder: () => `accounting-dashboard_${formatDate(new Date(), 'yyyyMMdd_HHmm', 'en-US')}`,
      pdfBuilder: (data, payload) => this.buildAccountingSnapshotPdf(data, payload),
      calculationExplanation: `**How This Report is Calculated:**

**Financial Summary:**
• **Total Revenue:** Sum of all revenue and income entries (excluding reversals)
• **Total Expenses:** Sum of all expense entries (salaries, rent, taxes, etc.)
• **Net Income:** Revenue minus Expenses
• **Inventory Value:** Current stock quantity × item prices (active items only)
• **Unpaid Invoices:** Sum of pending invoices and invoices with remaining balances

**Operational Metrics:**
• **Total Entries:** Count of all accounting journal entries
• **Total Invoices:** Count of all active invoices (excluding deleted)
• **Pending Invoices:** Count of invoices with "PENDING" status
• **Stock Alerts:** Sum of low stock and out of stock items
• **Low Stock Items:** Items flagged as below minimum threshold
• **Out of Stock:** Items with zero or negative quantity

**Monthly Performance:**
• Revenue and expenses broken down by month
• Shows trends over the last 6 months

**Recent Activities:**
• Latest journal entries, invoices, and expenses
• Helps track recent business transactions

**Note:** If a date range is provided, metrics are filtered to that period. Otherwise, all-time data is shown.`
    },
    {
      id: 'inventory-stock-report',
      category: 'Inventory & Operations',
      icon: 'inventory_2',
      name: 'Stock Position Report',
      description: 'Detailed stock balances with valuation, min-stock flags, and status per item.',
      endpoint: '/api/inventory/report',
      method: 'GET',
      supportedFormats: ['json', 'csv'],
      fileNameBuilder: () => `stock-report_${formatDate(new Date(), 'yyyyMMdd_HHmm', 'en-US')}`,
      calculationExplanation: `**How This Report is Calculated:**

**Stock Balances:**
• Shows current quantity on hand for each item
• Calculated from all inventory movements (IN and OUT transactions)
• Formula: Initial Stock + All IN movements - All OUT movements

**Valuation:**
• Stock value = Current Quantity × Item Price
• Uses the final price set for each item
• Reflects the total value of inventory on hand

**Status Indicators:**
• **In Stock:** Quantity is above minimum threshold
• **Low Stock:** Quantity is below minimum threshold but above zero
• **Out of Stock:** Quantity is zero or negative
• **Deleted/Disposed:** Items marked for removal (excluded from active inventory)

**Minimum Stock Flags:**
• Items are flagged when current quantity < minimum required quantity
• Helps identify items that need reordering

**Report Scope:**
• Includes all active items (excludes deleted and disposed items)
• Shows real-time stock position as of report generation time
• Each item's status is calculated based on current quantity vs. minimum threshold`
    },
    {
      id: 'inventory-statistics',
      category: 'Inventory & Operations',
      icon: 'stacked_line_chart',
      name: 'Inventory KPI Pack',
      description: 'Aggregated stock value, movement velocity, low-stock count, and top items.',
      endpoint: '/api/inventory/statistics',
      method: 'GET',
      supportedFormats: ['json', 'csv'],
      calculationExplanation: `**How This Report is Calculated:**

**Stock Value:**
• Total value of all inventory = Sum of (Item Quantity × Item Price) for all active items
• Only includes items that are not deleted or disposed
• Represents the current investment in inventory

**Movement Velocity:**
• Tracks how quickly items move in and out of stock
• Calculated from inventory movement transactions
• Shows activity levels: high velocity = fast-moving items, low velocity = slow-moving items

**Low Stock Count:**
• Number of items where current quantity < minimum required quantity
• Helps identify items that need immediate attention
• Critical for maintaining service levels

**Top Items:**
• Ranked by various metrics (value, quantity, movement frequency)
• Helps identify:
  - Most valuable items (by total stock value)
  - Fastest moving items (by transaction frequency)
  - Items requiring most attention

**Key Performance Indicators:**
• Provides aggregated metrics for inventory health
• Helps with inventory planning and optimization
• Identifies trends and patterns in stock management

**Note:** All calculations are based on active inventory only (excludes deleted/disposed items).`
    },
    {
      id: 'expiry-risk',
      category: 'Quality & Compliance',
      icon: 'warning_amber',
      name: 'Expiry Risk Register',
      description: 'Items approaching expiry with risk assessment, recommended actions, and value exposure.',
      endpoint: '/api/expiry-alerts',
      method: 'GET',
      supportedFormats: ['json', 'csv'],
      extractData: response => {
        // Handle ResponseModel structure: { errorCode, errorDesc, responseData }
        if (response && typeof response === 'object') {
          if (Array.isArray(response.responseData)) {
            return response.responseData;
          }
          if (Array.isArray(response.data)) {
            return response.data;
          }
        }
        // If response is already an array, return it
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      },
      parameters: [
        {
          key: 'expiryDate',
          label: 'Expiry Date Range',
          type: 'date-range',
          required: false,
          startKey: 'expiryDateFrom',
          endKey: 'expiryDateTo',
          hint: 'Optional: Filter items by expiry date range. Leave empty to show all items expiring within 30 days or already expired.'
        }
      ],
      calculationExplanation: `**How This Report is Calculated:**

**Expiry Detection:**
• Identifies items with expiry dates approaching within a defined warning period
• Compares item expiry dates against current date
• Flags items that need attention before they expire

**Risk Assessment:**
• **High Risk:** Items expiring soon (within critical timeframe)
• **Medium Risk:** Items expiring in near future (within warning timeframe)
• **Low Risk:** Items with sufficient time before expiry
• Risk levels are based on days until expiry date

**Value Exposure:**
• Calculates potential financial loss if items expire
• Formula: Quantity on Hand × Item Price
• Shows the monetary value at risk for each expiring item

**Recommended Actions:**
• Suggests actions based on risk level and time remaining:
  - **Immediate Sale/Promotion:** For high-risk items
  - **Priority Distribution:** For medium-risk items
  - **Monitor:** For low-risk items
• Helps minimize waste and financial loss

**Report Benefits:**
• Prevents inventory loss from expired items
• Helps optimize inventory turnover
• Supports compliance with quality standards
• Reduces financial waste from expired stock

**Note:** Only items with expiry dates are included in this report.`
    },
    {
      id: 'audit-trail',
      category: 'Governance & Oversight',
      icon: 'rule',
      name: 'Audit Trail Extract',
      description: 'Filtered list of user actions with HTTP traces and success status.',
      endpoint: '/api/audit/logs/search',
      method: 'POST',
      defaultPayload: {
        page: 0,
        size: 200,
        sortBy: 'createdAt',
        sortDirection: 'DESC'
      },
      parameters: [
        {
          key: 'from',
          label: 'Date (From)',
          type: 'date-range',
          startKey: 'from',
          endKey: 'to',
          hint: 'Optional filter for audit window.'
        },
        {
          key: 'success',
          label: 'Execution Status',
          type: 'select',
          options: [
            { label: 'All', value: '' },
            { label: 'Success only', value: 'true' },
            { label: 'Failed only', value: 'false' }
          ],
          defaultValue: ''
        }
      ],
      supportedFormats: ['json', 'csv'],
      extractData: response => response?.data ?? response,
      calculationExplanation: `**How This Report is Calculated:**

**Audit Log Collection:**
• Captures all user actions and system events automatically
• Records: who, what, when, and result of each action
• Includes HTTP request details (method, endpoint, parameters)
• Tracks success/failure status for each operation

**Data Included:**
• **User Information:** Who performed the action
• **Action Type:** What operation was executed (CREATE, UPDATE, DELETE, etc.)
• **Timestamp:** When the action occurred
• **Resource:** What entity was affected (invoice, item, expense, etc.)
• **HTTP Details:** Request method, endpoint, and parameters
• **Status:** Success or failure of the operation

**Filtering Options:**
• **Date Range:** Filter actions within a specific time period
• **Status Filter:** Show all, only successful, or only failed actions
• Results are sorted by creation date (newest first)

**Report Benefits:**
• **Compliance:** Maintains a complete record of system activities
• **Security:** Helps identify unauthorized access or suspicious activities
• **Troubleshooting:** Tracks failed operations for debugging
• **Accountability:** Shows who made changes and when
• **Forensics:** Supports investigation of issues or disputes

**Default Settings:**
• Shows 200 most recent entries
• Sorted by creation date (descending - newest first)
• Can be customized with date range and status filters

**Note:** This is a read-only log. Entries cannot be modified or deleted to maintain audit integrity.`
    },
    {
      id: 'user-invoices',
      category: 'Finance & Accounting',
      icon: 'receipt_long',
      name: 'User Invoice Report',
      description: 'List of invoices created by a specific user within a date range, including all invoice details.',
      endpoint: '/api/invoices/report/by-user',
      method: 'GET',
      supportedFormats: ['json', 'csv'],
      parameters: [
        {
          key: 'period',
          label: 'Date Range',
          type: 'date-range',
          required: true,
          startKey: 'fromDate',
          endKey: 'toDate',
          hint: 'Select the start and end date for the invoice search.'
        },
        {
          key: 'userId',
          label: 'User',
          type: 'select',
          required: true,
          hint: 'Select the user who created the invoices.',
          options: [] // Will be populated dynamically
        }
      ],
      fileNameBuilder: payload => {
        const from = payload.fromDate ? formatDate(payload.fromDate, 'yyyyMMdd', 'en-US') : 'start';
        const to = payload.toDate ? formatDate(payload.toDate, 'yyyyMMdd', 'en-US') : 'end';
        const userId = payload.userId || 'user';
        return `user-invoices_${userId}_${from}-${to}`;
      },
      calculationExplanation: `**How This Report is Calculated:**

**Invoice Selection:**
• Retrieves all invoices created by the specified user
• Filters invoices by invoice date within the selected date range
• Excludes deleted invoices (status = "DELETED")
• Results are sorted by invoice date (newest first)

**Invoice Details Included:**
• **Invoice Information:** Invoice number, date, status, payment method
• **Client Information:** Client ID, client name
• **User Information:** Creator ID and username
• **Financial Details:**
  - Total amount (after discounts)
  - Total amount before discount
  - Discount amount applied
  - VAT percentage
  - Amount settled (paid)
  - Remaining amount (unpaid)
• **Invoice Items:** Complete list of items in each invoice with:
  - Item ID, name, and code
  - Quantity sold
  - Unit price
  - Total price per line
  - Free item indicator

**Date Range Filtering:**
• Only invoices with invoice date between "From Date" and "To Date" are included
• Date comparison is inclusive (includes invoices on the start and end dates)
• Time component is considered for precise filtering

**Use Cases:**
• Track sales performance by user
• Review invoices created by specific staff members
• Generate commission reports
• Audit invoice creation activity
• Analyze user productivity and sales patterns

**Note:** The user ID must be a valid numeric ID. You can find user IDs in the Users management section of the system.`
    }
  ];

  getDefinitionsGrouped(): ReportGroup[] {
    const groups = new Map<string, ReportDefinition[]>();
    this.definitions.forEach(def => {
      if (!groups.has(def.category)) {
        groups.set(def.category, []);
      }
      groups.get(def.category)!.push(def);
    });

    return Array.from(groups.entries()).map(([category, definitions]) => ({
      category,
      definitions
    }));
  }

  getDefinition(id: string): ReportDefinition | null {
    return this.definitions.find(def => def.id === id) ?? null;
  }

  downloadReport(
    definition: ReportDefinition,
    rawParams: Record<string, any>,
    format: 'json' | 'csv' | 'pdf'
  ): Observable<ReportDownloadResult> {
    const requestPayload = this.preparePayload(definition, rawParams);

    if (definition.method === 'GET') {
      const params = this.buildHttpParams(requestPayload);
      return this.http.get(`${this.apiBase}${definition.endpoint}`, { params })
        .pipe(map(response => this.buildDownload(response, definition, requestPayload, format)));
    }

    return this.http.post(`${this.apiBase}${definition.endpoint}`, requestPayload)
      .pipe(map(response => this.buildDownload(response, definition, requestPayload, format)));
  }

  private preparePayload(definition: ReportDefinition, params: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = {
      ...(definition.defaultPayload ?? {})
    };
    if (!definition.parameters || definition.parameters.length === 0) {
      return { ...payload, ...(params ?? {}) };
    }

    definition.parameters.forEach(parameter => {
      if (parameter.type === 'date-range') {
        const startKey = parameter.startKey || `${parameter.key}Start`;
        const endKey = parameter.endKey || `${parameter.key}End`;
        const startValue = params[startKey];
        const endValue = params[endKey];

        if (startValue) {
          const isoStart = this.toIsoString(startValue, true);
          if (isoStart) {
            payload[startKey] = isoStart;
          }
        }
        if (endValue) {
          const isoEnd = this.toIsoString(endValue, false);
          if (isoEnd) {
            payload[endKey] = isoEnd;
          }
        }
      } else {
        const value = params[parameter.key];
        if (value !== undefined && value !== null && value !== '') {
          payload[parameter.key] = value;
        }
      }
    });

    return payload;
  }

  private toIsoString(value: string | Date, startOfDay: boolean): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    if (startOfDay) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return date.toISOString();
  }

  private buildHttpParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value);
      }
    });
    return httpParams;
  }

  private buildDownload(
    response: any,
    definition: ReportDefinition,
    payload: Record<string, any>,
    format: 'json' | 'csv' | 'pdf'
  ): ReportDownloadResult {
    const extracted = definition.extractData ? definition.extractData(response) : response;
    if (format === 'pdf') {
      if (!definition.pdfBuilder) {
        throw new Error(`PDF format is not supported for ${definition.name}`);
      }
      const blob = definition.pdfBuilder(extracted, payload);
      return {
        blob,
        fileName: this.resolveFileName(definition, payload, 'pdf')
      };
    }

    if (format === 'csv') {
      // Special handling for Inventory Statistics (nested structure)
      if (definition.id === 'inventory-statistics' && extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
        return this.asInventoryStatisticsCsv(extracted, definition, payload);
      }
      
      // Special handling for User Invoice Report (flatten invoice items)
      if (definition.id === 'user-invoices' && Array.isArray(extracted)) {
        return this.asUserInvoicesCsv(extracted, definition, payload);
      }
      
      // Handle ResponseModel structure for expiry-risk report
      if (definition.id === 'expiry-risk' && extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
        // If extracted is still an object (ResponseModel), try to get the array
        if ('responseData' in extracted && Array.isArray((extracted as any).responseData)) {
          return this.asCsv((extracted as any).responseData, definition, payload);
        }
        if ('data' in extracted && Array.isArray((extracted as any).data)) {
          return this.asCsv((extracted as any).data, definition, payload);
        }
        // If it's a single object, wrap it in an array
        return this.asCsv([extracted], definition, payload);
      }
      
      if (!Array.isArray(extracted)) {
        if (extracted && typeof extracted === 'object' && 'data' in extracted && Array.isArray((extracted as any).data)) {
          return this.asCsv((extracted as any).data, definition, payload);
        }
        if (extracted && typeof extracted === 'object' && 'responseData' in extracted && Array.isArray((extracted as any).responseData)) {
          return this.asCsv((extracted as any).responseData, definition, payload);
        }
        return this.asCsv([extracted], definition, payload);
      }
      return this.asCsv(extracted, definition, payload);
    }

    return this.asJson(extracted, definition, payload);
  }

  private asJson(
    data: unknown,
    definition: ReportDefinition,
    payload: Record<string, any>
  ): ReportDownloadResult {
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=UTF-8' });
    const fileName = this.resolveFileName(definition, payload, 'json');

    return { blob, fileName };
  }

  private asCsv(
    data: any[],
    definition: ReportDefinition,
    payload: Record<string, any>
  ): ReportDownloadResult {
    if (!Array.isArray(data) || data.length === 0) {
      const blob = new Blob(['No data available'], { type: 'text/plain;charset=UTF-8' });
      return {
        blob,
        fileName: `${definition.id}_${formatDate(new Date(), 'yyyyMMdd_HHmm', 'en-US')}.txt`
      };
    }

    const columnSet = new Set<string>();
    data.forEach(row => Object.keys(row || {}).forEach(key => columnSet.add(key)));
    
    // Filter out picture/image columns for Stock Position Report and Expiry Risk Register
    let columns = Array.from(columnSet);
    if (definition.id === 'inventory-stock-report' || definition.id === 'expiry-risk') {
      columns = columns.filter(col => 
        col !== 'picture' && 
        !col.toLowerCase().includes('image') && 
        !col.toLowerCase().includes('photo')
      );
    }

    const csvRows = [
      columns.join(','),
      ...data.map(row => columns.map(col => {
        const value = row?.[col];
        // Special handling for image/picture fields (for other reports)
        if ((col === 'picture' || col.toLowerCase().includes('image') || col.toLowerCase().includes('photo')) && value) {
          return this.escapeCsvValue(this.formatImageForCsv(value));
        }
        return this.escapeCsvValue(value);
      }).join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=UTF-8' });
    const fileName = this.resolveFileName(definition, payload, 'csv');

    return { blob, fileName };
  }

  private asInventoryStatisticsCsv(
    data: any,
    definition: ReportDefinition,
    payload: Record<string, any>
  ): ReportDownloadResult {
    const rows: string[] = [];
    
    // Add header
    rows.push('Inventory KPI Pack Report');
    rows.push(`Generated: ${formatDate(new Date(), 'medium', 'en-US')}`);
    rows.push(''); // Empty row
    
    // Summary Statistics Section
    rows.push('Summary Statistics');
    rows.push('Metric,Value');
    
    const summaryMetrics = [
      { label: 'Total Stock Value', value: data.totalStockValue ?? 0 },
      { label: 'Total Items', value: data.totalItems ?? 0 },
      { label: 'Low Stock Items', value: data.lowStockItems ?? 0 },
      { label: 'Movements This Month', value: data.movementsThisMonth ?? 0 },
      { label: 'Stock In This Month', value: data.stockInThisMonth ?? 0 },
      { label: 'Stock Out This Month', value: data.stockOutThisMonth ?? 0 }
    ];
    
    summaryMetrics.forEach(metric => {
      rows.push(`${this.escapeCsvValue(metric.label)},${this.escapeCsvValue(metric.value)}`);
    });
    
    rows.push(''); // Empty row
    
    // Top Items Section
    rows.push('Top Items by Stock Value');
    
    const topItems = data.topItemsByValue || [];
    if (topItems.length > 0) {
      const itemHeaders = ['Item ID', 'Item Name', 'Item Code', 'Current Stock', 'Stock Value', 'Status'];
      rows.push(itemHeaders.join(','));
      
      topItems.forEach((item: any) => {
        const itemRow = [
          item.itemId ?? '',
          item.itemName ?? '',
          item.itemCode ?? '',
          item.currentStock ?? 0,
          item.stockValue ?? 0,
          item.status ?? ''
        ];
        rows.push(itemRow.map(val => this.escapeCsvValue(val)).join(','));
      });
    } else {
      rows.push('No top items available');
    }
    
    const content = rows.join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=UTF-8' });
    const fileName = this.resolveFileName(definition, payload, 'csv');
    
    return { blob, fileName };
  }

  private asUserInvoicesCsv(
    invoices: any[],
    definition: ReportDefinition,
    payload: Record<string, any>
  ): ReportDownloadResult {
    if (!Array.isArray(invoices) || invoices.length === 0) {
      const blob = new Blob(['No invoices found for the selected criteria'], { type: 'text/plain;charset=UTF-8' });
      return {
        blob,
        fileName: `${definition.id}_${formatDate(new Date(), 'yyyyMMdd_HHmm', 'en-US')}.txt`
      };
    }

    // Map invoices to rows with only the specified fields
    const rows: any[] = invoices.map(invoice => ({
      invoiceDate: invoice.invoiceDate || '',
      status: invoice.status || '',
      totalAmount: invoice.totalAmount || 0,
      clientName: invoice.clientName || '',
      createdBy: invoice.createdByName || '',
      amountSettled: invoice.amountSettled || 0,
      remainingAmount: invoice.remainingAmount || 0,
      totalAmountBeforeDiscount: invoice.totalAmountBeforeDiscount || 0,
      invoiceNumber: invoice.invoiceNumber || '',
      discountAmount: invoice.discountAmount || 0,
      deductFromStock: invoice.deductFromStock || '',
      paymentMethod: invoice.paymentMethod || ''
    }));

    // Generate CSV with only the specified columns
    return this.asCsv(rows, definition, payload);
  }

  private formatImageForCsv(imageValue: string): string {
    if (!imageValue || typeof imageValue !== 'string') {
      return '';
    }

    // Check if it's a base64 data URL
    if (imageValue.startsWith('data:image/')) {
      // Extract image type and show a friendly message
      const match = imageValue.match(/data:image\/([^;]+);base64,/);
      const imageType = match ? match[1].toUpperCase() : 'IMAGE';
      return `[Image: ${imageType} - Base64 data]`;
    }

    // Check if it's a long base64 string (without data: prefix)
    // Base64 strings are typically long and contain only base64 characters
    if (imageValue.length > 100 && /^[A-Za-z0-9+/=]+$/.test(imageValue)) {
      return '[Image: Base64 data]';
    }

    // If it's a URL or file path, return as-is
    if (imageValue.startsWith('http://') || imageValue.startsWith('https://') || imageValue.startsWith('/') || imageValue.includes('.')) {
      return imageValue;
    }

    // Default: return as-is
    return imageValue;
  }

  private escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    let stringValue: string;
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      try {
        stringValue = JSON.stringify(value);
      } catch {
        stringValue = String(value);
      }
    } else {
      stringValue = String(value);
    }
    stringValue = stringValue.replace(/"/g, '""');
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue}"`;
    }
    return stringValue;
  }

  private resolveFileName(
    definition: ReportDefinition,
    payload: Record<string, any>,
    extension: 'json' | 'csv' | 'pdf'
  ): string {
    const base = definition.fileNameBuilder
      ? definition.fileNameBuilder(payload)
      : `${definition.id}_${formatDate(new Date(), 'yyyyMMdd_HHmm', 'en-US')}`;
    return base.endsWith(`.${extension}`) ? base : `${base}.${extension}`;
  }

  private buildAccountingSnapshotPdf(data: any, payload?: Record<string, any>): Blob {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 60;

    const addContinuationHeader = (): number => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor('#1a1a1a');
      doc.text('Accounting Dashboard Snapshot (continued)', margin, margin + 4);
      doc.setDrawColor(230, 233, 240);
      doc.line(margin, margin + 12, pageWidth - margin, margin + 12);
      return margin + 48;
    };

    const ensureSpace = (currentY: number, requiredHeight: number): number => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (currentY + requiredHeight > pageHeight - bottomMargin) {
        doc.addPage();
        return addContinuationHeader();
      }
      return currentY;
    };

    this.addHeader(doc, 'Accounting Dashboard Snapshot', margin);
    doc.setFontSize(10);
    doc.setTextColor('#555555');
    const generatedLine = `Generated: ${formatDate(new Date(), 'medium', 'en-US')}`;
    doc.text(generatedLine, margin, 82);
    const period = this.buildPeriodLine(payload);
    if (period) {
      doc.text(period, pageWidth - margin - doc.getTextWidth(period), 82);
    }

    const metrics = [
      { label: 'Total Revenue', value: this.formatCurrency(data?.totalRevenue) },
      { label: 'Total Expenses', value: this.formatCurrency(data?.totalExpenses) },
      { label: 'Net Income', value: this.formatCurrency(data?.netIncome) },
      { label: 'Inventory Value', value: this.formatCurrency(data?.inventoryValue) },
      { label: 'Unpaid Invoices', value: this.formatCurrency(data?.unpaidInvoicesAmount) }
    ];

    let cursorY = 110;
    cursorY = this.writeCompactMetricSection(doc, 'Financial Summary', metrics, margin, cursorY, ensureSpace, pageWidth);

    const operational = [
      { label: 'Total Entries', value: this.formatNumber(data?.totalEntries) },
      { label: 'Total Invoices', value: this.formatNumber(data?.totalInvoices) },
      { label: 'Pending Invoices', value: this.formatNumber(data?.pendingInvoices) },
      { label: 'Stock Alerts', value: this.formatNumber(data?.stockAlertsCount) },
      { label: 'Low Stock Items', value: this.formatNumber(data?.lowStockCount) },
      { label: 'Out of Stock', value: this.formatNumber(data?.outOfStockCount) }
    ];

    cursorY = this.writeCompactMetricSection(doc, 'Operational Snapshot', operational, margin, cursorY + 10, ensureSpace, pageWidth);
    cursorY = this.writeMonthlyPerformanceSection(doc, data?.monthlyData, margin, cursorY + 14, ensureSpace, pageWidth);

    cursorY = this.writeCondensedListSection(
      doc,
      'Recent Journal Entries',
      data?.recentEntries,
      margin,
      cursorY + 18,
      ensureSpace,
      (entry: any) => [
        `${entry?.entryNumber ?? 'Entry'} • ${this.safeFormatDate(entry?.date)}`,
        entry?.description ?? '—',
        `Debit: ${this.formatCurrency(entry?.totalDebit)} | Credit: ${this.formatCurrency(entry?.totalCredit)}`
      ]
    );

    cursorY = this.writeCondensedListSection(
      doc,
      'Recent Invoices',
      data?.recentInvoices,
      margin,
      cursorY + 16,
      ensureSpace,
      (inv: any) => [
        `${inv?.invoiceNumber ?? 'Invoice'} • ${inv?.status ?? 'N/A'}`,
        `Customer: ${inv?.customerName ?? 'N/A'} | Date: ${this.safeFormatDate(inv?.date)}`,
        `Total: ${this.formatCurrency(inv?.totalAmount)} | Remaining: ${this.formatCurrency(inv?.remainingAmount)}`
      ]
    );

    cursorY = this.writeCondensedListSection(
      doc,
      'Recent Expenses',
      data?.recentExpenses,
      margin,
      cursorY + 16,
      ensureSpace,
      (exp: any) => [
        `${exp?.expenseNumber ?? 'Expense'} • ${exp?.status ?? 'N/A'}`,
        exp?.description ?? '—',
        `Date: ${this.safeFormatDate(exp?.date)} | Amount: ${this.formatCurrency(exp?.totalAmount)}`
      ]
    );

    return doc.output('blob');
  }

  private addHeader(doc: jsPDF, title: string, margin: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(38, 70, 183);
    doc.rect(0, 0, pageWidth, 72, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor('#ffffff');
    doc.text(title, margin, 45);
    doc.setTextColor('#000000');
  }

  private writeCompactMetricSection(
    doc: jsPDF,
    title: string,
    metrics: Array<{ label: string; value: string }>,
    startX: number,
    startY: number,
    ensureSpace: (currentY: number, requiredHeight: number) => number,
    pageWidth: number
  ): number {
    let cursorY = ensureSpace(startY, 48);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, startX, cursorY);
    cursorY += 16;
    doc.setDrawColor(220);
    doc.line(startX, cursorY, pageWidth - startX, cursorY);
    cursorY += 12;

    const columns = 3;
    const gap = 12;
    const availableWidth = pageWidth - startX * 2;
    const columnWidth = (availableWidth - gap * (columns - 1)) / columns;
    const rowHeight = 40;

    for (let index = 0; index < metrics.length; index += columns) {
      cursorY = ensureSpace(cursorY, rowHeight + 12);
      for (let column = 0; column < columns; column++) {
        const metric = metrics[index + column];
        if (!metric) {
          continue;
        }
        const x = startX + column * (columnWidth + gap);
        doc.setFillColor(250, 251, 255);
        doc.roundedRect(x, cursorY - 12, columnWidth, rowHeight, 5, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor('#222222');
        doc.text(metric.value ?? '—', x + 10, cursorY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor('#666666');
        doc.text(metric.label, x + 10, cursorY + 20);
      }
      cursorY += rowHeight + 6;
    }

    return cursorY;
  }

  private writeCondensedListSection(
    doc: jsPDF,
    title: string,
    items: any[],
    startX: number,
    startY: number,
    ensureSpace: (currentY: number, requiredHeight: number) => number,
    formatter: (item: any) => string[]
  ): number {
    if (!Array.isArray(items) || items.length === 0) {
      return startY;
    }

    let cursorY = ensureSpace(startY, 56);
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - startX * 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#111111');
    doc.text(title, startX, cursorY);
    cursorY += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#333333');

    const subset = items.slice(0, 5);
    subset.forEach(item => {
      const segments = formatter(item);
      if (!segments || segments.length === 0) {
        return;
      }
      const innerWidth = maxWidth - 20;
      const lineHeight = 14;

      const headingLines = doc.splitTextToSize(segments[0], innerWidth);
      const detailLines = segments.slice(1).flatMap((detail, idx, arr) => {
        const chunk = doc.splitTextToSize(detail, innerWidth);
        return idx < arr.length - 1 ? [...chunk, ''] : chunk;
      });

      const headingHeight = headingLines.length * lineHeight;
      const detailHeight =
        detailLines.reduce((total, line) => total + (line === '' ? 6 : lineHeight), 0) || lineHeight;
      const blockHeight = headingHeight + detailHeight + 26;

      cursorY = ensureSpace(cursorY, blockHeight + 16);
      doc.setFillColor(251, 252, 255);
      doc.roundedRect(startX, cursorY - 14, maxWidth, blockHeight, 6, 6, 'F');

      let textY = cursorY + 2;
      textY += this.addTextBlock(doc, headingLines, startX + 12, textY, innerWidth, lineHeight, 10, 'bold');
      textY += 6;

      detailLines.forEach(line => {
        if (line === '') {
          textY += 6;
        } else {
          textY += this.addTextBlock(doc, line, startX + 10, textY, innerWidth, lineHeight, 9, 'normal');
        }
      });

      cursorY += blockHeight + 12;
    });

    return cursorY;
  }

  private writeMonthlyPerformanceSection(
    doc: jsPDF,
    monthlyData: any,
    startX: number,
    startY: number,
    ensureSpace: (currentY: number, requiredHeight: number) => number,
    pageWidth: number
  ): number {
    const months: string[] = monthlyData?.months ?? [];
    const revenue: any[] = monthlyData?.revenue ?? [];
    const expenses: any[] = monthlyData?.expenses ?? [];

    const rows = Math.min(months.length, 6);
    if (!rows) {
      return startY;
    }

    let cursorY = ensureSpace(startY, 64);
    const availableWidth = pageWidth - startX * 2;
    const rowHeight = 22;
    const headerHeight = 28;
    const tableHeight = headerHeight + rowHeight * rows + 16;

    cursorY = ensureSpace(cursorY, tableHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor('#111111');
    doc.text('Monthly Performance', startX, cursorY);
    cursorY += 18;

    const colWidths = [
      availableWidth * 0.34,
      availableWidth * 0.33,
      availableWidth * 0.33
    ];

    const headers = ['Month', 'Revenue', 'Expenses'];
    doc.setDrawColor(230, 233, 240);
    doc.setFillColor(244, 246, 252);
    doc.roundedRect(startX, cursorY, availableWidth, headerHeight, 6, 6, 'FD');

    let currentX = startX + 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      doc.text(header, currentX, cursorY + 18);
      currentX += colWidths[index];
    });

    cursorY += headerHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (let i = 0; i < rows; i++) {
      cursorY = ensureSpace(cursorY, rowHeight + 6);
      const isEven = i % 2 === 0;
      if (isEven) {
        doc.setFillColor(250, 251, 255);
        doc.rect(startX, cursorY, availableWidth, rowHeight, 'F');
      }

      const values = [
        months[i],
        this.formatCurrency(revenue[i]),
        this.formatCurrency(expenses[i])
      ];

      let colX = startX + 12;
      values.forEach((value, index) => {
        doc.text(value ?? '—', colX, cursorY + 15);
        colX += colWidths[index];
      });

      cursorY += rowHeight;
    }

    doc.setDrawColor(230, 233, 240);
    doc.line(startX, cursorY, startX + availableWidth, cursorY);
    cursorY += 12;

    return cursorY;
  }

  private addTextBlock(
    doc: jsPDF,
    text: string | string[],
    x: number,
    y: number,
    maxWidth: number,
    lineHeight = 14,
    fontSize = 10,
    fontStyle: 'normal' | 'bold' = 'normal'
  ): number {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    const lines = Array.isArray(text) ? text : doc.splitTextToSize(text, maxWidth);
    lines.forEach((line, index) => {
      doc.text(line, x, y + index * lineHeight);
    });
    return lines.length * lineHeight;
  }

  private checkPageBreak(doc: jsPDF, cursorY: number, requiredHeight: number, margin: number, startX: number): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (cursorY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      this.addHeader(doc, 'Accounting Dashboard Snapshot (continued)', startX);
      return startX + 30;
    }
    return cursorY;
  }

  private formatCurrency(value: any): string {
    const numberValue = Number(value ?? 0);
    if (Number.isNaN(numberValue)) {
      return '—';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numberValue);
  }

  private formatNumber(value: any): string {
    const numberValue = Number(value ?? 0);
    if (Number.isNaN(numberValue)) {
      return '0';
    }
    return new Intl.NumberFormat('en-US').format(numberValue);
  }

  private safeFormatDate(value: any, formatStr: string = 'mediumDate'): string {
    if (!value) {
      return 'N/A';
    }
    try {
      return formatDate(value, formatStr, 'en-US');
    } catch {
      return String(value);
    }
  }

  private buildPeriodLine(payload?: Record<string, any>): string | null {
    if (!payload) {
      return null;
    }
    const start = payload.startDate;
    const end = payload.endDate;
    if (!start && !end) {
      return null;
    }
    const startText = start ? this.safeFormatDate(start) : 'Any';
    const endText = end ? this.safeFormatDate(end) : 'Any';
    return `Period: ${startText} → ${endText}`;
  }
}

