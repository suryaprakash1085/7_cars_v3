"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";

import {
  fetchEntries,
  handleSearch,
  deleteAppointment,
  updateAppointment,
  handleScrollToTop,
  scrollToTopButtonDisplay,companydetails,
} from "../../../../controllers/estimateControllers";

import DynamicListTable from "@/components/DynamicListTable";
import {
  Dialog, DialogContent, DialogActions, Button,
  TextField, Typography, Box, IconButton, Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import AddCustomer from "@/components/addcust";
import OldCustomerModal from "@/components/OldCustomerModal";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// const limit = 20;

export default function JobCard() {
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
  const [openAddCustomerModal, setOpenAddCustomerModal] = useState(false);
  const [openOldCustomerModal, setOpenOldCustomerModal] = useState(false);
  const [selectedOldCustomer, setSelectedOldCustomer] = useState(null);
  const [limit, setLimit] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));

  //   Refs for scroll pagination
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


  useEffect(() => {
  const fetchCompanyDetails = async () => {
    try {
      const details = await companydetails();
      if (details?.company_details?.length > 0) {
        const fetchLimit = Number(details.company_details[0].fetch_limit) || 20;
        setLimit(fetchLimit);
      }
    } catch (err) {
      console.log(err);
    }
  };
  fetchCompanyDetails();
}, []);

  //   Initial load / date change
//   Initial load / date change
useEffect(() => {
  if (limit === null) return;

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
    storedToken,
    setEntries,
    setFilteredEntries,
    setLoading,
    setOpenSnackbar,
    setSnackbarMessage,
    setSnackbarSeverity,
    startDate,
    endDate,
    limit,
    0,
    false
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
}, [startDate, endDate, limit]);
  //   Scroll handler
  const handleScroll = (event) => {
    scrollToTopButtonDisplay(event, setShowFab);

    const { scrollTop, scrollHeight, clientHeight } = event.target;

    if (searchTextRef.current) return;
    if (!hasMoreRef.current) return;
    if (loadingRef.current) return;

    if (scrollHeight - scrollTop <= clientHeight + 200) {
      console.log("  API calling offset:", offsetRef.current);
      loadingRef.current = true;

      fetchEntries(
        tokenRef.current,
        setEntries,
        noOp,
        setLoading,
        setOpenSnackbar,
        setSnackbarMessage,
        setSnackbarSeverity,
        startDateRef.current,
        endDateRef.current,
        limit,
        offsetRef.current,
        true
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
    { key: "customer_name", label: "Customer Name", minWidth: "150px", truncate: 20 },
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
    handleSearch(entries, searchText, "", setFilteredEntries, token);
  };

  const handleRowClick = (row) => {
    router.push(`/views/estimate/${row.appointment_id}`);
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
        title="Estimate Appointments"
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
        extraControls={[
          <Tooltip key="add-customer" title="Add Customer" placement="top">
            <IconButton onClick={() => setOpenOldCustomerModal(true)}
              sx={{ borderRadius: 1, padding: "9px 10px", backgroundColor: "white", "&:hover": { backgroundColor: "#f5f5f5" } }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ]}
        snackbar={{
          open: openSnackbar, message: snackbarMessage,
          severity: snackbarSeverity, onClose: () => setOpenSnackbar(false),
        }}
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
        <IconButton onClick={() => setAppointmentEditModalOpen(false)}
          sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
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

      {/* Old Customer Modal */}
      <OldCustomerModal
        open={openOldCustomerModal}
        onClose={() => setOpenOldCustomerModal(false)}
        onSelectCustomer={(customer) => {
          setSelectedOldCustomer(customer);
          setOpenOldCustomerModal(false);
          setOpenAddCustomerModal(true);
        }}
        onCreateNew={() => { setSelectedOldCustomer(null); setOpenAddCustomerModal(true); }}
      />

      {/* Add Customer Dialog */}
      <Dialog open={openAddCustomerModal} maxWidth="md" fullWidth>
        <IconButton onClick={() => { setOpenAddCustomerModal(false); setSelectedOldCustomer(null); }}
          sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <AddCustomer
            salesType="Estimate Appointment"
            selectedCustomer={selectedOldCustomer}
            onClose={() => { setOpenAddCustomerModal(false); setSelectedOldCustomer(null); }}
            routerPush="estimate"
            onSuccess={() => {
              setOpenAddCustomerModal(false);
              setSelectedOldCustomer(null);
              fetchEntries(token, setEntries, setFilteredEntries, setLoading, setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity, startDate, endDate, limit, 0, false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}