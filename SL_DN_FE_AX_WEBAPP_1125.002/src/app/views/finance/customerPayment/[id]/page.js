"use client";

// React and Next imports
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

import axios from "axios";
import Cookies from "js-cookie";
// Function imports - Alphabetical
import {
  calculatePaymentStatus,
  calculateTotals,
  distributeBulkPayment,
  getDateComponents,
} from "../../../../../../controllers/customerPaymentIDControllers";

// Component imports - Alphabetical
import BackButton from "@/components/backButton";
import Navbar from "@/components/navbar";
import UnifiedPDF from "@/components/UnifiedPDF";

// UI package imports - Alphabetical
import {
  Alert,
  Box,
  Checkbox,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Snackbar,
  Switch,
  Chip,
  IconButton,
  Tooltip,
  Popover,
} from "@mui/material";
import InfoOutlineIcon from '@mui/icons-material/InfoOutlined';
import PrintIcon from '@mui/icons-material/Print';
export default function CustomerPaymentPage() {
  // FrontEnd extracted data states
  const { id } = useParams();
  // console.log("vehicle id from query", id);
  const searchParams = useSearchParams();

  const customer_id = searchParams.get("customer_id");
  const appointment_id = searchParams.get("appointment_id");
  // console.log("Appointment id from query", appointment_id);
  // setSelectedCustomerId(customer_id);
  // console.log("cust here ", customer_id);
  // Define state for vehicle payments
  const [vehiclePayments, setVehiclePayments] = useState([]);
  const [paymentLog, setPaymentLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [token, setToken] = useState("");

  // Set initial date range to start of current month to today
  useEffect(() => {
    // console.log("cusrtomer id from query", customer_id);
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(today));
  }, []);

  // Get token
  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
  }, []);








  useEffect(() => {





    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointment_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const fetchedPayments = Array.isArray(response.data) ? response.data : [response.data];

        // console.log("All fetched:", fetchedPayments);

        //   DEFINE HERE (IMPORTANT)
        const filteredPayments = fetchedPayments.filter((p) => {
          return (
            p.vehicle_id === id &&
            (p.status === "invoice" || p.status === "invoiced")
          );
        });

        // console.log("Filtered:", filteredPayments);

        setVehiclePayments(filteredPayments);

        const allPaymentLogs = [];

        filteredPayments.forEach((payment) => {
          let logs = [];

          //   Handle missing payment_log
          if (payment.payment_log) {
            logs = JSON.parse(payment.payment_log);
          } else if (payment.paid_amount > 0) {
            //   fallback log (VERY IMPORTANT FIX)
            logs = [
              {
                paid_amount: payment.paid_amount,
                payment_method: payment.payment_method || "cash",
                cheque_no: payment.cheque_no,
                cheque_date: payment.cheque_date,
                date: payment.invoice_date || payment.appointment_date,
              },
            ];
          }

          logs.forEach((log) => {
            if (log.paid_amount !== 0) {
              allPaymentLogs.push({
                ...log,
                appointment_id: payment.appointment_id,
                customer_name: payment.customer_name,
              });
            }
          });
        });

        //   Sort latest first
        allPaymentLogs.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        // console.log("Final Logs:", allPaymentLogs);

        setPaymentLog(allPaymentLogs);

      } catch (error) {
        // console.log("Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate && token) {
      fetchData();
    }
  }, [id, startDate, endDate, token]);


  // State to store selected customer ID & details
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);


  // Get token once
  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
  }, []);








  //   Set the state AFTER declaration
  useEffect(() => {
    if (customer_id) {
      setSelectedCustomerId(customer_id);
    }
  }, [customer_id]);

  //   Fetch customer details whenever selectedCustomerId changes
  useEffect(() => {
    if (!selectedCustomerId) return; // nothing to fetch

    const fetchCustomerDetails = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/customer/${selectedCustomerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSelectedCustomerDetails(response.data);
      } catch (error) {
        console.error("Error fetching customer details:", error);
        setSelectedCustomerDetails(null);
      }
    };

    fetchCustomerDetails();
  }, [selectedCustomerId, token]);

  // console.log("fetched customer details:", selectedCustomerDetails);
  // console.log("current id:", selectedCustomerId);


  // Frontend form input states
  const [paidAmounts, setPaidAmounts] = React.useState({});
  const [pendingAmounts, setPendingAmounts] = React.useState({});
  const [inputAdvanceAmount, setInputAdvanceAmount] = useState("");
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState("");

  // Add these new states after other state declarations
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");

  // Add this state near your other state declarations
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPaymentLog, setSelectedPaymentLog] = useState([]);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // New state for checkbox
  const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Functions that has to be in the same file
  const handlePaidAmountChange = (paymentId, value) => {
    const payment = vehiclePayments.find((p) => p._id === paymentId);
    const newPaidAmount = parseFloat(value) || 0;
    const pendingAmount =
      parseFloat(payment.invoice_amount) - parseFloat(payment.paid_amount);

    // Consider advance amount if checkbox is checked
    const effectivePendingAmount = isAdvanceChecked
      ? pendingAmount - parseFloat(inputAdvanceAmount || 0)
      : pendingAmount;

    setPaidAmounts({
      ...paidAmounts,
      [paymentId]: value,
    });


    // Update payment status based on the new paid amount
    const newStatus =
      newPaidAmount >= effectivePendingAmount ? "Fully Paid" : "Partially Paid";
    setPaymentStatuses({
      ...paymentStatuses,
      [paymentId]: newStatus,
    });
  };

  const handleBulkPaymentDistribution = (e) => {
    if (e.key === "Enter") {
      const { newPaidAmounts, newPaymentStatuses, balanceAmounts } =
        distributeBulkPayment(vehiclePayments, bulkPaymentAmount);

      setPaidAmounts(newPaidAmounts);
      setPaymentStatuses(newPaymentStatuses);
      // console.log(balanceAmounts);
      setBulkPaymentAmount("");
    }
  };
  // !? replace placeholders in the template message if any
  const replacePlaceholders = (template, dynamicValues) => {
    return template.replace(
      /{{([^}]+)}}/g,
      (match, p1) => dynamicValues[p1] || match
    );
  };
  // console.log(calculateTotals(vehiclePayments).totalInvoiceAmount, calculateTotals(vehiclePayments).totalPaidAmount)
  const handleRowSubmit = async (payment) => {
    let apmt_id = payment._id;
    const paidAmount = parseFloat(paidAmounts[payment._id] || 0);
    const advanceAmount = parseFloat(inputAdvanceAmount || 0);

    let dataForFinanceRoute = {
      appointment_id: payment.appointment_id,
      customer_id: payment.customer_id,
      credit: (parseFloat(paidAmounts[apmt_id] || 0) + parseFloat(inputAdvanceAmount || 0)).toFixed(2),
      type: "customer",
      expense_type: "Credit",
      description: `Credit for customer #${payment.customer_id} against invoice #${payment.appointment_id}`,
      creation_date: new Date().toISOString().split('T')[0]
    };

    // Calculate total new paid amount including advance
    const totalNewPaidAmount = parseFloat(payment.paid_amount) + paidAmount + advanceAmount;
    const invoiceAmount = parseFloat(payment.invoice_amount);

    // Calculate the new status based on total paid amount vs invoice amount
    let newPaidStatus;
    if (Math.abs(totalNewPaidAmount - invoiceAmount) < 0.01) {
      newPaidStatus = "paid";
    } else if (totalNewPaidAmount > 0) {
      newPaidStatus = "partially paid";
    } else {
      newPaidStatus = "not paid"; ``
    }

    const balance = parseFloat(payment.advance_balance) + advanceAmount;

    // Create payment log entries
    const newPaymentLogs = [];

    // Add regular payment log if there's a payment amount
    if (paidAmount > 0) {
      const logEntry = {
        payment_method: paymentMethod,
        paid_amount: paidAmount,
        date: new Date().toISOString()
      };

      // Include cheque details if payment method is cheque
      if (paymentMethod === "cheque") {
        logEntry.cheque_no = chequeNo;
        logEntry.cheque_date = chequeDate;
      }

      newPaymentLogs.push(logEntry);
    }

    // Add advance payment log if there's an advance amount
    if (advanceAmount > 0) {
      newPaymentLogs.push({
        payment_method: "Advance",
        paid_amount: advanceAmount,
        date: new Date().toISOString()
      });
    }

    // Ensure payment.payment_log is an array and properly parse it if it's a string
    let existingPaymentLog = [];
    try {
      existingPaymentLog = Array.isArray(payment.payment_log)
        ? payment.payment_log
        : JSON.parse(payment.payment_log || '[]');
    } catch (e) {
      console.error('Error parsing payment log:', e);
      existingPaymentLog = [];
    }

    // Combine existing payment logs with the new ones
    const updatedPaymentLog = [...existingPaymentLog, ...newPaymentLogs];

    if (isAdvanceChecked) {
      try {
        // First, deduct advance payment from customer account
        const deductResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/customer/deduct_advance_payment/${selectedCustomerDetails.customer_id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ advance_payment: advanceAmount }),
          }
        );

        if (!deductResponse.ok) {
          throw new Error("Failed to deduct advance payment from customer");
        }

        // Then update the appointment
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/update_invoice_amount/${payment.appointment_id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paid_status: newPaidStatus,
              Invoice_Date: payment.appointment_date,
              advance: advanceAmount,
              Paid_Amount: totalNewPaidAmount,
              Invoice_Amount: invoiceAmount,
              advance_payment: balance,
              payment_method: paymentMethod,
              ...(paymentMethod === "cheque" && {
                cheque_no: chequeNo,
                cheque_date: chequeDate,
              }),
              payment_log: updatedPaymentLog,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update payment");
        }

        // Update finance route
        const financeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/finance/post_ledger`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataForFinanceRoute),
          }
        );

        if (!financeResponse.ok) {
          throw new Error("Failed to update finance records");
        }

        // Refresh the page or update the UI
        window.location.reload();
      } catch (error) {
        console.error("Error updating payment:", error);
        // Handle error (show error message to user)
      }
    } else {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/update_invoice1/${payment.appointment_id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paid_status: newPaidStatus,
              Invoice_Date: payment.appointment_date,
              Paid_Amount: totalNewPaidAmount,
              payment_log: updatedPaymentLog,
              payment_method: paymentMethod,
              ...(paymentMethod === "cheque" && {
                cheque_no: chequeNo,
                cheque_date: chequeDate,
              }),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update payment");
        }

        // Update finance route
        const financeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/finance/post_ledger`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataForFinanceRoute),
          }
        );

        if (!financeResponse.ok) {
          throw new Error("Failed to update finance records");
        }

        // Refresh the page or update the UI
        window.location.reload();
      } catch (error) {
        console.error("Error updating payment:", error);
        // Handle error (show error message to user)
      }
    }
  };

  const handleCheckboxChange = () => {
    const newCheckedState = !isAdvanceChecked;
    setIsAdvanceChecked(newCheckedState);
    if (newCheckedState && vehiclePayments.length > 0) {
      const pending = vehiclePayments[0].invoice_amount - (vehiclePayments[0]?.paid_amount || 0);
      const availableAdvance = selectedCustomerDetails?.advance_payment || 0;
      if (availableAdvance > pending) {
        setInputAdvanceAmount(pending.toString());
      } else {
        setInputAdvanceAmount(availableAdvance.toString());
      }
    } else {
      setInputAdvanceAmount("0");
    }
  };

  // Add this handler function
  const handlePaymentMethodInfo = (event, payment) => {
    let log = [];
    try {
      const paymentLog = payment?.payment_log;
      if (typeof paymentLog === 'string') {
        log = JSON.parse(paymentLog || '[]');
      } else if (Array.isArray(paymentLog)) {
        log = paymentLog;
      } else {
        log = [];
      }
    } catch (error) {
      console.error('Error parsing payment log:', error);
      log = [];
    }
    const filtered = Array.isArray(log) ? log.filter(logEntry => logEntry.paid_amount !== 0) : [];
    setSelectedPaymentLog(filtered);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedPaymentLog([]);
  };

  // Sort payments: items with pending amount 0 go to the end
  const getSortedPayments = () => {
    return [...vehiclePayments].sort((a, b) => {
      const pendingA = Math.max(
        0,
        parseFloat(a.invoice_amount) -
        parseFloat(a.paid_amount) -
        parseFloat(inputAdvanceAmount || 0)
      );
      const pendingB = Math.max(
        0,
        parseFloat(b.invoice_amount) -
        parseFloat(b.paid_amount) -
        parseFloat(inputAdvanceAmount || 0)
      );

      // If A has pending (not 0) and B doesn't (0), A comes first
      if (pendingA > 0 && pendingB === 0) return -1;
      // If B has pending (not 0) and A doesn't (0), B comes first
      if (pendingA === 0 && pendingB > 0) return 1;
      // Otherwise, maintain original order
      return 0;
    });
  };

  const pageType = Cookies.get("page_type"); // "tab" or others

  // UI Code
  return (
    <div>
      {/* <Navbar pageName="Payment Details" /> */}
      {pageType !== "tab" && <Navbar pageName="Payment Details" />}

      {error && (
        <Alert severity="error" sx={{ margin: 2 }}>
          Error: {error}
        </Alert>
      )}

      {vehiclePayments.length === 0 && !loading && !error && (
        <Alert severity="info" sx={{ margin: 2 }}>
          No payment records found for Vehicle ID: {id}
        </Alert>
      )}

      <Paper
        elevation={3}
        sx={{
          borderRadius: 0,
          marginBottom: 3,
          paddingBottom: 2,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(1px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex" }}>
            {/* <BackButton />
            <h3 style={{ marginLeft: "10px" }}>Payment Details</h3> */}
          </div>
        </div>

        <Grid container spacing={2} alignItems="center" paddingX={5}>
          <Grid item xs={12} sm={5}>
            <Typography variant="h3">Pending Payments</Typography>
            <Typography variant="body1">
              <strong>Customer:</strong> {selectedCustomerDetails?.customer_name || vehiclePayments[0]?.customer_name}
            </Typography>
            <Typography variant="body1">
              <strong>Phone:</strong>{" "}
              <a href={`tel://${selectedCustomerDetails?.contact?.phone || vehiclePayments[0]?.phone}`}>
                {selectedCustomerDetails?.contact?.phone || vehiclePayments[0]?.phone}
              </a>
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Pending Payment Summary
            </Typography>
            <Typography variant="body1">
              <strong>Total Invoiced Amount:</strong> ₹
              {calculateTotals(vehiclePayments).totalInvoiceAmount}
            </Typography>
            <Typography variant="body1">
              <strong>Total Paid Amount:</strong> ₹
              {(
                parseFloat(calculateTotals(vehiclePayments).totalPaidAmount) +
                parseFloat(inputAdvanceAmount || 0)
              ).toFixed(2)}
            </Typography>
            <Typography variant="body1">
              <strong>Total Pending Amount:</strong> ₹
              {Math.max(
                0,
                calculateTotals(vehiclePayments).totalInvoiceAmount -
                calculateTotals(vehiclePayments).totalPaidAmount -
                parseFloat(inputAdvanceAmount || 0)
              ).toFixed(2)}
            </Typography>
            {/* <Typography variant="body1">
              <strong>Total Pending Invoices:</strong> {vehiclePayments.length}
            </Typography> */}
            <div style={{ display: "flex" }}>
              <Typography variant="body1">
                <strong>Advance Balance:</strong> ₹ {selectedCustomerDetails?.advance_payment || 0}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2, mb: 2 }}>
                <UnifiedPDF
  type="pending-payments"
  data={{
    vehiclePayments,
    customerDetails: selectedCustomerDetails,
    totals: calculateTotals(vehiclePayments),
    advance_payment: selectedCustomerDetails?.advance_payment || 0
  }}
  token={token}
/>
              </Box>
              <Checkbox
                checked={isAdvanceChecked}
                disabled={calculateTotals(vehiclePayments).totalInvoiceAmount === calculateTotals(vehiclePayments).totalPaidAmount || (selectedCustomerDetails?.advance_payment || 0) <= 0}
                onChange={handleCheckboxChange}
              />


            </div>
          </Grid>
          {isAdvanceChecked ? (
            <Grid item xs={8} sm={2}>
              <div>
                <TextField
                  type="number"
                  size="small"
                  label="Advance Amount"
                  value={inputAdvanceAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const availableAdvance = selectedCustomerDetails?.advance_payment || 0;
                    if (
                      value === "" ||
                      (parseFloat(value) >= 0 &&
                        parseFloat(value) <= availableAdvance)
                    ) {
                      setInputAdvanceAmount(value);
                    }
                  }}
                  placeholder={`₹${selectedCustomerDetails?.advance_payment || 0}`}
                />
              </div>
            </Grid>
          ) : null}
          <Grid item xs={12} sm={3}>
            <Typography variant="body1" style={{ marginBottom: "10px" }}>
              <strong>Payment Method: </strong>
              <IconButton onClick={handlePaymentMethodInfo}>
                <InfoOutlineIcon />
              </IconButton>
            </Typography>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div>
                <Checkbox
                  checked={paymentMethod === "cash"}
                  onChange={() => {
                    setPaymentMethod("cash");
                    // Clear cheque details when switching to cash
                    setChequeNo("");
                    setChequeDate("");
                  }}
                />
                <span>Cash</span>
              </div>
              <div>
                <Checkbox
                  checked={paymentMethod === "gpay"}
                  onChange={() => {
                    setPaymentMethod("gpay");
                    // Clear cheque details when switching to gpay
                    setChequeNo("");
                    setChequeDate("");
                  }}
                />
                <span>GPay</span>
              </div>
              <div>
                <Checkbox
                  checked={paymentMethod === "cheque"}
                  onChange={() => setPaymentMethod("cheque")}
                />
                <span>Cheque</span>
              </div>
            </div>
            {paymentMethod === "cheque" && (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  gap: "10px",
                  flexDirection: "column",
                }}
              >
                <TextField
                  size="small"
                  label="Cheque No"
                  value={chequeNo}
                  onChange={(e) => setChequeNo(e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  type="date"
                  label="Cheque Date"
                  value={chequeDate}
                  onChange={(e) => setChequeDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </div>
            )}
          </Grid>
        </Grid>

        {/* Print Button Section */}

      </Paper>

      <Box paddingX={"1%"}>
        <Grid item xs={12}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "white",
            }}
          >
            <div>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Payment Records
              </Typography>
            </div>
            {/* <div>
              <TextField
                type="number"
                size="small"
                value={bulkPaymentAmount}
                onChange={(e) => setBulkPaymentAmount(e.target.value)}
                onKeyDown={handleBulkPaymentDistribution}
                placeholder="Enter amount and press Enter"
                InputProps={{
                  startAdornment: <span style={{ marginRight: 4 }}>₹</span>,
                }}
              />
            </div> */}
          </div>
          {loading ? (
            <Typography variant="body1" sx={{ padding: 2 }}>
              Loading payment records...
            </Typography>
          ) : error ? (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              Error loading payment records: {error}
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Appointment ID</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Customer Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Vehicle ID</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Invoice Date</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Invoice Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Total Amount paid with advance</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Paid Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Pending Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Paid Cash</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Paid Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>History</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Action</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehiclePayments.length > 0 ? (
                    getSortedPayments().map((payment) => {
                      const pendingAmount = Math.max(
                        0,
                        parseFloat(payment.invoice_amount) -
                        parseFloat(payment.paid_amount) -
                        parseFloat(inputAdvanceAmount || 0)
                      );
                      const isFullyPaid = pendingAmount === 0;

                      return (
                        <TableRow key={payment._id}>
                          <TableCell>{payment.appointment_id}</TableCell>
                          <TableCell>{selectedCustomerDetails?.customer_name || vehiclePayments[0]?.customer_name}</TableCell>
                          <TableCell>{payment.vehicle_id}</TableCell>
                          <TableCell>
                            {getDateComponents(payment.appointment_date)}
                          </TableCell>
                          <TableCell>
                            ₹{Math.max(0, payment.invoice_amount).toFixed(2)}
                          </TableCell>
                          <TableCell>₹{payment.advance_payment}</TableCell>
                          <TableCell>₹{payment.paid_amount}</TableCell>
                          <TableCell>₹{pendingAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              style={{ width: "150px" }}
                              label="Enter amount"
                              size="small"
                              disabled={isFullyPaid}
                              value={paidAmounts[payment._id] || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                const numericValue = parseFloat(value);
                                const maxAmount = pendingAmount;

                                if (
                                  value === "" ||
                                  (!isNaN(numericValue) &&
                                    numericValue >= 0 &&
                                    numericValue <= maxAmount)
                                ) {
                                  handlePaidAmountChange(payment._id, value);
                                }
                              }}
                              placeholder={`${pendingAmount.toFixed(2)}`}
                              InputProps={{
                                startAdornment: (
                                  <span style={{ marginRight: 4 }}>₹</span>
                                ),
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {isFullyPaid
                              ? "Fully Paid"
                              : payment.paid_status === "paid"
                                ? "Fully Paid"
                                : payment.paid_status === "partially paid"
                                  ? "Partially Paid"
                                  : "Pending"}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(event) => handlePaymentMethodInfo(event, payment)}
                              title="View payment history"
                            >
                              <InfoOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleRowSubmit(payment)}
                              style={{
                                padding: "5px 10px",
                                backgroundColor: isFullyPaid ? "#6c757d" : "#28a745",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: isFullyPaid ? "default" : "pointer",
                                display:
                                  calculateTotals(vehiclePayments)
                                    .totalInvoiceAmount ===
                                    calculateTotals(vehiclePayments).totalPaidAmount
                                    ? "none"
                                    : "block",
                              }}
                            >
                              {isFullyPaid ? "Fully Paid" : "Submit"}
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} align="center" sx={{ padding: 3 }}>
                        <Typography variant="body1">No payment records found for this vehicle.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{
          p: 2,
          maxWidth: 400,
          maxHeight: 500, // Set maximum height
          overflow: 'auto' // Enable scrolling
        }}>
          <Typography variant="h6" gutterBottom>
            All Payment History
          </Typography>
          {paymentLog.length > 0 ? (
            paymentLog.map((log, index) => (
              <Box key={index} sx={{ mb: 2, pb: 1, borderBottom: index < paymentLog.length - 1 ? '1px solid #ddd' : 'none' }}>
                {log.appointment_id && (
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                    Appointment: {log.appointment_id}
                  </Typography>
                )}
                {log.customer_name && (
                  <Typography variant="caption" sx={{ display: 'block', color: '#666', mb: 0.5 }}>
                    Customer: {log.customer_name}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Method:</strong> {log.payment_method}
                </Typography>
                <Typography variant="body2">
                  <strong>Amount:</strong> ₹{log.paid_amount}
                </Typography>
                {log.payment_method === 'cheque' && (
                  <>
                    <Typography variant="body2">
                      <strong>cheque No:</strong> {log.cheque_no || 'N/A'}
                    </Typography>
                    {log.cheque_date && (
                      <Typography variant="body2">
                        <strong>cheque Date:</strong> {new Date(log.cheque_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </>
                )}

                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(log.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {new Date(log.date).toLocaleTimeString()}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2">No payment history available</Typography>
          )}
        </Box>
      </Popover>
    </div>
  );
}
