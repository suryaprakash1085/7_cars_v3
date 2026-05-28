import axios from 'axios';
import Cookies from "js-cookie";

const storedToken = Cookies.get("token");


export const processPayments = (payments) => {
  const processed = Object.values(
    payments.reduce((acc, payment) => {
      if ((payment.paid_status.toLowerCase() === "not paid" || payment.paid_status.toLowerCase() === "partially paid")) {
        const pendingAmount = parseFloat(payment.invoice_amount) - parseFloat(payment.paid_amount);

        if (pendingAmount > 0) {
          if (!acc[payment.vehicle_id]) {
            acc[payment.vehicle_id] = {
              ...payment,
              pendingAmount: pendingAmount,
              totalInvoiceAmount: parseFloat(payment.invoice_amount),
              totalPaidAmount: parseFloat(payment.paid_amount),
              visitCount: 1
            };
          } else {
            acc[payment.vehicle_id].visitCount += 1;
            acc[payment.vehicle_id].totalInvoiceAmount += parseFloat(payment.invoice_amount);
            acc[payment.vehicle_id].totalPaidAmount += parseFloat(payment.paid_amount);
            acc[payment.vehicle_id].pendingAmount += pendingAmount;

            if (new Date(payment.appointment_date) > new Date(acc[payment.vehicle_id].appointment_date)) {
              acc[payment.vehicle_id] = {
                ...payment,
                pendingAmount: acc[payment.vehicle_id].pendingAmount,
                totalInvoiceAmount: acc[payment.vehicle_id].totalInvoiceAmount,
                totalPaidAmount: acc[payment.vehicle_id].totalPaidAmount,
                visitCount: acc[payment.vehicle_id].visitCount
              };
            }
          }
        }
      }
      return acc;
    }, {})
  );
  return processed;
};

export const handleOptionChange = (event, setSelectedOption, setSearchText, setFilteredPayments) => {
  setSelectedOption(event.target.value);
  setSearchText("");
  setFilteredPayments([]);
};

export const handleRowClick = (vehicleId, router) => {
  router.push(`/views/finance/vendorPayment/${vehicleId}`);
};

export const getDisplayPayments = (filteredPayments, uniqueVehiclePayments) => {
  return filteredPayments.length > 0 ? filteredPayments : uniqueVehiclePayments;

};

export const fetchPayments = async (startDate, endDate) => {
  try {
    const queryParts = ["type=supplier"];
    if (startDate) queryParts.push(`start_date=${startDate}`);
    if (endDate) queryParts.push(`end_date=${endDate}`);

    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/finance/transactions?${queryParts.join("&")}`,
      {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log("Error fetching payments:", error);
    return [];
  }
};

// Utility: format date string as DD/MM/YYYY
export function getDateComponents(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Calculate totals used in vendor payment views
export const calculateTotals = (transactions = []) => {
  const totalCreditAmount = transactions
    .reduce((sum, t) => sum + parseFloat(t.credit || 0), 0)
    .toFixed(2);

  const totalDebitAmount = transactions
    .reduce((sum, t) => sum + parseFloat(t.debit || 0), 0)
    .toFixed(2);

  const balanceAmount = (parseFloat(totalCreditAmount) - parseFloat(totalDebitAmount)).toFixed(2);

  return { totalCreditAmount, totalDebitAmount, balanceAmount };
};

// Distribute a bulk payment across payments (oldest first)
export const distributeBulkPayment = (payments = [], bulkAmount) => {
  let remainingAmount = parseFloat(bulkAmount || 0);
  const newPaidAmounts = {};
  const newPaymentStatuses = {};
  const balanceAmounts = {};

  // Sort by date (appointment_date) ascending
  const sortedPayments = [...payments].sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

  sortedPayments.forEach(payment => {
    if (remainingAmount <= 0) return;

    const pendingAmount = parseFloat(payment.invoice_amount || 0) - parseFloat(payment.paid_amount || 0);
    const amountToApply = Math.min(remainingAmount, pendingAmount);

    if (amountToApply > 0) {
      newPaidAmounts[payment._id || payment.id] = amountToApply.toFixed(2);
      newPaymentStatuses[payment._id || payment.id] = amountToApply >= pendingAmount ? "fully paid" : "partially paid";
      balanceAmounts[payment._id || payment.id] = (pendingAmount - amountToApply).toFixed(2);
      remainingAmount -= amountToApply;
    }
  });

  return { newPaidAmounts, newPaymentStatuses, balanceAmounts };
};

// Calculate payment status
export const calculatePaymentStatus = (payment, newPaidAmount) => {
  const pendingAmount = parseFloat(payment.invoice_amount || 0) - parseFloat(payment.paid_amount || 0);
  if (newPaidAmount >= pendingAmount) return "fully paid";
  if (newPaidAmount > 0) return "partially paid";
  return (payment.paid_status || "not paid").toLowerCase();
};

// Export a placeholder payments constant (some pages import it even if unused)
export const payments = [];
