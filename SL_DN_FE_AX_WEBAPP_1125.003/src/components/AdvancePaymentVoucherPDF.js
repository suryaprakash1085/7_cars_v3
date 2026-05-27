"use client";

import React from "react";
import { Button, Tooltip } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import jsPDF from "jspdf";

const AdvancePaymentVoucherPDF = ({
  customer,
  amount,
  tooltip = "Download Voucher PDF",
  size = "medium",
  color = "primary",
  disabled = false,
}) => {
  if (!customer || !amount) return null;

  const generatePDF = () => {
    const doc = new jsPDF();

    // 🎨 Colors
    const primary = [33, 150, 243]; // blue
    const lightGray = [240, 240, 240];
    const darkText = [40, 40, 40];

    const voucherNo = `ADV-${Math.floor(100000 + Math.random() * 900000)}`;
    const printDate = new Date().toLocaleDateString();

    const customerPhone =
      customer?.contact?.phone ||
      customer?.phone ||
      customer?.phone_number ||
      customer?.contactPhone ||
      "N/A";

    const getFullName = () => {
      if (customer?.customer_name) return customer.customer_name;
      if (customer?.name) return customer.name;
      if (customer?.full_name) return customer.full_name;
      if (customer?.firstName && customer?.lastName)
        return `${customer.firstName} ${customer.lastName}`;
      if (customer?.first_name && customer?.last_name)
        return `${customer.first_name} ${customer.last_name}`;
      return "N/A";
    };

    const customerName = getFullName();

    const drawVoucher = (startY, label) => {
      let y = startY;

      // 🧾 Header
      doc.setFillColor(...primary);
      doc.rect(10, y, 190, 15, "F");

      doc.setTextColor(255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ADVANCE PAYMENT VOUCHER123", 105, y + 10, { align: "center" });

      y += 20;

      // Copy Label
      doc.setTextColor(...primary);
      doc.setFontSize(9);
      doc.text(label, 180, y - 5, { align: "right" });

      // 👤 Customer Info Box
      doc.setDrawColor(...primary);
      doc.rect(10, y, 190, 25);

      doc.setFontSize(10);
      doc.setTextColor(...darkText);

      doc.text(`Customer Name: ${customerName}`, 15, y + 8);
      doc.text(`Phone: ${customerPhone}`, 15, y + 16);

      doc.text(`Date: ${printDate}`, 130, y + 8);
      doc.text(`Voucher No: ${voucherNo}`, 130, y + 16);

      y += 35;

      // 📊 Table Header
      doc.setFillColor(...lightGray);
      doc.rect(10, y, 190, 10, "F");

      doc.setFont("helvetica", "bold");
      doc.text("Description", 15, y + 7);
      doc.text("Category", 100, y + 7);
      doc.text("Amount", 185, y + 7, { align: "right" });

      y += 10;

      // 📊 Table Row
      doc.setFont("helvetica", "normal");
      doc.rect(10, y, 190, 12);

      doc.text("Customer Advance Payment", 15, y + 8);
      doc.text("Advance", 100, y + 8);
      doc.text(`₹ ${parseFloat(amount).toFixed(2)}`, 185, y + 8, {
        align: "right",
      });

      y += 20;

      // 💰 Total Highlight
      doc.setFillColor(...primary);
      doc.rect(110, y, 90, 12, "F");

      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.text(
        `TOTAL: ₹ ${parseFloat(amount).toFixed(2)}`,
        195,
        y + 8,
        { align: "right" }
      );

      y += 20;

      // ✍️ Signature
      doc.setTextColor(...darkText);
      doc.setFont("helvetica", "normal");

      doc.line(20, y, 80, y);
      doc.text("Customer Signature", 20, y + 5);

      doc.line(130, y, 190, y);
      doc.text("Authorized Signature", 130, y + 5);
    };

    // First Copy
    drawVoucher(10, "CUSTOMER COPY");

    // Divider
    doc.setLineDashPattern([3, 3], 0);
    doc.line(10, 145, 200, 145);
    doc.setLineDashPattern([], 0);

    doc.setFontSize(10);
    doc.text("✂ CUT HERE ✂", 105, 150, { align: "center" });

    // Second Copy
    drawVoucher(155, "COMPANY COPY");

    doc.save(`voucher-${Date.now()}.pdf`);
  };

  return (
    <Tooltip
      title={disabled ? "Please select customer and enter amount" : tooltip}
    >
      <Button
        variant="contained"
        size={size}
        color={color}
        disabled={disabled}
        onClick={generatePDF}
        startIcon={<PrintIcon />}
      >
        Print Voucher
      </Button>
    </Tooltip>
  );
};

export default AdvancePaymentVoucherPDF;