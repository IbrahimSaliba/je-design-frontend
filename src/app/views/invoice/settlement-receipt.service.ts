import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

export interface ReceiptData {
  settlement: any;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  logoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettlementReceiptService {
  
  constructor() {}

  /**
   * Generate PDF receipt for settlement
   */
  async generateReceipt(data: ReceiptData): Promise<Blob> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Company Info
    const companyName = data.companyName || 'Your Company Name';
    const companyAddress = data.companyAddress || '123 Business Street, City, Country';
    const companyPhone = data.companyPhone || '+1 (555) 123-4567';
    const companyEmail = data.companyEmail || 'info@company.com';
    
    const settlement = data.settlement;
    let yPosition = 20;
    
    // Header - Company Name
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.text(companyName, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    
    // Company Details
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text(companyAddress, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    pdf.text(`Phone: ${companyPhone} | Email: ${companyEmail}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246); // Blue-500
    pdf.text('PAYMENT RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    // Receipt Info Box
    pdf.setDrawColor(229, 231, 235); // Gray-200
    pdf.setFillColor(249, 250, 251); // Gray-50
    pdf.roundedRect(15, yPosition, pageWidth - 30, 35, 3, 3, 'FD');
    
    yPosition += 8;
    
    // Receipt Details (Left Column)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(75, 85, 99); // Gray-600
    pdf.text('Receipt ID:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(settlement.id?.substring(0, 13) || 'N/A', 55, yPosition);
    
    // Date (Right Column)
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date:', pageWidth - 80, yPosition);
    pdf.setFont('helvetica', 'normal');
    const settlementDate = new Date(settlement.settlementDate);
    pdf.text(settlementDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), pageWidth - 55, yPosition);
    
    yPosition += 7;
    
    // Invoice Number
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(59, 130, 246);
    pdf.text(settlement.invoiceNumber || 'N/A', 55, yPosition);
    pdf.setTextColor(75, 85, 99);
    
    // Payment Method (Right Column)
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Method:', pageWidth - 80, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(this.capitalizeFirst(settlement.paymentMethod || 'N/A'), pageWidth - 35, yPosition);
    
    yPosition += 7;
    
    // Client Name
    pdf.setFont('helvetica', 'bold');
    pdf.text('Client:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(settlement.clientName || 'N/A', 55, yPosition);
    
    // Reference Number (Right Column)
    if (settlement.referenceNumber) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reference:', pageWidth - 80, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(settlement.referenceNumber, pageWidth - 35, yPosition);
    }
    
    yPosition += 7;
    
    // Recorded By
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recorded By:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(settlement.recordedByName || 'N/A', 55, yPosition);
    
    yPosition += 20;
    
    // Payment Details Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Payment Details', 15, yPosition);
    yPosition += 8;
    
    // Payment Table
    const tableStartY = yPosition;
    const colWidths = [100, 60];
    const rowHeight = 10;
    
    // Table Header
    pdf.setFillColor(59, 130, 246); // Blue-500
    pdf.rect(15, yPosition, colWidths[0] + colWidths[1], rowHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', 20, yPosition + 7);
    pdf.text('Amount', 15 + colWidths[0] + 5, yPosition + 7);
    yPosition += rowHeight;
    
    // Table Rows
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'normal');
    
    // Invoice Total
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(15, yPosition, colWidths[0] + colWidths[1], rowHeight);
    pdf.text('Invoice Total Amount', 20, yPosition + 7);
    pdf.text(`$${settlement.invoiceTotalAmount?.toFixed(2) || '0.00'}`, 15 + colWidths[0] + 5, yPosition + 7);
    yPosition += rowHeight;
    
    // Previously Settled
    pdf.rect(15, yPosition, colWidths[0] + colWidths[1], rowHeight);
    pdf.text('Previously Settled', 20, yPosition + 7);
    const previouslySettled = (settlement.invoiceAmountSettled || 0) - (settlement.settlementAmount || 0);
    pdf.text(`$${previouslySettled.toFixed(2)}`, 15 + colWidths[0] + 5, yPosition + 7);
    yPosition += rowHeight;
    
    // This Payment
    pdf.setFillColor(240, 253, 244); // Green-50
    pdf.rect(15, yPosition, colWidths[0] + colWidths[1], rowHeight, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(22, 163, 74); // Green-600
    pdf.text('This Payment', 20, yPosition + 7);
    pdf.setFontSize(12);
    pdf.text(`$${settlement.settlementAmount?.toFixed(2) || '0.00'}`, 15 + colWidths[0] + 5, yPosition + 7);
    yPosition += rowHeight;
    
    // Remaining Balance
    pdf.setFillColor(255, 243, 224); // Orange-50
    pdf.rect(15, yPosition, colWidths[0] + colWidths[1], rowHeight, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(234, 88, 12); // Orange-600
    pdf.setFontSize(11);
    pdf.text('Remaining Balance', 20, yPosition + 7);
    pdf.setFontSize(12);
    pdf.text(`$${settlement.invoiceRemainingAmount?.toFixed(2) || '0.00'}`, 15 + colWidths[0] + 5, yPosition + 7);
    yPosition += rowHeight + 15;
    
    // Notes Section
    if (settlement.notes && settlement.notes.trim()) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      pdf.text('Notes:', 15, yPosition);
      yPosition += 7;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      const notesLines = pdf.splitTextToSize(settlement.notes, pageWidth - 30);
      pdf.text(notesLines, 15, yPosition);
      yPosition += (notesLines.length * 5) + 10;
    }
    
    // Status Badge
    yPosition += 10;
    const status = settlement.invoiceStatus?.toUpperCase() || 'UNKNOWN';
    let statusColor = [107, 114, 128]; // Gray
    if (status === 'PAID') statusColor = [22, 163, 74]; // Green
    else if (status === 'DEPT') statusColor = [234, 88, 12]; // Orange
    
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(15, yPosition, 40, 8, 2, 2, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(status, 17, yPosition + 5.5);
    
    // Footer
    const footerY = pageHeight - 25;
    pdf.setDrawColor(229, 231, 235);
    pdf.line(15, footerY, pageWidth - 15, footerY);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(107, 114, 128);
    pdf.text('Thank you for your payment!', pageWidth / 2, footerY + 5, { align: 'center' });
    pdf.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 10, { align: 'center' });
    pdf.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, footerY + 15, { align: 'center' });
    
    return pdf.output('blob');
  }

  /**
   * Download receipt as PDF
   */
  async downloadReceipt(data: ReceiptData, filename?: string): Promise<void> {
    const blob = await this.generateReceipt(data);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `Receipt_${data.settlement.invoiceNumber}_${Date.now()}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Print receipt
   */
  async printReceipt(data: ReceiptData): Promise<void> {
    const blob = await this.generateReceipt(data);
    const url = window.URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(url);
        }, 100);
      }, 100);
    };
  }

  /**
   * Open receipt in new window
   */
  async viewReceipt(data: ReceiptData): Promise<void> {
    const blob = await this.generateReceipt(data);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}

