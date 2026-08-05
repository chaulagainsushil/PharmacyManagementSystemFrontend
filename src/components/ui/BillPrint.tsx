'use client';

import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import type { SaleResponse } from '@/types';

const COMPANY_NAME    = 'SiddhaSoft Pharmavy Pvt. Ltd.';
const COMPANY_ADDRESS = 'Satdobato, Lalitpur, Nepal';
const COMPANY_PAN     = '609847231';
const COMPANY_PHONE   = '+977-01-5551234';

interface Props {
  invoice: SaleResponse;
  cashDiscount: number;
}

export function BillPrint({ invoice, cashDiscount }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
            .bill-header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 12px; }
            .bill-header h1 { font-size: 18px; font-weight: 800; color: #1e3a5f; }
            .bill-header p { font-size: 11px; color: #555; margin-top: 2px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px; font-size: 11px; }
            .meta-grid span { color: #666; }
            .meta-grid strong { color: #111; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
            td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
            tr:last-child td { border-bottom: none; }
            .totals { margin-left: auto; width: 220px; font-size: 11px; }
            .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
            .totals .grand { font-weight: 800; font-size: 13px; border-top: 1.5px solid #1e3a5f; padding-top: 5px; margin-top: 3px; color: #1e3a5f; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; border-top: 1px dashed #bbb; padding-top: 12px; }
            .sig-label { font-size: 10px; color: #888; margin-top: 4px; text-align: center; }
            .thank-you { font-size: 11px; color: #555; text-align: center; margin-top: 16px; }
            .uom-badge { background: #e0f2fe; color: #0369a1; border-radius: 3px; padding: 1px 4px; font-size: 10px; font-weight: 600; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const grandTotal = Number(invoice.totalAmount) - cashDiscount;

  return (
    <div>
      {/* Hidden printable area */}
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="bill-header">
          <h1>{COMPANY_NAME}</h1>
          <p>{COMPANY_ADDRESS} | Tel: {COMPANY_PHONE}</p>
          <p>PAN: {COMPANY_PAN}</p>
        </div>

        <div className="meta-grid">
          <div><span>Invoice #: </span><strong>{invoice.invoiceNumber}</strong></div>
          <div><span>Date: </span><strong>{format(new Date(invoice.saleDate), 'dd MMM yyyy, hh:mm a')}</strong></div>
          <div><span>Customer: </span><strong>{invoice.customerName}</strong></div>
          <div><span>Pharmacist: </span><strong>{invoice.pharmacistName}</strong></div>
          <div><span>Payment: </span><strong>{invoice.paymentMode}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Batch</th>
              <th>Unit</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Disc%</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.saleItemId}>
                <td>{i + 1}</td>
                <td>{item.medicineName}</td>
                <td>{item.batchNumber}</td>
                <td>
                  <span className="uom-badge">{item.uomName || '—'}</span>
                </td>
                <td>
                  {item.quantity}
                  {item.baseQuantityDeducted !== item.quantity && (
                    <span style={{ color: '#888', fontSize: 10 }}> ({item.baseQuantityDeducted} base)</span>
                  )}
                </td>
                <td>Rs {Number(item.unitPrice).toFixed(2)}</td>
                <td>{Number(item.discountPercent).toFixed(0)}%</td>
                <td style={{ textAlign: 'right' }}>Rs {Number(item.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div><span>Subtotal</span><span>Rs {Number(invoice.subtotal).toFixed(2)}</span></div>
          {Number(invoice.discountPercent) > 0 && (
            <div>
              <span>Invoice Disc ({Number(invoice.discountPercent)}%)</span>
              <span>-Rs {Number(invoice.discountAmount).toFixed(2)}</span>
            </div>
          )}
          {cashDiscount > 0 && (
            <div><span>Cash Discount</span><span>-Rs {cashDiscount.toFixed(2)}</span></div>
          )}
          <div className="grand"><span>Grand Total</span><span>Rs {grandTotal.toFixed(2)}</span></div>
        </div>

        <div className="footer">
          <div>
            <p style={{ fontSize: 10, color: '#888' }}>Received By</p>
            <svg width="140" height="48" viewBox="0 0 140 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 36 C20 10, 35 8, 45 22 C55 36, 60 14, 75 18 C90 22, 95 34, 110 28 C120 24, 128 30, 132 36"
                fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 40 C30 38, 50 42, 70 40 C90 38, 110 42, 130 40"
                fill="none" stroke="#1e3a5f" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
            </svg>
            <p className="sig-label">Authorised Signature</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, color: '#888' }}>
            <p>Thank you for your purchase!</p>
            <p style={{ marginTop: 4 }}>{COMPANY_NAME}</p>
          </div>
        </div>

        <p className="thank-you">*** This is a computer generated bill ***</p>
      </div>

      {/* Print button */}
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <Printer className="h-4 w-4" />
        Print Bill
      </button>
    </div>
  );
}
