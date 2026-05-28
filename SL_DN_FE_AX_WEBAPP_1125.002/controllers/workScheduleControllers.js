import Cookies from "js-cookie";
const handleOpenDialog = (setIsEditMode, setIsDialogOpen) => {
  setIsEditMode(false);
  setIsDialogOpen(true);
};

const handleCloseDialog = (setIsDialogOpen) => {
  setIsDialogOpen(false);
};
// const token = Cookies.get("token");
const fetchUsers = async (setUsers, token) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  setUsers(data);
  console.log("Users", data);
};

const fetchWorkSchedule = async (setWorkSchedules, token) => {
  console.log(token);
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/workschedule`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  setWorkSchedules(data);
  console.log("Work Schedule", data);
};

const getShiftDescription = (shiftType, workSchedules) => {
  const schedule = workSchedules.find((schedule) => schedule.id === shiftType);
  return schedule ? schedule.description : "N/A";
};

const submitWorkSchedule = async (user, setIsDialogOpen, setSnackbar, token) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/shift/update-shift-type`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const result = await response.json();
    console.log("Success:", result);
    window.location.reload();
  } catch (error) {
    console.log("Error:", error);
  }

  try {
    const reportResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workschedule/report/work_report`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      }
    );

    let reportResponseData = await reportResponse.json();

    if (!reportResponse.ok) {
      throw new Error("Failed to send report data");
    }
    console.log("Report data sent successfully", reportResponseData);

    console.log("Report data sent successfully");
  } catch (error) {
    console.log("Error sending report data:", error);
    setSnackbar({
      open: true,
      message: "Error sending report data",
      severity: "error",
    });
  }

  handleCloseDialog(setIsDialogOpen);
};

const handleDelete = async (user, setSnackbar, token) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/shift/null-shift-type`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.user_id }),
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    window.location.reload();
  } catch (error) {
    console.error("Error:", error);
    setSnackbar({
      open: true,
      message: "Failed to delete shift",
      severity: "error",
    });
  }
};

const handleEdit = (user, workSchedules, setSelectedEmployee, setSelectedShiftType, setIsEditMode, setIsDialogOpen) => {
  console.log("Edit user_id:", user.user_id);
  const shift = workSchedules.find(schedule => schedule.id === user.shift_type);
  setSelectedEmployee(user);
  setSelectedShiftType(shift);
  setIsEditMode(true);
  setIsDialogOpen(true);
};

export {
  handleOpenDialog,
  handleCloseDialog,
  fetchUsers,
  fetchWorkSchedule,
  getShiftDescription,
  submitWorkSchedule,
  handleDelete,
  handleEdit,
};
