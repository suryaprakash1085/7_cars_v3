import axios from 'axios';
import Cookies from "js-cookie";

const storedToken = Cookies.get("token");


export const processPayments = (payments) => {
  // const processed = Object.values(
  //   payments.reduce((acc, payment) => {
  //     if ((payment.paid_status.toLowerCase() === "not paid" || payment.paid_status.toLowerCase() === "partially paid") || payment.paid_status.toLowerCase() === "paid") {
  //       const pendingAmount = parseFloat(payment.invoice_amount) - parseFloat(payment.paid_amount);

  //       if (pendingAmount > 0) {
  //         if (!acc[payment.vehicle_id]) {
  //           acc[payment.vehicle_id] = {
  //             ...payment,
  //             pendingAmount: pendingAmount,
  //             totalInvoiceAmount: parseFloat(payment.invoice_amount),
  //             totalPaidAmount: parseFloat(payment.paid_amount),
  //             visitCount: 1
  //           };
  //         } else {
  //           acc[payment.vehicle_id].visitCount += 1;
  //           acc[payment.vehicle_id].totalInvoiceAmount += parseFloat(payment.invoice_amount);
  //           acc[payment.vehicle_id].totalPaidAmount += parseFloat(payment.paid_amount);
  //           acc[payment.vehicle_id].pendingAmount += pendingAmount;

  //           if (new Date(payment.appointment_date) > new Date(acc[payment.vehicle_id].appointment_date)) {
  //             acc[payment.vehicle_id] = {
  //               ...payment,
  //               pendingAmount: acc[payment.vehicle_id].pendingAmount,
  //               totalInvoiceAmount: acc[payment.vehicle_id].totalInvoiceAmount,
  //               totalPaidAmount: acc[payment.vehicle_id].totalPaidAmount,
  //               visitCount: acc[payment.vehicle_id].visitCount
  //             };
  //           }
  //         }
  //       }
  //     }
  //     return acc;
  //   }, {})
  // );
  // should only process status = invoice and invoiced
  const processedPayments = payments.filter(
    (p) => p.status === "invoice" || p.status === "invoiced"
  );
  processedPayments.forEach(payment => {
    payment.pendingAmount = parseFloat(payment.invoice_amount) - parseFloat(payment.paid_amount);
  });
  return processedPayments;
};

export const handleOptionChange = (event, setSelectedOption, setSearchText, setFilteredPayments) => {
  setSelectedOption(event.target.value);
  setSearchText("");
  setFilteredPayments([]);
};

export const handleRowClick = (vehicleId, router, customerId, appointmentId) => {
        // console.log("Vehicle ID clicked:", vehicleId, "Customer ID:", customerId, "Appointment ID:", appointmentId);

  router.push(`/views/finance/customerPayment/${vehicleId}?customer_id=${customerId}&appointment_id=${appointmentId}`);
};

export const getDisplayPayments = (filteredPayments, uniqueVehiclePayments) => {
  return filteredPayments.length > 0 ? filteredPayments : uniqueVehiclePayments;

};

export const fetchPayments = async (id) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/appointment`,
      {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    // if id is present then filter the payments by customer_id
    if (id) {
      const filteredPayments = response.data.filter((payment) => payment.customer_id === id);
      return filteredPayments;
    }
    else {
      return response.data;
    }
  } catch (error) {
    // console.log("Error fetching payments:", error);
    return [];
  }
};
