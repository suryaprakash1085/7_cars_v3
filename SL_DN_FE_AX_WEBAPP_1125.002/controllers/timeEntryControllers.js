import dayjs from "dayjs";

const handleOpenShiftModal = (
  employee,
  date,
  setSelectedEmployee,
  setSelectedDay,
  setIsLeave,
  setOpenShiftModal,
  setNewShift,
  workReport
) => {
  setSelectedEmployee(employee);
  setSelectedDay(date);

  if (!workReport) {
    console.log("Work report is undefined");
    return;
  }

  // Find the work report for the selected employee
  const report = workReport.find((report) => report.user_id === employee.id);

  if (report) {
    const [start, end] = report.time.split("-");
    const dayName = dayjs(date, "DD/MM/YYYY").format("dddd");

    // Check if the selected day is in the report's days
    if (report.days.includes(dayName)) {
      setNewShift((prevShift) => ({
        ...prevShift,
        start: start.trim(),
        end: end.trim(),
      }));
      setIsLeave(false);
    } else {
      // Reset to default if the day is not in the report's days
      setNewShift((prevShift) => ({
        ...prevShift,
        start: "",
        end: "",
      }));
      setIsLeave(true); // Set leave to true if the day is not in the report
    }
  } else {
    // Reset to default if no report is found
    setNewShift((prevShift) => ({
      ...prevShift,
      start: "",
      end: "",
    }));
    setIsLeave(true); // Set leave to true if no report is found
  }

  setOpenShiftModal(true);
};

const handleCloseShiftModal = (
  setOpenShiftModal,
  setEditingShift,
  setNewShift
) => {
  setOpenShiftModal(false);
  setEditingShift(null);
  setNewShift({
    name: "",
    type: "",
    start: "",
    end: "",
    description: "",
    color: "",
  });
};

const handleSnackbarClose = (setSnackbarOpen) => {
  setSnackbarOpen(false);
};

//   const fetchData = async (setUsers, setEmployees) => {
//     try {
//       // Fetch users
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users`);
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
//       const usersData = await response.json();
//       console.log("API Users Data:", usersData);

//       // Filter out users with null shift_type
//       const transformedUsers = usersData
//         .filter(user => user.shift_type !== null) // Filter out users with null shift_type
//         .map(user => ({
//           id: user.user_id,
//           name: `${user.firstName} ${user.lastName}`,
//           department: "Employee",
//           shifts: [], // Initialize with empty shifts
//         }));

//       // Fetch time entries
//       const timeEntriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/time/time-entries`);
//       if (!timeEntriesResponse.ok) {
//         throw new Error('Failed to fetch time entries');
//       }
//       const timeEntries = await timeEntriesResponse.json();
//       console.log("API Time Entries:", timeEntries);

//       // Map time entries to users
//       const usersWithShifts = transformedUsers.map(user => {
//         const userShifts = timeEntries.filter(entry => entry.employeeId === user.id);
//         return {
//           ...user,
//           shifts: userShifts.map(shift => ({
//             ...shift,
//             date: dayjs(shift.date).format('DD/MM/YYYY'), // Format date for display
//           })),
//         };
//       });

//       setUsers(usersWithShifts);
//       setEmployees(usersWithShifts);
//     } catch (error) {
//       console.log("Fetch error:", error);
//     }
//   };

const handleMenuOpen = (
  event,
  shift,
  setAnchorEl,
  setSelectedEmployee,
  setSelectedShift,
  employees
) => {
  event.stopPropagation();
  setAnchorEl(event.currentTarget);
  setSelectedEmployee(
    employees.find((emp) =>
      emp.shifts.some((dayShift) => dayShift.id === shift.id)
    )
  );
  setSelectedShift(shift);
};

const handleMenuClose = (setAnchorEl, setSelectedShift) => {
  setAnchorEl(null);
  setSelectedShift(null);
};

