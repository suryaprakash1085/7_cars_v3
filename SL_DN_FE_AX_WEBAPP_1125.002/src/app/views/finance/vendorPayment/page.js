"use client";
// React and Next imports
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";

// Function imports - Alphabetical
import {
  getDisplayPayments,
  handleOptionChange,
  handleRowClick,
  processPayments,
  fetchPayments,
} from "../../../../../controllers/vendorPaymentControllers";

// Component imports - Alphabetical
import BackButton from "@/components/backButton";
import Navbar from "@/components/navbar";
import AddCustomer from "@/components/addcustfrom_finance";

// UI package imports - Alphabetical
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
  Modal
} from "@mui/material";

// Icons and Images imports - Alphabetical
import SearchIcon from "@mui/icons-material/Search";

export default function CustomerPayment() {
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
  const [openModal, setOpenModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add a state to track if the view is mobile
  const [isMobileView, setIsMobileView] = useState(false);

  // Function to determine if the screen is mobile-sized
  const isMobile = () => typeof window !== "undefined" && window.innerWidth <= 768;

  // Add an effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(isMobile());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      handleResize(); // Call it initially to set the state

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

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
        console.log("Error fetching customers:", error);
        setCustomers([]);
        setHasMore(false);
      }
    };

    const loadPayments = async () => {
      const fetchedPayments = await fetchPayments(startDate, endDate);
      setPayments(fetchedPayments.data);
      console.log('fetchedPayments', fetchedPayments)
    };
    loadPayments();
    fetchCustomers();
  }, [startDate, endDate, changeinsupp_inv]);


  useEffect(() => {
  const today = new Date();

  const last7Days = new Date();
  last7Days.setDate(today.getDate() - 7);

  // format YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split("T")[0];

  setStartDate(formatDate(last7Days));
  setEndDate(formatDate(today));
}, []);
  // const uniqueVehiclePayments = processPayments(payments);

  // Functions that has to be in the same file
  const onRowClick = (vehicleId) => handleRowClick(vehicleId, router);

  // Get display payments
  // const displayPayments = getDisplayPayments(
  //   filteredPayments,
  //   uniqueVehiclePayments
  // );

  // Update displayPayments to filter based on search query and phone number
  // const payments = displayPayments.filter(
  //   (payment) =>
  //     payment.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     (payment.phone && payment.phone.includes(searchQuery))
  // );

  // Add these new handlers
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCustomer(null);
    setAdvanceAmount("");
  };

  // Add this function to handle the submission of advance payment
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

      if (!response.ok) {
        throw new Error("Failed to submit advance payment.");
      }

      const data = await response.json();
      // console.log("Advance payment successful:", data);
      handleCloseModal();
      setSnackbarMessage("Advance payment successful.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.log(error.message);
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Function to handle Enter key press
  const handleSearchKeyDown = async (event) => {
    if (event.key === "Enter") {
      // Perform search or any other action on Enter key press
      setSearchQuery(searchInput);

      // Define the async function to fetch search results
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/finance/transactions?searchText=${searchInput}&type=supplier`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // Handle the response (you can set the result in your state here)
        console.log(response.data); // Example: log the data to console
        // Set the state with the fetched data
        setPayments(response.data.data);
      } catch (error) {
        console.log("Error fetching payments:", error);
        // Handle error (e.g., show an error message)
      }
    }
  };

 const pageType = Cookies.get("page_type"); // "tab" or others

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
      {/* <Navbar pageName="Supplier Payments" /> */}
{pageType !== "tab" && <Navbar pageName="Supplier Payments" />}

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
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", marginLeft: "auto", }}>
                      
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
          <div>
            {/* <Button
              variant="contained"
              color="primary"
              onClick={handleOpenModal}
            >
              Advance Payment
            </Button> */}
          </div>
        </div>
        {isMobileView ? (
          // Render card view for mobile
          <div>
            {payments?.length > 0 ? (
              payments.map((payment) => (
                <Paper
                  key={payment.id}
                  sx={{
                    marginBottom: "16px",
                    padding: "16px",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                  onClick={() => onRowClick(payment.invoice_no)}
                >
                  <Typography variant="h6">{payment.customer_id}</Typography>
                  <Typography variant="body2">{payment.creation_date}</Typography>
                  <Typography variant="body2">Invoice No: {payment.invoice_no}</Typography>
                  <Typography variant="body2">Credit Amount: ₹{parseFloat(payment.credit).toFixed(2)}</Typography>

                  <Chip
                    label={
                      payment.status === null || payment.status === "pending"
                        ? "Pending"
                        : payment.status === "partially paid"
                          ? "Partially Paid"
                          : "Paid"
                    }
                    color={
                      payment.status === null || payment.status === "pending"
                        ? "error"
                        : payment.status === "partially paid"
                          ? "warning"
                          : "success"
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
            <Table sx={{ minWidth: 650 }} aria-label="supplier payments table">
              <TableHead>
                <TableRow>
                  <TableCell>Supplier ID</TableCell>
                    <TableCell>Creation Date</TableCell>
                  <TableCell>Invoice No</TableCell>
                
                  <TableCell>Credit Amount</TableCell>
                  <TableCell>Debit Amount</TableCell>
                  <TableCell>Payment Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments?.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow
                      key={payment.id}
                      onClick={() => onRowClick(payment.customer_id)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "#f5f5f5" },
                      }}
                    >
                      <TableCell>{payment.customer_id}</TableCell>
                      <TableCell>{payment.creation_date}</TableCell>
                      <TableCell>{payment.invoice_no}</TableCell>
                      <TableCell>₹{payment.credit === null ? "0.00" : parseFloat(payment.credit).toFixed(2)}</TableCell>
                      <TableCell>₹{payment.debit === null ? "0.00" : parseFloat(payment.debit).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            payment.status === null || payment.status === "pending"
                              ? "Pending"
                              : payment.status === "partially paid"
                                ? "Partially Paid"
                                : "Paid"
                          }
                          color={
                            payment.status === null || payment.status === "pending"
                              ? "error"
                              : payment.status === "partially paid"
                                ? "warning"
                                : "success"
                          }
                          size="small"
                        />

                      </TableCell>

                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}


        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Advance Payment</DialogTitle>
          <DialogContent>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                marginTop: "10px",
              }}
            >
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.customer_name}
                isOptionEqualToValue={(option, value) =>
                  option.customer_id === value.customer_id
                }
                onChange={(event, newValue) => setSelectedCustomer(newValue)}
                onInputChange={(event, newValue) => {
                  // if value is blank dont set the value
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
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.customer_id}>
                    {option.customer_name}
                  </li>
                )}
                noOptionsText={
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body1">
                      No Items Available
                    </Typography>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => {
                        setOpenAddCustomerModal(true);
                        // Assuming you have a similar function to set the product type
                        // setProductType("desiredProductType");
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                }
              />

              <TextField
                label="Phone Number"
                value={selectedCustomer ? selectedCustomer.contact.phone : ""}
                disabled
                variant="outlined"
              />

              <TextField
                label="Advance Amount"
                type="text"
                value={advanceAmount}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setAdvanceAmount(value);
                  }
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAdvancePaymentSubmit}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
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
