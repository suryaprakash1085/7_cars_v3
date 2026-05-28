"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";

import BackButton from "@/components/backButton";
import Navbar from "@/components/navbar";
import AddCustomer from "@/components/addcustfrom_finance";
import UnifiedPDF from "@/components/UnifiedPDF";

import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Autocomplete,
  Snackbar,
  Alert,
  Dialog,
  Grid,
} from "@mui/material";

export default function AdvancePayment() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdvancePaymentContent />
    </Suspense>
  );
}

function AdvancePaymentContent() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceHistory, setAdvanceHistory] = useState([]);
  const [advanceHistoryLoading, setAdvanceHistoryLoading] = useState(false);
  const [advanceHistoryError, setAdvanceHistoryError] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const [OpenAddCustomerModal, setOpenAddCustomerModal] = useState(false);
  const [typedname, setTypedname] = useState("");
  const [changeinsupp_inv, setchangeinsupp_inv] = useState(false);
  const [refreshAdvanceHistory, setRefreshAdvanceHistory] = useState(false);

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
        setCustomers([]);
      }
    };

    fetchCustomers();
  }, [changeinsupp_inv]);

  useEffect(() => {
    if (!selectedCustomer?.customer_id || !token) {
      setAdvanceHistory([]);
      setAdvanceHistoryError("");
      return;
    }

    const fetchAdvanceHistory = async () => {
      setAdvanceHistoryLoading(true);
      setAdvanceHistoryError("");

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/finance/transactions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              customer_id: selectedCustomer.customer_id,
              type: "customer-advance",
            },
          }
        );

        let historyData = [];
        if (response.data?.data) {
          historyData = response.data.data;
        } else if (Array.isArray(response.data)) {
          historyData = response.data;
        }

        if (historyData.length === 0) {
          const fallbackResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/finance/transactions`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                customer_id: selectedCustomer.customer_id,
                searchText: "Advance",
              },
            }
          );

          if (fallbackResponse.data?.data) {
            historyData = fallbackResponse.data.data;
          } else if (Array.isArray(fallbackResponse.data)) {
            historyData = fallbackResponse.data;
          }
        }

        setAdvanceHistory(historyData);
      } catch (error) {
        console.error("Error fetching advance history:", error);
        setAdvanceHistory([]);
        setAdvanceHistoryError("Unable to load advance history");
      } finally {
        setAdvanceHistoryLoading(false);
      }
    };

    fetchAdvanceHistory();
  }, [selectedCustomer?.customer_id, token, refreshAdvanceHistory]);

  const handleAdvancePaymentSubmit = async () => {
    if (!selectedCustomer || !advanceAmount) {
      setSnackbarMessage("Please fill all the fields.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/advance_payment/${selectedCustomer.customer_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ advance_payment: parseFloat(advanceAmount) }),
        }
      );

      const ledgerData = {
        customer_id: selectedCustomer.customer_id,
        status: "Advance Amount",
        creation_date: new Date().toISOString().split("T")[0],
        expense_type: "Advance",
        type: "customer-advance",
        description: `Advanced Amount By Customer #${selectedCustomer.customer_id}`,
        debit: advanceAmount,
      };

      const response2 = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/finance/post_ledger`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ledgerData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit advance payment.");
      }

      setAdvanceAmount("");

      // refresh advance history
      setchangeinsupp_inv(!changeinsupp_inv); // to refresh customer data
      setRefreshAdvanceHistory(!refreshAdvanceHistory); // to refresh advance history

      setSnackbarMessage("Advance payment successful.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

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
        />
      </Dialog>
      <Navbar pageName="Advance Payment" />

      <Box paddingX={"2%"} mt={2}>

        <Paper sx={{ p: 4, mb: 4, maxWidth: "1200px", margin: "0 auto" }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.customer_name}
                isOptionEqualToValue={(option, value) =>
                  option.customer_id === value.customer_id
                }
                onChange={(event, newValue) => {
                  setSelectedCustomer(newValue);
                }}
                onInputChange={(event, newValue) => {
                  if (newValue) {
                    setTypedname(newValue);
                  }
                }}
                value={selectedCustomer}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer Name"
                    variant="outlined"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.customer_id}>
                    {option.customer_name}
                  </li>
                )}
                noOptionsText={
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body1">No Items Available</Typography>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => {
                        setOpenAddCustomerModal(true);
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                }
              />
            </Grid> 

            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                value={selectedCustomer?.contact?.phone || selectedCustomer?.phone || ""}
                disabled
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Current Advance Balance"
                value={
                  selectedCustomer?.advance_payment != null
                    ? `₹ ${Number(selectedCustomer.advance_payment).toFixed(2)}`
                    : "-"
                }
                disabled
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Advance Amount"
                type="text"
                fullWidth
                value={advanceAmount}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setAdvanceAmount(value);
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Total Advance Amount"
                value={
                  selectedCustomer?.advance_payment != null && advanceAmount
                    ? `₹ ${(
                        Number(selectedCustomer.advance_payment) +
                        Number(advanceAmount || 0)
                      ).toFixed(2)}`
                    : selectedCustomer?.advance_payment != null
                    ? `₹ ${Number(selectedCustomer.advance_payment).toFixed(2)}`
                    : "-"
                }
                disabled
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <UnifiedPDF
                type="advance-voucher"
                data={{ customer: selectedCustomer, amount: advanceAmount }}
                buttonLabel="Print Voucher"
                variant="contained"
                color="primary"
                disabled={!selectedCustomer || !advanceAmount}
                token={token}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAdvancePaymentSubmit}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {selectedCustomer && (
          <Box sx={{ mt: 4, maxWidth: "1200px", margin: "0 auto" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Advance History
            </Typography>
            {advanceHistoryLoading ? (
              <Typography>Loading advance history...</Typography>
            ) : advanceHistoryError ? (
              <Typography color="error">{advanceHistoryError}</Typography>
            ) : advanceHistory.length === 0 ? (
              <Typography>No advance history found.</Typography>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Credit</TableCell>
                      <TableCell align="right">Debit</TableCell>
                      <TableCell align="right">Total Advance Amount</TableCell>
                      <TableCell>Invoice</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {advanceHistory.map((payment, index) => {
                      let totalAdvanceAmount = 0;
                      advanceHistory.slice(0, index + 1).forEach((p) => {
                        if (p.debit) totalAdvanceAmount += Number(p.debit);
                        if (p.credit) totalAdvanceAmount -= Number(p.credit);
                      });

                      const currentAdvanceAtThatTime = totalAdvanceAmount - Number(payment.debit || 0);

                      return (
                        <TableRow
                          key={payment.id || `${payment.creation_date}-${payment.credit}-${payment.debit}`}
                        >
                          <TableCell>{payment.creation_date || "-"}</TableCell>
                          <TableCell>{payment.description || "-"}</TableCell>
                          <TableCell align="right">
                            {payment.credit != null
                              ? `₹${Number(payment.credit).toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell align="right">
                            {payment.debit != null
                              ? `₹${Number(payment.debit).toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell align="right">
                            <strong>₹{totalAdvanceAmount.toFixed(2)}</strong>
                          </TableCell>
                          <TableCell>{payment.invoice_no || "-"}</TableCell>
                          <TableCell sx={{ display: "flex", gap: 1 }}>
                            <UnifiedPDF
                              type="advance-voucher"
                              data={{
                                customer: {
                                  ...selectedCustomer,
                                  advance_payment: currentAdvanceAtThatTime,
                                },
                                amount: payment.debit || 0,
                              }}
                              buttonLabel="PDF"
                              size="small"
                              variant="outlined"
                              token={token}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
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
