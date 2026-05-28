"use client";

import Navbar from "../../../components/navbar.js";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Tooltip,
  IconButton,
  Button,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";


import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import {
  fetchData,
  createCounterSale,
  deleteCTInvoice,
} from "./shoppingcartControllers.js";
import AddCustomer from "@/components/addcust";
import OldCustomerModal from "@/components/OldCustomerModal";
const CustomerTable = () => {
  const [token, setToken] = useState();
  const [tableRows, setTableRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDeleteItemId, setSelectedDeleteItemId] = useState(null);

  // Set initial date range (Last 30 Days)
useEffect(() => {
  const today = new Date();

  // First day of CURRENT month (CURRENT year)
  const startOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  setStartDate(formatDate(startOfMonth));
  setEndDate(formatDate(today));
}, []);



  // Fetch data from API
  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);

    fetchData(storedToken, setLoading, setTableRows);
  }, []);

  // Filter data for the last 7 days
  useEffect(() => {
    const filteredData = tableRows
      .filter((row) => {
  const formattedDate = row.appointment_date
    ? row.appointment_date
        .split("T")[0]
        .split("-")
        .reverse()
        .join("/")
    : "";

  const rowDate = new Date(
    formattedDate.split("/").reverse().join("-")
  );

  return (
    rowDate >= new Date(startDate) &&
    rowDate <= new Date(endDate)
  );
})
      .sort((a, b) => {
        const dateDiff =
          new Date(b.appointment_date) - new Date(a.appointment_date); // Sort by date (latest first)
        if (dateDiff !== 0) return dateDiff;

        // Extract numeric part of Customer ID (assuming format "CTS-700321")
        const idA = parseInt(a.appointment_id.replace(/\D/g, ""), 10);
        const idB = parseInt(b.appointment_id.replace(/\D/g, ""), 10);

        return idB - idA; // Descending Order (Largest ID First)
      });

    setFilteredRows(filteredData);
  }, [startDate, endDate, tableRows]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDeleteClick = (appointmentId) => {
    setSelectedDeleteItemId(appointmentId);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDeleteDialog(false);

    if (!selectedDeleteItemId) return;

    const response = await deleteCTInvoice(
      selectedDeleteItemId,
      token,
      setLoading,
      setTableRows
    );

    if (response) {
      setSnackbar({
        open: true,
        message: "Invoice deleted successfully",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: "Failed to delete invoice",
        severity: "error",
      });
    }

    setSelectedDeleteItemId(null);
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setSelectedDeleteItemId(null);
  };

  // Handle Add Counter Sale Button
  const handleAddLeadClick = async () => {
    const saleData = {};
    const newId = await createCounterSale(saleData, Cookies.get("token"));
    if (newId) {
      router.push(`/views/shoppingcart/${newId}`);
    } else {
      setSnackbar({
        open: true,
        message: "Failed to create a new counter sale",
        severity: "error",
      });
    }
  };
const pageType = Cookies.get("page_type"); // "tab" or others
const [openAddCustomerModal, setOpenAddCustomerModal] = useState(false);
const [openOldCustomerModal, setOpenOldCustomerModal] = useState(false);
const [selectedOldCustomer, setSelectedOldCustomer] = useState(null);

  return (
    <>


    
      {/* <Navbar pageName="Counter Sales" /> */}
      {pageType !== "tab" && <Navbar pageName="Counter Sales" /> }
     <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    padding: "20px",
  }}
>
  <Box
    sx={{
      display: "flex",
      gap: 2,
      alignItems: "center",
      marginLeft: "auto",
       // moves to right end
    }}
  >
    <TextField
      type="date"
      size="small"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      sx={{
        backgroundColor: "white",
        "& .MuiOutlinedInput-root": {
          "&:hover fieldset": { borderColor: "gray" },
          "&.Mui-focused fieldset": { borderColor: "blue" },
        },
      }}
    />

    <TextField
      type="date"
      size="small"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      sx={{
        backgroundColor: "white",
        "& .MuiOutlinedInput-root": {
          "&:hover fieldset": { borderColor: "gray" },
          "&.Mui-focused fieldset": { borderColor: "blue" },
        },
      }}
    />

    <Tooltip title="Add Customer" placement="right-end">
      <IconButton
        onClick={() => {
          setOpenOldCustomerModal(true);
        }}
        sx={{
          borderRadius: 1,
          padding: "9px 10px",
          backgroundColor: "white",
          "&:hover": { backgroundColor: "white" },
        }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>
</Box>

      <TableContainer
        component={Paper}
        sx={{   overflowY: "auto" ,  minHeight: "80vh",}}
      >
        <Table sx={{ minWidth: 650 }} aria-label="customer table">
          <TableHead
            style={{ position: "sticky", top: 0, backgroundColor: "white" }}
          >
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
                  onClick={() =>
                    router.push(`/views/shoppingcart/${row.appointment_id}`)
                  }
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
                    {/* <Button size="small">Edit</Button>
                    <Button size="small" color="error">
                      Cancel
                    </Button> */}

                    <IconButton
                      aria-label="delete"
                      size="small"
                      sx={{
                        display: row.invoice_amount == 0 ? "block" : "none",
                        zIndex: 40,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(row.appointment_id);
                      }}
                    >
                      <DeleteIcon color="error" fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No Data Found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
  salesType="counterSales"
  selectedCustomer={selectedOldCustomer}
  onClose={() => {
    setOpenAddCustomerModal(false);
    setSelectedOldCustomer(null);
  }}
  onSuccess={() => {
    setOpenAddCustomerModal(false);
    setSelectedOldCustomer(null);
    fetchData(token, setLoading, setTableRows);
  }}
/>

  </DialogContent>
</Dialog>



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

      <Dialog
        open={openDeleteDialog}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Invoice Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this invoice? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomerTable;
