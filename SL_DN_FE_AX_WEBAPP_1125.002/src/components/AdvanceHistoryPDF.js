"use client";

import React from "react";
import { Button, Tooltip } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import jsPDF from "jspdf";

const AdvanceHistoryPDF = ({
  payment,
  customerName,
  tooltip = "Download PDF",
  size = "small",
  color = "primary",
}) => {
  if (!payment) return null;

  const generatePDF = () => {
    const doc = new jsPDF();

    // Colors
    const primaryColor = [210, 185, 83]; // gold
    const bgColor = [247, 240, 200]; // light yellow
    const textColor = [63, 49, 32];

    // Background box
    doc.setFillColor(...bgColor);
    doc.rect(10, 10, 190, 277, "F");

    // Border
    doc.setDrawColor(...primaryColor);
    doc.rect(10, 10, 190, 277);

    // Title
    doc.setTextColor(...textColor);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Advance History Receipt", 105, 25, { align: "center" });

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Customer: ${customerName || "N/A"}`,
      105,
      32,
      { align: "center" }
    );

    // Divider
    doc.setDrawColor(...primaryColor);
    doc.line(20, 36, 190, 36);

    let y = 50;

    const addRow = (label, value, isAmount = false) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(label, 20, y);

      doc.setFont("helvetica", "normal");

      if (isAmount) {
        doc.setTextColor(33, 150, 243); // blue
      } else {
        doc.setTextColor(0, 0, 0);
      }

      doc.text(value, 150, y, { align: "right" });

      // Divider line
      doc.setDrawColor(230, 230, 230);
      doc.line(20, y + 2, 190, y + 2);

      y += 12;
    };

    addRow("Date:", payment.creation_date || "-");
    addRow("Description:", payment.description || "-");
    addRow("Invoice No:", payment.invoice_no || "-");

    addRow(
      "Credit Amount:",
      `₹${payment.credit != null ? Number(payment.credit).toFixed(2) : "0.00"}`,
      true
    );

    addRow(
      "Debit Amount:",
      `₹${payment.debit != null ? Number(payment.debit).toFixed(2) : "0.00"}`,
      true
    );

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      `Printed on: ${new Date().toLocaleString()}`,
      105,
      270,
      { align: "center" }
    );
    doc.text(
      "This is an auto-generated document",
      105,
      276,
      { align: "center" }
    );

    const fileName = `advance-history-${payment.creation_date}-${Date.now()}.pdf`;
    doc.save(fileName);
  };

  return (
    <Tooltip title={tooltip}>
      <Button
        variant="outlined"
        size={size}
        color={color}
        onClick={generatePDF}
        startIcon={<PrintIcon />}
        sx={{
          textTransform: "none",
          minWidth: "auto",
        }}
      >
        PDF
      </Button>
    </Tooltip>
  );
};

export default AdvanceHistoryPDF;