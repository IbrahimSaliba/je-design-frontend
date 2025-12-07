export interface Invoice {
  id?: string;
  orderNo?: string;
  invoiceNumber?: string;  // Backend field name
  status?: string;
  date?: string | Date;
  invoiceDate?: string | Date;  // Backend field name
  currency?: string;
  vat?: number;
  discounts?: number;  // Frontend/legacy field name
  discountAmount?: number;  // Backend field name (same as discounts)
  deductFromStock?: string;
  clientId?: string;  // Client UUID
  clientName?: string;  // Client name from backend
  initialPayment?: number;  // Initial payment amount
  totalAmount?: number;  // Backend calculated total
  totalAmountBeforeDiscount?: number;  // Backend calculated
  amountSettled?: number;  // Backend calculated
  remainingAmount?: number;  // Backend calculated
  paymentMethod?: string;  // Payment method: money, card, cash
  buyer?: {
    name: string;
    address: string;
  };
  seller?: {
    name: string;
    address: string;
  };
  item?: InvoiceItem[];
  items?: InvoiceItem[];  // Backend field name
}

export interface InvoiceItem {
  name: string;
  unit: number;
  price: number;
  code: string;
  discounts?: number;
  isFree?: boolean;
  id?: string;
  itemId?: string;  // Item UUID for backend
}
