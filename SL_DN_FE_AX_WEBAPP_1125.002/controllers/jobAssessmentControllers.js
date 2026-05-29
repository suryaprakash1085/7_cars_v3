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

    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    ["scheduled", "released"].forEach((s) => params.append("status", s));
    params.append("limit", limit);
    params.append("offset", offset);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

    const json = await response.json();
    const rawData = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    const total = json.total ?? rawData.length;

    // ✅ filter valid services
    const filteredData = rawData.filter((entry) => {
       return entry.status === "scheduled" || entry.status === "released";
      // if (!validStatus) return false;
      // if (!entry.services_actual || entry.services_actual.length === 0) return false;
      // return entry.services_actual.some(
      //   (s) => s.service_description && s.service_description.trim() !== ""
      // );
    });

  //  after — deduplicate by appointment_id
if (append) {
  setEntries((prev) => {
    const existingIds = new Set(prev.map((e) => e.appointment_id));
    const unique = filteredData.filter((e) => !existingIds.has(e.appointment_id));
    return [...prev, ...unique];
  });
  setFilteredEntries((prev) => {
    const existingIds = new Set(prev.map((e) => e.appointment_id));
    const unique = filteredData.filter((e) => !existingIds.has(e.appointment_id));
    return [...prev, ...unique];
  });
} else {
  console.log("Resetting entries with new data", filteredData);
  setEntries(filteredData);
  setFilteredEntries(filteredData);
}

    setLoading(false);
    return { data: filteredData, total };

  } catch (err) {
    setOpenSnackbar(true);
    setSnackbarMessage(err.message);
    setSnackbarSeverity("error");
    setLoading(false);
    return { data: [], total: 0 };
  }
}


export const handleScrollToTop = () => {
  const container = document.getElementById("scrollable-table");
  if (container) container.scrollTo({ top: 0, behavior: "smooth" });
};

export const scrollToTopButtonDisplay = (event, setShowFab) => {
  const { scrollTop } = event.target;
  setShowFab(scrollTop > 10);
};

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

    // Apply service_description filter to search results
    const filteredResults = results.filter((entry) => {
      if (!entry.services_actual || entry.services_actual.length === 0) {
        return false;
      }
      const hasValidService = entry.services_actual.some(
        (service) => service.service_description && service.service_description.trim() !== ""
      );
      return hasValidService;
    });

    setFilteredEntries(filteredResults);
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

      const matchesSearch = (
        vehicleId.includes(lowerQuery) ||
        appointmentId.includes(lowerQuery) ||
        customerName.includes(lowerQuery) ||
        phone.includes(lowerQuery) ||
        plateNumber.includes(lowerQuery)
      );

      // Also apply service_description filter
      if (!matchesSearch) return false;

      if (!row.services_actual || row.services_actual.length === 0) {
        return false;
      }
      const hasValidService = row.services_actual.some(
        (service) => service.service_description && service.service_description.trim() !== ""
      );
      return hasValidService;
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
    handleSearch(setFilteredEntries, entries, searchText, selectedOption);
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
  router.push(`/views/jobAssessment/${appointmentId}`);
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/dt/${editAppointmentData.appointment_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editAppointmentData),
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${deletionID}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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
