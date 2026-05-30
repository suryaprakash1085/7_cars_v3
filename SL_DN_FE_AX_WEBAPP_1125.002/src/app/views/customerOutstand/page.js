"use client";
// React and Next imports
import React, { useState, useEffect,useRef  } from "react";
import { useRouter } from 'next/navigation';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { fetchCompanyDetails } from "../../../../controllers/LeadsControllers.js";
// Function imports
import {
  fetchData,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  filterDataByStatus,
  updateCount,
  calculateDays,
  filterByDateRange,
  handleScroll,
  fetchMoreData,
} from "../../../../controllers/customerOutstandingControllers";


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
  Button,
  Autocomplete,
} from "@mui/material";
import Cookies from "js-cookie";
import { useAppTimezone } from "@/utils/timezoneUtil";

// Images and Icon imports
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

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

export default function CustomerOutstand() {
  const router = useRouter();
  const { fmtDate } = useAppTimezone();
  // FrontEnd extracted data states
  

  // Modal and Alert states
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [showFab, setShowFab] = useState(false);

  // Backend data states
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // FrontEnd form input states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numberOfPaid, setNumberOfPaid] = useState(0);
  const [numberOfOverdue, setNumberOfOverdue] = useState(0);
  const [numberOfPending, setNumberOfPending] = useState(0);

  const [isMobileView, setIsMobileView] = useState(false);

  const [showDetails, setShowDetails] = useState({});

  // Add new states for customers and selected customer
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fetchLimit, setFetchLimit] = useState(null);
const token = Cookies.get("token");

  const loadingRef = useRef(false);
const hasMoreRef = useRef(true);
const totalRef = useRef(0);
const offsetRef = useRef(0);
const limitRef = useRef(20);
const tokenRef = useRef("");

