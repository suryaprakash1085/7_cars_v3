import dayjs from "dayjs";
import Cookies from "js-cookie";

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
  limit = 20,
  offset = 0,
  append = false
) {
  try {
    if (!token) {
      setOpenSnackbar(true);
      setSnackbarMessage("Unauthorized. Please log in with appropriate user credentials.");
      setSnackbarSeverity("error");
      setLoading(false);
      return { data: [], total: 0 };
    }

    const companyCode = getCompanyCode();
    const statuses = ["released", "invoice"];

    const params = new URLSearchParams({
      ...(companyCode && { company_code: companyCode }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    statuses.forEach((s) => params.append("status", s));
    params.append("limit", limit);
    params.append("offset", offset);

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

    const newData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    const total = data.total ?? newData.length;

    if (append) {
      setEntries((prev) => [...prev, ...newData]);
      setFilteredEntries((prev) => [...prev, ...newData]);
    } else {
      setEntries(newData);
      setFilteredEntries(newData);
    }

    setLoading(false);
    return { data: newData, total };

  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage(err.message);
    setSnackbarSeverity("error");
    setLoading(false);
    return { data: [], total: 0 };
  }
}

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
    const arr = Array.isArray(results.data) ? results.data : Array.isArray(results) ? results : [];
    setFilteredEntries(arr);
  } catch (error) {
    console.error("Search error:", error);
    const lowerQuery = searchQuery.toLowerCase();
    const results = entries.filter((row) => {
      return (
        String(row.vehicle_id || "").toLowerCase().includes(lowerQuery) ||
        String(row.appointment_id || "").toLowerCase().includes(lowerQuery) ||
        String(row.customer_name || "").toLowerCase().includes(lowerQuery) ||
        String(row.contact?.phone || row.phone || "").toLowerCase().includes(lowerQuery) ||
        String(row.plateNumber || "").toLowerCase().includes(lowerQuery)
      );
    });
    setFilteredEntries(results);
  }
};

export const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) {
    container.scrollTo({ top: 0, behavior: "smooth" });
  }
};

export const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10);
};

export const handleSearchChange = (event, setSearchText) => {
  setSearchText(event.target.value);
};

export const handleCloseSnackBar = (setOpenSnackbar) => {
  setOpenSnackbar(false);
};

export const handleCardClick = (router, appointmentId) => {
  router.push(`/views/estimate/${appointmentId}`);
};

export const handleCloseAppointmentEditModal = (setAppointmentEditModalOpen) => {
  setAppointmentEditModalOpen(false);
};

export const handleEditClick = (
  e,
  setAppointmentEditModalOpen,
  data,
  setAppointmentDate,
  setAppointmentTime,
  setEditAppointmentData
) => {
  e.stopPropagation();
  setAppointmentDate(dayjs(data.appointment_date).format("YYYY-MM-DD"));
  setAppointmentTime(data.appointment_time);
  setEditAppointmentData(data);
  setAppointmentEditModalOpen(true);
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
        body: JSON.stringify({ ...editAppointmentData, company_code: companyCode }),
      }
    );

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
      setSnackbarMessage("Failed to update Appointment");
      setSnackbarSeverity("error");
      return;
    }

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
      return;
    }

    setOpenSnackbar(true);
    setSnackbarMessage("Appointment deleted successfully.");
    setSnackbarSeverity("success");
    setOpenDeleteDialog(false);
    location.reload();
  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage("Jobcard not deleted");
    setSnackbarSeverity("error");
  }
};


export const companydetails = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/ss`
    );

    const data = await response.json();

    return data;
  } catch (err) {
    console.error("Error fetching company details:", err);
    throw err;
  }
};