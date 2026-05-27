"use client";
// React and Next imports
import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import axios from "axios";
import Cookies from "js-cookie";
import FileDownloadIcon from "@mui/icons-material/FileDownload";



// Function imports - Alphabetical
import {
  getDisplayPayments,
  handleOptionChange,
  handleRowClick,
  processPayments,
  fetchPayments,
} from "../../../../../controllers/customerPaymentControllers";

// Component imports - Alphabetical
import BackButton from "@/components/backButton";
import Navbar from "@/components/navbar";
import AddCustomer from "@/components/addcustfrom_finance";
import UnifiedPDF from "@/components/UnifiedPDF";

// UI package imports - Alphabetical
import * as XLSX from "xlsx";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Snackbar,
  Alert,
  Modal,
} from "@mui/material";

// Icons and Images imports - Alphabetical
import SearchIcon from "@mui/icons-material/Search";

export default function CustomerPayment() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerPaymentContent />
    </Suspense>
  );
}

function CustomerPaymentContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  // Frontend extracted data states
  const router = useRouter();

  // Backend Data states
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [token, setToken] = useState("");
  const [changeinsupp_inv, setchangeinsupp_inv] = useState("");
  const [typedname, setTypedname] = useState("");

  // Add these new states
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  // Add a new state for search query
  const [searchQuery, setSearchQuery] = useState("");
  const [OpenAddCustomerModal, setOpenAddCustomerModal] = useState("");

  // Add a new state for search input
  const [searchInput, setSearchInput] = useState("");

  // Add a state to track if the view is mobile
  const [isMobileView, setIsMobileView] = useState(false);

  // Add date states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Function to determine if the screen is mobile-sized
  const isMobile = () => window.innerWidth <= 768;

  // Add an effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(isMobile());
    };

    // Only run on client
    window.addEventListener("resize", handleResize);
    handleResize(); // Call it initially to set the state

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set default date range to start of current month to today
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(today));
  }, []); // Run once on component mount (client-side only)

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/customer?limit=9999&offset=0`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        setCustomers(response.data);
      } catch (error) {
        // console.log("Error fetching customers:", error);
        setCustomers([]);
        setHasMore(false);
      }
    };

    fetchCustomers();
  }, [changeinsupp_inv]);

  // Add useEffect to fetch data based on date range
  useEffect(() => {
    const fetchDataByDate = async () => {
      if (startDate && endDate) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/appointment/get_appointments_by_date/${startDate}/${endDate}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          let data = response.data;

          // if id is present then filter by customer_id and status
          if (id) {
            data = data.filter(
              (payment) =>
                payment.customer_id === id &&
                (payment.status === "invoice" || payment.status === "invoiced")
            );
          }

          // ✅ FRONTEND PAID_STATUS ORDER: not paid → partially paid → paid
          data.sort((a, b) => {
            const order = { "not paid": 0, "partially paid": 1, "paid": 2 };
            return (order[a.paid_status] ?? 3) - (order[b.paid_status] ?? 3);
          });

          setPayments(data);
          if (id) setFilteredPayments(data);
        } catch (error) {
          // console.error("Error fetching data by date:", error);
          // Optional: show snackbar or toast
        }
      }
    };

    fetchDataByDate();
  }, [startDate, endDate, token]);

  const uniqueVehiclePayments = processPayments(payments);

  // Functions that has to be in the same file
  const onRowClick = (vehicleId, paidStatus, customerId, appointmentId) => {
    // Check if payment status is "Fully Paid" or "paid"
    if (paidStatus === "Fully Paid" || paidStatus === "paid") {
      // Show snackbar alert for paid status
      setSnackbarMessage("Payment not pending alert show");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    } else {
      // Navigate to ID page for non-paid or partially paid statuses
      handleRowClick(vehicleId, router, customerId, appointmentId);
      // console.log("Vehicle ID clicked:", vehicleId, "Customer ID:", customerId , "payement",payments);
    }
  };

  // Get display payments
  const displayPayments = getDisplayPayments(
    filteredPayments,
    uniqueVehiclePayments
  );

  // Update displayPayments to filter based on search query and phone number
  const filteredDisplayPayments = displayPayments.filter(
    (payment) =>
      payment.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.phone && payment.phone.includes(searchQuery))
  );

  const handleExportExcel = () => {
    const dataToExport = [
      { A: "Customer Payment Report" },
      {
        A: "From:",
        B: startDate || "-",
        D: "To:",
        E: endDate || "-",
      },
      {},
      {
        A: "Customer Name",
        B: "Appointment Date",
        C: "Vehicle ID",
        D: "Invoice Date",
        E: "Invoice Amount",
        F: "Pending Amount",
        G: "Paid Amount",
        H: "Payment Status",
      },
      ...filteredDisplayPayments.map((item) => ({
        A: item.customer_name || "",
        B: item.appointment_date || "",
        C: item.vehicle_id || "",
        D: item.invoice_date || item.creation_date || "",
        E:
          item.invoice_amount != null
            ? `₹ ${parseFloat(item.invoice_amount).toFixed(2)}`
            : "",
        F:
          item.pendingAmount != null
            ? `₹ ${parseFloat(item.pendingAmount).toFixed(2)}`
            : "",
        G:
          item.paid_amount != null
            ? `₹ ${parseFloat(item.paid_amount).toFixed(2)}`
            : "",
        H: item.paid_status || "",
      })),
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
      skipHeader: true,
    });
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CustomerPayments");
    XLSX.writeFile(workbook, "CustomerPayments.xlsx");
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Function to handle Enter key press
  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      // Perform search or any other action on Enter key press
      setSearchQuery(searchInput);
    }
  };



  const pageType = Cookies.get("page_type"); // "tab" or others
  // console.log("current payments", payments);

  return (
    <div className="p-4">
      <Dialog
        maxWidth="sm"
        sx={{ padding: "50px" }}
        fullWidth
        open={OpenAddCustomerModal}
        onClose={() => setOpenAddCustomerModal(false)}
      >
        <AddCustomer
          token={token}
          setOpenAddCustomerModal={setOpenAddCustomerModal}
          onProductAdded={() => {
            setchangeinsupp_inv(!changeinsupp_inv);
            setOpenAddCustomerModal(false);
          }}
          typedname={typedname}
          setTypedname={setTypedname}
          from="customerPayment"
        // setProductAdded={setProductAdded}
        />
      </Dialog>
      {/* <Navbar pageName="Customer Payments" /> */}
      {pageType !== "tab" && <Navbar pageName="Customer Payments" />}

      <Box paddingX={"2%"}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {/* <BackButton />
          <h1 className="text-2xl font-bold mb-4">Customer Payments</h1> */}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "16px",
            color: "white",
          }}
        >
          <div>
            <TextField
              size="small"
              sx={{ backgroundColor: "white" }}
              label="Search"
              variant="outlined"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/views/finance/customerPayment/advancePayment")}
            >
              Advance Payment
            </Button>
            {/* <Button
              variant="outlined"
              sx={{ backgroundColor: "white" }}
              startIcon={<PrintIcon />}
              onClick={() => handleOpenModal(true)}
            >
              Print Voucher
            </Button> */}
            <Button
              variant="outlined"
              sx={{ backgroundColor: "white" }}
              onClick={handleExportExcel}
              disabled={filteredDisplayPayments.length === 0}
            >
              <FileDownloadIcon />
            </Button>
            <TextField
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ backgroundColor: "white" }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ backgroundColor: "white" }}
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </div>
        {isMobileView ? (
          // Render card view for mobile
          <div>
            {filteredDisplayPayments.length > 0 ? (
              filteredDisplayPayments.map((payment) => (
                <Paper
                  key={payment._id}
                  sx={{
                    marginBottom: "16px",
                    padding: "16px",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}

                  onClick={() => onRowClick(payment.vehicle_id, payment.paid_status, payment.customer_id, payment.appointment_id)}
                >
                  <Typography variant="h6">{payment.customer_name}</Typography>
                  <Typography variant="body2">
                    Vehicle ID: {payment.vehicle_id}
                  </Typography>
                  <Typography variant="body2">
                    Invoice Count: {payment.visitCount}
                  </Typography>
                  <Typography variant="body2">
                    Pending Amount: ₹{payment.pendingAmount.toFixed(2)}
                  </Typography>
                  <Chip
                    label={payment.paid_status}
                    color={
                      payment.paid_status === "Fully Paid"
                        ? "success"
                        : payment.paid_status === "Partially Paid"
                          ? "warning"
                          : "error"
                    }
                    size="small"
                  />
                </Paper>
              ))
            ) : (
              <Typography align="center">No data found</Typography>
            )}
          </div>
        ) : (
          // Render table view for larger screens
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="customer payments table">
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Appointment Date</TableCell>
                  <TableCell>Vehicle ID</TableCell>
                  <TableCell>Invoice Date</TableCell>
                  {/* <TableCell>Invoice Count </TableCell> */}
                  <TableCell>Invoice Amount</TableCell>
                  <TableCell>Pending Amount</TableCell>
                  <TableCell>Paid Amount</TableCell>
                  <TableCell>Payment Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDisplayPayments.length > 0 ? (
                  filteredDisplayPayments.map((payment) => (
                    <TableRow
                      key={payment._id}
                      onClick={() => onRowClick(payment.vehicle_id, payment.paid_status, payment.customer_id, payment.appointment_id)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "#f5f5f5" },
                      }}
                    >
                      <TableCell>{payment.customer_name}</TableCell>
<TableCell>
  {payment.appointment_date
    ? new Date(payment.appointment_date).toLocaleDateString("en-GB")
    : "N/A"}
</TableCell>
                      <TableCell>{payment.vehicle_id}</TableCell>
                      {/* <TableCell>{payment.customer_id}</TableCell> */}
                     <TableCell>
  {payment.invoice_date || payment.creation_date
    ? new Date(payment.invoice_date || payment.creation_date).toLocaleDateString("en-GB")
    : "N/A"}
</TableCell> {/* <TableCell>{payment.visitCount}</TableCell> */}
                      <TableCell>₹{payment.invoice_amount?.toFixed(2)}</TableCell>
                      <TableCell>₹{payment.pendingAmount?.toFixed(2)}</TableCell>
                      <TableCell>₹{payment.paid_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.paid_status}
                          color={
                            payment.paid_status === "Fully Paid"
                              ? "success"
                              : payment.paid_status === "Partially Paid"
                                ? "warning"
                                : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
