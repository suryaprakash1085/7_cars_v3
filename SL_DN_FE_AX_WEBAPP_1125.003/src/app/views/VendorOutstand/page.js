"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import AddSupplier from "@/components/addSupplier";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
// import Cookies from 'js-cookie';
import { Suspense } from 'react';

// Function imports
import {
  fetchData,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  filterDataByStatus,
  updateCount,
  calculateDays,
  filterByDateRange,
} from "../../../../controllers/vendoroutstandControllers";

// Component imports
import Navbar from "../../../components/navbar";
import BackButton from "@/components/backButton";

// Functional package imports
import axios from "axios";

// UI package imports
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Badge,
  Fab,
  Snackbar,
  Alert,
  Autocomplete,
  Button,
  Modal,
  Typography,
} from "@mui/material";
import Cookies from "js-cookie";

// Images and Icon imports
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { IconButton } from "yet-another-react-lightbox";
import { Cookie } from "@mui/icons-material";

const filterStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f9f9f9",
  height: "30px",
  width: "60px",
  padding: "10px",
  textAlign: "center",
  cursor: "pointer",
  borderRadius: "15px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
};

// Create a separate component for the main content
function VendorOutstandContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  // FrontEnd extracted data states
  const [token, setToken] = useState("");
  const [openAddSupplierModal, setOpenAddSupplierModal] = useState(false);
  const [typedname, setTypedname] = useState("");
  const [refreshonsave, setRefreshonsave] = useState(false);
  // Modal and Alert states
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [showFab, setShowFab] = useState(false);
  const [openaddentry, setopenaddentry] = useState(false);
  const [changeinsupp_inv, setchangeinsupp_inv] = useState(false);
  // Backend data states
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // FrontEnd form input states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numberOfPaid, setNumberOfPaid] = useState(0);
  const [numberOfOverdue, setNumberOfOverdue] = useState(0);
  const [numberOfPending, setNumberOfPending] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const [showDetails, setShowDetails] = useState({});
  const [formData, setFormData] = useState({
    appointment_id: "",
    customer_id: "",
    credit: "",
    expense_type: "Credit", // Default to 'Credit'
    description: "",
    invoice_id: "",
    invoice_date: "",
  });

  const [supp_data, setsupp_data] = useState();

  // Set initial date range to current week
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/finance/transactions?type=supplier&start_date=${startDate}&end_date=${endDate}`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        });
        setFilteredData(response.data.data);

      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const url = selectedSupplier
          ? `${process.env.NEXT_PUBLIC_API_URL}/finance/transactions?type=supplier&supplier_id=${selectedSupplier.supplier_id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/finance/transactions?type=supplier`;

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        });

        // Set the data if the response is successful
        setFilteredData(aggregateTransactions(response.data.data));

      } catch (error) {
        console.error("Error fetching transactions:", error);
        setFilteredData([]); // Set filtered data as empty on error
      }
    };

    fetchTransactions();
  }, [selectedSupplier]); // Dependencies array

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768); // Adjust the width as needed
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/supplier`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data) {
          setsupp_data(response.data); // Update state with the response data
        }
      } catch (error) {
        console.error("Error fetching supplier data:", error);
      }
    };

    fetchSupplierData(); // Call the async function to fetch data
  }, [changeinsupp_inv]); // Empty dependency array to run only on mount

  // Function to update status based on conditions
  const updateStatus = (data) => {
    return data.map((item) => {
      const [day, month, year] = item.invoiceDate.split("/");
      const invoiceDate = new Date(`${year}-${month}-${day}`);
      invoiceDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysDifference = Math.ceil(
        (today - invoiceDate) / (1000 * 60 * 60 * 24)
      );

      // if (item.pendingAmount === 0) {
      //   item.status = "Paid";
      // } else if (daysDifference > 15) {
      //   item.status = "Overdue";
      // } else {
      //   item.status = "Pending";
      // }

      if (item.pendingAmount === 0) {
        item.status = "Paid";
      } else if (daysDifference > 15) {
        item.status = "Overdue";
      } else {
        item.status = "Pending";
      }

      return item;
    });
  };

  // Fetch data and update status
  // useEffect(() => {
  //   let storedToken = Cookies.get("token");
  //   setToken(storedToken);

  //   fetchData(
  //     axios,
  //     storedToken,
  //     setData,
  //     setFilteredData,
  //     updateStatus,
  //     setOpenSnackbar,
  //     setSnackbarMessage,
  //     setSnackbarSeverity
  //   );
  // }, []);
  // MADE BY SARA USE THIS ONLY IF WANT TO GROUP THE TRANSACTIONS BY CUSTOMER_ID
  function aggregateTransactions(transactions) {
    const result = {};

    transactions.forEach(transaction => {
      const { customer_id } = transaction;
      const key = customer_id; // Only use customer_id as key

      if (!result[key]) {
        result[key] = {
          customer_id: customer_id,
          credit: 0,
          debit: 0,
          status: "Pending",
          invoice_date: transaction.invoice_date,
          creation_date: transaction.creation_date,
        };
      }

      // Sum up all credits and debits for this supplier
      result[key].credit += parseFloat(transaction.credit || 0);
      result[key].debit += parseFloat(transaction.debit || 0);
    });

    // Calculate status for each supplier
    Object.values(result).forEach(entry => {
      if (entry.credit === 0) {
        entry.status = "No Transactions";
      } else if (entry.credit === entry.debit) {
        entry.status = "Fully Paid";
      } else if (entry.debit > 0 && entry.debit < entry.credit) {
        entry.status = "Partially Paid";
      } else {
        entry.status = "Pending";
      }
    });

    return Object.values(result);
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/finance/transactions?type=supplier`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        // setFilteredData(data.data); // Set the data into state
        if (id) {
          // console.log("Filtering with id:", id);
          const filtered = data.data.filter(item => {
            // console.log("Checking item:", item.customer_id);
            return item.customer_id === id;
          });
          setFilteredData(filtered);
          setFilteredData(aggregateTransactions(filtered));
        }
        else {
          // setFilteredData(data.data);
          setFilteredData(aggregateTransactions(data.data));
        }
        console.log(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [token, refreshonsave]); // Dependency array ensures the effect is triggered when 'token' changes


  // Calculate counts based on filtered data
  useEffect(() => {
    updateCount(
      filteredData,
      setNumberOfPaid,
      setNumberOfOverdue,
      setNumberOfPending
    );
  }, [filteredData]);

  // Update filtered data when dates change
  useEffect(() => {
    filterByDateRange(data, setFilteredData, startDate, endDate);
  }, [startDate, endDate]);

  // Function to filter by date range
  const filterByDateRange = (data, setFilteredData, startDate, endDate) => {
    if (!startDate && !endDate) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) => {
      // Convert DD/MM/YYYY to YYYY-MM-DD for proper date comparison
      const [day, month, year] = item.invoiceDate.split("/");
      const invoiceDate = new Date(`${year}-${month}-${day}`);

      // Remove time portion from dates for accurate comparison
      invoiceDate.setHours(0, 0, 0, 0);

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(0, 0, 0, 0);

      if (start && end) {
        return invoiceDate >= start && invoiceDate <= end;
      } else if (start) {
        return invoiceDate >= start;
      } else if (end) {
        return invoiceDate <= end;
      }
      return true;
    });

    setFilteredData(filtered);
  };

  const toggleDetails = (index) => {
    setShowDetails((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  // Function to handle closing the snackbar
  const handleCloseSnackBar = () => {
    setOpenSnackbar(false);
  };

  const handleInvoiceDateChange = (e) => {
    const { name, value } = e.target;
    // preselect the today's date
    setFormData((prevState) => ({
      ...prevState,
      [name]: value || new Date().toISOString().split('T')[0],
    }));
  };
  // Handle input change in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle form submission (mockup for now)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const resp = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/finance/supplier/credit`,
      { formData },
      {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (resp.status === 201) {
      setopenaddentry(false);
      handleClose(); // Close the modal after submission
      setSnackbarMessage("Credit added successfully!");
      // fetch the data again
      setRefreshonsave(true);
      setFormData({
        appointment_id: "",
        customer_id: "",
        credit: "",
        expense_type: "Credit", // Default to 'Credit'
        description: "",
        invoice_id: "",
      });
    }
    // close the modal
    else {
      setSnackbarMessage("Failed to add credit. Please try again.");
      setSnackbarSeverity("error");
    }
  };

  // Open modal function
  const handleOpen = () => setopenaddentry(true);

  // Close modal function
  const handleClose = () => setopenaddentry(false);

  const handleAutocompleteChange = (event, newValue) => {
    // Update customer_id in formData with the selected supplier's supplier_id
    if (newValue) {
      setFormData((prevState) => ({
        ...prevState,
        customer_id: newValue.supplier_id,
      }));
    }
  };
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      <Modal
        open={openAddSupplierModal}
        onClose={() => { }}

      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          <AddSupplier
            typedname={typedname}
            setTypedname={setTypedname}
            onClose={() => {
              setOpenAddSupplierModal(false), setchangeinsupp_inv(true);
            }}
          />
        </Box>
      </Modal>
      {openaddentry && (
        <Modal
          open={openaddentry}
        // onClose={handleClose}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "100%",
            }}
          >
            <h2>Add Appointment Entry</h2>

            <form onSubmit={handleSubmit}>
              <Autocomplete
                value={
                  supp_data.find(
                    (supplier) => supplier.supplier_id === formData.customer_id
                  ) || null
                }
                onChange={handleAutocompleteChange} // Use the correct change handler
                options={supp_data}
                onInputChange={(event, newValue) => {
                  // if value is blank dont set the value
                  if (newValue) {
                    setTypedname(newValue);
                  }
                }}
                getOptionLabel={(option) =>
                  `${option.supplier_id} - ${option.name}`
                } // Display supplier_id and name in the autocomplete suggestions
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label=" Select Supplier"
                    fullWidth
                    margin="normal"
                    required
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option.supplier_id === value.supplier_id
                } // Ensures proper comparison for selection
                noOptionsText={
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body1">
                      No Suppliers Available
                    </Typography>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => {
                        // Add your logic here to open a modal or any action for adding a supplier
                        setOpenAddSupplierModal(true); // Example function to handle adding a new supplier
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                }
              />
              <TextField
                label="Credit"
                type="number"
                name="credit"
                value={formData.credit}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Expense Type"
                name="expense_type"
                value={formData.expense_type}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                disabled
              />
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Invoice ID"
                name="invoice_id"
                value={formData.invoice_id}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Invoice Date"
                name="invoice_date"
                // preselect the today's date
                value={formData.invoice_date || new Date().toISOString().split('T')[0]}
                onChange={handleInvoiceDateChange}
                fullWidth
                margin="normal"
                type="date"
                InputLabelProps={{
                  shrink: true, // Ensures label stays shrunk
                }}
              />


              {/* Submit and Close Buttons */}
              <div style={{ marginTop: "20px" }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  style={{ marginRight: "10px" }}
                >
                  Submit
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  color="secondary"
                >
                  Close
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
      {/* <Navbar pageName=" Supplier Outstanding" /> */}
      {pageType !== "tab" && <Navbar pageName=" Vendor Outstanding" />}
      <Box
        sx={{
          backgroundSize: "cover",
          minHeight: "89vh",
        }}
        style={{ marginTop: pageType !== "tab" ? "0px" : "16px",}}
      >
        <Box paddingX="1%">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Display status counts */}
            {/* <div
              style={{
                display: "flex",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <Badge badgeContent={filteredData.length} color="primary">
                  <div
                    style={filterStyle}
                    onClick={() =>
                      filterDataByStatus("All", data, setFilteredData, startDate, endDate)
                    }
                  >
                    All <br />
                  </div>
                </Badge>
                <Badge badgeContent={numberOfPaid} color="primary">
                  <div
                    style={filterStyle}
                    onClick={() =>
                      filterDataByStatus("Paid", data, setFilteredData, startDate, endDate)
                    }
                  >
                    Paid <br />
                  </div>
                </Badge>

                <Badge badgeContent={numberOfOverdue} color="primary">
                  <div
                    style={filterStyle}
                    onClick={() =>
                      filterDataByStatus("Overdue", data, setFilteredData, startDate, endDate)
                    }
                  >
                    Overdue
                  </div>
                </Badge>

                <Badge badgeContent={numberOfPending} color="primary">
                  <div
                    style={filterStyle}
                    onClick={() =>
                      filterDataByStatus("Pending", data, setFilteredData, startDate, endDate)
                    }
                  >
                    Pending
                  </div>
                </Badge>
              </div>
            </div> */}
            {/* <div style={{ display: "flex" }}>
               <BackButton />
              <h1 style={{ marginLeft: "10px", color: "white" }}>
                Customer Outstanding
              </h1> 
            </div> */}

            {/* <AddIcon backgroundColorackgroundColor='white' /> */}
            {/* </IconButton> */}
            <div
              onClick={() => {
                setopenaddentry(true);
              }}
              style={{
                backgroundColor: "white",
                borderRadius: "50%",
                color: "black",
                padding: "10px",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <AddIcon style={{ color: "black" }} />
            </div>
            {/* Date Filter Controls */}
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "center",
                justifyContent: "space-around",
              }}
            >
              <Autocomplete
                size="small"
                sx={{ width: "50%", backgroundColor: "white", borderRadius: "4px", }}
                options={supp_data}
                onChange={(event, newValue) => {
                  setSelectedSupplier(newValue);
                  // If no supplier is selected, reset the filtered data
                  if (!newValue) {
                    setFilteredData([]);
                  }
                }}
                getOptionLabel={(option) => `${option.supplier_id} - ${option.name}`}
                renderInput={(params) => <TextField {...params} label="Supplier" />}
              />
              <TextField
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  backgroundColor: "white",
                  borderRadius: "4px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#474747",
                    },
                  },
                }}
              />
              <TextField
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  backgroundColor: "white",
                  borderRadius: "4px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#474747",
                    },
                  },
                }}
              />
            </div>
          </div>

          {isMobileView ? (
            // Render cards for mobile view
            <Box>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <Paper key={index} sx={{ marginBottom: 2, padding: 2 }}>
                    {!showDetails[index] ? (
                      // Summary view
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Transaction Date:</b>{" "}
                          {row.creation_date ? row.creation_date.split("-").reverse().join("/") : "N/A"}

                        </Box>
                        {/* <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Appointment ID:</b> {row.appointment_id}
                        </Box> */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Supplier ID:</b> {row.customer_id}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          {/* <b>Expense Type:</b> {row.expense_type} */}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Invoice Number:</b>{" "}
                          {row.invoice_no ? row.invoice_no : "N/A"}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Description:</b> {row.description}
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => toggleDetails(index)}
                        >
                          Show Details
                        </Button>
                      </Box>
                    ) : (
                      // Details view
                      <Box mt={2}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Transaction Date:</b>{" "}
                          {row.creation_date.split("-").reverse().join("/")}
                        </Box>
                        {/* <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Appointment ID:</b> {row.appointment_id}
                        </Box> */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Supplier ID:</b> {row.customer_id}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          {/* <b>Expense Type:</b> {row.expense_type} */}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Invoice Number:</b>{" "}
                          {row.invoice_no ? row.invoice_no : "N/A"}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Description:</b> {row.description}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Credit:</b>{" "}
                          {row.credit
                            ? parseFloat(row.credit).toFixed(2)
                            : "0.00"}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Debit:</b>{" "}
                          {row.debit
                            ? parseFloat(row.debit).toFixed(2)
                            : "0.00"}
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => toggleDetails(index)}
                        >
                          Hide Details
                        </Button>
                      </Box>
                    )}
                  </Paper>
                ))
              ) : (
                <Box align="center">No Transactions Found</Box>
              )}
            </Box>
          ) : (
            // Render table for desktop view
            <TableContainer
              id="scrollable-table"
              component={Paper}
              style={{
                maxHeight: "70vh",
                overflowY: "auto",
              }}
              onScroll={(event) => {
                scrollToTopButtonDisplay(event, setShowFab);
              }}
            >
              <Table stickyHeader>
                <TableHead
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "white",
                  }}
                >
                  <TableRow>
                    {/* <TableCell sx={{ backgroundColor: "pink" }}>
                      <b>Transaction Date</b>
                    </TableCell> */}
                    {/* <TableCell sx={{ backgroundColor: "pink" }}><b>Appointment ID</b></TableCell> */}
                    <TableCell sx={{ backgroundColor: "pink" }}>
                      <b>Supplier ID</b>
                    </TableCell>
                    {/* <TableCell sx={{ backgroundColor: "pink" }}>
                      <b>Expense Type</b>
                    </TableCell> */}
                    {/* <TableCell sx={{ backgroundColor: "pink" }}>
                      <b>Invoice Number</b>
                    </TableCell> */}
                    {/* <TableCell sx={{ backgroundColor: "pink" }}>
                      <b>Description</b>
                    </TableCell> */}
                    <TableCell sx={{ backgroundColor: "pink" }} align="right">
                      <b>Supplier Invoice Amount</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink" }} align="right">
                      <b>Supplier Invoice Date</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink" }} align="right">
                      <b>Supplier Invoice Paid</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink" }} align="right">
                      <b>Pending Amount</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink" }} align="right">
                      <b>Supplier Invoice Status</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink" }} align="right">
                      <b>Pay Now</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody style={{ overflowY: "auto" }}>
                  {filteredData.map((row, index) => (
                    <TableRow key={index}>
                      {/* <TableCell>
                        {row.creation_date.split("-").reverse().join("/")}
                      </TableCell> */}
                      {/* <TableCell>{row.appointment_id}</TableCell> */}
                      <TableCell>{row.customer_id}</TableCell>
                      {/* <TableCell>{row.expense_type}</TableCell> */}
                      {/* <TableCell>
                        {row.invoice_no ? row.invoice_no : "N/A"}
                      </TableCell> */}
                      {/* <TableCell>{row.description}</TableCell> */}
                      <TableCell align="right">
                        {row.credit
                          ? parseFloat(row.credit).toFixed(2)
                          : "0.00"}
                      </TableCell>
                    <TableCell align="right">
  {row.creation_date 
    ? row.creation_date.split("-").reverse().join("/") 
    : "N/A"}
</TableCell>
                      <TableCell align="right">
                        {row.debit ? parseFloat(row.debit).toFixed(2) : "0.00"}
                      </TableCell>
                      <TableCell align="right">
                        {row.credit - row.debit >= 0 ? (row.credit - row.debit).toFixed(2) : "0.00"}
                      </TableCell>

                      <TableCell align="right">
                        {row.status ? row.status : "N/A"}
                      </TableCell>
                      <TableCell align="right">
                        {/* if invoice amount - paid amount > 0 then show pay now button */}
                        {row.credit - row.debit > 0 && (
                          <InfoOutlinedIcon
                            // show only if contains credit
                            size="small"
                            onClick={() => router.push(`/views/finance/vendorPayment/${row.customer_id}`)}


                            color="primary" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Back to Top FAB */}
          {showFab && (
            <Fab
              size="small"
              onClick={handleScrollToTop}
              style={{
                backgroundColor: "white",
                color: "primary",
                position: "absolute",
                bottom: 40,
                right: 40,
                zIndex: 10,
              }}
            >
              <ArrowUpwardIcon />
            </Fab>
          )}
        </Box>
      </Box>

      {/* Snackbar for Error Message */}
      <Snackbar
        open={openSnackbar}
      // autoHideDuration={4000}
      // onClose={() => handleCloseSnackBar(setOpenSnackbar)}
      >
        <Alert
          onClose={handleCloseSnackBar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default function CustomerOutstand() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VendorOutstandContent />
    </Suspense>
  );
}