useEffect(() => {
    if (token) {
      fetchCompanyDetails(token, (limit) => {
        limitRef.current = parseInt(limit);
         setFetchLimit(parseInt(limit));
      });
    }
  }, [token]);
  // Set initial date range: start date = today - 1 week, end date = today
  useEffect(() => {
    const today = new Date();
    const firstDay =new Date(today.getFullYear(), today.getMonth(), 1);
    
   const formatDate =(date)=>{
    const Year=date.getFullYear();
    const Month=String(date.getMonth()+1).padStart(2,"0");
    const Day=String(date.getDate()).padStart(2,"0");
    return `${Year}-${Month}-${Day}`;
   }
    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(today));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768); // Adjust the width as needed
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
useEffect(() => {
  let storedToken = Cookies.get("token");
  // setToken(storedToken);
  tokenRef.current = storedToken;

  if (!startDate || !endDate || !fetchLimit) return;

  // ✅ reset on date change
  offsetRef.current = 0;
  hasMoreRef.current = true;
  loadingRef.current = false;

  fetchData(
    axios, storedToken, setData, setFilteredData, updateStatus,
    setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity,
    startDate, endDate, limitRef.current
  ).then((result) => {
    if (result) {
      totalRef.current = result.total;
      offsetRef.current = limitRef.current;
      hasMoreRef.current = result.total > limitRef.current;
    }
  });
}, [startDate, endDate , fetchLimit]);


  // Calculate counts based on filtered data
  useEffect(() => {
    updateCount(filteredData, setNumberOfPaid, setNumberOfOverdue, setNumberOfPending);
  }, [filteredData]);

  // Update the useEffect for customers
  useEffect(() => {
    if (data.length > 0) {
      // Create unique customers from the data
      const uniqueCustomers = data.reduce((acc, item) => {
        if (!acc[item.customer_id]) {
          acc[item.customer_id] = {
            customer_id: item.customer_id,
            customer_name: item.customer,
            phone: item.phone
          };
        }
        return acc;
      }, {});

      setCustomers(Object.values(uniqueCustomers));
    }
  }, [data]);

  // Combined filtering logic for both date range and customer selection
  useEffect(() => {
    let filtered = [...data];

    // Apply customer filter first
    if (selectedCustomer) {
      filtered = filtered.filter(item => item.customer_id === selectedCustomer.customer_id);
    }

    setFilteredData(sortByLatestDate(filtered));
  }, [selectedCustomer, data]);

  const toggleDetails = (index) => {
    setShowDetails((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };


// add refs
const startDateRef = useRef("");
const endDateRef = useRef("");

// sync refs
useEffect(() => { startDateRef.current = startDate; }, [startDate]);
useEffect(() => { endDateRef.current = endDate; }, [endDate]);

// use refs in onTableScroll (not state values)
const onTableScroll = (event) => {
  handleScroll(event, setShowFab, () => {
    if (!hasMoreRef.current || loadingRef.current) return;

    loadingRef.current = true;

    fetchMoreData(
      axios, tokenRef.current,
      offsetRef.current, limitRef.current,
      startDateRef.current, endDateRef.current, // ✅ refs not state
      updateStatus, setData, setFilteredData
    ).then((result) => {
      if (!result || result.rawCount === 0) {
        hasMoreRef.current = false;
      } else {
        offsetRef.current += result.rawCount;
        hasMoreRef.current = offsetRef.current < result.total;
      }
      loadingRef.current = false;
    });
  });
};

  // Helper function to sort data by latest appointment date in descending order
  const sortByLatestDate = (dataToSort) => {
    return [...dataToSort].sort((a, b) => {
      const dateA = new Date(a.latestAppointmentDate || 0);
      const dateB = new Date(b.latestAppointmentDate || 0);
      return dateB - dateA; // Descending order (newest first)
    });
  };

  // Function to handle closing the snackbar
  const handleCloseSnackBar = () => {
    setOpenSnackbar(false);
  };

 const pageType = Cookies.get("page_type"); // "tab" or others


  return (
    <div>
      {/* <Navbar pageName=" Customer Outstanding" /> */}
      {pageType !== "tab" && <Navbar pageName="Customer Outstanding" />}
      
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
            <div
              style={{
                display: "flex",
              }}
            >
              {/* <div
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
              </div> */}
            </div>
            {/* <div style={{ display: "flex" }}>
               <BackButton />
              <h1 style={{ marginLeft: "10px", color: "white" }}>
                Customer Outstanding
              </h1> 
            </div> */}

            {/* Date Filter Controls */}
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "center",
                justifyContent: "space-around",
                flexWrap: "wrap",
              }}
            >
              {/* {console.log("customers", customers)}
              {console.log('data', data)} */}
              <TextField
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
                sx={{
                  backgroundColor: "white",
                  borderRadius: "4px",
                  minWidth: "200px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#474747",
                    },
                  },
                }}
              />
              <TextField
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
                sx={{
                  backgroundColor: "white",
                  borderRadius: "4px",
                  minWidth: "200px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#474747",
                    },
                  },
                }}
              />
              <Autocomplete
                size="small"
                options={customers}
                getOptionLabel={(option) => option.customer_name || ''}
                value={selectedCustomer}
                onChange={(event, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search customer..."
                    sx={{
                      backgroundColor: "white",
                      borderRadius: "4px",
                      minWidth: "200px",
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: "#474747",
                        },
                      },
                    }}
                  />
                )}
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
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          {/* <b>Invoice Date:</b> {row.invoiceDate.split("-").reverse().join("/")} */}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Customer:</b> {row.customer}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Phone:</b> {row.phone}
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
                        {/* <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Invoice Date:</b> {row.invoiceDate.split("-").reverse().join("/")}
                        </Box> */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Customer:</b> {row.customer}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Phone:</b> {row.phone}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b> Customer Advance Amount:</b> {parseFloat(row.advance_balance).toFixed(2)}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Customer Invoice Amount:</b> {parseFloat(row.invoiceAmount).toFixed(2).toString()}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Customer Pending Amount:</b> {parseFloat(row.pendingAmount).toFixed(2)}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          <b>Status:</b> {row.status}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", paddingBottom: 1 }}>
                          {/* <b>Number of Days:</b> {calculateDays(row.invoiceDate).toString()} */}
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
                <Box align="center">No Customer Found</Box>
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
                overflowX: "auto",
              }}
             onScroll={onTableScroll} 
            >
              <Table 
                stickyHeader
                sx={{
                  minWidth: 1200,
                  tableLayout: "fixed",
                  width: "100%",
                }}
              >
                <TableHead
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "white",
                    zIndex: 2,
                  }}
                >
                  <TableRow>
                    {/* <TableCell sx={{ backgroundColor: "pink" }}>
                      <b>Invoice Date</b>
                    </TableCell> */}
                    <TableCell sx={{ backgroundColor: "pink", width: "15%", minWidth: "150px" }}>
                      <b>Customer</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink", width: "12%", minWidth: "120px" }}>
                      <b>Phone</b>
                    </TableCell>
                    {/* <TableCell sx={{ backgroundColor: "pink" }} align="right">
                        <b>Customer Advance Amount</b>
                      </TableCell> */}
                    <TableCell sx={{ backgroundColor: "pink", width: "16%", minWidth: "160px" }} align="right">
                      <b>Customer Invoice Amount</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink", width: "16%", minWidth: "160px" }} align="right">
                      <b>Customer Pending Amount</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink", width: "16%", minWidth: "160px" }} align="right">
                      <b>Customer Paid Amount</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink", width: "10%", minWidth: "100px" }} align="center">
                      <b>Status</b>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "pink", width: "15%", minWidth: "160px" }} align="center">
                      <b>Latest Appointment Date</b>
                    </TableCell>
                    {/* <TableCell sx={{ backgroundColor: "pink" }}>
                      <b>Number of Days</b>
                    </TableCell> */}
                    <TableCell
                      sx={{
                        backgroundColor: "pink",
                        width: "15%",
                        minWidth: "150px",
                        position: "sticky",
                        right: 0,
                        zIndex: 3,
                      }}
                      align="center"
                    >
                      <b>Pay Now</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody style={{ overflowY: "auto" }}>
                  {filteredData.map((row, index) => (
                    <TableRow key={index}>
                      {/* <TableCell>{row.invoiceDate.split("-").reverse().join("/")}</TableCell> */}
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "15%" }}>
                        {row.customer}
                      </TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "12%" }}>
                        {row.phone}
                      </TableCell>
                      {/* <TableCell align="right">{parseFloat(row.advance_balance).toFixed(2)}</TableCell> */}
                      <TableCell align="right" sx={{ width: "16%" }}>₹{parseFloat(row.invoiceAmount).toFixed(2).toString()}</TableCell>
                      <TableCell align="right" sx={{ width: "16%" }}>₹{Math.max(0, parseFloat(row.pendingAmount)).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ width: "16%" }}>₹{parseFloat(row.paidAmount).toFixed(2)}</TableCell>
                      <TableCell align="center" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "10%" }}>
                        {row.status}
                      </TableCell>
                      <TableCell align="center" sx={{ width: "15%" }}>
                        {row.latestAppointmentDate ? fmtDate(row.latestAppointmentDate) : "N/A"}
                      </TableCell>
                      {/* showing pay now button only if pending amount is greater than 0 */}
                      {row.pendingAmount > 0 ? (
                        <TableCell 
                          align="center" 
                          sx={{ 
                            padding: "8px 12px",
                            width: "15%",
                            position: "sticky",
                            right: 0,
                            backgroundColor: "white",
                            zIndex: 1,
                          }}
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: "100px", maxWidth: "120px" }}
                            onClick={() => router.push(`/views/finance/customerPayment/?id=${row.customer_id}`)}
                          >
                            Pay Now
                          </Button>
                        </TableCell>
                      ) : (
                        <TableCell 
                          align="center" 
                          sx={{ 
                            padding: "8px 12px",
                            width: "15%",
                            position: "sticky",
                            right: 0,
                            backgroundColor: "white",
                            zIndex: 1,
                          }}
                        >
                          <RemoveRedEyeIcon
                            style={{ cursor: "pointer" }}
                            variant="outlined"
                            onClick={() => router.push(`/views/finance/customerPayment/?id=${row.customer_id}`)}
                          />
                        </TableCell>
                      )}

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
