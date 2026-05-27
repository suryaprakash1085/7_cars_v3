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
} from "../../../../controllers/estimateControllers";

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
import AddIcon from "@mui/icons-material/Add";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AddCustomer from "@/components/addcust";
import OldCustomerModal from "@/components/OldCustomerModal";

export default function JobCard() {
  const router = useRouter();

  const [token, setToken] = useState();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, 
    setFilteredEntries] = useState([]);
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
  const [openAddCustomerModal, setOpenAddCustomerModal] = useState(false);
  const [openOldCustomerModal, setOpenOldCustomerModal] = useState(false);
  const [selectedOldCustomer, setSelectedOldCustomer] = useState(null);

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
      setSnackbarSeverity,
      startDate,
      endDate,
      
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
      truncate: 20,
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
  handleSearch(entries, searchText, "", setFilteredEntries, token);
};

  const handleRowClick = (row) => {
    router.push(`/views/estimate/${row.appointment_id}`);
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
 
 const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatDate(firstDay);
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return formatDate(today);
  });

  return (
    <div>
      <DynamicListTable
        title="Estimate Appointments"
        columns={columns}
        data={entries}
        filteredData={filteredEntries}
        loading={loading}
        searchText={searchText}
        onSearchChange={(e) => setSearchText(e.target.value)}
        onSearchSubmit={handleSearchSubmit}
        onRowClick={handleRowClick}
         dateFilters={[
          {
            label: "Start Date",
            value: startDate,
            onChange: (e) => {
              const newStart = e.target.value;
              if (newStart === startDate) return;
              setStartDate(newStart);
             if (newStart && endDate) {
  fetchEntries(
    token,
    setEntries,
    setFilteredEntries,
    setLoading,
    setOpenSnackbar,
    setSnackbarMessage,
    setSnackbarSeverity,
    newStart,
    endDate
  );
}
            },
          },
          {
            label: "End Date",
            value: endDate,
            onChange: (e) => {
              const newEnd = e.target.value;
              if (newEnd === endDate) return;
              setEndDate(newEnd);
              if (startDate && newEnd) {
  fetchEntries(
    token,
    setEntries,
    setFilteredEntries,
    setLoading,
    setOpenSnackbar,
    setSnackbarMessage,
    setSnackbarSeverity,
    startDate,
    newEnd
  );
}
            },
          },
        ]}
        extraControls={[
          <Tooltip key="add-customer" title="Add Customer" placement="top">
            <IconButton
              onClick={() => {
                setOpenOldCustomerModal(true);
              }}
              sx={{
                borderRadius: 1,
                padding: "9px 10px",
                backgroundColor: "white",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ]}
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

      {/* Modal for OldCustomer Selection */}
      <OldCustomerModal
        open={openOldCustomerModal}
        onClose={() => setOpenOldCustomerModal(false)}
        onSelectCustomer={(customer) => {
          setSelectedOldCustomer(customer);
          setOpenOldCustomerModal(false);
          setOpenAddCustomerModal(true);
        }}
        onCreateNew={() => {
          setSelectedOldCustomer(null);
          setOpenAddCustomerModal(true);
        }}
      />

      <Dialog
        open={openAddCustomerModal}
        maxWidth="md"
        fullWidth
      >
        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenAddCustomerModal(false);
            setSelectedOldCustomer(null);
          }}
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
          <AddCustomer
            salesType=" Estimate Appointment"
            selectedCustomer={selectedOldCustomer}
            onClose={() => {
              setOpenAddCustomerModal(false);
              setSelectedOldCustomer(null);
            }}
            routerPush="estimate"
            onSuccess={() => {
              setOpenAddCustomerModal(false);
              setSelectedOldCustomer(null);
              fetchEntries(
                token,
                setEntries,
                setFilteredEntries,
                setLoading,
                setOpenSnackbar,
                setSnackbarMessage,
                setSnackbarSeverity
              );
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
