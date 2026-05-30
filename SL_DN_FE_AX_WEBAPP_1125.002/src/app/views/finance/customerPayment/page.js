"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import * as XLSX from "xlsx";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import {
  getDisplayPayments,
  handleRowClick,
  processPayments,
  fetchPaymentEntries,
  handleScrollToTop,
  scrollToTopButtonDisplay,
} from "../../../../../controllers/customerPaymentControllers";

import Navbar from "@/components/navbar";
import AddCustomer from "@/components/addcustfrom_finance";

import {
  Box, Button, Chip, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
  Dialog, Snackbar, Alert, Fab, CircularProgress,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const LIMIT = 20;

const formatDate = (date) => date.toISOString().split("T")[0];

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
  const router = useRouter();

  const [token, setToken] = useState("");
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFab, setShowFab] = useState(false);

  const [changeinsupp_inv, setchangeinsupp_inv] = useState(false);
  const [typedname, setTypedname] = useState("");
  const [OpenAddCustomerModal, setOpenAddCustomerModal] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);

  const [startDate, setStartDate] = useState(() =>
    formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const [totalCount, setTotalCount] = useState(0);

  //   Refs — same pattern as JobAssessment
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const totalRef = useRef(0);
  const tokenRef = useRef("");
  const startDateRef = useRef(startDate);
  const endDateRef = useRef(endDate);
  const idRef = useRef(id);
  const searchQueryRef = useRef("");

  useEffect(() => { startDateRef.current = startDate; }, [startDate]);
  useEffect(() => { endDateRef.current = endDate; }, [endDate]);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);

  const noOp = () => {};

  //   Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //   Fetch customers
  useEffect(() => {
    const storedToken = Cookies.get("token");
    if (!storedToken) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer?limit=9999&offset=0`,
      { headers: { Authorization: `Bearer ${storedToken}` } }
    )
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, [changeinsupp_inv]);

  //   Initial load — triggered when dates change (same as JobAssessment)
  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    tokenRef.current = storedToken;
    startDateRef.current = startDate;
    endDateRef.current = endDate;

    // Reset everything
    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setPayments([]);
    setFilteredPayments([]);
    setLoading(true);

    fetchPaymentEntries(
      storedToken,
      setPayments,
      setFilteredPayments,
      setLoading,
      setSnackbarOpen,
      setSnackbarMessage,
      setSnackbarSeverity,
      startDate,
      endDate,
      idRef.current,
      LIMIT,
      0,
      false  // append = false (fresh load)
    ).then((result) => {
      if (!result || result.data.length === 0) {
        hasMoreRef.current = false;
      } else {
        totalRef.current = result.total;
        setTotalCount(result.total);
        offsetRef.current = LIMIT;
        hasMoreRef.current = result.total > LIMIT;
      }
      loadingRef.current = false;
    });
  }, [startDate, endDate]);

  //   Scroll handler — same pattern as JobAssessment
  const handleScroll = (event) => {
    scrollToTopButtonDisplay(event, setShowFab);

    const { scrollTop, scrollHeight, clientHeight } = event.target;

    if (searchQueryRef.current) return; // skip infinite scroll during search
    if (!hasMoreRef.current) return;
    if (loadingRef.current) return;

    if (scrollHeight - scrollTop <= clientHeight + 200) {
      console.log("  Loading more, offset:", offsetRef.current);
      loadingRef.current = true;

      fetchPaymentEntries(
        tokenRef.current,
        setPayments,
        setFilteredPayments,
        noOp,
        setSnackbarOpen,
        setSnackbarMessage,
        setSnackbarSeverity,
        startDateRef.current,
        endDateRef.current,
        idRef.current,
        LIMIT,
        offsetRef.current,
        true  // append = true
      ).then((result) => {
        if (!result || result.data.length === 0) {
          hasMoreRef.current = false;
          loadingRef.current = false;
        } else {
          const newOffset = offsetRef.current + result.data.length;
          offsetRef.current = newOffset;
          hasMoreRef.current = newOffset < totalRef.current;
          loadingRef.current = false;
        }
      });
    }
  };

  const uniqueVehiclePayments = processPayments(payments);

  const displayPayments = getDisplayPayments(filteredPayments, uniqueVehiclePayments);

  const filteredDisplayPayments = displayPayments.filter(
    (p) =>
      p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery))
  );

  const onRowClick = (vehicleId, paidStatus, customerId, appointmentId) => {
    if (paidStatus === "Fully Paid" || paidStatus === "paid") {
      setSnackbarMessage("Payment not pending");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    } else {
      handleRowClick(vehicleId, router, customerId, appointmentId);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = [
      { A: "Customer Payment Report" },
      { A: "From:", B: startDate || "-", D: "To:", E: endDate || "-" },
      {},
      {
        A: "Customer Name", B: "Appointment Date", C: "Vehicle ID",
        D: "Invoice Date", E: "Invoice Amount", F: "Pending Amount",
        G: "Paid Amount", H: "Payment Status",
      },
      ...filteredDisplayPayments.map((item) => ({
        A: item.customer_name || "",
        B: item.appointment_date || "",
        C: item.vehicle_id || "",
        D: item.invoice_date || item.creation_date || "",
        E: item.invoice_amount != null ? `₹ ${parseFloat(item.invoice_amount).toFixed(2)}` : "",
        F: item.pendingAmount != null ? `₹ ${parseFloat(item.pendingAmount).toFixed(2)}` : "",
        G: item.paid_amount != null ? `₹ ${parseFloat(item.paid_amount).toFixed(2)}` : "",
        H: item.paid_status || "",
      })),
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { skipHeader: true });
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
    worksheet["!cols"] = [
      { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CustomerPayments");
    XLSX.writeFile(workbook, "CustomerPayments.xlsx");
  };

  const pageType = Cookies.get("page_type");

  return (
    <div>
      <Dialog
        maxWidth="sm"
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
        />
      </Dialog>

      {pageType !== "tab" && <Navbar pageName="Customer Payments" />}

      <Box paddingX="2%" paddingY="1%">
        {/* ── Toolbar ── */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
          mb={2}
        >
          <TextField
            size="small"
            sx={{ backgroundColor: "white" }}
            label="Search"
            variant="outlined"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setSearchQuery(searchInput); }}
          />

          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              Showing {filteredDisplayPayments.length} / {totalCount}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/views/finance/customerPayment/advancePayment")}
            >
              Advance Payment
            </Button>
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
          </Box>
        </Box>

        {/* ── Content ── */}
        {isMobileView ? (
          // Mobile cards — window scroll
          <Box>
            {filteredDisplayPayments.map((payment) => (
              <Paper
                key={payment._id}
                sx={{ mb: 2, p: 2, cursor: "pointer", "&:hover": { backgroundColor: "#f5f5f5" } }}
                onClick={() => onRowClick(payment.vehicle_id, payment.paid_status, payment.customer_id, payment.appointment_id)}
              >
                <Typography variant="h6">{payment.customer_name}</Typography>
                <Typography variant="body2">Vehicle ID: {payment.vehicle_id}</Typography>
                <Typography variant="body2">Pending: ₹{payment.pendingAmount?.toFixed(2)}</Typography>
                <Chip
                  label={payment.paid_status}
                  color={payment.paid_status === "Fully Paid" ? "success" : payment.paid_status === "Partially Paid" ? "warning" : "error"}
                  size="small"
                />
              </Paper>
            ))}
            {!loading && filteredDisplayPayments.length === 0 && (
              <Typography align="center">No data found</Typography>
            )}
            {loading && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={28} />
              </Box>
            )}
          </Box>
        ) : (
          // Desktop table — container scroll (matches DynamicListTable pattern)
          <TableContainer
            component={Paper}
            id="scrollable-cp-table"
            onScroll={handleScroll}
            sx={{ maxHeight: "75vh", overflowY: "auto" }}
          >
            <Table stickyHeader sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Appointment Date</TableCell>
                  <TableCell>Vehicle ID</TableCell>
                  <TableCell>Invoice Date</TableCell>
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
                      sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f5f5f5" } }}
                    >
                      <TableCell>{payment.customer_name}</TableCell>
                      <TableCell>
                        {payment.appointment_date
                          ? new Date(payment.appointment_date).toLocaleDateString("en-GB")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{payment.vehicle_id}</TableCell>
                      <TableCell>
                        {payment.invoice_date || payment.creation_date
                          ? new Date(payment.invoice_date || payment.creation_date).toLocaleDateString("en-GB")
                          : "N/A"}
                      </TableCell>
                      <TableCell>₹{payment.invoice_amount?.toFixed(2)}</TableCell>
                      <TableCell>₹{payment.pendingAmount?.toFixed(2)}</TableCell>
                      <TableCell>₹{payment.paid_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.paid_status}
                          color={
                            payment.paid_status === "Fully Paid" ? "success"
                            : payment.paid_status === "Partially Paid" ? "warning"
                            : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  !loading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">No data found</TableCell>
                    </TableRow>
                  )
                )}
                {/*   Loader row at bottom — same as DynamicListTable */}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/*   Scroll to top FAB — same as JobAssessment */}
      {showFab && (
        <Fab
          size="small"
          color="primary"
          onClick={() => { handleScrollToTop(); setShowFab(false); }}
          sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000 }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}