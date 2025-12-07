import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, catchError, tap } from 'rxjs/operators';
import { JwtAuthService } from '../../shared/services/auth/jwt-auth.service';

// Chart of Accounts
export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  category: string;
  parentId?: string;
  isActive: boolean;
  description: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

// Accounting Entries
export interface AccountingEntry {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  reference: string;
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  status: string; // PENDING, SETTLED
  postedBy?: string;
  postedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  entries: JournalEntry[];
}

export interface JournalEntry {
  id: string;
  accountId: string;
  account: Account;
  debit: number;
  credit: number;
  description: string;
  reference: string;
}

// Inventory Movements
export interface InventoryMovement {
  id: string;
  movementNumber: string;
  date: Date;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  itemId: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  location: string;
  reference: string;
  description: string;
  createdBy: string;
  createdAt: Date;
}

// Financial Reports
export interface FinancialReport {
  id: string;
  name: string;
  type: 'PROFIT_LOSS' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TRIAL_BALANCE';
  period: {
    start: Date;
    end: Date;
  };
  data: any;
  generatedAt: Date;
  generatedBy: string;
}

// Invoices
export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentTerms: string;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
}

// Expenses
export interface Expense {
  id: string;
  expenseNumber: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  vendor: string;
  accountId: string;
  account: Account;
  status: 'PENDING' | 'SETTLED' | 'DELETED' | 'APPROVED' | 'REJECTED' | 'PAID';
  approvedBy?: string;
  approvedAt?: Date;
  receiptUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bank Transactions
export interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  balance: number;
  reference: string;
  accountId: string;
  account: Account;
  isReconciled: boolean;
  reconciledAt?: Date;
  reconciledBy?: string;
  createdAt: Date;
}

// Tax Management
export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'SALES' | 'PURCHASE' | 'VAT' | 'GST';
  isActive: boolean;
  description: string;
  createdAt: Date;
}

// Budget
export interface Budget {
  id: string;
  name: string;
  year: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  accounts: BudgetAccount[];
  totalBudget: number;
  totalActual: number;
  variance: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAccount {
  accountId: string;
  account: Account;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private entriesSubject = new BehaviorSubject<AccountingEntry[]>([]);
  private inventoryMovementsSubject = new BehaviorSubject<InventoryMovement[]>([]);
  private invoicesSubject = new BehaviorSubject<Invoice[]>([]);
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  private bankTransactionsSubject = new BehaviorSubject<BankTransaction[]>([]);
  private taxRatesSubject = new BehaviorSubject<TaxRate[]>([]);
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);

  public accounts$ = this.accountsSubject.asObservable();
  public entries$ = this.entriesSubject.asObservable();
  public inventoryMovements$ = this.inventoryMovementsSubject.asObservable();
  public invoices$ = this.invoicesSubject.asObservable();
  public expenses$ = this.expensesSubject.asObservable();
  public bankTransactions$ = this.bankTransactionsSubject.asObservable();
  public taxRates$ = this.taxRatesSubject.asObservable();
  public budgets$ = this.budgetsSubject.asObservable();
  
