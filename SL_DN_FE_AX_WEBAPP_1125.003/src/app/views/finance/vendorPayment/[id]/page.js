"use client";

// React and Next imports
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  sendWhatsappMessage,
  checkWhatsappLoggedIn,
} from "@/components/whatsapp";
import axios from "axios";
import Cookies from "js-cookie";
// Function imports - Alphabetical
import {
  calculatePaymentStatus,
  calculateTotals,
  distributeBulkPayment,
  getDateComponents,
} from "../../../../../../controllers/vendorPaymentControllers";
import { payments, fetchPayments } from "../../../../../../controllers/vendorPaymentControllers";

// Component imports - Alphabetical
import BackButton from "@/components/backButton";
import Navbar from "@/components/navbar";

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
} from "@mui/material";

export default function CustomerPaymentPage() {


  const { id: supplierId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [supplier, setSupplier] = useState([]);
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/finance/transactions?type=supplier&supplier_id=${supplierId}`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        });
        // fetching the supplier details
        const supplierResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/supplier/${supplierId}`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        });
        console.log("supplierResponse", supplierResponse);


        const grouped = response.data.data.reduce((acc, item) => {
          console.log("item", item);
          const key = item.invoice_no || 'OutStanding';
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(item);
          return acc;
        }, {});

        const mergedGrouped = Object.entries(grouped).reduce((acc, [invoiceNo, entries]) => {
          const merged = {
            ...entries[0], // base from the first entry
            debit: 0,
            credit: 0
          };

          entries.forEach(entry => {
            merged.debit += parseFloat(entry.debit || 0);
            merged.credit += parseFloat(entry.credit || 0);
          });

          acc[invoiceNo] = merged;
          return acc;
        }, {});

        const result = Object.entries(mergedGrouped).map(([key, value]) => ({
          groupid: key,
          ...value
        }));
        // setTransactions(response.data.data);
        setTransactions(result);
        setSupplier(supplierResponse.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, [supplierId]);

  // FrontEnd extracted data states
  const { id } = useParams();

  // Define state for vehicle payments
  const [vehiclePayments, setVehiclePayments] = useState([]);

  // Frontend data processing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedPayments = await fetchPayments();
        const filteredPayments = fetchedPayments.filter(
          (p) =>
            p.vehicle_id === id &&
            (p.paid_status.toLowerCase() === "not paid" ||
              p.paid_status.toLowerCase() === "partially paid")
        );
        setVehiclePayments(filteredPayments);

        // Set initial payment method if available
        if (filteredPayments[0]?.payment_method) {
          setPaymentMethod(filteredPayments[0].payment_method);
          if (filteredPayments[0].payment_method === "cheque") {
            setChequeNo(filteredPayments[0].cheque_no || "");
            setChequeDate(filteredPayments[0].cheque_date || "");
          }
        }

        // console.log("filteredPayments", filteredPayments);
      } catch (error) {
        console.log("Error fetching payments:", error);
      }
    };

    fetchData();
  }, [id]);

  // Frontend form input states
  const [paidAmounts, setPaidAmounts] = React.useState({});
  const [pendingAmounts, setpendingAmounts] = React.useState({});
  const [inputAdvanceAmount, setInputAdvanceAmount] = useState("");
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState("");
  const [token, setToken] = useState("");

  // Add these new states after other state declarations
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      setToken(token);
    }
  }, []);

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
    const effectivependingAmount = isAdvanceChecked
      ? pendingAmount - parseFloat(inputAdvanceAmount || 0)
      : pendingAmount;

    setPaidAmounts({
      ...paidAmounts,
      [paymentId]: value,
    });

    // Update payment status based on the new paid amount
    const newStatus =
      newPaidAmount >= effectivependingAmount ? "fully paid" : "partially paid";
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
  const handleRowSubmit = async (transaction) => {
    const paidAmount = parseFloat(paidAmounts[transaction.id] || 0);
    const remainingCredit = parseFloat(transaction.credit) - ( parseFloat(transaction.debit) + paidAmount );
    const newDebit = parseFloat(transaction.debit || 0) + paidAmount;
    const newStatus = remainingCredit <= 0 ? "fully paid" : "partially paid";
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/finance/post_ledger`, {
        // id: transaction.id,
        invoice_no: transaction.invoice_no,
        customer_id: transaction.customer_id,
        appointment_id: transaction.appointment_id,
        creation_date: new Date().toISOString().split("T")[0],
        type: transaction.type,
        expense_type: 'Debit',
        description: `Debit to Vendor #${transaction.customer_id} against invoice #${transaction.invoice_no}`,
        status: newStatus,
        debit: paidAmount.toFixed(2),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/finance/update_ledger`, {
      //   id: transaction.id,
      //   status: newStatus,
      //   // credit: remainingCredit.toFixed(2),
      //   debit: newDebit.toFixed(2),
      // }, {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     "Content-Type": "application/json",
      //   },
      // });

      if (response.status === 200) {
        setTransactions((prevTransactions) =>
          prevTransactions.map((t) =>
            t.id === transaction.id ? { ...t, status: newStatus, debit: newDebit } : t
          )
        );
        setSnackbarMessage("Transaction updated successfully.");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      setSnackbarMessage("Error updating transaction.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCheckboxChange = () => {
    const newCheckedState = !isAdvanceChecked;
    setIsAdvanceChecked(newCheckedState);
    if (newCheckedState && vehiclePayments.length > 0) {
      if (
        vehiclePayments[0].advance_balance >
        vehiclePayments[0].invoice_amount - vehiclePayments[0]?.paid_amount
      ) {
        setInputAdvanceAmount(
          vehiclePayments[0].invoice_amount - vehiclePayments[0]?.paid_amount
        );
      } else {
        setInputAdvanceAmount(vehiclePayments[0].advance_balance);
      }
    } else {
      setInputAdvanceAmount("0");
    }
  };
 const pageType = Cookies.get("page_type"); // "tab" or others

  // UI Code
  return (
    <div>
      {/* <Navbar pageName="Payment Details" /> */}
       {pageType !== "tab" && <Navbar pageName="Calls" />}
      
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
            <Typography variant="h3">{supplier.supplier_name}</Typography>
            <Typography variant="body1">
              <strong>Customer:</strong> {supplier.supplier_name}
            </Typography>
            <Typography variant="body1">
              <strong>Phone:</strong>{" "}
              <a href={`tel://${supplier?.contact?.phone}`}>
                {supplier?.contact?.phone}
              </a>

            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              pending Payment Summary
            </Typography>

            <Typography variant="body1">
              <strong>Total Credit Amount:</strong> ₹
              {calculateTotals(transactions).totalCreditAmount}
            </Typography>

            <Typography variant="body1">
              <strong>Total Paid Amount:</strong> ₹
              {/* {(
                  parseFloat(calculateTotals(vehiclePayments).totalPaidAmount) +
                  parseFloat(inputAdvanceAmount || 0)
                ).toFixed(2)} */}
              {calculateTotals(transactions).totalDebitAmount}
            </Typography>
            {/* <Typography variant="body1">
              <strong>Balance:</strong> ₹ */}
            {/* {calculateTotals(transactions).balanceAmount} */}
            {/* </Typography> */}

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
                    const advanceBalance =
                      vehiclePayments[0]?.advance_balance <
                        vehiclePayments[0]?.invoice_amount
                        ? vehiclePayments[0]?.invoice_amount
                        : vehiclePayments[0]?.advance_balance;
                    if (
                      value === "" ||
                      (parseFloat(value) >= 0 &&
                        parseFloat(value) <= advanceBalance)
                    ) {
                      setInputAdvanceAmount(value);
                    }
                  }}
                  placeholder={`₹${vehiclePayments[0]?.advance_balance || 0}`}
                />
              </div>
            </Grid>
          ) : null}
          <Grid item xs={12} sm={3}>
            <Typography variant="body1" style={{ marginBottom: "10px" }}>
              <strong>Payment Method:</strong>
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Transaction ID</strong></TableCell>
                  <TableCell><strong>Supplier ID</strong></TableCell>
                  <TableCell><strong>Invoice No</strong></TableCell>
                  <TableCell><strong>Creation Date</strong></TableCell>
                  {/* <TableCell><strong>Invoice Date</strong></TableCell> */}
                  <TableCell><strong>Supplier Invoice Amount	</strong></TableCell>
                  <TableCell><strong>Supplier Invoice Paid	</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Pending Amount</strong></TableCell>
                  <TableCell><strong>Suppler Payments </strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.id}</TableCell>
                    <TableCell>{transaction.customer_id}</TableCell>
                    <TableCell>{transaction.invoice_no}</TableCell>
                    <TableCell>{getDateComponents(transaction.creation_date)}</TableCell>
                    {/* <TableCell>
                      {transaction.invoice_date ? getDateComponents(transaction.invoice_date) : 'No Date'}
                    </TableCell> */}

                    <TableCell>₹{Math.max(0, parseFloat(transaction.credit || 0)).toFixed(2)}</TableCell>
                    <TableCell>₹{Math.max(0, parseFloat(transaction.debit || 0)).toFixed(2)}</TableCell>
                    <TableCell>
                      {/* {transaction.status} */}
                      <span
                      // style={{
                      //   padding: '5px 10px',
                      //   backgroundColor:
                      //     transaction.status === 'fully paid' ? '#6c757d' :
                      //       transaction.status === 'paid' ? '#28a745' :
                      //         transaction.status === 'partially paid' ? '#ffc107' :
                      //           transaction.status === 'pending' ? '#007bff' :
                      //             '#007bff',
                      //   color: '#fff',
                      //   borderRadius: '12px',
                      //   fontWeight: 'bold',
                      // }}
                      >
                        {transaction.status === 'fully paid' ? 'fully paid' :
                          transaction.status === 'paid' ? 'Paid' :
                            transaction.status === 'partially paid' ? 'partially paid' :
                              transaction.status === 'pending' ? 'pending' : 'pending'}

                      </span>
                    </TableCell>

                    <TableCell>
                      {transaction.credit - transaction.debit >= 0 ? (transaction.credit - transaction.debit).toFixed(2) : "0.00"}
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        max={transaction.credit}
                        placeholder={transaction.credit - transaction.debit >= 0 ? (transaction.credit - transaction.debit).toFixed(2) : "0.00"}
                        value={paidAmounts[transaction.id] || ""}
                        onChange={(e) => {
                          const value = Math.min(e.target.value, transaction.credit); // Ensure it doesn't exceed transaction.credit
                          setPaidAmounts({
                            ...paidAmounts,
                            [transaction.id]: value
                          });
                        }}
                      />

                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleRowSubmit(transaction)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: transaction.status === "fully paid" ? "#6c757d" : "#28a745",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: transaction.status === "fully paid" ? "default" : "pointer",
                        }}
                        disabled={transaction.status === "fully paid"}
                      >
                        {transaction.status === "fully paid" ? "fully paid" : "Submit"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

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
    </div>
  );
}
