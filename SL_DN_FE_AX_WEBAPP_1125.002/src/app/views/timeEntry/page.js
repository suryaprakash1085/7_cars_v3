"use client";
//React and Next imports
import React, { useState, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Cookies from "js-cookie";

// Component imports - Alphabetical
import BackButton from "@/components/backButton";
import Navbar from "@/components/navbar";

// Functional package imports - Alphabetical
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  getWeeksInMonth,
  getWeekOfMonth,
} from "date-fns";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

// UI package imports - Alphabetical
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Checkbox,
  useMediaQuery,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { useTheme } from "@mui/material/styles";

import {
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
} from "../../../../controllers/timeEntryControllers";

// Images and icon imports - Alphabetical
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";

export default function TimeEntry() {
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down("sm")); // Mobile view
  const isTabletView = useMediaQuery(theme.breakpoints.between("sm", "md")); // Tablet view

  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(new Date(), "yyyy-MM")
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("");
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [newShift, setNewShift] = useState({
    name: "",
    type: "",
    start: "",
    end: "",
    description: "",
    color: "",
  });
  const [token, setToken] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [monthPickerAnchor, setMonthPickerAnchor] = useState(null);
  const [weekPickerAnchor, setWeekPickerAnchor] = useState(null);
  const [isLeave, setIsLeave] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
