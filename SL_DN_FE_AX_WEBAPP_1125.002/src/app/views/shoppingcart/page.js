"use client";

import Navbar from "../../../components/navbar.js";
import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Box, Tooltip,
  IconButton, Button, TextField, Snackbar, Alert,
  Fab,
} from "@mui/material";
import {
  Dialog, DialogContent, DialogTitle,
  DialogContentText, DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useRouter } from "next/navigation";
import {
  fetchData,
  createCounterSale,
  deleteCTInvoice,
  handleScrollToTop,
  scrollToTopButtonDisplay,
} from "./shoppingcartControllers.js";
import AddCustomer from "@/components/addcust";
import OldCustomerModal from "@/components/OldCustomerModal";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const limit = 20;

const CustomerTable = () => {
  const [token, setToken] = useState();
  const [tableRows, setTableRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [showFab, setShowFab] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false, message: "", severity: "error",
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDeleteItemId, setSelectedDeleteItemId] = useState(null);
  const [openAddCustomerModal, setOpenAddCustomerModal] = useState(false);
  const [openOldCustomerModal, setOpenOldCustomerModal] = useState(false);
  const [selectedOldCustomer, setSelectedOldCustomer] = useState(null);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));

  // ✅ Refs for scroll pagination
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const totalRef = useRef(0);
  const tokenRef = useRef("");
  const startDateRef = useRef("");
  const endDateRef = useRef("");

  useEffect(() => { startDateRef.current = startDate; }, [startDate]);
  useEffect(() => { endDateRef.current = endDate; }, [endDate]);

  // ✅ Initial load / date change
  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    tokenRef.current = storedToken;
    startDateRef.current = startDate;
    endDateRef.current = endDate;

    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setTableRows([]);

    fetchData(storedToken, setLoading, setTableRows, startDate, endDate, limit, 0, false)
      .then((result) => {
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

  // ✅ Filter rows by date
  useEffect(() => {
    const filteredData = tableRows
      .filter((row) => {
        const rowDate = new Date(row.appointment_date);
        return rowDate >= new Date(startDate) && rowDate <= new Date(endDate);
      })
      .sort((a, b) => {
        const dateDiff = new Date(b.appointment_date) - new Date(a.appointment_date);
        if (dateDiff !== 0) return dateDiff;
        const idA = parseInt(a.appointment_id.replace(/\D/g, ""), 10);
        const idB = parseInt(b.appointment_id.replace(/\D/g, ""), 10);
        return idB - idA;
      });

    setFilteredRows(filteredData);
  }, [startDate, endDate, tableRows]);

  // ✅ Scroll handler
  const handleScroll = (event) => {
    scrollToTopButtonDisplay(event, setShowFab);

    const { scrollTop, scrollHeight, clientHeight } = event.target;

    if (!hasMoreRef.current) return;
    if (loadingRef.current) return;

    if (scrollHeight - scrollTop <= clientHeight + 200) {
      console.log("✅ API calling offset:", offsetRef.current);
      loadingRef.current = true;

      fetchData(
        tokenRef.current,
        setLoading,
        setTableRows,
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

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const handleDeleteClick = (appointmentId) => {
    setSelectedDeleteItemId(appointmentId);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDeleteDialog(false);
    if (!selectedDeleteItemId) return;

    const response = await deleteCTInvoice(selectedDeleteItemId, token, setLoading, setTableRows);
    setSnackbar({
      open: true,
      message: response ? "Invoice deleted successfully" : "Failed to delete invoice",
      severity: response ? "success" : "error",
    });
    setSelectedDeleteItemId(null);
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setSelectedDeleteItemId(null);
  };

  const handleAddLeadClick = async () => {
    const newId = await createCounterSale({}, Cookies.get("token"));
    if (newId) {
      router.push(`/views/shoppingcart/${newId}`);
    } else {
      setSnackbar({ open: true, message: "Failed to create a new counter sale", severity: "error" });
    }
  };

  const pageType = Cookies.get("page_type");

  return (
    <>
      {pageType !== "tab" && <Navbar pageName="Counter Sales" />}

      <Box sx={{ display: "flex", justifyContent: "space-between", padding: "20px" }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", marginLeft: "auto" }}>
          <TextField
            type="date" size="small" value={startDate}
            onChange={(e) => { if (e.target.value !== startDate) setStartDate(e.target.value); }}
            sx={{ backgroundColor: "white" }}
          />
          <TextField
            type="date" size="small" value={endDate}
            onChange={(e) => { if (e.target.value !== endDate) setEndDate(e.target.value); }}
            sx={{ backgroundColor: "white" }}
          />
          <Tooltip title="Add Customer" placement="right-end">
            <IconButton
              onClick={() => setOpenOldCustomerModal(true)}
              sx={{ borderRadius: 1, padding: "9px 10px", backgroundColor: "white", "&:hover": { backgroundColor: "white" } }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ✅ Scrollable table with onScroll */}
      <TableContainer
        component={Paper}
        id="scrollable-table"
        onScroll={handleScroll}
        sx={{ overflowY: "auto", minHeight: "80vh", maxHeight: "80vh" }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="customer table">
          <TableHead style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
            <TableRow>
              <TableCell>Appointment Id</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Phone No</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row, index) => (
                <TableRow
                  key={index}
                  onClick={() => router.push(`/views/shoppingcart/${row.appointment_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{row.appointment_id}</TableCell>
                  <TableCell>
                    {row.appointment_date
                      ? new Date(row.appointment_date).toLocaleDateString("en-GB")
                      : "N/A"}
                  </TableCell>
                  <TableCell>{row.customer_name || "N/A"}</TableCell>
                  <TableCell>{row.phone || "N/A"}</TableCell>
                  <TableCell>{row.invoice_amount}</TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="delete"
                      size="small"
                      sx={{ display: row.invoice_amount == 0 ? "block" : "none", zIndex: 40 }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.appointment_id); }}
                    >
                      <DeleteIcon color="error" fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">No Data Found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ Scroll to top FAB */}
      {showFab && (
        <Fab
          size="small"
          onClick={() => { handleScrollToTop(); setShowFab(false); }}
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}

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
        <IconButton
          onClick={() => { setOpenAddCustomerModal(false); setSelectedOldCustomer(null); }}
          sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <AddCustomer
            salesType="counterSales"
            selectedCustomer={selectedOldCustomer}
            onClose={() => { setOpenAddCustomerModal(false); setSelectedOldCustomer(null); }}
            onSuccess={() => {
              setOpenAddCustomerModal(false);
              setSelectedOldCustomer(null);
              fetchData(token, setLoading, setTableRows, startDate, endDate, limit, 0, false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
        <DialogTitle>{"Confirm Invoice Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this invoice? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomerTable;