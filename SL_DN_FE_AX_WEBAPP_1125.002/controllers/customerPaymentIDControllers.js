// Convert date string to components (DD/MM/YYYY format)
export function getDateComponents(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Calculate payment status based on amounts
export const calculatePaymentStatus = (payment, newPaidAmount) => {
  const pendingAmount = parseFloat(payment.invoice_amount) - parseFloat(payment.paid_amount);
  return newPaidAmount >= pendingAmount ? "Fully Paid" :
    newPaidAmount > 0 ? "Partially Paid" :
      payment.paid_status;
};

// Calculate totals for pending payments
export const calculateTotals = (payments) => {
  const totalInvoiceAmount = payments.reduce((sum, payment) =>
    sum + parseFloat(payment.invoice_amount), 0
  ).toFixed(2);

  const totalPaidAmount = payments.reduce((sum, payment) =>
    sum + parseFloat(payment.paid_amount), 0
  ).toFixed(2);

  return { totalInvoiceAmount, totalPaidAmount };
};

// Distribute bulk payment across payments
export const distributeBulkPayment = (payments, bulkAmount) => {
  let remainingAmount = parseFloat(bulkAmount);
  const newPaidAmounts = {};
  const newPaymentStatuses = {};
  const balanceAmounts = {}; // New object to store balance amounts

  // Sort payments by date
  const sortedPayments = [...payments].sort((a, b) => {
    const dateA = new Date(a.appointment_date);
    const dateB = new Date(b.appointment_date);
    return dateA - dateB;
  });

  // Distribute amount across payments
  sortedPayments.forEach(payment => {
    if (remainingAmount <= 0) return;

    const pendingAmount = parseFloat(payment.invoice_amount) - parseFloat(payment.paid_amount);
    const amountToApply = Math.min(remainingAmount, pendingAmount);

    if (amountToApply > 0) {
      newPaidAmounts[payment._id] = amountToApply.toFixed(2);
      newPaymentStatuses[payment._id] = amountToApply >= pendingAmount ? "Fully Paid" : "Partially Paid";
      balanceAmounts[payment._id] = (amountToApply - pendingAmount).toFixed(2); // Calculate balance amount
      remainingAmount -= amountToApply;
    }
  });

  return { newPaidAmounts, newPaymentStatuses, balanceAmounts }; // Return balance amounts
};
