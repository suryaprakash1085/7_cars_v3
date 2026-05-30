import axios from 'axios';
import Cookies from "js-cookie";

const storedToken = Cookies.get("token");


// export const processPayments = (payments) => {
//   // const processed = Object.values(
//   //   payments.reduce((acc, payment) => {
//   //     if ((payment.paid_status.toLowerCase() === "not paid" || payment.paid_status.toLowerCase() === "partially paid") || payment.paid_status.toLowerCase() === "paid") {
//   //       const pendingAmount = parseFloat(payment.invoice_amount) - parseFloat(payment.paid_amount);

//   //       if (pendingAmount > 0) {
//   //         if (!acc[payment.vehicle_id]) {
//   //           acc[payment.vehicle_id] = {
//   //             ...payment,
//   //             pendingAmount: pendingAmount,
//   //             totalInvoiceAmount: parseFloat(payment.invoice_amount),
//   //             totalPaidAmount: parseFloat(payment.paid_amount),
//   //             visitCount: 1
//   //           };
//   //         } else {
//   //           acc[payment.vehicle_id].visitCount += 1;
//   //           acc[payment.vehicle_id].totalInvoiceAmount += parseFloat(payment.invoice_amount);
//   //           acc[payment.vehicle_id].totalPaidAmount += parseFloat(payment.paid_amount);
//   //           acc[payment.vehicle_id].pendingAmount += pendingAmount;

//   //           if (new Date(payment.appointment_date) > new Date(acc[payment.vehicle_id].appointment_date)) {
//   //             acc[payment.vehicle_id] = {
//   //               ...payment,
//   //               pendingAmount: acc[payment.vehicle_id].pendingAmount,
//   //               totalInvoiceAmount: acc[payment.vehicle_id].totalInvoiceAmount,
//   //               totalPaidAmount: acc[payment.vehicle_id].totalPaidAmount,
//   //               visitCount: acc[payment.vehicle_id].visitCount
//   //             };
//   //           }
//   //         }
//   //       }
//   //     }
//   //     return acc;
//   //   }, {})
//   // );
//   // should only process status = invoice and invoiced
//   const processedPayments = payments.filter(
//     (p) => p.status === "invoice" || p.status === "invoiced"
//   );
//   processedPayments.forEach(payment => {
//     payment.pendingAmount = parseFloat(payment.invoice_amount) - parseFloat(payment.paid_amount);
//   });
//   return processedPayments;
// };


export const processPayments = (payments) => {
  payments.forEach(payment => {
    payment.pendingAmount = parseFloat(payment.invoice_amount || 0) - parseFloat(payment.paid_amount || 0);
  });
  return payments;
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


export const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-cp-table");
  if (container) container.scrollTo({ top: 0, behavior: "smooth" });
};

export const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10);
};

//   Fetch with append support
export const fetchPaymentEntries = async (
  token,
  setPayments,
  setFilteredPayments,
  setLoading,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity,
  startDate,
  endDate,
  id,
  limit = 20,
  offset = 0,
  append = false
) => {
  try {
    if (!token) {
      setOpenSnackbar(true);
      setSnackbarMessage("Unauthorized. Please log in.");
      setSnackbarSeverity("error");
      setLoading(false);
      return { data: [], total: 0 };
    }

    const params = new URLSearchParams();
    params.append("status", "invoice");
    params.append("status", "invoiced");
    params.append("limit", limit);
    params.append("offset", offset);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/get_appointments_by_date/${startDate}/${endDate}?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error("Failed to fetch payments");

    const json = await response.json();
    const total = json.total ?? 0;
    let rawData = json.data || [];

    // Filter by customer id if present
    if (id) {
      rawData = rawData.filter(
        (p) => p.customer_id === id &&
          (p.status === "invoice" || p.status === "invoiced")
      );
    }

    // Sort: not paid → partially paid → paid
    rawData.sort((a, b) => {
      const order = { "not paid": 0, "partially paid": 1, paid: 2 };
      return (order[a.paid_status] ?? 3) - (order[b.paid_status] ?? 3);
    });

    if (append) {
      setPayments((prev) => {
        const existingIds = new Set(prev.map((e) => e.appointment_id));
        const unique = rawData.filter((e) => !existingIds.has(e.appointment_id));
        return [...prev, ...unique];
      });
      if (id) {
        setFilteredPayments((prev) => {
          const existingIds = new Set(prev.map((e) => e.appointment_id));
          const unique = rawData.filter((e) => !existingIds.has(e.appointment_id));
          return [...prev, ...unique];
        });
      }
    } else {
      setPayments(rawData);
      if (id) setFilteredPayments(rawData);
    }

    setLoading(false);
    return { data: rawData, total };

  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage(err.message);
    setSnackbarSeverity("error");
    setLoading(false);
    return { data: [], total: 0 };
  }
};
