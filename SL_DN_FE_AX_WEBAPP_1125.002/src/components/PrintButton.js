"use client";

import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";

// Global flag to prevent multiple print operations
let isGlobalPrinting = false;

const PrintButton = ({
    type, // 'advance-voucher' or 'pending-payments'
    data, // Data object containing customer info, amounts, etc.
    onError, // Callback for error handling
    tooltip = "Print",
    size = "medium",
    color = "primary",
    ...props
}) => {
    const [isPrinting, setIsPrinting] = React.useState(false);

    const handlePrint = React.useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();

        if (isPrinting || isGlobalPrinting) return; // Prevent multiple clicks

        isGlobalPrinting = true;
        setIsPrinting(true);

        try {
            let printHtml = "";
            let title = "";

            if (type === "advance-voucher") {
                printHtml = generateAdvanceVoucherHtml(data);
                title = "Advance Voucher";
            } else if (type === "pending-payments") {
                printHtml = generatePendingPaymentsHtml(data);
                title = "Pending Payments Summary";
            } else {
                throw new Error("Invalid print type specified");
            }

            const printWindow = window.open("", `print-${type}-${Date.now()}`, "width=900,height=700");
            if (!printWindow) {
                if (onError) {
                    onError("Unable to open print window. Please check your popup settings.");
                }
                isGlobalPrinting = false;
                setIsPrinting(false);
                return;
            }

            printWindow.document.write(printHtml);
            printWindow.document.close();
            printWindow.document.title = title;

            // Add print button to the opened window
            const printButton = printWindow.document.createElement('button');
            printButton.innerHTML = 'Click here to Print';
            printButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 20px;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        z-index: 1000;
      `;
            printButton.onclick = () => {
                printWindow.print();
            };
            printWindow.document.body.appendChild(printButton);

            // Reset after window closes
            const resetPrinting = () => {
                isGlobalPrinting = false;
                setIsPrinting(false);
            };

            printWindow.onbeforeunload = resetPrinting;
            setTimeout(resetPrinting, 10000); // Fallback

        } catch (error) {
            if (onError) {
                onError(error.message || "An error occurred while generating the print document.");
            }
            isGlobalPrinting = false;
            setIsPrinting(false);
        }
    }, [type, data, onError, isPrinting]);

    const generateAdvanceVoucherHtml = (data) => {
        const { customer, amount } = data;
        if (!customer || !amount) {
            throw new Error("Customer and amount are required for advance voucher");
        }

        const voucherNo = `ADV-${Math.floor(100000 + Math.random() * 900000)}`;
        const printDate = new Date().toLocaleDateString();
        
        // Extract phone number with multiple fallback options
        const customerPhone = 
            customer?.contact?.phone || 
            customer?.phone || 
            customer?.phone_number || 
            customer?.contactPhone || 
            "N/A";
        
        // Extract customer name with multiple fallback options
        const getFullName = () => {
            if (customer?.customer_name) return customer.customer_name;
            if (customer?.name) return customer.name;
            if (customer?.full_name) return customer.full_name;
            if (customer?.firstName && customer?.lastName) return `${customer.firstName} ${customer.lastName}`;
            if (customer?.first_name && customer?.last_name) return `${customer.first_name} ${customer.last_name}`;
            return "N/A";
        };
        const customerName = getFullName();

        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Advance Voucher</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #fff; color: #3f3120; }
  .page { width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
  
  .half-page { 
    width: 100%; 
    height: 50vh; 
    padding: 40px; 
    display: flex; 
    flex-direction: column; 
    justify-content: center;
    background: #f7f0c8;
    border: 1px solid #d2b953;
  }
  
  .divider { 
    width: 100%; 
    height: 20px; 
    border-top: 2px dotted #d2b953;
    border-bottom: 2px dotted #d2b953;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #d2b953;
  }
  
  .voucher-header { text-align: center; margin-bottom: 12px; }
  .voucher-title { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; }
  .voucher-subtitle { font-size: 12px; margin-top: 6px; letter-spacing: 0.4px; }
  
  .voucher-meta { display: flex; justify-content: space-between; gap: 12px; margin: 12px 0; }
  .voucher-meta div { background: rgba(255,255,255,0.9); padding: 8px; border-radius: 4px; flex: 1; font-size: 11px; }
  .voucher-meta div strong { display: block; margin-bottom: 3px; color: #4a2d0b; font-weight: bold; }
  
  .voucher-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
  .voucher-table th, .voucher-table td { border: 1px solid #d2b953; padding: 6px; text-align: left; }
  .voucher-table th { background: #d2b953; color: #3f3120; }
  .voucher-table td { background: rgba(255,255,255,0.85); }
  
  .voucher-footer { display: flex; justify-content: space-between; margin-top: 12px; gap: 10px; }
  .voucher-footer div { width: 30%; text-align: center; font-size: 10px; }
  
  .signature-line { border-top: 1px solid #3f3120; margin-top: 20px; padding-top: 4px; }
  
  .footer-note { margin-top: 8px; font-size: 10px; color: #5f4730; text-align: center; }
  
  .copy-label { text-align: center; margin-bottom: 8px; font-size: 11px; color: #d2b953; font-weight: bold; }
  
  @media print {
    body { margin: 0; padding: 0; }
    .page { min-height: auto; }
    .half-page { height: 50%; page-break-after: avoid; }
  }
</style>
</head>
<body>
  <div class="page">
    <!-- CUSTOMER COPY (TOP HALF) -->
    <div class="half-page">
      <div class="copy-label">CUSTOMER COPY</div>
      <div class="voucher-header">
        <h1 class="voucher-title">Advance Payment Vouche123r</h1>
      </div>
      <div class="voucher-meta">
        <div><strong>Paid By</strong>${customerName}</div>
        <div><strong>Date</strong>${printDate}</div>
        <div><strong>Voucher No.</strong>${voucherNo}</div>
      </div>
      <table class="voucher-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${printDate}</td>
            <td>Customer Advance Payment</td>
            <td>Advance</td>
            <td>₹ ${parseFloat(amount).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div class="voucher-meta" style="margin-top: 8px;">
        <div><strong>Paid To</strong>Company</div>
        <div><strong>Contact</strong>${customerPhone}</div>
      </div>
    </div>
    
    <!-- DIVIDER LINE -->
    <div class="divider">✂️ TEAR HERE ✂️</div>
    
    <!-- COMPANY COPY (BOTTOM HALF) -->
    <div class="half-page">
      <div class="copy-label">COMPANY COPY</div>
      <div class="voucher-header">
        <h1 class="voucher-title">Advance Payment Voucher1234</h1>
      </div>
      <div class="voucher-meta">
        <div><strong>Paid By</strong>${customerName}</div>
        <div><strong>Date</strong>${printDate}</div>
        <div><strong>Voucher No.</strong>${voucherNo}</div>
      </div>
      <table class="voucher-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${printDate}</td>
            <td>Customer Advance Payment</td>
            <td>Advance</td>
            <td>₹ ${parseFloat(amount).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div class="voucher-meta" style="margin-top: 8px;">
        <div><strong>Paid To</strong>Company</div>
        <div><strong>Contact</strong>${customerPhone}</div>
      </div>
      <div class="voucher-footer">
        <div><span class="signature-line">Prepared By</span></div>
        <div><span class="signature-line">Payment By</span></div>
        <div><span class="signature-line">Approved By</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;
    };

    const generatePendingPaymentsHtml = (data) => {
        const { vehiclePayments, calculateTotals, inputAdvanceAmount, selectedCustomerDetails } = data;
        if (!vehiclePayments || !vehiclePayments.length) {
            throw new Error("No payment data available to print");
        }

        // Use selectedCustomerDetails if available, otherwise fall back to first payment record
        const customer = selectedCustomerDetails || vehiclePayments[0];
        const totals = calculateTotals(vehiclePayments);
        const printDate = new Date().toLocaleDateString();
        
        // Extract phone number with multiple fallback options
        const customerPhone = 
            customer?.contact?.phone || 
            customer?.phone || 
            customer?.phone_number || 
            customer?.contactPhone || 
            "N/A";
        
        // Extract customer name with multiple fallback options
        const getFullName = () => {
            if (customer?.customer_name) return customer.customer_name;
            if (customer?.name) return customer.name;
            if (customer?.full_name) return customer.full_name;
            if (customer?.firstName && customer?.lastName) return `${customer.firstName} ${customer.lastName}`;
            if (customer?.first_name && customer?.last_name) return `${customer.first_name} ${customer.last_name}`;
            return "N/A";
        };
        const customerName = getFullName();

        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Pending Payments Summary</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #fff; color: #3f3120; }
  .page { width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
  
  .half-page { 
    width: 100%; 
    height: 50vh; 
    padding: 40px; 
    display: flex; 
    flex-direction: column; 
    justify-content: center;
    background: #f7f0c8;
    border: 1px solid #d2b953;
  }
  
  .divider { 
    width: 100%; 
    height: 20px; 
    border-top: 2px dotted #d2b953;
    border-bottom: 2px dotted #d2b953;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #d2b953;
  }
  
  .header { text-align: center; margin-bottom: 8px; }
  .title { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; }
  .subtitle { font-size: 12px; margin-top: 6px; letter-spacing: 0.4px; }
  
  .customer-info { display: flex; justify-content: space-between; gap: 12px; margin: 12px 0; }
  .customer-info div { background: rgba(255,255,255,0.9); padding: 10px; border-radius: 4px; flex: 1; font-size: 11px; }
  .customer-info div strong { display: block; margin-bottom: 4px; color: #4a2d0b; font-weight: bold; }
  
  .summary-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
  .summary-table th, .summary-table td { border: 1px solid #d2b953; padding: 8px; text-align: left; }
  .summary-table th { background: #d2b953; color: #3f3120; }
  .summary-table td { background: rgba(255,255,255,0.85); }
  
  .footer { margin-top: 12px; text-align: center; }
  .footer-note { font-size: 10px; color: #5f4730; }
  
  .copy-label { text-align: center; margin-bottom: 8px; font-size: 11px; color: #d2b953; font-weight: bold; }
  
  @media print {
    body { margin: 0; padding: 0; }
    .page { min-height: auto; }
    .half-page { height: 50%; page-break-after: avoid; }
  }
</style>
</head>
<body>
  <div class="page">
    <!-- CUSTOMER COPY (TOP HALF) -->
    <div class="half-page">
      <div class="copy-label">CUSTOMER COPY</div>
      <div class="header">
        <h1 class="title">Pending Payments Summary</h1>
      </div>
      <div class="customer-info">
        <div><strong>Customer Name</strong>${customerName}</div>
        <div><strong>Phone</strong>${customerPhone}</div>
        <div><strong>Date</strong>${printDate}</div>
      </div>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Invoiced</td>
            <td>₹${parseFloat(totals.totalInvoiceAmount).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total Paid</td>
            <td>₹${parseFloat(totals.totalPaidAmount).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total Pending</td>
            <td>₹${Math.max(0, parseFloat(totals.totalInvoiceAmount) - parseFloat(totals.totalPaidAmount)).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Balance Advance</td>
            <td>₹${Math.max(0, parseFloat(customer?.advance_balance || 0) - parseFloat(inputAdvanceAmount || 0)).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- DIVIDER LINE -->
    <div class="divider">✂️ TEAR HERE ✂️</div>
    
    <!-- COMPANY COPY (BOTTOM HALF) -->
    <div class="half-page">
      <div class="copy-label">COMPANY COPY</div>
      <div class="header">
        <h1 class="title">Pending Payments Summary</h1>
      </div>
      <div class="customer-info">
        <div><strong>Customer Name</strong>${customerName}</div>
        <div><strong>Phone</strong>${customerPhone}</div>
        <div><strong>Date</strong>${printDate}</div>
      </div>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Invoiced</td>
            <td>₹${parseFloat(totals.totalInvoiceAmount).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total Paid</td>
            <td>₹${parseFloat(totals.totalPaidAmount).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total Pending</td>
            <td>₹${Math.max(0, parseFloat(totals.totalInvoiceAmount) - parseFloat(totals.totalPaidAmount)).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Balance Advance</td>
            <td>₹${Math.max(0, parseFloat(customer?.advance_balance || 0) - parseFloat(inputAdvanceAmount || 0)).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">
        <div class="footer-note">This is a system generated Pending Payments Summary. Please retain this for your records.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    };

    return (
        <Tooltip title={isPrinting ? "Printing..." : tooltip}>
            <IconButton
                onClick={handlePrint}
                size={size}
                color={color}
                disabled={isPrinting}
                {...props}
            >
                <PrintIcon />
            </IconButton>
        </Tooltip>
    );
};

export default PrintButton;