"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import {
  fetchEntries, handleSearch,
  deleteAppointment, updateAppointment,
  handleScrollToTop, scrollToTopButtonDisplay,
} from "../../../../controllers/jobAssessmentControllers";
import DynamicListTable from "@/components/DynamicListTable";
import {
  Dialog, DialogContent, DialogActions, Button,
  TextField, Typography, Box, IconButton, Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const limit = 20;

export default function JobAssessment() {
  const router = useRouter();

  const [token, setToken] = useState();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [searchText, setSearchText] = useState("");
  const [showFab, setShowFab] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletionID, setDeletionID] = useState();
  const [appointmentEditModalOpen, setAppointmentEditModalOpen] = useState(false);
  const [editAppointmentData, setEditAppointmentData] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));

  // ✅ Refs
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const totalRef = useRef(0);
  const tokenRef = useRef("");
  const searchTextRef = useRef("");
  const startDateRef = useRef("");
  const endDateRef = useRef("");

  useEffect(() => { searchTextRef.current = searchText; }, [searchText]);
  useEffect(() => { startDateRef.current = startDate; }, [startDate]);
  useEffect(() => { endDateRef.current = endDate; }, [endDate]);

  const noOp = () => {};

  // ✅ Initial load
  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    tokenRef.current = storedToken;
    startDateRef.current = startDate;
    endDateRef.current = endDate;

    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setEntries([]);
    setFilteredEntries([]);

    fetchEntries(
      storedToken, setEntries, setFilteredEntries, setLoading,
      setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity,
      startDate, endDate, limit, 0, false
    ).then((result) => {
      if (!result || result.data.length === 0) {
        hasMoreRef.current = false;
      } else {
        totalRef.current = result.total;
        offsetRef.current = limit;
        hasMoreRef.current = result.total > limit;
      }
      loadingRef.current = false;
    });
  }, [startDate, endDate]);

  // ✅ Scroll handler
  const handleScroll = (event) => {
    scrollToTopButtonDisplay(event, setShowFab);

    const { scrollTop, scrollHeight, clientHeight } = event.target;

    if (searchTextRef.current) return;
    if (!hasMoreRef.current) return;
    if (loadingRef.current) return;

    if (scrollHeight - scrollTop <= clientHeight + 200) {
      console.log("✅ API calling offset:", offsetRef.current);
      loadingRef.current = true;

      fetchEntries(
        tokenRef.current, setEntries, setFilteredEntries, noOp,
        setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity,
        startDateRef.current, endDateRef.current, limit, offsetRef.current, true
      ).then((result) => {
        if (!result || result.data.length === 0) {
          hasMoreRef.current = false;
          loadingRef.current = false;
        } else {
          const newOffset = offsetRef.current + result.data.length;
          offsetRef.current = newOffset;
          if (newOffset >= totalRef.current) {
            hasMoreRef.current = false;
            loadingRef.current = false;
          } else {
            hasMoreRef.current = true;
            loadingRef.current = false;
          }
        }
      });
    }
  };

  const columns = [
    {
      key: "plateNumber", label: "Plate Number", minWidth: "120px",
      format: (value, row) => value || row.vehicle_id || "N/A",
    },
    { key: "customer_name", label: "Customer Name", minWidth: "150px", format: (v) => v || "N/A" },
    {
      key: "phone", label: "Phone", minWidth: "120px",
      format: (value, row) => row.contact?.phone || row.phone || "N/A",
    },
    {
      key: "appointment_date", label: "Date", minWidth: "100px",
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    { key: "appointment_time", label: "Time", minWidth: "80px" },
    { key: "status", label: "Status", minWidth: "100px" },
    {
      key: "actions", label: "Actions", minWidth: "100px",
      format: (value, row) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => {
              e.stopPropagation();
              setEditAppointmentData(row);
              setAppointmentDate(row.appointment_date?.split("T")[0] || "");
              setAppointmentTime(row.appointment_time || "");
              setAppointmentEditModalOpen(true);
            }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={(e) => {
              e.stopPropagation();
              setDeletionID(row.appointment_id);
              setOpenDeleteDialog(true);
            }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleSearchSubmit = () => {
    handleSearch(entries, searchText, "vehicleModel", setFilteredEntries, token);
  };

  const handleRowClick = (row) => {
    router.push(`/views/jobAssessment/${row.appointment_id}`);
  };

  const handleDeleteConfirm = () => {
    deleteAppointment(token, deletionID, setOpenDeleteDialog, setSnackbarMessage, setOpenSnackbar, setSnackbarSeverity);
  };

  const handleUpdateAppointment = () => {
    if (!editAppointmentData) return;
    editAppointmentData.appointment_date = appointmentDate;
    editAppointmentData.appointment_time = appointmentTime;
    updateAppointment(token, editAppointmentData, setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity, setAppointmentEditModalOpen);
  };

  return (
    <div>
      <DynamicListTable
        title="Job Assessment"
        columns={columns}
        data={entries}
        filteredData={filteredEntries}
        loading={loading}
        searchText={searchText}
        onSearchChange={(e) => setSearchText(e.target.value)}
        onSearchSubmit={handleSearchSubmit}
        onRowClick={handleRowClick}
        onScroll={handleScroll}
        scrollableTableId="scrollable-table"
        onScrollToTop={() => { handleScrollToTop(); setShowFab(false); }}
        showScrollFab={showFab}
        snackbar={{
          open: openSnackbar, message: snackbarMessage,
          severity: snackbarSeverity, onClose: () => setOpenSnackbar(false),
        }}
        dateFilters={[
          {
            label: "Start Date", value: startDate,
            onChange: (e) => { if (e.target.value !== startDate) setStartDate(e.target.value); },
          },
          {
            label: "End Date", value: endDate,
            onChange: (e) => { if (e.target.value !== endDate) setEndDate(e.target.value); },
          },
        ]}
      />

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogContent>
          <Typography>Are you sure you want to delete this appointment? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={appointmentEditModalOpen} fullWidth maxWidth="sm">
        <IconButton
          onClick={() => setAppointmentEditModalOpen(false)}
          sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <Typography variant="h6" paddingBottom={2} paddingTop={2}>Edit Appointment Details</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField required type="date" label="Appointment Date" size="small"
              variant="outlined" fullWidth InputLabelProps={{ shrink: true }}
              value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
            <TextField required label="Appointment Time" size="small" type="time"
              variant="outlined" fullWidth InputLabelProps={{ shrink: true }}
              value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppointmentEditModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateAppointment} color="primary">Update Appointment</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}