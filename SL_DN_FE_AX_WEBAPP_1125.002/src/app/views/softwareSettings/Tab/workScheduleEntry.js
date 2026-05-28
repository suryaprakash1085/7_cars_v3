"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

export default function WorkScheduleEntry() {
  const [rows, setRows] = useState([]);
  const [token, setToken] = useState("");
  const [rolename, setRole] = useState("");
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [newShift, setNewShift] = useState({
    description: "",
    days: [],
    startTime: "",
    endTime: "",
    startdate: "",
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // Fetch all work schedules on component mount
    const token = Cookies.get("token");
    fetch(`${apiUrl}/workschedule`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => setRows(data))
      .catch((error) => console.log("Error fetching work schedules:", error));
  }, [apiUrl]);

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);

    const role = Cookies.get("role");
    setRole(role);
  }, []);

  const handleOpenEditModal = (index) => {
    const shiftToEdit = rows.find((row) => row.id === index);

    if (!shiftToEdit) {
      console.log("Shift to edit is undefined");
      return;
    }

    console.log({ shiftToEdit });
    console.log({ "shiftToEdit.startdate": shiftToEdit.startdate });

    // Ensure the date is parsed correctly by specifying the format
    const startdd = shiftToEdit.startdate;
    // ? dayjs(shiftToEdit.startdate, "DD/MM/YYYY").format("YYYY-MM-DD")
    // : "Invalid Date";

    console.log({ startdd });

    const newData = {
      description: shiftToEdit.description || "",
      days: shiftToEdit.days
        ? shiftToEdit.days.replace(/'/g, "").split(", ").filter(Boolean)
        : [],
      startTime: shiftToEdit.time ? shiftToEdit.time.split("-")[0] : "",
      endTime: shiftToEdit.time ? shiftToEdit.time.split("-")[1] : "",
      startdate: shiftToEdit.startdate
        ? dayjs(shiftToEdit.startdate).format("YYYY-MM-DD")
        : "",
    };

    console.log({ newData });

    setNewShift(newData);

    setEditingRowIndex(index);
    setOpenCreateModal(true);
  };

  const handleCreateOrUpdateShift = () => {
    const start = dayjs(`2022-01-01 ${newShift.startTime}`);
    const end = dayjs(`2022-01-01 ${newShift.endTime}`);
    const duration = end.diff(start, "hour");

    if (newShift.startTime === newShift.endTime) {
      setSnackbar({
        open: true,
        message: "Start time and end time cannot be the same.",
        severity: "error",
      });
      return;
    }

    if (duration > 12) {
      setSnackbar({
        open: true,
        message: "Shift duration cannot exceed 12 hours.",
        severity: "error",
      });
      return;
    }

    const newShiftData = {
      description: newShift.description,
      days: newShift.days ? newShift.days.join(", ") : "",
      time: `${start.format("hh:mm A")}-${end.format("hh:mm A")}`,
      startdate: newShift.startdate
        ? dayjs(newShift.startdate).format("YYYY-MM-DD")
        : "",
      type: "Regular",
      ...(editingRowIndex !== null && { id: editingRowIndex }),
    };

    console.log("New Shift Data:", newShiftData);
    console.log("Editing Row Index ID:", editingRowIndex);

    const url =
      editingRowIndex !== null
        ? `${apiUrl}/workschedule/${editingRowIndex}`
        : `${apiUrl}/workschedule`;
    const method = editingRowIndex !== null ? "PUT" : "POST";

    console.log({ newShiftData });

    fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newShiftData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (editingRowIndex !== null) {
          // Update existing shift
          setRows((prevRows) => {
            const updatedRows = [...prevRows];
            updatedRows[editingRowIndex] = data.schedule;
            return updatedRows;
          });
          setSnackbar({
            open: true,
            message: "Shift updated successfully",
            severity: "success",
          });
        } else {
          // Add new shift
          setRows((prevRows) => [...prevRows, data.schedule]);
          setSnackbar({
            open: true,
            message: "Shift created successfully",
            severity: "success",
          });
        }
        handleCloseCreateModal();
        window.location.reload();
        // router.refresh();
      })
      .catch((error) => {
        console.log("Error creating/updating shift:", error);
        setSnackbar({
          open: true,
          message: "Error creating/updating shift",
          severity: "error",
        });
      });
  };

  const handleDeleteRow = (id) => {
    setDeleteRowId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = (
    token,
    setRows,
    deleteRowId,
    setOpenDeleteDialog,
    setSnackbar
  ) => {
    fetch(`${apiUrl}/workschedule/${deleteRowId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          setRows((prevRows) =>
            prevRows.filter((row) => row.id !== deleteRowId)
          );
          setSnackbar({
            open: true,
            message: "Shift deleted successfully",
            severity: "success",
          });
        } else {
          throw new Error("Failed to delete shift");
        }
      })
      .catch((error) => {
        console.log("Error deleting shift:", error);
        setSnackbar({
          open: true,
          message: "Error deleting shift",
          severity: "error",
        });
      })
      .finally(() => {
        setOpenDeleteDialog(false);
      });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleOpenCreateModal = () => {
    setEditingRowIndex(null);
    setNewShift({
      description: "",
      days: [],
      startTime: "",
      endTime: "",
      startdate: dayjs().format("YYYY-MM-DD"),
    });
    setOpenCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
    setNewShift({
      description: "",
      days: [],
      startTime: "",
      endTime: "",
      startdate: "",
    });
  };

  const handleSelectAllDays = (isChecked) => {
    if (isChecked) {
      setNewShift({
        ...newShift,
        days: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      });
    } else {
      setNewShift({ ...newShift, days: [] });
    }
  };

  const getCurrentDateForInput = () => {
    const currentDate = new Date();
    return currentDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", md: "2rem" },
            }}
          >
            Work Schedule
          </Typography>
        </Box>
        <Tooltip title="Add Shift">
          <IconButton
            variant="contained"
            onClick={handleOpenCreateModal}
            sx={{ height: "40px", backgroundColor: "pink" }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ height: "60vh", display: "flex", flexDirection: "column" }}>
        <TableContainer
          component={Paper}
          sx={{
            maxWidth: "100%",
            flexGrow: 1,
            overflow: "auto",
            "& .MuiTable-root": {
              tableLayout: "fixed",
              width: "100%",
            },
          }}
        >
          <Table
            stickyHeader
            sx={{ minWidth: { xs: "100%", sm: 650 } }}
            aria-label="simple table"
          >
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .filter((row) => {
                  // Ensure row is defined and check if id is not referenced by any updated_id
                  return (
                    row &&
                    !rows.some(
                      (otherRow) =>
                        otherRow && otherRow.updated_id === row.id.toString()
                    )
                  );
                })
                .map((row, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">
                      {row.description}
                    </TableCell>
                    <TableCell>
                      {row.days
                        ? row.days
                            .replace(/'/g, "")
                            .split(", ")
                            .map((day) => day.substring(0, 3))
                            .join(", ")
                        : ""}
                    </TableCell>
                    <TableCell>{row.time}</TableCell>
                    {/* <TableCell>{row.startdate}</TableCell> */}
                    <TableCell>
                      {row.startdate
                        ? dayjs(row.startdate).format("DD/MM/YYYY")
                        : ""}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenEditModal(row.id)}>
                        <EditIcon />
                      </IconButton>
                      <span>
                        <IconButton
                          disabled={rolename !== "Admin"}
                          onClick={() => handleDeleteRow(row.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openCreateModal} onClose={handleCloseCreateModal}>
        <DialogTitle>
          {editingRowIndex !== null ? "Edit Shift" : "Create Shift"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Description"
            value={newShift.description}
            onChange={(e) =>
              setNewShift({ ...newShift, description: e.target.value })
            }
            fullWidth
            margin="dense"
          />
          <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newShift.days?.length === 7}
                  onChange={(e) => handleSelectAllDays(e.target.checked)}
                />
              }
              label="Select All"
            />
            <Box sx={{ display: "flex" }}>
              {["Sunday", "Monday", "Tuesday", "Wednesday"].map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      checked={newShift.days?.includes(day) || false}
                      onChange={(e) => {
                        const newDays = e.target.checked
                          ? [...(newShift.days || []), day]
                          : (newShift.days || []).filter((d) => d !== day);
                        setNewShift({ ...newShift, days: newDays });
                      }}
                    />
                  }
                  label={day}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex" }}>
              {["Thursday", "Friday", "Saturday"].map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      checked={newShift.days?.includes(day) || false}
                      onChange={(e) => {
                        const newDays = e.target.checked
                          ? [...(newShift.days || []), day]
                          : (newShift.days || []).filter((d) => d !== day);
                        setNewShift({ ...newShift, days: newDays });
                      }}
                    />
                  }
                  label={day}
                />
              ))}
            </Box>
          </Box>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TimePicker
                label="Start Time"
                value={dayjs(`2022-01-01 ${newShift.startTime || ""}`)}
                onChange={(newValue) =>
                  setNewShift({
                    ...newShift,
                    startTime: newValue.format("HH:mm"),
                  })
                }
                ampm={true}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
              <TimePicker
                label="End Time"
                value={dayjs(`2022-01-01 ${newShift.endTime || ""}`)}
                onChange={(newValue) =>
                  setNewShift({
                    ...newShift,
                    endTime: newValue.format("HH:mm"),
                  })
                }
                ampm={true}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <DatePicker
                label="Start Date"
                value={
                  newShift.startdate
                    ? dayjs(newShift.startdate, "YYYY-MM-DD")
                    : dayjs()
                }
                onChange={(newValue) =>
                  setNewShift({
                    ...newShift,
                    startdate: newValue ? newValue.format("YYYY-MM-DD") : "",
                  })
                }
                minDate={dayjs()}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateModal}>Cancel</Button>
          <Button onClick={handleCreateOrUpdateShift} variant="contained">
            {editingRowIndex !== null ? "Update Shift" : "Add Shift"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this shift? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() =>
              confirmDelete(
                token,
                setRows,
                deleteRowId,
                setOpenDeleteDialog,
                setSnackbar
              )
            }
            color="error"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
