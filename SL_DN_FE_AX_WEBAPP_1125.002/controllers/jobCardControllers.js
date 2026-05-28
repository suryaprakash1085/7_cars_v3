import dayjs from "dayjs";
import Cookies from "js-cookie";

// Helper function to get company_code from cookies
function getCompanyCode() {
  return Cookies.get("current_company_code") || Cookies.get("companyCode") || "";
}

export async function fetchEntries(
  token,
  setEntries,
  setFilteredEntries,
  setLoading,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity,
  startDate,
  endDate,
  status,
  limit,
  offset,
  setOffset,
  setHasMore


) {
  try {
    if (!token) {
      setOpenSnackbar(true);
      setSnackbarMessage(
        "Unauthorized. Please log in with appropriate user credentials."
      );
      setSnackbarSeverity("error");
      setLoading(false);
      return;
    }

    const companyCode = getCompanyCode();
      const statuses = ["released", "invoice"];
    const params = new URLSearchParams({
      ...(companyCode && { company_code: companyCode }),
      ...(startDate && { startDate: startDate }),
      ...(endDate && { endDate: endDate }),
      ...(limit && {limit:limit}),
      ...(offset >=0 && {offset:offset}),
      //  ...(status && { status }),
    });
    statuses.forEach((s) => params.append("status", s));
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-company-code": companyCode,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

    const data = await response.json();
    console.log("API RESPONSE:", data);
    console.log(data)
    console.log("LIMIT:", limit);
console.log("OFFSET:", offset);
  //   const filteredData = data.filter((entry) =>
  //     // entry.appointment_id.startsWith("EST-") &&
  //   // (entry.status === "scheduled" || entry.status === "released")
  //  (entry.status === "released" || entry.status === "invoice")
  //   );
  const filteredData = data.data.filter(
  (entry) =>
    entry.status === "released" ||
    entry.status === "invoice"
);


    // console.log("Filtered Data:", filteredData);

    // setEntries(filteredData);
    setEntries((prev)=>([...prev,...filteredData]));
    setFilteredEntries((prev)=>([...prev,...filteredData]));
    setOffset((prev)=>prev+limit);
    if (filteredData.length < limit) {
  setHasMore(false);
} else {
  setHasMore(true);
}
    // console.log(setEntries)
    // setFilteredEntries(filteredData);
    setLoading(false);
  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage(err.message);
    setSnackbarSeverity("error");
    setLoading(false);
  }
}

export const handleSearchChange = (event, setSearchText) => {
  setSearchText(event.target.value);
};

export const handleSearch = async (
  entries,
  searchQuery,
  selectedOption,
  setFilteredEntries,
  token
) => {
  if (!searchQuery || searchQuery.trim() === "") {
    setFilteredEntries(entries || []);
    return;
  }

  try {
    const companyCode = getCompanyCode();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/search/appointments?q=${encodeURIComponent(searchQuery)}&company_code=${encodeURIComponent(companyCode)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-company-code": companyCode,
        },
      }
    );

    if (!response.ok) throw new Error("Search failed");

    const results = await response.json();
    setFilteredEntries(results);
  } catch (error) {
    console.error("Search error:", error);
    // Fallback to client-side search if API fails
    const lowerQuery = searchQuery.toLowerCase();
    const results = entries.filter((row) => {
      const vehicleId = String(row.vehicle_id || "").toLowerCase();
      const appointmentId = String(row.appointment_id || "").toLowerCase();
      const customerName = String(row.customer_name || "").toLowerCase();
      const phone = String(row.contact?.phone || row.phone || "").toLowerCase();
      const plateNumber = String(row.plateNumber || "").toLowerCase();

      return (
        vehicleId.includes(lowerQuery) ||
        appointmentId.includes(lowerQuery) ||
        customerName.includes(lowerQuery) ||
        phone.includes(lowerQuery) ||
        plateNumber.includes(lowerQuery)
      );
    });
    setFilteredEntries(results);
  }
};

export const handleKeyPress = (
  event,
  setFilteredEntries,
  entries,
  searchText,
  selectedOption
) => {
  if (event.key === "Enter") {
    handleSearch(entries, searchText, selectedOption, setFilteredEntries);
  }
};

export const handleCloseSnackBar = (setOpenSnackbar) => {
  setOpenSnackbar(false);
};

export const handleCloseAppointmentEditModal = (
  setAppointmentEditModalOpen
) => {
  setAppointmentEditModalOpen(false);
};

export const handleCardClick = (router, appointmentId) => {
  // console.log("Appointment ID:", appointmentId);
  router.push(`/views/jobCard/${appointmentId}`);
};

export const handleEditClick = (
  e,
  setAppointmentEditModalOpen,
  data,
  setAppointmentDate,
  setAppointmentTime,
  setEditAppointmentData
) => {
  e.stopPropagation(); // Prevent card click
  setAppointmentDate(dayjs(data.appointment_date).format("YYYY-MM-DD"));
  setAppointmentTime(data.appointment_time);
  setEditAppointmentData(data);
  setAppointmentEditModalOpen(true);
  // console.log(data);
};

export const updateAppointment = async (
  token,
  editAppointmentData,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity,
  setAppointmentEditModalOpen
) => {
  try {
    const companyCode = getCompanyCode();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/dt/${editAppointmentData.appointment_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-company-code": companyCode,
        },
        body: JSON.stringify({
          ...editAppointmentData,
          company_code: companyCode,
        }),
      }
    );

    // Handle specific status codes
    if (response.status === 409) {
      setSnackbarOpen(true);
      setSnackbarMessage("Cannot Delete Vehicle - Appointments Exist.");
      setSnackbarSeverity("error");
      return;
    }

    if (response.status === 404) {
      setOpenSnackbar(true);
      setSnackbarMessage("Appointment not found.");
      setSnackbarSeverity("warning");
      return;
    }

    if (!response.ok) {
      setOpenSnackbar(true);
      setSnackbarMessage("Failed to delete Appointment");
      setSnackbarSeverity("error");
    }

    // Successful deletion
    setOpenSnackbar(true);
    setSnackbarMessage("Appointment Updated Successfully.");
    setSnackbarSeverity("success");

    setAppointmentEditModalOpen(false);
    location.reload();
  } catch (err) {
    console.log(err.message);
  }
};

export const deleteAppointment = async (
  token,
  deletionID,
  setOpenDeleteDialog,
  setSnackbarMessage,
  setOpenSnackbar,
  setSnackbarSeverity
) => {
  try {
    const companyCode = getCompanyCode();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${deletionID}?company_code=${encodeURIComponent(companyCode)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-company-code": companyCode,
        },
      }
    );
    // console.log(response);
    // Handle specific status codes
    if (response.status === 409) {
      setOpenSnackbar(true);
      setSnackbarMessage("Cannot Delete Vehicle - Appointments Exist.");
      setSnackbarSeverity("error");
      return;
    }

    if (response.status === 404) {
      setOpenSnackbar(true);
      setSnackbarMessage("Appointment not found.");
      setSnackbarSeverity("warning");
      return;
    }

    if (!response.ok) {
      setOpenSnackbar(true);
      setSnackbarMessage("Failed to delete Appointment");
      setSnackbarSeverity("error");
    }

    // Successful deletion
    setOpenSnackbar(true);
    setSnackbarMessage("Appointment deleted successfully.");
    setSnackbarSeverity("success");

    setOpenDeleteDialog(false);
    location.reload();
  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage("Jobcard not deleted - ");
    setSnackbarSeverity("error");
  }
};
