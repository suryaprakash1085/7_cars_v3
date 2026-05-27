"use client";
// React and Next imports
import React, { useState, useEffect } from "react";

// Component imports - Alphabetical
import Navbar from "@/components/navbar";
import Cookies from "js-cookie";

// UI package imports - Alphabetical
import {
  MenuItem,
  Box,
  Checkbox,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Rating,
  Tooltip,
  Button,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import { fetchFeedback, filterRows } from "../../../../../controllers/feedbackControllers";
import { set } from "date-fns";

const labels = {
  0.5: "Useless",
  1: "Poor",
  1.5: "Poor+",
  2: "Fair",
  2.5: "Fair+",
  3: "Good",
  3.5: "Good+",
  4: "Excellent",
  4.5: "Excellent+",
  5: "Outstanding",
};

export default function Feedback() {
  const [token, setToken] = useState();
  const [feedbackData, setFeedbackData] = useState([]);
  const [filteredFeedbackData, setFilteredFeedbackData] = useState([]);
  const [callStatus, setCallStatus] = useState({});
  const [scheduleDates, setScheduleDates] = useState({});
  const [comments, setComments] = useState({});
  const [callFeedback, setCallFeedback] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [reworkStatus, setReworkStatus] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [pageType, setPageType] = useState(null);

  // Get page type from cookie on client-side only to prevent hydration mismatch
  useEffect(() => {
    const pt = Cookies.get("page_type");
    setPageType(pt || "default");
  }, []);

  useEffect(() => {
    const storedToken = Cookies.get("token");
    const userId = Cookies.get("userId");
    setToken(storedToken);
    if (userId) {
      fetchFeedback(userId, setFeedbackData);
    }
  }, []);

  useEffect(() => {
    // Fetch and log feedback data from the API
    const fetchAndLogFeedback = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/get/feedback`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        // Process data to only include entries with the maximum id for each appointment_id
        const filteredData = Object.values(
          data.reduce((acc, item) => {
            if (
              !acc[item.appointment_id] ||
              acc[item.appointment_id].id < item.id
            ) {
              acc[item.appointment_id] = item;
            }
            return acc;
          }, {})
        );

        // console.log("recived feedback data:", filteredData);

        // Set the callStatus, scheduleDates, comments, and callFeedback state with the fetched data
        const initialCallStatus = {};
        const initialScheduleDates = {};
        const initialComments = {};
        const initialCallFeedback = {};
        const initialReworkStatus = {};
        filteredData.forEach((item) => {
          initialCallStatus[item.appointment_id] = item.callStatus || "";
          initialScheduleDates[item.appointment_id] = item.scheduledDate || "";
          initialComments[item.appointment_id] = item.comment || "";
          initialCallFeedback[item.appointment_id] = item.callFeedback || 0;
          initialReworkStatus[item.appointment_id] = item.rework || "no";
        });
        setCallStatus(initialCallStatus);
        setScheduleDates(initialScheduleDates);
        setComments(initialComments);
        setCallFeedback(initialCallFeedback);
        setReworkStatus(initialReworkStatus);
        setFilteredFeedbackData(filteredData);
      } catch (error) {
        // console.log("Error fetching feedback data:", error);
      }
    };

    fetchAndLogFeedback();
  }, []);

  useEffect(() => {
    // Filter the data to exclude rows with empty invoice_date
    const filtered = feedbackData.filter((row) => row.invoice_date !== "");
    setFilteredFeedbackData(filtered);
  }, [feedbackData]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768); // Adjust the width as needed
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCallStatusChange = (appointmentId, newStatus) => {
    setCallStatus((prevState) => ({
      ...prevState,
      [appointmentId]: newStatus,
    }));

    const currentDate = new Date();
    let newDate = "";

    if (newStatus === "Attended") {
      newDate = currentDate.toLocaleDateString("en-GB");
    } else if (newStatus === "Not Attended") {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
      newDate = nextDate.toLocaleDateString("en-GB");
    }

    setScheduleDates((prevState) => ({
      ...prevState,
      [appointmentId]: newDate,
    }));
  };

  const getCurrentDateForInput = () => {
    const currentDate = new Date();
    return currentDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  };

  const handleSendFeedback = async (feedback) => {
    const appointmentId = feedback.appointment_id;
    const feedbackData = {
      appointment_id: appointmentId,
      feedback: [
        {
          callStatus: callStatus[appointmentId] || feedback.call_status || "",
          notAttend: callStatus[appointmentId] === "Not Attended" ? 1 : 0,
          scheduledDate: scheduleDates[appointmentId] || "",
          callFeedback:
            callStatus[appointmentId] === "Attended"
              ? callFeedback[appointmentId]
              : feedback.call_feedback || 0,
          comment:
            callStatus[appointmentId] !== "Not Attended"
              ? comments[appointmentId]
              : "",
          rework: reworkStatus[appointmentId] ? "yes" : "no",
        },
      ],
    };

    // console.log("feedbackData", feedbackData);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/feedback/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(feedbackData),
        }
      );

      if (response.ok) {
        setSnackbarOpen(true);
        setSnackbarMessage("Feedback sent successfully!");
        setSnackbarSeverity("success");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setSnackbarOpen(true);
        setSnackbarMessage("Failed to send feedback");
        setSnackbarSeverity("error");
      }
    } catch (error) {
      setSnackbarOpen(true);
      setSnackbarMessage("Error sending feedback:", error);
      setSnackbarSeverity("error");
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const toggleDetails = (appointmentId) => {
    setShowDetails((prevState) => ({
      ...prevState,
      [appointmentId]: !prevState[appointmentId],
    }));
  };
  return (
    <div>
       {pageType !== null && pageType !== "tab" && <Navbar pageName="Calls" />}
      
      <Box
        sx={{
          backgroundSize: "cover",
          minHeight: "79vh",
          
        }}
      >
        <Box paddingX="1%">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              marginTop: pageType === "tab" ? "16px" : "0px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 5,
                width: "100%",
                justifyContent: "flex-end",
              }}
            >
              {/* Search Field */}
              <TextField
                label="Search"
                variant="outlined"
                size="small"
                sx={{ backgroundColor: "white", borderRadius: 1 }}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => {
                  e.key === "Enter"
                    ? filterRows(
                        token,
                        filteredFeedbackData,
                        setFilteredFeedbackData,
                        searchQuery,
                        setSnackbarOpen,
                        setSnackbarMessage,
                        setSnackbarSeverity
                      )
                    : null;
                }}
              />
            </div>
          </div>

          {isMobileView ? (
            // Render cards for mobile view
            <Box>
              {filteredFeedbackData.length > 0 ? (
                filteredFeedbackData.map((feedback, index) => (
                  <Paper key={index} sx={{ marginBottom: 2, padding: 2 }}>
                    {!showDetails[feedback.appointment_id] ? (
                      // Summary view
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Appointment No:</b> {feedback.appointment_id}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Vehicle:</b> {feedback.vehicle_id} {feedback.make}(
                          {feedback.model})
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Customer Name:</b> {feedback.customer_name}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Phone Number:</b> {feedback.phone}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Invoice Date:</b>{" "}
                          {new Date(feedback.invoice_date).toLocaleDateString(
                            "en-GB"
                          )}
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => toggleDetails(feedback.appointment_id)}
                        >
                          More Details
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
                          <b>Customer Name:</b> {feedback.customer_name}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >

                          
                          <b>Vehicle:</b> {feedback.vehicle_id} {feedback.make}(
                          {feedback.model})
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Phone Number:</b> {feedback.phone}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Call Status:</b>
                          <Select
                            value={
                              callStatus[feedback.appointment_id] ||
                              feedback.call_status ||
                              ""
                            }
                            onChange={(e) =>
                              handleCallStatusChange(
                                feedback.appointment_id,
                                e.target.value
                              )
                            }
                            displayEmpty
                            size="small"
                            sx={{ width: "130px" }}
                          >
                            <MenuItem value="Attended">Attended</MenuItem>
                            <MenuItem value="Not Attended">
                              Not Attended
                            </MenuItem>
                            <MenuItem value="Call Back Later">
                              Call Back Later
                            </MenuItem>
                          </Select>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Scheduled Date:</b>
                          {callStatus[feedback.appointment_id] ===
                          "Call Back Later" ? (
                            <TextField
                              type="date"
                              value={
                                scheduleDates[feedback.appointment_id] || ""
                              }
                              variant="standard"
                              sx={{ width: "100px" }}
                              inputProps={{
                                min: getCurrentDateForInput(),
                              }}
                              onChange={(e) =>
                                setScheduleDates((prevState) => ({
                                  ...prevState,
                                  [feedback.appointment_id]: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            scheduleDates[feedback.appointment_id] || ""
                          )}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Rework:</b>
                          <Checkbox
                            checked={
                              reworkStatus[feedback.appointment_id] === "yes" ||
                              false
                            }
                            onChange={(e) =>
                              setReworkStatus((prevState) => ({
                                ...prevState,
                                [feedback.appointment_id]: e.target.checked
                                  ? "yes"
                                  : "no",
                              }))
                            }
                            disabled={
                              callStatus[feedback.appointment_id] !== "Attended"
                            }
                          />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Call Feedback:</b>
                          <Tooltip
                            title={
                              labels[callFeedback[feedback.appointment_id]] ||
                              ""
                            }
                          >
                            <Rating
                              name={`feedback-rating-${index}`}
                              value={callFeedback[feedback.appointment_id] || 0}
                              precision={0.5}
                              onChange={(event, newValue) => {
                                // Update the callFeedback state with the new rating
                                setCallFeedback((prevState) => ({
                                  ...prevState,
                                  [feedback.appointment_id]: newValue,
                                }));
                              }}
                              disabled={
                                callStatus[feedback.appointment_id] ===
                                  "Not Attended" ||
                                callStatus[feedback.appointment_id] ===
                                  "Call Back Later"
                              }
                            />
                          </Tooltip>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingBottom: 1,
                          }}
                        >
                          <b>Comment:</b>
                          <TextField
                            multiline
                            rows={2}
                            id="filled-basic"
                            placeholder="Comments"
                            variant="filled"
                            value={comments[feedback.appointment_id] || ""}
                            onChange={(e) =>
                              setComments((prevState) => ({
                                ...prevState,
                                [feedback.appointment_id]: e.target.value,
                              }))
                            }
                          />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            paddingBottom: 1,
                          }}
                        >
                          <IconButton
                            onClick={() => {
                              if (
                                callStatus[feedback.appointment_id] ==
                                  "Call Back Later" &&
                                !scheduleDates[feedback.appointment_id]
                              ) {
                                setSnackbarOpen(true);
                                setSnackbarMessage("Please enter a date");
                                setSnackbarSeverity("error");
                              } else {
                                handleSendFeedback(feedback);
                              }
                            }}
                          >
                            <SendIcon />
                          </IconButton>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => toggleDetails(feedback.appointment_id)}
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
            <TableContainer component={Paper} style={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>Appointment No</b>
                    </TableCell>
                    <TableCell>
                      <b>Vehicle</b>
                    </TableCell>
                    <TableCell>
                      <b>Invoice Date</b>
                    </TableCell>
                    <TableCell>
                      <b>Customer Name</b>
                    </TableCell>
                    <TableCell>
                      <b>Phone Number</b>
                    </TableCell>
                    <TableCell>
                      <b>Call Status</b>
                    </TableCell>
                    <TableCell>
                      <b>Scheduled Date</b>
                    </TableCell>
                    <TableCell>
                      <b>Rework</b>
                    </TableCell>
                    <TableCell>
                      <b>Call Feedback</b>
                    </TableCell>
                    <TableCell>
                      <b>Comment</b>
                    </TableCell>
                    <TableCell>
                      <b>Action</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody style={{ overflowY: "auto" }}>
                  {filteredFeedbackData.length > 0 ? (
                    filteredFeedbackData.map((feedback, index) => (
                      <TableRow key={index}>
                        <TableCell>{feedback.appointment_id}</TableCell>
                        <TableCell>
                          {feedback.vehicle_id}
                          <br />
                          {feedback.make}({feedback.model})
                        </TableCell>
                        <TableCell>
                          {new Date(feedback.invoice_date).toLocaleDateString(
                            "en-GB"
                          )}
                        </TableCell>
                        <TableCell>{feedback.customer_name}</TableCell>
                        <TableCell>{feedback.phone}</TableCell>
                        <TableCell>
                          <Select
                            value={
                              callStatus[feedback.appointment_id] ||
                              feedback.call_status ||
                              ""
                            }
                            onChange={(e) =>
                              handleCallStatusChange(
                                feedback.appointment_id,
                                e.target.value
                              )
                            }
                            displayEmpty
                            size="small"
                            sx={{ width: "130px" }}
                          >
                            <MenuItem value="Attended">Attended</MenuItem>
                            <MenuItem value="Not Attended">
                              Not Attended
                            </MenuItem>
                            <MenuItem value="Call Back Later">
                              Call Back Later
                            </MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {callStatus[feedback.appointment_id] ===
                          "Call Back Later" ? (
                            <TextField
                              type="date"
                              value={
                                scheduleDates[feedback.appointment_id] || ""
                              }
                              variant="standard"
                              sx={{ width: "100px" }}
                              inputProps={{
                                min: getCurrentDateForInput(),
                              }}
                              onChange={(e) =>
                                setScheduleDates((prevState) => ({
                                  ...prevState,
                                  [feedback.appointment_id]: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            scheduleDates[feedback.appointment_id] || ""
                          )}
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={
                              reworkStatus[feedback.appointment_id] === "yes" ||
                              false
                            }
                            onChange={(e) =>
                              setReworkStatus((prevState) => ({
                                ...prevState,
                                [feedback.appointment_id]: e.target.checked
                                  ? "yes"
                                  : "no",
                              }))
                            }
                            disabled={
                              callStatus[feedback.appointment_id] !== "Attended"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={
                              labels[callFeedback[feedback.appointment_id]] ||
                              ""
                            }
                          >
                            <Rating
                              name={`feedback-rating-${index}`}
                              value={callFeedback[feedback.appointment_id] || 0}
                              precision={0.5}
                              onChange={(event, newValue) => {
                                // Update the callFeedback state with the new rating
                                setCallFeedback((prevState) => ({
                                  ...prevState,
                                  [feedback.appointment_id]: newValue,
                                }));
                              }}
                              disabled={
                                callStatus[feedback.appointment_id] ===
                                  "Not Attended" ||
                                callStatus[feedback.appointment_id] ===
                                  "Call Back Later"
                              }
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <TextField
                            multiline
                            rows={2}
                            id="filled-basic"
                            placeholder="Comments"
                            variant="filled"
                            value={comments[feedback.appointment_id] || ""}
                            onChange={(e) =>
                              setComments((prevState) => ({
                                ...prevState,
                                [feedback.appointment_id]: e.target.value,
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => {
                              if (
                                callStatus[feedback.appointment_id] ==
                                  "Call Back Later" &&
                                !scheduleDates[feedback.appointment_id]
                              ) {
                                setSnackbarOpen(true);
                                setSnackbarMessage("Please enter a date");
                                setSnackbarSeverity("error");
                              } else {
                                handleSendFeedback(feedback);
                              }
                            }}
                          >
                            <SendIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        No Customer Found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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
