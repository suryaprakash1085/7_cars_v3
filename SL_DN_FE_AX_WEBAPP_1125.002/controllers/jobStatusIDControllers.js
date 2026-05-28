import Cookies from "js-cookie";
const storedToken = Cookies.get("token");

const fetchDetails = async (
  token,
  appointmentId,
  vehicleId,
  setLoading,
  setError,
  setSnackbarMessage,
  setOpenSnackbar,
  setSnackBarSeverity,
  setServices,
  setKm,
  setNextServiceKm,
  setCustomer,
  setVehicleId,
  setInventory,
  setAppointmentStatus,
  setEstimateItems,
  setPaymentMethod,
  setInvoiceDate, 
  setVehicleMake,
  setVehicleModel,
  setAppointmentDate,
) => {
  try {
    const appointmentResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Add print tracking
    const printResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/print`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          print_type: "reprint",
          printed_by: Cookies.get("userName") || "Unknown User",
          print_date: new Date().toISOString(),
        }),
      }
    );

    if (!appointmentResponse.ok)
      throw new Error("Failed to fetch appointment details");

    const appointmentData = await appointmentResponse.json();

    setServices(appointmentData.services_actual || []);
    setKm(appointmentData.km);
    setNextServiceKm(appointmentData.next_service_km || "");
    setAppointmentStatus(appointmentData.status);
    setPaymentMethod(appointmentData.payment_method || "");

    const formattedDate = appointmentData.invoice_date
      ? appointmentData.invoice_date.split("-").reverse().join("/")
      : "";
    setInvoiceDate(formattedDate);

 const formattedDate_appoinment_date  = appointmentData.appointment_date
      ? appointmentData.appointment_date.split("-").reverse().join("/")
      : "";
    setAppointmentDate(formattedDate_appoinment_date);

console.log("appointment data_appoinments", formattedDate_appoinment_date);
    // Format and set estimate items
    if (
      appointmentData.services_actual &&
      appointmentData.services_actual.length > 0
    ) {
      const formattedEstimateItems = appointmentData.services_actual.map(
        (service) => ({
          service_id: service.service_id || "",
          type: service.service_type || "",
          spares: service.items_required.map((item) => ({
            spareList: item.item_name || "",
            qty: item.qty || 0,
            price: item.price || 0,
            uom: item.uom || "",
            tax: item.tax || 0,
          })),
          reportedIssue: service.service_description || "",
          estimatedAmount: service.price || 0,
        })
      );
      setEstimateItems(formattedEstimateItems);
    } else {
      setEstimateItems([
        {
          service_id: "",
          type: "Services",
          spares: [],
          reportedIssue: "",
          estimatedAmount: 0,
        },
      ]);
    }

    const customerId = appointmentData.customer_id;
    vehicleId = appointmentData.vehicle_id;
    setVehicleId(vehicleId);

    const [customerResponse, inventoryResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/${customerId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
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

    // ✅ FIXED: was commented out before — this is why nothing rendered
    setCustomer(customerData);


if (customerData.vehicles?.length > 0) {
  setVehicleMake(customerData.vehicles[0].make || "");
  setVehicleModel(customerData.vehicles[0].model || "");

  console.log(
    "setmake and model",
    customerData.vehicles[0].make,
    customerData.vehicles[0].model
  );
}    setInventory(inventoryData);
  } catch (err) {
    setError(err.message);
    setSnackbarMessage(err.message);
    setSnackBarSeverity("error");
    setOpenSnackbar(true);
  } finally {
    setLoading(false);
  }
};

const fetchInvoiceId = async (appointmentId, setInvoiceId) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/appointments_to_invoice/${appointmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch invoice ID");
    const final_data = await response.json();
    setInvoiceId(final_data.invoice_id);
  } catch (err) {
    console.error("Error fetching invoice ID:", err);
  }
};

const ReadInvoiceId = (appointmentId, setInvoiceId) => {
  try {
    const request = new XMLHttpRequest();
    request.open(
      "GET",
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/appointments_to_invoice/invoice_status`,
      false // Synchronous
    );

    request.setRequestHeader("Authorization", `Bearer ${storedToken}`);
    request.setRequestHeader("Content-Type", "application/json");
    request.send();

    if (request.status !== 200) {
      throw new Error("Failed to fetch invoice ID");
    }

    const data = JSON.parse(request.responseText);

    const invoice = data.find(
      (dta) =>
        dta.appointment_id === appointmentId &&
        dta.invoice_status === "active"
    );

    setInvoiceId(invoice ? invoice.invoice_id : null);
    return invoice ? invoice.invoice_id : null;
  } catch (err) {
    console.error("Error fetching invoice ID:", err);
  }
};

const handleCloseSnackbar = (setOpenSnackbar) => {
  setOpenSnackbar(false);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export {
  fetchDetails,
  handleCloseSnackbar,
  formatDate,
  fetchInvoiceId,
  ReadInvoiceId,
};