"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  fetchEntries,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  companydetails,
} from "../../../../controllers/jobStatusControllers";
import Navbar from "../../../components/navbar";
import DataNotFound from "@/components/dataNotFound";
import { useAppTimezone } from "@/utils/timezoneUtil";
import { motion } from "framer-motion";
import LinearProgress from "@mui/material/LinearProgress";
import Collapse from "@mui/material/Collapse";
import {
  Box, TextField, IconButton, Typography,
  InputAdornment, Snackbar, Alert, Badge,
  Switch, Tooltip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Fab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


function LinearProgressWithLabel(props) {
  const { counterSales, ...rest } = props;
  return (
    <Box sx={{ display: counterSales ? "none" : "flex", alignItems: "center" }}>
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

export default function JobStatus() {
  const router = useRouter();
  const { fmtDate } = useAppTimezone();

  const [token, setToken] = useState();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [totalVehicleInService, setTotalVehicleInService] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackBarSeverity, setSnackBarSeverity] = useState();
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedStatuses, setCollapsedStatuses] = useState({});
  const [showFab, setShowFab] = useState(false);
  const [pageType, setPageType] = useState(null);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));

  //   Refs for scroll pagination
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const totalRef = useRef(0);
  const tokenRef = useRef("");
  const startDateRef = useRef("");
  const endDateRef = useRef("");
  const showDeletedRef = useRef(false);
  const searchQueryRef = useRef("");

  useEffect(() => { startDateRef.current = startDate; }, [startDate]);
  useEffect(() => { endDateRef.current = endDate; }, [endDate]);
  useEffect(() => { showDeletedRef.current = showDeleted; }, [showDeleted]);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);





  const [limit, setLimit] = useState(null);


  useEffect(() => {
  const fetchCompanyDetails = async () => {
    try {
      const details = await companydetails();
      if (details?.company_details?.length > 0) {
        const fetchLimit = Number(details.company_details[0].fetch_limit) || 20;
        setLimit(fetchLimit);
      }
    } catch (err) {
      console.log(err);
    }
  };
  fetchCompanyDetails();
}, []);
  //   Initial load
 useEffect(() => {
  if (limit === null) return;  //   wait for limit

  const storedToken = Cookies.get("token");
  setToken(storedToken);
  tokenRef.current = storedToken;
  startDateRef.current = startDate;
  endDateRef.current = endDate;
  showDeletedRef.current = showDeleted;
  setPageType(Cookies.get("page_type"));

  offsetRef.current = 0;
  hasMoreRef.current = true;
  loadingRef.current = false;
  setEntries([]);
  setFilteredEntries([]);

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
    searchQuery,
    limit,   //   from state
    0,
    false
  ).then((result) => {
    if (!result || result.data.length === 0) {
      hasMoreRef.current = false;
    } else {
      totalRef.current = result.total;
      offsetRef.current = limit;
      hasMoreRef.current = result.total > limit;
    }
    loadingRef.current = false;
  });
}, [showDeleted, startDate, endDate, searchQuery, limit]); //   add limit


  //   Init collapse states when filteredEntries change
  useEffect(() => {
    const initialCollapsedStates = {};
    Object.keys(groupedEntries).forEach((status) => {
      if (!(status in collapsedStatuses)) {
        initialCollapsedStates[status] = true;
      }
    });
    if (Object.keys(initialCollapsedStates).length > 0) {
      setCollapsedStatuses((prev) => ({ ...prev, ...initialCollapsedStates }));
    }
  }, [filteredEntries]);

  //   Scroll handler
  const handleScroll = (event) => {
    scrollToTopButtonDisplay(event, setShowFab);

    const { scrollTop, scrollHeight, clientHeight } = event.target;

    if (searchQueryRef.current) return;
    if (!hasMoreRef.current) return;
    if (loadingRef.current) return;

    if (scrollHeight - scrollTop <= clientHeight + 200) {
      console.log("  API calling offset:", offsetRef.current);
      loadingRef.current = true;

      fetchEntries(
        tokenRef.current,
        setEntries,
        setFilteredEntries,
        () => {},
        () => {},
        setOpenSnackbar,
        setSnackbarMessage,
        setSnackBarSeverity,
        showDeletedRef.current,
        startDateRef.current,
        endDateRef.current,
        "",
        limit,
        offsetRef.current,
        true
      ).then((result) => {
        if (!result || result.data.length === 0) {
          hasMoreRef.current = false;
          loadingRef.current = false;
        } else {
          const newOffset = offsetRef.current + result.data.length;
          offsetRef.current = newOffset;
          if (newOffset >= totalRef.current) {
            hasMoreRef.current = false;
            loadingRef.current = false;
          } else {
            hasMoreRef.current = true;
            loadingRef.current = false;
          }
        }
      });
    }
  };

  const calculateCompletionPercentage = (tile) => {
    if (!tile.services_actual || !Array.isArray(tile.services_actual)) return 0;
    const total = tile.services_actual.length;
    const completed = tile.services_actual.filter(
      (s) => s.service_status === "Completed"
    ).length;
    const pct = (completed / total) * 100;
    return isNaN(pct) ? 0 : pct;
  };

  const groupedEntries = filteredEntries?.reduce((acc, tile) => {
    const status = tile.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(tile);
    return acc;
  }, {});

  const toggleCollapse = (status) => {
    setCollapsedStatuses((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const label = { inputProps: { "aria-label": "Show Deleted" } };

  return (
    <div>
      {pageType !== "tab" && <Navbar pageName="Job Status" />}
      <Box>
        <Box paddingX="1%">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <Box style={{ marginTop: pageType !== "tab" ? "0px" : "16px" }}>
              <Badge badgeContent={totalVehicleInService} max={99} color="primary">
                <Box sx={{
                  textAlign: "center", padding: "20px", color: "black",
                  borderRadius: "15px", backgroundColor: "#f9f9f9",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}>
                  In Service <br />
                </Box>
              </Badge>
            </Box>

            <Box>
              <Tooltip title={showDeleted ? "Hide Deleted" : "Show Deleted"}>
                <Switch
                  {...label}
                  color="warning"
                  onChange={(e) => setShowDeleted(e.target.checked)}
                />
              </Tooltip>
              <TextField
                type="date" size="small" value={startDate}
                onChange={(e) => { if (e.target.value !== startDate) setStartDate(e.target.value); }}
                sx={{ backgroundColor: "white", borderRadius: 1, marginRight: 2 }}
              />
              <TextField
                type="date" size="small" value={endDate}
                onChange={(e) => { if (e.target.value !== endDate) setEndDate(e.target.value); }}
                sx={{ backgroundColor: "white", borderRadius: 1, marginRight: 2 }}
              />
              <TextField
                placeholder="Search" variant="outlined" size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              />
            </Box>
          </Box>

          {/*   Scrollable container */}
          <Box
            id="scrollable-table"
            onScroll={handleScroll}
            sx={{ overflowY: "auto", maxHeight: "75vh" }}
          >
            {loading ? (
              <p>Loading...</p>
            ) : filteredEntries.length === 0 ? (
              <DataNotFound />
            ) : (
              Object.keys(groupedEntries).map((status) => (
                <Box key={status} mb={2}>
                  <Typography
                    variant="h6"
                    onClick={() => toggleCollapse(status)}
                    sx={{
                      fontSize: "1.2rem", cursor: "pointer",
                      backgroundColor: "#f5f5f5", display: "flex",
                      alignItems: "center", padding: "6px 10px", borderRadius: "6px",
                    }}
                  >
                    <IconButton size="small">
                      {collapsedStatuses[status] ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                    </IconButton>
                    {status} ({groupedEntries[status].length})
                  </Typography>

                  <Collapse in={collapsedStatuses[status]}>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Appointment ID</TableCell>
                            <TableCell>Invoice ID</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Invoice Amount</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Job Status</TableCell>
                            <TableCell>Progress</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupedEntries[status].map((tile) => (
                            <TableRow
                              key={tile._id}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() => router.push(`/views/jobStatus/${tile.appointment_id}`)}
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
              ))
            )}
          </Box>
        </Box>
      </Box>

      {/*  Scroll to top FAB */}
      {showFab && (
        <Fab
          size="small"
          onClick={() => { handleScrollToTop(); setShowFab(false); }}
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackBarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}