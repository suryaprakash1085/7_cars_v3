import snackBar from "@/components/snackBar";
import { calculateTotals } from "@/components/gstcalculation";
import { set } from "date-fns";

const fetchDetails = async (
  token,
  appointmentId,
  setSnackbarMessage,
  setOpenSnackbar,
  setSnackbarSeverity,
  setKm,
  setnextServiceKm,
  setAppointment,
  setCustomer,
  setVehicleId,
  setInventory,
  setEstimateItems,
  setLoading,
  setPaymentMode,
  setInvoiceDate,
  setInvoiceId,
  setGstInvoiceId,
) => {
  try {
    const appointmentResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!appointmentResponse.ok)
      throw new Error("Failed to fetch appointment details");

    const appointmentData = await appointmentResponse.json();
    const customerId = appointmentData.customer_id;
    const vehicleId = appointmentData.vehicle_id;

    // Always set appointment object, and default km to 0 when null/undefined
    setAppointment(appointmentData);
    setKm(appointmentData.km ?? 0);
  // To this:
if (typeof setnextServiceKm === "function") {
  if (appointmentData.next_service_km && appointmentData.next_service_km !== 0) {
    setnextServiceKm(appointmentData.next_service_km);
  } else {
    setnextServiceKm(0);
  }
}

if (typeof setInvoiceId === "function") {
  if (appointmentData.invoice_id) {
    setInvoiceId(appointmentData.invoice_id);
  } else {
    setInvoiceId("");
  }
}

if (typeof setGstInvoiceId === "function") {
  if (appointmentData.gst_invoice_id) {
    setGstInvoiceId(appointmentData.gst_invoice_id);
  } else {
    setGstInvoiceId("");
  }
}

// Always store raw "YYYY-MM-DD" — only set when setter provided
if (typeof setInvoiceDate === "function") {
  if (appointmentData.invoice_date) {
    setInvoiceDate(appointmentData.invoice_date);
  } else {
    const today = new Date().toISOString().split("T")[0];
    setInvoiceDate(today);
  }
}


    // Set payment mode from appointment data
    if (appointmentData.payment_method && setPaymentMode) {
      setPaymentMode(appointmentData.payment_method.toLowerCase());
    }

    const [customerResponse, inventoryResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/${customerId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=10000`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
    ]);

    if (!customerResponse.ok)
      throw new Error("Failed to fetch customer details");
    if (!inventoryResponse.ok)
      throw new Error("Failed to fetch inventory details");

    const customerData = await customerResponse.json();
    const inventoryData = await inventoryResponse.json();
    // console.log("Fetched Customer Data:", customerData);
    setCustomer(customerData);
    setVehicleId(vehicleId);
    setInventory(inventoryData);

    // ---------- FILTER + PREFILL ----------
    if (
      appointmentData.services_actual &&
      appointmentData.services_actual.length > 0
    ) {
      const preFilledItems = appointmentData.services_actual
        // FILTER: remove services with empty items_required
        .filter(
          (service) =>
            Array.isArray(service.items_required) &&
            service.items_required.length > 0
        )
        .map((service) => ({
          service_id: service.service_id || "",
          spareList: service.items_required[0]?.item_name || "",
          reportedIssue: service.service_description || "",
          qty: Number(service.items_required[0]?.qty) || 1,
          price: Number(service.price) || 0,
          discountType: "percentage",
          estimatedAmount: Number(service.price) || 0,
          tax: Number(service.items_required[0]?.tax) || 0,
        }));

      // If after filtering nothing remains → default row
      if (preFilledItems.length > 0) {
        setEstimateItems(preFilledItems);
      } else {
        setEstimateItems([
          {
            service_id: "",
            spareList: "",
            reportedIssue: "",
            qty: 0,
            price: 0,
            discountType: "percentage",
            estimatedAmount: 0,
            tax: 0,
          },
        ]);
      }
    }
  } catch (err) {
    setSnackbarMessage(err.message);
    setSnackbarSeverity("error");
    setOpenSnackbar(true);
  } finally {
    setLoading(false);
  }
};


const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10); // Show FAB after scrolling down 200px
};

const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) {
    container.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const cancelInvoice = async (token, appointment_id, estimateItems) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/cancel/${appointment_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentItems: estimateItems }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData?.error || `Failed to cancel invoice (${response.status})`
      );
    }

    const data = await response.json();

    //   ALWAYS RETURN STRING
    return typeof data?.message === "string"
      ? data.message
      : "Invoice cancelled successfully";
  } catch (error) {
    console.error("Error cancelling invoice:", error);
    throw error;
  }
};


// const generatePDF = (jsPDF, customer, appointmentId, estimateItems, km) => {
//   const doc = new jsPDF();
//   doc.setFont("helvetica", "normal");

//   // Add company logo and header
//   // doc.addImage("path_to_ganesh_logo", "PNG", 15, 15, 25, 25);
//   // doc.addImage("path_to_7cars_logo", "PNG", 45, 15, 40, 25);

//   doc.setFontSize(16);
//   doc.text("TAX INVOICE", 100, 20, { align: "center" });

//   // Company Details (Right aligned header)
//   doc.setFontSize(10);
//   doc.text("No 366, Thiruthangal Road,", 140, 30, { align: "left" });
//   doc.text("Sivakasi - 626 130.", 140, 35, { align: "left" });
//   doc.text("Contact : 77080 03088, 72003 77707", 140, 40, { align: "left" });
//   doc.text("GSTIN : 33BGFPA9032E1ZY", 140, 45, { align: "left" });

//   // Customer Details (Left side)
//   doc.text("Patron : ", 15, 60);
//   doc.text(`${customer.customer_name}`, 15, 65);
//   doc.text(`${customer.contact.address.street}`, 15, 70);
//   doc.text(
//     `${customer.contact.address.city}-${customer.contact.address.zip}`,
//     15,
//     75
//   );
//   doc.text(`GSTIN : ${customer.gstin || "N/A"}`, 15, 80);

//   // Invoice Details (Right side)
//   doc.text(`Invoice No : ${appointmentId}`, 140, 60);
//   doc.text(`Invoice Date : ${new Date().toLocaleDateString()}`, 140, 65);
//   doc.text("Vehicle No : ", 140, 70);
//   doc.text(`Vehicle Kms : ${km}`, 140, 75);

//   // Table Headers
//   const startY = 90;
//   doc.line(15, startY, 175, startY); // Top line
//   //this is the table header

//   const headers = ["S.No", "Particulars", "Quantity", "Rate", "GST%", "Amount"];

//   const columnWidths = [15, 70, 20, 30, 20, 30];
//   let xPos = 15;

//   doc.setFontSize(10);
//   headers.forEach((header, i) => {
//     doc.text(header, xPos, startY - 5);
//     xPos += columnWidths[i];
//   });

//   // Then draw the line below headers
//   doc.line(15, startY, 195, startY);

//   // Table Content
//   let yPos = startY + 10;
//   estimateItems.forEach((item, index) => {
//     xPos = 15;
//     doc.text((index + 1).toString(), xPos, yPos);
//     doc.text(item.spareList, xPos + 15, yPos);
//     doc.text(item.qty.toString(), xPos + 85, yPos);
//     doc.text(item.price, xPos + 105, yPos);
//     doc.text(item.tax.toString() + "%", xPos + 135, yPos);
//     doc.text((item.price * item.qty).toFixed(2), xPos + 155, yPos);
//     yPos += 7;
//   });

//   // Summary Section
//   const summaryY = yPos + 20;
//   doc.text("Bank Details :", 15, summaryY);
//   doc.text("ARG'S 7cars & See jaya finserve", 15, summaryY + 5);
//   doc.text("City Union Bank", 15, summaryY + 10);
//   doc.text("A/c: 770800309", 15, summaryY + 15);

//   // Tax Summary
//   doc.text("Sub Total", 130, summaryY);
//   doc.text(grandTotal.toFixed(2), 180, summaryY, { align: "right" });

//   doc.text("CGST", 130, summaryY + 5);
//   doc.text((totalTax / 2).toFixed(2), 180, summaryY + 5, { align: "right" });

//   doc.text("SGST", 130, summaryY + 10);
//   doc.text((totalTax / 2).toFixed(2), 180, summaryY + 10, { align: "right" });

//   doc.text("Round off", 130, summaryY + 15);
//   doc.text("0.00", 180, summaryY + 15, { align: "right" });

//   doc.text("Net Amount", 130, summaryY + 20);
//   doc.text(grandTotal.toFixed(2), 180, summaryY + 20, { align: "right" });

//   // Footer
//   doc.text("For ARG'S 7 Car", 150, summaryY + 35);
//   doc.text("Authorized Signature", 150, summaryY + 45);

//   // Add border around entire invoice
//   doc.rect(10, 10, 190, summaryY + 50);

//   doc.save(`Invoice_${appointmentId}.pdf`);
// };

export {
  fetchDetails,
  scrollToTopButtonDisplay,
  handleScrollToTop,
  calculateTotals,
  cancelInvoice,
  // generatePDF,
};