const handleEditShift = (
  setEditingShift,
  setSelectedDay,
  setNewShift,
  setOpenShiftModal,
  setAnchorEl,
  setSelectedShift,
  selectedShift,
  setIsLeave
) => {
  setEditingShift(selectedShift);
  setSelectedDay(selectedShift.date);

  const isLeaveShift = selectedShift.color === "yellow";

  setNewShift({
    name: selectedShift.name || "",
    type: selectedShift.type || "",
    start: isLeaveShift ? "" : selectedShift.time?.split("-")[0].trim() || "",
    end: isLeaveShift ? "" : selectedShift.time?.split("-")[1].trim() || "",
    date: selectedShift.date || "",
    description: selectedShift.description || "",
    color: selectedShift.color || "",
  });

  setIsLeave(isLeaveShift);
  setOpenShiftModal(true);
  handleMenuClose(setAnchorEl, setSelectedShift);
};

const handleDeleteShift = async (
  selectedEmployee,
  handleMenuClose,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  setAnchorEl,
  setSelectedShift,
  selectedShift,
  fetchData,
  setUsers,
  setEmployees,
  token
) => {
  if (!selectedEmployee || !selectedShift) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/time/time-entry/${selectedShift.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete shift");
    }

    // Refresh the data from the backend to ensure the UI is updated
    await fetchData(setUsers, setEmployees);
    handleMenuClose(setAnchorEl, setSelectedShift);
    setSnackbarMessage("Shift deleted successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  } catch (error) {
    console.log("Error deleting shift:", error);
    setSnackbarMessage("Failed to delete shift");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};

const handleMonthSelect = (newMonth, setSelectedMonth, setCurrentDate) => {
  setSelectedMonth(newMonth);
  const [year, month] = newMonth.split("-");
  const newDate = new Date(parseInt(year), parseInt(month) - 1);
  setCurrentDate(newDate);
};

const sortedShifts = (shifts) => {
  return shifts.sort((a, b) => {
    const dateA = dayjs(a.date, "DD/MM/YYYY");
    const dateB = dayjs(b.date, "DD/MM/YYYY");
    return dateA - dateB;
  });
};

const handleSaveShift = async (
  selectedEmployee,
  selectedDay,
  isLeave,
  newShift,
  editingShift,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  fetchData,
  handleCloseShiftModal,
  setOpenShiftModal,
  setEditingShift,
  setNewShift,
  setUsers,
  setEmployees,
  workReport,
  token
) => {
  if (!selectedEmployee || !selectedDay) return;

  // 🔥 FIX: Normalize workReport so .find() NEVER crashes
  let reportArray = [];

  if (Array.isArray(workReport)) {
    reportArray = workReport;
  } else if (Array.isArray(workReport?.data)) {
    reportArray = workReport.data;
  } else if (Array.isArray(workReport?.report)) {
    reportArray = workReport.report;
  } else if (workReport && typeof workReport === "object") {
    reportArray = [workReport];
  } else {
    reportArray = [];
  }

  console.log("Normalized workReport:", reportArray);

  // Check for required fields only for start and end times
  if (!isLeave && (!newShift.start || !newShift.end)) {
    alert("Please fill in the start and end time fields.");
    return;
  }

  // Determine color based on conditions
  let color = "yellow"; // Default for leave

  if (!isLeave) {
    // Find matching work report entry
    const workReportEntry = reportArray.find(
      (entry) => entry.user_id === selectedEmployee.id
    );

    if (workReportEntry) {
      // Normalize time formats
      const normalizeTimeFormat = (timeStr) => {
        return timeStr.replace(/\s+/g, " ").toUpperCase();
      };

      const workReportTime = normalizeTimeFormat(workReportEntry.time);

      // Extract start and end times
      const [startTime, endTime] = workReportTime
        .split("-")
        .map((time) => time.trim());

      const start = dayjs(startTime, "hh:mm A");
      const end = dayjs(endTime, "hh:mm A");
      const workReportTimeTotal = end.diff(start, "minute");
      const workReportTimeHours = Math.floor(workReportTimeTotal / 60);

      const entryTime = normalizeTimeFormat(newShift.time);
      const [newShiftStartTime, newShiftEndTime] = newShift.time
        .split("-")
        .map((time) => time.trim());

      const newShiftStart = dayjs(newShiftStartTime, "hh:mm A");
      const newShiftEnd = dayjs(newShiftEndTime, "hh:mm A");
      const newShiftTimeTotal = newShiftEnd.diff(newShiftStart, "minute");
      const newShiftTimeHours = Math.floor(newShiftTimeTotal / 60);

      // Compare duration, color coding
      color = newShiftTimeHours === workReportTimeHours ? "pink" : "blue";
    } else {
      color = "blue"; // No matching work report entry
    }
  }

  const shiftData = {
    id: editingShift ? editingShift.id : Date.now(),
    time: newShift.time,
    name: selectedEmployee.name,
    color,
    date: dayjs(selectedDay, "DD/MM/YYYY").isValid()
      ? dayjs(selectedDay, "DD/MM/YYYY").format("YYYY-MM-DD")
      : "Invalid Date",
    employeeId: selectedEmployee.id,
  };

  try {
    const method = editingShift ? "PUT" : "POST";
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/time/time-entry${
      editingShift ? `/${editingShift.id}` : ""
    }`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shiftData),
    });

    if (!response.ok) {
      throw new Error(
        editingShift ? "Failed to update shift" : "Failed to save shift"
      );
    }

    await fetchData(setUsers, setEmployees);

    handleCloseShiftModal(setOpenShiftModal, setEditingShift, setNewShift);

    setSnackbarMessage(
      editingShift ? "Shift updated successfully" : "Shift added successfully"
    );
    setSnackbarSeverity("success");
    setSnackbarOpen(true);

  } catch (error) {
    console.log(
      editingShift ? "Error updating shift:" : "Error saving shift:",
      error
    );
    setSnackbarMessage(
      editingShift ? "Failed to update shift" : "Failed to save shift"
    );
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};


const fetchData = async (setUsers, setEmployees, setWorkReport, token) => {
  try {
    // Fetch users
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Network response was not ok");

    const usersData = await response.json();

    const transformedUsers = usersData
      .filter((user) => user.shift_type !== null)
      .map((user) => ({
        id: user.user_id,
        name: `${user.firstName} ${user.lastName}`,
        department: "Employee",
        shifts: [],
      }));

    // Fetch time entries
    const timeEntriesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/time/time-entries`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!timeEntriesResponse.ok) {
      throw new Error("Failed to fetch time entries");
    }

    const timeEntries = await timeEntriesResponse.json();

    const usersWithShifts = transformedUsers.map((user) => {
      const userShifts = timeEntries.filter(
        (entry) => entry.employeeId === user.id
      );

      return {
        ...user,
        shifts: userShifts.map((shift) => ({
          ...shift,
          date: dayjs(shift.date).format("DD/MM/YYYY"),
        })),
      };
    });

    setUsers(usersWithShifts);
    setEmployees(usersWithShifts);

    /*
     * ------------------------------------------
     * FIXED: FETCH WORK REPORT (SAFE NORMALIZATION)
     * ------------------------------------------
     */
    const workReportResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/time/time-entries`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const workReportRaw = await workReportResponse.json();

    // Normalize workReport to always be an ARRAY
    let finalReport = [];

    if (Array.isArray(workReportRaw)) {
      finalReport = workReportRaw;
    } else if (Array.isArray(workReportRaw?.data)) {
      finalReport = workReportRaw.data;
    } else if (Array.isArray(workReportRaw?.report)) {
      finalReport = workReportRaw.report;
    } else if (workReportRaw && typeof workReportRaw === "object") {
      finalReport = [workReportRaw];
    }

    console.log("Final normalized workReport:", finalReport);
    setWorkReport(finalReport);

  } catch (error) {
    console.log("Fetch error:", error);
  }
};


const filteredEmployees = (employees, searchTerm, department) => {
  return employees.filter((employee) => {
    const matchesSearch = employee.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDepartment = !department || employee.department === department;
    return matchesSearch && matchesDepartment;
  });
};

export {
  handleOpenShiftModal,
  handleCloseShiftModal,
  handleSnackbarClose,
  fetchData,
  handleMenuOpen,
  handleMenuClose,
  handleEditShift,
  handleDeleteShift,
  handleMonthSelect,
  sortedShifts,
  handleSaveShift,
  filteredEmployees,
};
