"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";

import {
  fetchEntries,
  handleSearch,
  deleteAppointment,
  updateAppointment,
} from "../../../../controllers/jobAssessmentControllers";

import DynamicListTable from "@/components/DynamicListTable";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletionID, setDeletionID] = useState();
  const [appointmentEditModalOpen, setAppointmentEditModalOpen] = useState(false);
  const [editAppointmentData, setEditAppointmentData] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);

    fetchEntries(
      storedToken,
      setEntries,
      setFilteredEntries,
      setLoading,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackbarSeverity
    );
  }, []);

  const columns = [
    {
      key: "plateNumber",
      label: "Plate Number",
      minWidth: "120px",
      format: (value, row) => value || row.vehicle_id || "N/A",
    },
    {
      key: "customer_name",
      label: "Customer Name",
      minWidth: "150px",
      format: (value) => value || "N/A",
    },
    {
      key: "phone",
      label: "Phone",
      minWidth: "120px",
      format: (value, row) => row.contact?.phone || row.phone || "N/A",
    },
    {
      key: "appointment_date",
      label: "Date",
      minWidth: "100px",
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      key: "appointment_time",
      label: "Time",
      minWidth: "80px",
    },
    {
      key: "status",
      label: "Status",
      minWidth: "100px",
    },
    {
      key: "actions",
      label: "Actions",
      minWidth: "100px",
      format: (value, row) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEditAppointmentData(row);
                setAppointmentDate(row.appointment_date?.split("T")[0] || "");
                setAppointmentTime(row.appointment_time || "");
                setAppointmentEditModalOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDeletionID(row.appointment_id);
                setOpenDeleteDialog(true);
              }}
              color="error"
            >
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
    deleteAppointment(
      token,
      deletionID,
      setOpenDeleteDialog,
      setSnackbarMessage,
      setOpenSnackbar,
      setSnackbarSeverity
    );
  };

  const handleUpdateAppointment = () => {
    if (!editAppointmentData) return;

    editAppointmentData.appointment_date = appointmentDate;
    editAppointmentData.appointment_time = appointmentTime;

    updateAppointment(
      token,
      editAppointmentData,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackbarSeverity,
      setAppointmentEditModalOpen
    );
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
        snackbar={{
          open: openSnackbar,
          message: snackbarMessage,
          severity: snackbarSeverity,
          onClose: () => setOpenSnackbar(false),
        }}
        scrollableTableId="scrollable-table"
      />

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogContent>
          <Typography>
            Are you sure you want to delete this appointment? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={appointmentEditModalOpen}
        fullWidth
        maxWidth="sm"
      >
        <IconButton
          aria-label="close"
          onClick={() => setAppointmentEditModalOpen(false)}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent>
          <Typography variant="h6" paddingBottom={2} paddingTop={2}>
            Edit Appointment Details
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              required
              type="date"
              label="Appointment Date"
              size="small"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
            <TextField
              required
              label="Appointment Time"
              size="small"
              type="time"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setAppointmentEditModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateAppointment}
            color="primary"
          >
            Update Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
