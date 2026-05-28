import dayjs from "dayjs";

export async function fetchEntries(
  token,
  setEntries,
  setFilteredEntries,
  setLoading,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity
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

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch entries");

    const data = await response.json();
    setEntries(data);
    setFilteredEntries(data);
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

export const handleSearch = (
  entries,
  searchQuery,
  selectedOption,
  setFilteredEntries
) => {
  if (!searchQuery) {
    setFilteredEntries(entries);
    return;
  }
  console.log("Ent", entries);
  const results = entries.filter((row) => {
    const matchesSearchQuery =
      row.vehicle_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(row.appointmentId).includes(searchQuery);
    return matchesSearchQuery;
  });
  setFilteredEntries(results);
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

export const handleCardClick = (router, 
  
  
) => {
  console.log("Appointment ID:", appointmentId);
  router.push(`/views/stats/${appointmentId}`);
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
  console.log(data);
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
    console.log(response);
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