  private baseUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private jwtAuth: JwtAuthService
  ) {
    // Data is loaded on demand from backend
  }
  
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

  // Chart of Accounts
  getAccounts(): Observable<Account[]> {
    return this.accounts$;
  }

  getAccountById(id: string): Observable<Account | undefined> {
    return this.accounts$.pipe(
      map(accounts => accounts.find(account => account.id === id))
    );
  }

  addAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Observable<Account> {
    const newAccount: Account = {
      ...account,
      id: `acc-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const currentAccounts = this.accountsSubject.value;
    this.accountsSubject.next([...currentAccounts, newAccount]);
    
    return of(newAccount).pipe(delay(500));
  }

  updateAccount(id: string, updates: Partial<Account>): Observable<Account> {
    const currentAccounts = this.accountsSubject.value;
    const accountIndex = currentAccounts.findIndex(account => account.id === id);
    
    if (accountIndex !== -1) {
      const updatedAccount = {
        ...currentAccounts[accountIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      currentAccounts[accountIndex] = updatedAccount;
      this.accountsSubject.next([...currentAccounts]);
      
      return of(updatedAccount).pipe(delay(500));
    }
    
    throw new Error(`Account with id ${id} not found`);
  }

  // Accounting Entries
  getEntries(): Observable<AccountingEntry[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any[]>(`${this.baseUrl}/accounting/entries`, { headers })
      .pipe(
        map(response => {
          console.log('Accounting entries response:', response);
          
          // Map backend AccountingEntryResponseDTO to frontend AccountingEntry
          const mappedEntries = response.map(entry => {
            // Convert ID to string if it's not already
            const entryIdStr = String(entry.id);
            const invoiceIdStr = entry.relatedInvoiceId ? String(entry.relatedInvoiceId) : null;
            
            const amount = parseFloat(entry.amount);
            let totalDebit = 0;
            let totalCredit = 0;
            
            // Proper accounting mapping
            if (entry.type === 'INCOME') {
              // Income = Credit (money coming in)
              totalDebit = 0;
              totalCredit = amount; // Positive amount
            } else if (entry.type === 'EXPENSE') {
              // Expense = Debit (money going out)
              totalDebit = amount; // Positive amount
              totalCredit = 0;
            } else if (entry.type === 'REVERSAL') {
              // Reversal = Opposite of original
              // If amount is negative (reversing an expense debit), show as credit
              if (amount < 0) {
                totalDebit = 0;
                totalCredit = Math.abs(amount); // Show positive credit to reverse debit
              } else {
                totalDebit = amount;
                totalCredit = 0;
              }
            }
            
            return {
              id: entryIdStr,
              entryNumber: `AE-${entryIdStr.substring(0, 8)}`, // Generate entry number from ID
              date: new Date(entry.entryDate),
              description: entry.description,
              reference: invoiceIdStr ? `Invoice-${invoiceIdStr.substring(0, 8)}` : (entry.type === 'REVERSAL' ? 'REVERSAL' : '-'),
              totalDebit: totalDebit,
              totalCredit: totalCredit,
              isPosted: true, // Assume all backend entries are posted
              status: 'SETTLED',
              createdBy: entry.createdByName || 'Unknown',
              createdAt: new Date(entry.entryDate),
              updatedAt: new Date(entry.entryDate),
              entries: [] // Simple entries don't have sub-entries in current backend model
            };
          });
          
          // Update the subject with fetched data
          this.entriesSubject.next(mappedEntries);
          
          return mappedEntries;
        }),
        catchError(error => {
          console.error('Error fetching accounting entries:', error);
          return of([]);
        })
      );
  }

  addEntry(entry: Omit<AccountingEntry, 'id' | 'entryNumber' | 'createdAt' | 'updatedAt'>): Observable<AccountingEntry> {
    const newEntry: AccountingEntry = {
      ...entry,
      id: `entry-${Date.now()}`,
      entryNumber: `JE-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const currentEntries = this.entriesSubject.value;
    this.entriesSubject.next([...currentEntries, newEntry]);
    
    return of(newEntry).pipe(delay(500));
  }

  postEntry(id: string, postedBy: string): Observable<AccountingEntry> {
    return this.updateEntry(id, {
      isPosted: true,
      status: 'SETTLED',
      postedBy,
      postedAt: new Date()
    });
  }

  updateEntry(id: string, updates: Partial<AccountingEntry>): Observable<AccountingEntry> {
    const currentEntries = this.entriesSubject.value;
    const entryIndex = currentEntries.findIndex(entry => entry.id === id);
    
    if (entryIndex !== -1) {
      const updatedEntry = {
        ...currentEntries[entryIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      currentEntries[entryIndex] = updatedEntry;
      this.entriesSubject.next([...currentEntries]);
      
      return of(updatedEntry).pipe(delay(500));
    }
    
    throw new Error(`Entry with id ${id} not found`);
  }

  // Inventory Movements
  getInventoryMovements(): Observable<InventoryMovement[]> {
    return this.inventoryMovements$;
  }

  addInventoryMovement(movement: Omit<InventoryMovement, 'id' | 'movementNumber' | 'createdAt'>): Observable<InventoryMovement> {
    const newMovement: InventoryMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
      movementNumber: `IM-${Date.now()}`,
      createdAt: new Date()
    };
    
    const currentMovements = this.inventoryMovementsSubject.value;
    this.inventoryMovementsSubject.next([...currentMovements, newMovement]);
    
    return of(newMovement).pipe(delay(500));
  }

  // Invoices
  getInvoices(): Observable<Invoice[]> {
    return this.invoices$;
  }

  addInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Observable<Invoice> {
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const currentInvoices = this.invoicesSubject.value;
    this.invoicesSubject.next([...currentInvoices, newInvoice]);
    
    return of(newInvoice).pipe(delay(500));
  }

  // Expenses - Connected to backend
  getExpenses(): Observable<Expense[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any[]>(`${this.baseUrl}/expenses`, { headers })
      .pipe(
        map(response => {
          console.log('Expenses response:', response);
          
          // Map backend ExpenseResponseDTO to frontend Expense
          const mappedExpenses = response.map(expense => ({
            id: String(expense.id),
            expenseNumber: `EXP-${String(expense.id).substring(0, 8)}`,
            date: new Date(expense.settlementDate),
            category: 'General', // Backend doesn't have category
            description: expense.reason,
            amount: parseFloat(expense.amount),
            taxAmount: 0,
            totalAmount: parseFloat(expense.amount),
            vendor: '',
            accountId: '',
            account: {} as Account,
            status: expense.status,
            receiptUrl: undefined,
            createdBy: expense.createdByName || 'Unknown',
            createdAt: new Date(expense.createdDate),
            updatedAt: new Date(expense.createdDate),
            approvedBy: undefined,
            approvedAt: undefined
          }));
          
          this.expensesSubject.next(mappedExpenses);
          return mappedExpenses;
        }),
        catchError(error => {
          console.error('Error fetching expenses:', error);
          return of([]);
        })
      );
  }

  createExpense(expenseData: { amount: number; reason: string; settlementDate: Date; status: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    
    const expenseDTO = {
      amount: expenseData.amount,
      reason: expenseData.reason,
      settlementDate: new Date(expenseData.settlementDate).toISOString(),
      status: expenseData.status || 'PENDING' // Include user-selected status
    };

    console.log('Creating expense:', expenseDTO);
    
    return this.http.post<any>(`${this.baseUrl}/expenses`, expenseDTO, { headers })
      .pipe(
        tap(response => {
          console.log('Expense created:', response);
        }),
        catchError(error => {
          console.error('Error creating expense:', error);
          throw error;
        })
      );
  }

  updateExpense(expenseId: string, expenseData: { amount: number; reason: string; settlementDate: Date; status?: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    
    const expenseDTO = {
      amount: expenseData.amount,
      reason: expenseData.reason,
      settlementDate: new Date(expenseData.settlementDate).toISOString(),
      status: expenseData.status // Include status if provided
    };

    console.log('Updating expense:', expenseId, expenseDTO);
    
    return this.http.put<any>(`${this.baseUrl}/expenses/${expenseId}`, expenseDTO, { headers })
      .pipe(
        tap(response => {
          console.log('Expense updated:', response);
        }),
        catchError(error => {
          console.error('Error updating expense:', error);
          throw error;
        })
      );
  }

  settleExpense(expenseId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    
    console.log('Settling expense:', expenseId);
    
    return this.http.post<any>(`${this.baseUrl}/expenses/settle/${expenseId}`, {}, { headers })
      .pipe(
        tap(response => {
          console.log('Expense settled:', response);
        }),
        catchError(error => {
          console.error('Error settling expense:', error);
          throw error;
        })
      );
  }

  getOverdueExpenses(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any[]>(`${this.baseUrl}/expenses/overdue`, { headers })
      .pipe(
        tap(response => {
          console.log('Overdue expenses:', response);
        }),
        catchError(error => {
          console.error('Error fetching overdue expenses:', error);
          return of([]);
        })
      );
  }

  deleteExpense(expenseId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    
    console.log('Deleting expense:', expenseId);
    
    return this.http.delete<any>(`${this.baseUrl}/expenses/${expenseId}`, { headers })
      .pipe(
        tap(response => {
          console.log('Expense deleted:', response);
        }),
        catchError(error => {
          console.error('Error deleting expense:', error);
          throw error;
        })
      );
  }

  addExpense(expense: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt' | 'updatedAt'>): Observable<Expense> {
    // Legacy method - redirect to createExpense
    return this.createExpense({
      amount: expense.totalAmount,
      reason: expense.description,
      settlementDate: expense.date,
      status: expense.status || 'PENDING' // Use expense status or default to PENDING
    }).pipe(
      map(() => ({
        ...expense,
        id: `exp-${Date.now()}`,
        expenseNumber: `EXP-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
  }

  // Tax Rates
  getTaxRates(): Observable<TaxRate[]> {
    return this.taxRates$;
  }

  // Financial Reports
  generateProfitLossReport(startDate: Date, endDate: Date): Observable<FinancialReport> {
    // TODO: Implement real API call to backend
    // This should calculate from actual accounting entries
    throw new Error('Not implemented - connect to backend API');
  }

  generateBalanceSheetReport(date: Date): Observable<FinancialReport> {
    // TODO: Implement real API call to backend
    // This should calculate from actual accounts
    throw new Error('Not implemented - connect to backend API');
  }

  // Budget Management
  getBudgets(): Observable<Budget[]> {
    return this.budgets$;
  }

  addBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Observable<Budget> {
    const newBudget: Budget = {
      ...budget,
      id: `budget-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const currentBudgets = this.budgetsSubject.value;
    this.budgetsSubject.next([...currentBudgets, newBudget]);
    
    return of(newBudget).pipe(delay(500));
  }
  
  // Get Accounting Dashboard Data
  getAccountingDashboard(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    console.log('📊 ACCOUNTING SERVICE: Fetching dashboard data from backend...');
    
    return this.http.get<any>(`${this.baseUrl}/accounting/dashboard`, { headers })
      .pipe(
        tap(response => {
          console.log('✅ ACCOUNTING SERVICE: Dashboard data received:', response);
        }),
        catchError(error => {
          console.error('❌ ACCOUNTING SERVICE: Error fetching dashboard:', error);
          return throwError(() => error);
        })
      );
  }
}

