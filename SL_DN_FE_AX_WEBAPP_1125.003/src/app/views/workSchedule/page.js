"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import BackButton from "@/components/backButton";
import Cookies from "js-cookie";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Button,
  TextField,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import {
  handleOpenDialog,
  handleCloseDialog,
  fetchUsers,
  fetchWorkSchedule,
  getShiftDescription,
  submitWorkSchedule,
  handleDelete,
  handleEdit,
} from "../../../../controllers/workScheduleControllers";

export default function WorkSchedule() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [workSchedules, setWorkSchedules] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedShiftType, setSelectedShiftType] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchUsers(setUsers, token);
    fetchWorkSchedule(setWorkSchedules, token);
  }, []);

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);
    fetchWorkSchedule(setWorkSchedules, token);
  }, []);

  const handleSubmit = async () => {
    const user = {
      user_id: selectedEmployee.user_id,
      shift_type: selectedShiftType.id,
      description: selectedShiftType.description,
      startdate: selectedShiftType.startdate,
      name: selectedEmployee.firstName + " " + selectedEmployee.lastName,
      phone: selectedEmployee.phone,
      time: selectedShiftType.time,
      days: selectedShiftType.days,
      editdate: dayjs().format("YYYY-MM-DD"),
    };

    console.log("User", user);

    submitWorkSchedule(user, setIsDialogOpen, setSnackbar, token);
  };

  const handleDeleteClick = (user) => {
    handleDelete(user, setSnackbar, token);
  };
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {/* <Navbar pageName="Work Schedule" /> */}
      {pageType !== "tab" && <Navbar pageName="Work Schedule" />}
      <Box
        sx={{
          backgroundSize: "cover",
          minHeight: "90vh",
        }}
      >
        <Box paddingX="1%">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex" }}>
              {/* <BackButton />
              <h1 style={{ marginLeft: "10px", color: "white" }}>
                Work Schedule
              </h1> */}
            </div>
          </div>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <Button
            variant="contained"
            style={{ marginRight: "2%", marginBottom: "1%" }}
            onClick={() => handleOpenDialog(setIsEditMode, setIsDialogOpen)}
          >
            Create Shift
          </Button>
        </Box>

        <Box
          sx={{
            height: "50vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <TableContainer
            component={Paper}
            sx={{
              maxWidth: "96%",
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
                  <TableCell>Employee Name</TableCell>
                  <TableCell align="right">Phone Number</TableCell>
                  <TableCell align="right">Shift Type</TableCell>
                  <TableCell align="right">Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users
                  .filter((user) => user.shift_type !== null)
                  .map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell align="right">{user.phone}</TableCell>
                      <TableCell align="right">
                        {getShiftDescription(user.shift_type, workSchedules)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="edit"
                          onClick={() =>
                            handleEdit(
                              user,
                              workSchedules,
                              setSelectedEmployee,
                              setSelectedShiftType,
                              setIsEditMode,
                              setIsDialogOpen
                            )
                          }
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Dialog
          open={isDialogOpen}
          // onClose={() => handleCloseDialog(setIsDialogOpen)}
        >
          <DialogTitle>
            {isEditMode ? "Edit Shift" : "Create Shift"}
          </DialogTitle>
          <DialogContent>
            <Autocomplete
              options={users.filter(
                (user) =>
                  user.shift_type == null ||
                  user.user_id === selectedEmployee?.user_id
              )}
              getOptionLabel={(option) =>
                `${option.firstName} ${option.lastName}`
              }
              value={selectedEmployee}
              onChange={(event, newValue) => setSelectedEmployee(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Employee Name"
                  margin="dense"
                  fullWidth
                  disabled={isEditMode}
                />
              )}
            />
            <TextField
              disabled
              value={selectedEmployee ? selectedEmployee.phone : ""}
              fullWidth
              margin="dense"
            />
            <Autocomplete
              options={workSchedules.filter(
                (schedule) => schedule.enddate == "9999-12-31"
              )}
              getOptionLabel={(option) => option.description}
              value={selectedShiftType}
              onChange={(event, newValue) => setSelectedShiftType(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Shift Type"
                  margin="dense"
                  fullWidth
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleCloseDialog(setIsDialogOpen)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit}>
              {isEditMode ? "Update" : "Submit"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={false}
          autoHideDuration={4000}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert severity="success" sx={{ width: "100%" }}>
            Message
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}