const [workReport, setWorkReport] = useState([]);

  const [loading, setLoading] = useState(true);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);

  const filteredEmps = filteredEmployees(employees, searchTerm, department);

  const getWeekDates = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
    return Array.from({ length: 7 }).map((_, index) => addDays(start, index));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handlePrevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleMonthClick = (event) => {
    setMonthPickerAnchor(event.currentTarget);
  };

  const handleMonthClose = () => {
    setMonthPickerAnchor(null);
  };

  const handleWeekSelect = (weekStart) => {
    setCurrentDate(weekStart);
    setWeekPickerAnchor(null);
    setMonthPickerAnchor(null);
  };

  const getMonthWeeks = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const weeks = [];

    let currentWeekStart = startOfWeek(start, { weekStartsOn: 1 });

    while (currentWeekStart <= end) {
      weeks.push(currentWeekStart);
      currentWeekStart = addWeeks(currentWeekStart, 1);
    }

    return weeks;
  };

  const isCurrentWeek = (weekStart) => {
    const weekEnd = addDays(weekStart, 6);
    return currentDate >= weekStart && currentDate <= weekEnd;
  };

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);
 fetchData(setUsers, setEmployees, token, setWorkReport);
    setLoading(false);
  }, []);

  const handleDeleteShiftConfirmation = (shift) => {
    setShiftToDelete(shift);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteShift = async () => {
    if (!selectedEmployee || !shiftToDelete) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/time/time-entry/${shiftToDelete.id}`,
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

      await fetchData(setUsers, setEmployees, token);

      handleMenuClose(setAnchorEl, setSelectedShift);
      setSnackbarMessage("Shift deleted successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.log("Error deleting shift:", error);
      setSnackbarMessage("Failed to delete shift");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setConfirmDeleteOpen(false);
      setShiftToDelete(null);
    }
  };
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {/* <Navbar pageName="Time Entry" /> */}
      {pageType !== "tab" && <Navbar pageName="Time Entry" /> }
      <Box sx={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {/* <BackButton />
          <h1 className="text-2xl font-bold mb-4">Time Entry</h1> */}
        </div>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexDirection: isMobileView ? "column" : "row",
            justifyContent: "flex-end",
          }}
        >
          <TextField
            placeholder="Search..."
            variant="outlined"
            size="small"
            sx={{ backgroundColor: "white", borderRadius: 1 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // fullWidth
          />
          {/* <Select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Department</MenuItem>
            <MenuItem value="management">Management</MenuItem>
            <MenuItem value="engineering">Engineering</MenuItem>
            <MenuItem value="hr">HR</MenuItem>
          </Select> */}
        </Box>
        {isMobileView || isTabletView ? (
          // Mobile View
          <Box>
            {/* Mobile-specific layout */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                backgroundColor: "white",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <IconButton onClick={handlePrevWeek}>
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>
              <Typography
                variant="subtitle1"
                onClick={handleMonthClick}
                sx={{ cursor: "pointer" }}
              >
                {format(currentDate, "MMMM yyyy")}
              </Typography>
              <IconButton onClick={handleNextWeek}>
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Box>
            {/* jan select that week show in week1 or week2 or week3 or week4 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                backgroundColor: "white",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              {getMonthWeeks(currentDate).map((weekStart, index) => (
                <Typography
                  key={index}
                  variant="subtitle1"
                  sx={{
                    cursor: "pointer",
                    color: isCurrentWeek(weekStart) ? "blue" : "inherit",
                  }}
                >
                  Week {index + 1}
                </Typography>
              ))}
            </Box>
            {/* Employee cards for mobile */}
            <Box>
              {filteredEmps.map((employee) => (
                <Card key={employee.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{employee.name}</Typography>
                    {getWeekDates().map((date) => (
                      <Box key={date.toString()} sx={{ mt: 1 }}>
                        <Typography variant="subtitle2">
                          {format(date, "EEE, dd/MM/yyyy")}
                        </Typography>
                        {sortedShifts(employee.shifts)
                          .filter(
                            (shift) =>
                              shift.date === dayjs(date).format("DD/MM/YYYY")
                          )
                          .map((shift) => (
                            <Box
                              key={shift.id}
                              sx={{
                                backgroundColor: shift.color,
                                borderRadius: 1,
                                p: 0.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <AccessTimeIcon fontSize="small" />
                              <Typography
                                variant="caption"
                                sx={{ color: "white" }}
                              >
                                {shift.time}
                              </Typography>
                              <IconButton
                                size="small"
                                sx={{ color: "white" }}
                                onClick={(e) =>
                                  handleMenuOpen(
                                    e,
                                    shift,
                                    setAnchorEl,
                                    setSelectedEmployee,
                                    setSelectedShift,
                                    employees
                                  )
                                }
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        {!employee.shifts.filter(
                          (shift) =>
                            shift.date === dayjs(date).format("DD/MM/YYYY")
                        ).length && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              handleOpenShiftModal(
                                employee,
                                format(date, "dd/MM/yyyy"),
                                setSelectedEmployee,
                                setSelectedDay,
                                setIsLeave,
                                setOpenShiftModal,
                                setNewShift,
                                workReport   
                              )
                            }
                            sx={{ width: "100%", mt: 1 }}
                          >
                            Time Entry
                          </Button>
                        )}
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        ) : (
          // Desktop View
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "200px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        justifyContent: "space-between",
                      }}
                    >
                      Employee
                    </div>
                  </TableCell>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{
                      position: "relative",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconButton
                      onClick={handlePrevWeek}
                      sx={{ position: "absolute", left: 1 }}
                    >
                      <ArrowBackIosIcon fontSize="small" />
                    </IconButton>
                    <Typography
                      variant="subtitle1"
                      onClick={handleMonthClick}
                      sx={{ cursor: "pointer" }}
                    >
                      {format(currentDate, "MMMM yyyy")}
                    </Typography>
                    <IconButton
                      onClick={handleNextWeek}
                      sx={{ position: "absolute", right: 1 }}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Name</TableCell>
                  {getWeekDates().map((date) => (
                    <TableCell key={date.toString()} align="center">
                      <Typography variant="subtitle2">
                        {format(date, "EEE")}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {format(date, "dd/MM/yyyy")}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmps.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {employee.name}
                      </Typography>
                    </TableCell>
                    {getWeekDates().map((date) => (
                      <TableCell key={date.toString()}>
                        <Box sx={{ minHeight: 40, p: 1 }}>
                          {sortedShifts(employee.shifts)
                            .filter(
                              (shift) =>
                                shift.date === dayjs(date).format("DD/MM/YYYY")
                            )
                            .map((shift) => (
                              <Box
                                key={shift.id}
                                sx={{
                                  backgroundColor: shift.color,
                                  borderRadius: 1,
                                  p: 0.5,
                                  mb: 0.5,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <AccessTimeIcon
                                    fontSize="small"
                                    onClick={(e) =>
                                      handleMenuOpen(
                                        e,
                                        shift,
                                        setAnchorEl,
                                        setSelectedEmployee,
                                        setSelectedShift,
                                        employees
                                      )
                                    }
                                    sx={{ cursor: "pointer" }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "white" }}
                                  >
                                    {shift.time}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  sx={{ color: "white" }}
                                  onClick={(e) =>
                                    handleMenuOpen(
                                      e,
                                      shift,
                                      setAnchorEl,
                                      setSelectedEmployee,
                                      setSelectedShift,
                                      employees
                                    )
                                  }
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          {!employee.shifts.filter(
                            (shift) =>
                              shift.date === dayjs(date).format("DD/MM/YYYY")
                          ).length && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() =>
                                handleOpenShiftModal(
                                  employee,
                                  format(date, "dd/MM/yyyy"),
                                  setSelectedEmployee,
                                  setSelectedDay,
                                  setIsLeave,
                                  setOpenShiftModal,
                                  setNewShift
                                )
                              }
                              sx={{ width: "100%", mt: 1 }}
                            >
                              Time Entry
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog
        open={openShiftModal}
        // onClose={() =>
        //   handleCloseShiftModal(setOpenShiftModal, setEditingShift, setNewShift)
        // }
      >
        <DialogTitle>{editingShift ? "Edit Shift" : "Add Shift"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                checked={isLeave}
                onChange={(e) => {
                  setIsLeave(e.target.checked);
                  if (!e.target.checked) {
                    setNewShift((prevShift) => ({
                      ...prevShift,
                      start: "",
                      end: "",
                    }));
                  }
                }}
              />
              <Typography>Leave</Typography>
            </Box>
            {!isLeave && (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  placeholder="Start Time"
                  value={
                    newShift.start ? dayjs(newShift.start, "hh:mm A") : null
                  }
                  onChange={(newValue) =>
                    setNewShift({
                      ...newShift,
                      start: newValue ? newValue.format("hh:mm A") : "",
                    })
                  }
                  ampm={true}
                />
                <TimePicker
                  placeholder="End Time"
                  value={newShift.end ? dayjs(newShift.end, "hh:mm A") : null}
                  onChange={(newValue) =>
                    setNewShift({
                      ...newShift,
                      end: newValue ? newValue.format("hh:mm A") : "",
                    })
                  }
                  ampm={true}
                />
              </LocalizationProvider>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              handleCloseShiftModal(
                setOpenShiftModal,
                setEditingShift,
                setNewShift
              )
            }
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const formattedStart = dayjs(newShift.start, "hh:mm A").format(
                "hh:mm A"
              );
              const formattedEnd = dayjs(newShift.end, "hh:mm A").format(
                "hh:mm A"
              );
              let formattedTime = `${formattedStart} - ${formattedEnd}`;
              if (isLeave) {
                formattedTime = "Leave";
              }
              handleSaveShift(
                selectedEmployee,
                selectedDay,
                isLeave,
                { ...newShift, time: formattedTime },
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
                formattedTime,
                token
              );
            }}
            variant="contained"
          >
            {editingShift ? "Save Changes" : "Add Entry"}
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(monthPickerAnchor)}
        anchorEl={monthPickerAnchor}
        onClose={handleMonthClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <TextField
            type="month"
            value={selectedMonth}
            onChange={(e) =>
              handleMonthSelect(
                e.target.value,
                setSelectedMonth,
                setCurrentDate
              )
            }
            sx={{ mb: 2, width: "100%" }}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Select Week:
          </Typography>
          {getMonthWeeks(currentDate).map((weekStart, index) => (
            <Card
              key={weekStart.toString()}
              sx={{
                mb: 1,
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => handleWeekSelect(weekStart)}
            >
              <CardContent>
                <Typography variant="subtitle2">
                  Week {index + 1}: {format(weekStart, "dd MMM")} -{" "}
                  {format(addDays(weekStart, 6), "dd MMM")}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Popover>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleMenuClose(setAnchorEl, setSelectedShift)}
      >
        <MenuItem
          onClick={() =>
            handleEditShift(
              setEditingShift,
              setSelectedDay,
              setNewShift,
              setOpenShiftModal,
              setAnchorEl,
              setSelectedShift,
              selectedShift,
              setIsLeave
            )
          }
        >
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDeleteShiftConfirmation(selectedShift)}>
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this shift?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteShift}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => handleSnackbarClose(setSnackbarOpen)}
      >
        <MuiAlert
          onClose={() => handleSnackbarClose(setSnackbarOpen)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </div>
  );
}
