export const calculateGSTAmount = (baseAmount, gstPercent) => {
  if (!baseAmount || !gstPercent) return 0;
  const gstAmount = (baseAmount * gstPercent) / (100 + gstPercent);
  return Math.round(gstAmount * 100) / 100;
};

export const calculateBaseAmount = (totalAmount, gstPercent) => {
  if (!totalAmount || !gstPercent) return totalAmount || 0;
  const baseAmount = totalAmount / (1 + gstPercent / 100);
  return Math.round(baseAmount * 100) / 100;
};

export const calculateTotalWithGST = (baseAmount, gstAmount) => {
  const total = (baseAmount || 0) + (gstAmount || 0);
  return Math.round(total * 100) / 100;
};

export const calculateAppointmentTotals = (appointment) => {
  const spares = appointment.spares || [];
  const labour = appointment.labour || [];

  const sparesSubtotal = spares.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const labourSubtotal = labour.reduce((sum, l) => sum + (l.service_cost || 0), 0);

  const sparesGST = spares.reduce((sum, s) => sum + (s.gst_amount || 0), 0);
  const labourGST = labour.reduce((sum, l) => sum + (l.gst_amount || 0), 0);

  const subtotal = sparesSubtotal + labourSubtotal;
  const totalGST = sparesGST + labourGST;
  const grandTotal = subtotal + totalGST;

  return {
    sparesSubtotal,
    labourSubtotal,
    sparesGST,
    labourGST,
    subtotal,
    totalGST,
    grandTotal,
  };
};

export const formatCurrency = (amount, decimals = 2) => {
  return Number(amount || 0).toFixed(decimals);
};
