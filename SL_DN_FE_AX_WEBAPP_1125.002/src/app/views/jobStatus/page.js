"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

// Function imports
import { fetchEntries } from "../../../../controllers/jobStatusControllers";

// Component imports
import Navbar from "../../../components/navbar";
import BackButton from "../../../components/backButton";

// Functional package imports
import { motion } from "framer-motion";
import LinearProgress from "@mui/material/LinearProgress";
import Collapse from "@mui/material/Collapse";

import DataNotFound from "@/components/dataNotFound";
import { useAppTimezone } from "@/utils/timezoneUtil";
// UI package imports
import {
  Box,
  TextField,
  IconButton,
  Card,
  CardContent,
  Typography,
  InputAdornment,
  Grid,
  Snackbar,
  Alert,
  Badge,
  Switch,
  Tooltip,
   Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

// Images and icon imports
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { set } from "date-fns";

export default function JobStatus() {
  const router = useRouter();
  const { fmtDate } = useAppTimezone();

  // FrontEnd extracted data states
  const [token, setToken] = useState();

  // Backend Data states
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [totalVehicleInService, setTotalVehicleInService] = useState(0);
  const [totalVehicleReady, setTotalVehicleReady] = useState(0);

  // Modal and Alert states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackBarSeverity, setSnackBarSeverity] = useState();
  let [showDeleted, setShowDeleted] = useState(false);

  // FrontEnd form input states
  const [selectedOption, setSelectedOption] = useState("vehicleModel");
  const [searchQuery, setSearchQuery] = useState("");

  // New state for grouping and collapsing
  const [collapsedStatuses, setCollapsedStatuses] = useState({});

  // New state for date filters
 const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const [startDate, setStartDate] = useState(() => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return formatDate(firstDay);
});

const [endDate, setEndDate] = useState(() => {
  const today = new Date();
  return formatDate(today);
});


 function LinearProgressWithLabel(props) {
  const { counterSales, ...rest } = props;   // <-- remove custom prop

  return (
    <Box
      sx={{
        display: counterSales ? "none" : "flex",
        alignItems: "center",
      }}
    >
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" {...rest} />
      </Box>

      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}


  const calculateCompletionPercentage = (tile) => {
    // Handle case where services_actual is missing (e.g., from search endpoint)
    if (!tile.services_actual || !Array.isArray(tile.services_actual)) {
      return 0;
    }

    let totalServices = tile.services_actual.length;
    let completedServices = 0;

    tile.services_actual.forEach((service) => {
      if (service.service_status === "Completed") {
        completedServices = completedServices + 1;
      }
    });

    let percentage =
      (parseInt(completedServices) / parseInt(totalServices)) * 100;

    if (isNaN(percentage)) {
      return 0;
    } else {
      return percentage;
    }
  };

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);

    fetchEntries(
      storedToken,
      setEntries,
      setFilteredEntries,
      setLoading,
      setTotalVehicleInService,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackBarSeverity,
      showDeleted,
      startDate,
      endDate,
      searchQuery
    );
  }, [showDeleted, startDate, endDate, searchQuery]);

  // Initialize all statuses to be open
  useEffect(() => {
    const initialCollapsedStates = {};
    Object.keys(groupedEntries).forEach((status) => {
      initialCollapsedStates[status] = true; // Set to true for open state
    });
    setCollapsedStatuses(initialCollapsedStates);
  }, [filteredEntries]);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = () => {
    // Search is now handled by the useEffect that watches searchQuery
    // and triggers API call with the search parameter
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const label = { inputProps: { "aria-label": "Show Deleted" } };

  const handleCardClick = (appointmentId) => {
    // console.log("Appointment ID:", appointmentId);
    router.push(`/views/jobStatus/${appointmentId}`);
  };

  const groupedEntries = filteredEntries?.reduce((acc, tile) => {
    console.log({ filteredEntries });
    const status = tile.status;
    console.log({ status });
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(tile);
    console.log({ acc });
    return acc;
  }, {});

  const toggleCollapse = (status) => {
    setCollapsedStatuses((prevCollapsedStatuses) => ({
      ...prevCollapsedStatuses,
      [status]: !prevCollapsedStatuses[status],
    }));
  };


  
// const pageType = Cookies.get("page_type"); // "tab" or others
const [pageType, setPageType] = useState(null);

useEffect(() => {
  setPageType(Cookies.get("page_type"));
}, []);


  return (
    <div>
      {/* <Navbar pageName="Job Status" /> */}
      {pageType !== "tab" && <Navbar pageName="Job Status" />}
      <Box>
        <Box paddingX="1%">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <Box style={{ marginTop: pageType !== "tab" ? "0px" : "16px",}}
             > 
              <Badge
                badgeContent={totalVehicleInService}
                max={99}
                color="primary"
              >
                <Box
                  sx={{
                    textAlign: "center",
                    padding: "20px",
                    color: "black",
                    borderRadius: "15px",
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  
                >
                  In Service <br></br>{" "}
                </Box>
              </Badge>
            </Box>
            <Box>
              <Tooltip title={showDeleted ? "Hide Deleted" : "Show Deleted"}>
                <Switch
                  {...label}
                  color="warning"
                  onChange={(e) => {
                    let switchStatus = e.target.checked;
                    setShowDeleted(switchStatus);
                  }}
                />
              </Tooltip>
              {/* Date Filter Fields */}
              <TextField
                type="date"
                size="small"
                // label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  marginRight: 2,
                }}
              />
              <TextField
                type="date"
                size="small"
                // label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  marginRight: 2,
                }}
              />
              {/* Search Field */}
              <TextField
                placeholder="Search"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => {
                  e.key === "Enter"
                    ? handleSearch(
                        entries,
                        searchQuery,
                        selectedOption,
                        setFilteredEntries
                      )
                    : null;
                }}
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              />
            </Box>
          </Box>

          {loading ? (
            <p>Loading...</p>
          ) : entries === 0 ? (
            <DataNotFound />
          ) : (
            <>
              {Object.keys(groupedEntries).map((status) => (
                <Box key={status}>
                  {console.log({ groupedEntries })}
                  <Typography
  variant="h6"
  onClick={() => toggleCollapse(status)}
  sx={{
    fontSize: "1.2rem",
    cursor: "pointer",
    backgroundColor: "#f5f5f5", 
      // your color
    // color: "white",
    display: "flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "6px",
  }}
>
  <IconButton size="small" >
    {collapsedStatuses[status] ? <ExpandMoreIcon /> : <ExpandLessIcon />}
  </IconButton>

  {status} ({groupedEntries[status].length})
</Typography>

                <Collapse in={collapsedStatuses[status]}>
  <TableContainer component={Paper} sx={{}}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell >Vehicle</TableCell>
          <TableCell>Appointment ID</TableCell>
          <TableCell>Invoice ID</TableCell>
          <TableCell >Customer</TableCell>
              <TableCell >Invoice Amount</TableCell>
          <TableCell >Date</TableCell>
          <TableCell>Time</TableCell>
          <TableCell >Phone</TableCell>
          <TableCell >Job Status</TableCell>
          <TableCell>Progress</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {groupedEntries[status].map((tile) => (
          <TableRow
            key={tile._id}
            hover
            sx={{ cursor: "pointer" }}
            onClick={() => handleCardClick(tile.appointment_id)}
          >
            <TableCell>{tile.plateNumber || tile.vehicle_id}</TableCell>
            <TableCell>{tile.appointment_id}</TableCell>
            <TableCell>{tile.invoice_id || "-"}</TableCell>
            <TableCell>{tile.customer_name}</TableCell>
            <TableCell>{tile.invoice_amount}</TableCell>
            <TableCell>{fmtDate(tile.appointment_date)}</TableCell>
            <TableCell>{tile.appointment_time || "-"}</TableCell>
            <TableCell>{tile.phone || "N/A"}</TableCell>
            <TableCell>{tile.status}</TableCell>
            <TableCell width={180}>
              <LinearProgressWithLabel
                value={calculateCompletionPercentage(tile)}
                counterSales={tile.plateNumber === "CounterSales"}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</Collapse>

                </Box>
              ))}
            </>
          )}
        </Box>
      </Box>

      {/* Snackbar for Error Message */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => handleCloseSnackBar(setOpenSnackbar)}
      >
        <Alert
          onClose={() => handleCloseSnackBar(setOpenSnackbar)}
          severity={snackBarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
