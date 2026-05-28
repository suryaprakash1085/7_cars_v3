export function calculateTotals(estimateItems) {
  const items = Array.isArray(estimateItems) ? estimateItems : [];

  const grandTotal = items.reduce((acc, item) => {
    const price = Number(item?.price) || 0;
    const qty = Number(item?.qty) || 0;
    return acc + price * qty;
  }, 0);

  const totalDiscount = items.reduce((acc, item) => {
    const price = Number(item?.price) || 0;
    const qty = Number(item?.qty) || 0;
    const discount = Number(item?.discount) || 0;
    const discountValue = item?.discountType === "percentage"
      ? (price * (discount / 100))
      : discount;
    return acc + Math.min(discountValue, price) * qty;
  }, 0);

  const totalTax = items.reduce((acc, item) => {
    const price = Number(item?.price) || 0;
    const qty = Number(item?.qty) || 0;
    const tax = Number(item?.tax) || 0;
    const taxRate = tax / 100;
    const taxAmount = (price * qty * taxRate) / (1 + taxRate);
    return acc + taxAmount;
  }, 0);

  const overallTotal = grandTotal; // adjust if discounts/rounding apply
  return { grandTotal, totalDiscount, totalTax, overallTotal };
}

// export function GSTCalculation(totalAmount, gstRate) {
//     //formula is total amount -(total amount * (gst rate / 100))
//     const gstAmount = totalAmount * (gstRate / 100);
//     const totalAmountWithGst = totalAmount - gstAmount;
//     return totalAmountWithGst;
// }

