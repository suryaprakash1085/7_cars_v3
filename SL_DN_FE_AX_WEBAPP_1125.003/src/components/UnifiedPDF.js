"use client";

import React from "react";
import { Button, Tooltip } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import jsPDF from "jspdf";

/**
 * =========================
 * STYLE SYSTEM
 * =========================
 */
const STYLE = {
  primary: [30, 30, 30],
  line: [200, 200, 200],
};

/**
 * =========================
 * IMAGE LOADER (BASE64)
 * =========================
 */
const loadImageAsBase64 = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0,0);

      resolve(canvas.toDataURL("image/png"));
    };
  });

/**
 * =========================
 * BASIC HELPERS
 * =========================
 */
const docInit = () => new jsPDF();

const hr = (doc, y) => {
  doc.setDrawColor(...STYLE.line);
  doc.line(10, y, 200, y);
};

const title = (doc, text, y) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...STYLE.primary);
  doc.text(text, 105, y, { align: "center" });
};

const subtitle = (doc, text, y) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(text, 105, y, { align: "center" });
};

/**
 * =========================
 * VOUCHER BLOCK
 * =========================
 */
const drawVoucher = async (doc, data, y, label, rupeeIcon, companyLogo) => {
  const date = new Date().toLocaleDateString();

  const name =
    data?.customer?.customer_name ||
    data?.customerDetails?.customer_name ||
    data?.customer?.name ||
    "N/A";

  // Generate voucher number from customer ID or random
  const customerId = data?.customer?.customer_id;
  const voucherNo = customerId
    ? `ADV-${String(customerId).padStart(6, "0")}`
    : `ADV-${Math.floor(100000 + Math.random() * 900000)}`;

  // Add company logo if available
  if (companyLogo) {
    doc.addImage(companyLogo, "PNG", 15, y, 180, 20);
    y += 28;
  }

  title(doc, "ADVANCE PAYMENT VOUCHER", y);
  y += 8;

  subtitle(doc, label, y);
  y += 10;

  hr(doc, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Paid By:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(name, 50, y);

  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Date:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(date, 50, y);

  // y += 7;

  // doc.setFont("helvetica", "bold");
  // doc.text("Voucher No:", 15, y);
  // doc.setFont("helvetica", "normal");
  // doc.text(voucherNo, 50, y);

  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Current Advance:", 15, y);
  doc.setFont("helvetica", "normal");
  const currentAdvance = Number(
    data?.customer?.advance_payment ??
      data?.customerDetails?.advance_payment ??
      0,
  ).toFixed(2);
  if (rupeeIcon) {
    doc.addImage(rupeeIcon, "PNG", 95, y - 3, 4, 4);
    doc.text(String(currentAdvance), 101, y);
  } else {
    doc.text(`Rs. ${currentAdvance}`, 95, y);
  }

  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Total Advance Amount:", 15, y);
  doc.setFont("helvetica", "normal");
  const currentAdvanceForTotal = Number(
    data?.customer?.advance_payment ??
      data?.customerDetails?.advance_payment ??
      0,
  );
  const newAdvanceAmount = Number(
    data?.amount ?? data?.advance_payment ?? data?.totals?.advance_payment ?? 0,
  );
  const totalAdvance = (currentAdvanceForTotal + newAdvanceAmount).toFixed(2);
  if (rupeeIcon) {
    doc.addImage(rupeeIcon, "PNG", 95, y - 3, 4, 4);
    doc.text(String(totalAdvance), 101, y);
  } else {
    doc.text(`Rs. ${totalAdvance}`, 95, y);
  }

  y += 10;

  hr(doc, y);
  y += 10;

  /**
   * TABLE HEADER
   */
  doc.setFont("helvetica", "bold");
  doc.text("Date", 15, y);
  doc.text("Description", 55, y);
  doc.text("Category", 120, y);
  doc.text("Amount", 165, y);

  y += 8;

  hr(doc, y);
  y += 10;

  /**
   * ROW
   */
  const amount = Number(
    data?.amount ?? data?.advance_payment ?? data?.totals?.advance_payment ?? 0,
  ).toFixed(2);

  doc.setFont("helvetica", "normal");
  doc.text(date, 15, y);
  doc.text("Customer Advance Payment", 55, y);
  doc.text("ADVANCE", 120, y);

  /**
   * RUPEE ICON + AMOUNT
   */
  if (rupeeIcon) {
    doc.addImage(rupeeIcon, "PNG", 165, y - 3, 4, 4);
    doc.text(String(amount), 171, y);
  } else {
    doc.text(`Rs. ${amount}`, 165, y);
  }

  y += 10;

  hr(doc, y);

  return y;
};

/**
 * =========================
 * COMPONENT
 * =========================
 */
const UnifiedPDF = ({
  type,
  data,
  buttonLabel = "Download PDF",
  tooltip,
  size = "small",
  color = "primary",
  variant = "outlined",
  disabled = false,
  startIcon = true,
  token = null,
}) => {
  if (!type || !data) return null;

  const generatePDF = async () => {
    const doc = docInit();

    /**
     * load rupee icon
     */
    const rupeeIcon = await loadImageAsBase64("/assets/images/rupee.png");

    /**
     * Load company logo
     */
    let companyLogo = null;
    try {
      // Try to get company details from API or localStorage
      let companyDetails = null;

      if (token) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/ss`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          const data = await response.json();
          companyDetails = data.company_details?.[0];
        } catch (apiError) {
          console.error("Failed to fetch company details from API:", apiError);
        }
      }

      // Fallback to localStorage if API fails
      if (!companyDetails) {
        const companyDetailsStr = localStorage.getItem("companyDetails");
        if (companyDetailsStr) {
          companyDetails = JSON.parse(companyDetailsStr);
        }
      }

      if (companyDetails?.pdf_header) {
        const logoUrl = `${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_header/${companyDetails.pdf_header}`;
        // companyLogo='https://7carsbe.sl-diginova.com/company/image/file/pdf_header/pdf_header-1776861502972.png'
        companyLogo = await loadImageAsBase64(logoUrl).catch(() => null);
      }
    } catch (error) {
      console.error("Failed to load company logo:", error);
    }

    if (type === "advance-voucher") {
      /**
       * TOP COPY
       */
      await drawVoucher(doc, data, 20, "CUSTOMER COPY", rupeeIcon, companyLogo);

      /**
       * FOLD LINE
       */
      doc.setDrawColor(120);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(10, 148, 200, 148);
      doc.setLineDashPattern([], 0);
      doc.setFontSize(9);
      doc.text("FOLD HERE", 105, 146, { align: "center" });

      /**
       * BOTTOM COPY
       */
      await drawVoucher(doc, data, 160, "COMPANY COPY", rupeeIcon, companyLogo);

      doc.save(`voucher-${Date.now()}.pdf`);
    } else if (type === "advance-history") {
      // For advance history receipts
      const payment = data.payment;
      const customerName = data.customerName;

      const primaryColor = [210, 185, 83];
      const bgColor = [247, 240, 200];
      const textColor = [63, 49, 32];

      doc.setFillColor(...bgColor);
      doc.rect(10, 10, 190, 277, "F");

      doc.setDrawColor(...primaryColor);
      doc.rect(10, 10, 190, 277);

      // Add logo if available
      if (companyLogo) {
        doc.addImage(companyLogo, "PNG", 15, 12, 30, 15);
      }

      doc.setTextColor(...textColor);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Advance History Receipt", 105, 32, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Customer: ${customerName || "N/A"}`, 105, 40, {
        align: "center",
      });

      doc.setDrawColor(...primaryColor);
      doc.line(20, 44, 190, 44);

      let y = 58;

      const addRow = (label, value, isAmount = false) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, 20, y);

        doc.setFont("helvetica", "normal");
        if (isAmount) {
          doc.setTextColor(33, 150, 243);
        } else {
          doc.setTextColor(0, 0, 0);
        }

        doc.text(value, 150, y, { align: "right" });

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
        true,
      );
      addRow(
        "Debit Amount:",
        `₹${payment.debit != null ? Number(payment.debit).toFixed(2) : "0.00"}`,
        true,
      );

      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Printed on: ${new Date().toLocaleString()}`, 105, 270, {
        align: "center",
      });
      doc.text("This is an auto-generated document", 105, 276, {
        align: "center",
      });

      doc.save(`advance-history-${payment.creation_date}-${Date.now()}.pdf`);
    } else if (type === "pending-payments") {
      // For pending-payments, use different layout
      await drawVoucher(
        doc,
        data,
        20,
        "PENDING PAYMENTS",
        rupeeIcon,
        companyLogo,
      );
      doc.save(`pending-payments-${Date.now()}.pdf`);
    } else {
      // Fallback to default voucher behavior
      await drawVoucher(doc, data, 20, "CUSTOMER COPY", rupeeIcon, companyLogo);
      doc.save(`document-${Date.now()}.pdf`);
    }
  };

  return (
    <Tooltip title={tooltip || "Download PDF"}>
      <span>
        <Button
          variant={variant}
          size={size}
          color={color}
          disabled={disabled}
          onClick={generatePDF}
          startIcon={startIcon ? <PrintIcon /> : undefined}
          sx={{ textTransform: "none", fontWeight: 500 }}
        >
          {buttonLabel}
        </Button>
      </span>
    </Tooltip>
  );
};

export default UnifiedPDF;
