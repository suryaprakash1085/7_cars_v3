"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie"; // Import js-cookie for cookie management
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
// Function imports
import {
  filterRows,
  handlePendingAmountChange,
  stopEditing,
  handleCallStatusChange,
  handleCallFeedbackChange,
  handleDeleteRow,
  confirmDeleteRow,
  handleInputChange,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  getTomorrowDate,
  getAllLeads,
  infiniteScroll,
  handleScrollToTop,
  scrollToTopButtonDisplay,
  fetchCompanyDetails
} from "../../../../../controllers/telecallerControllers";

// Component imports
import Navbar from "../../../../components/navbar";
import BackButton from "@/components/backButton";

// Function package imports
import dayjs from "dayjs";

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
  Select,
  MenuItem,
  TextField,
  Tooltip,
  IconButton,
  Modal,
  Button,
  Alert,
  Fab,
  Snackbar,
  Typography,
} from "@mui/material";

// Images and icons imports
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import DirectionsCarFilledIcon from "@mui/icons-material/DirectionsCarFilled";

export default function Telecaller() {
  // FrontEnd extracted data states
  let [token, setToken] = useState(null);
  let [userId, setUserId] = useState(null);
  let [commentsTime, setCommentsTime] = useState([]);
  // console.log("commentsTime:", commentsTime);
  // Modal and Alert states
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showFab, setShowFab] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  // const limit = 10;
  const [limit, setLimit] = useState(0);
  const [pageType, setPageType] = useState(null);

  // FrontEnd form input states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [editRowId, setEditRowId] = useState("");
  const [editedData, setEditedData] = useState({
    telecall: {
      callStatus: "",
      callFeedback: "",
      scheduledDate: "",
      comments: "",
    },
  });

  const [isMobileView, setIsMobileView] = useState(false);

  // Add this new state for the comments modal
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsHistory, setCommentsHistory] = useState([]);

  // New states for vehicle data and modal
  const [vehicles, setVehicles] = useState([]);
  const [openVehicleModal, setOpenVehicleModal] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(false);
  // Get page type from cookie on client-side only to prevent hydration mismatch
  useEffect(() => {
    const pt = Cookies.get("page_type");
    setPageType(pt || "default");
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch company details");
      }

      const data = await response.json();

      const company = data.company_details?.[0] || null;

      setCompanyDetails(company);

      // // Set WhatsApp enabled flag
      setIsWhatsappEnabled(
        company?.whatsapp === "true" || company?.whatsapp === "1"
      );

    } catch (error) {
      console.error("Error fetching company details:", error);
      setCompanyDetails(null);
      setIsWhatsappEnabled(false);
    }
  };


  const fetchComments = async (customerId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/comments/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      // data = JSON.parse(data);
      debugger;
      // Add error handling for empty data
      if (!data || data.length === 0) {
        showSnackbar("No comments history available", "info");
        return;
      }



      try {
        // const parsedComments = JSON.parse(data[0].telecall);
        const parsedComments = JSON.parse(data);
        // Ensure parsedComments is an array
        // Add null check and error handling for telecall field
        if (parsedComments.length === 0) {
          // showSnackbar("No telecall history available", "info");
          showSnackbar("No history available", "info");
          return;
        }
        const commentsArray = Array.isArray(parsedComments)
          ? parsedComments
          : [parsedComments];
        // setting the time too
        let commentsTime = [];
        // commentsArray.forEach((comment) => {
        //   commentsTime.push({
        //     ...comment,
        //     time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        //   });
        // });
        setCommentsTime(commentsTime);
        setCommentsHistory(commentsArray);
        setCommentsModalOpen(true);
      } catch (parseError) {
        // console.log("Error parsing comments:", parseError);
        showSnackbar("Error parsing comments data", "error");
      }
    } catch (error) {
      // console.log("Error fetching comments:", error);
      showSnackbar("Error fetching comments history", "error");
    }
  };

  const fetchVehicles = async (customerId) => {
    const token = Cookies.get("token");

    if (!token) {
      console.error("No token found. User might not be logged in.");
      return; // Optionally, show a message to the user
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/${customerId}/vehicles`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // if (!response.ok) {
      //   const errorText = await response.text(); // Get the response text
      //   console.error("Error fetching vehicles:", errorText);
      //   throw new Error(errorText); // Throw an error with the response text
      // }

      const data = await response.json();
      setVehicles(data);
      setOpenVehicleModal(true); // Open the modal after fetching data
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      // Optionally, show an error message to the user
    }
  };

  // Separate state for mobile view editing
  const [mobileEditedData, setMobileEditedData] = useState({
    type: "",
    customer_id: "",
    customer_name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    telecall: {
      callStatus: "",
      scheduledDate: "",
      callFeedback: "",
      comment: "",
    },
  });

  // State to manage sorting order
  const [sortOrder, setSortOrder] = useState("desc"); // Default to descending

  useEffect(() => {
    // Retrieve login status and phone number from cookies on component mount
    const storedStatus = Cookies.get("connection_status");
    const storedPhone = Cookies.get("phone");

    if (storedStatus === "active" && storedPhone) {
      setIsLoggedIn(true);
      setMobileNumber(storedPhone);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768); // Adjust the width as needed
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Backend rows states
  const [rows, setRows] = useState([]);

  // console.log("Rows Data:", token);
  useEffect(() => {
    const token = Cookies.get("token");
    fetchCompanyDetails(token, setLimit);
  }, []);
  // const [filteredRows, setFilteredRows] = useState(rows);
  // const filteredRows = filterRows(rows, searchQuery, filterType);

  // const filteredRows = rows;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState("");
  const [messageType, setMessageType] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [vcardName, setVcardName] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  // const [apiKey, setApiKey] = useState(); // Example API key
  // setApiKey(process.env.NEXT_PUBLIC_WHATSAPP_API_Key);
  const apiKey = process.env.NEXT_PUBLIC_WHATSAPP_API_Key;

  // New states for login modal and mobile number
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleOpenModal = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setMessageContent("");
    setMediaUrl("");
    setLatitude("");
    setLongitude("");
    setVcardName("");
    setVcardPhone("");
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const getCurrentDateForInput = () => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, "0"); // Get day with leading zero
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Get month (0-based index) with leading zero
    const year = currentDate.getFullYear(); // Get full year

    return `${day}-${month}-${year}`; // Format: DD-MM-YYYY
  };

  const handleSendMessage = async () => {
    if (!isLoggedIn || !mobileNumber) {
      showSnackbar("You must be logged in to send messages.", "warning");
      return;
    }

    if (!selectedRow) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fromNumber: mobileNumber,
            toNumber: selectedRow.phone,
            message: messageContent,
          }),
        }
      );
      const result = await response.text();
      if (result === "Message sent") {
        showSnackbar("Message sent successfully!", "success");
      } else {
        showSnackbar("Failed to send message: " + result, "error");
      }
    } catch (error) {
      showSnackbar("Error sending message: " + error.message, "error");
    }

    handleCloseModal();
  };

  const handleOpenLoginModal = () => {
    setLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
    setMobileNumber("");
    setQrCode("");
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            number: mobileNumber,
          }),
        }
      );

      const result = await response.json();
      if (result.qrCode) {
        setQrCode(result.qrCode);
        showSnackbar("Please scan the QR code.", "info");
      } else if (result.login_status === "Session already open") {
        // console.log("result:", result.login_status);
        setIsLoggedIn(true);
        Cookies.set("phone", mobileNumber);
        Cookies.set("connection_status", "active");
        showSnackbar("Device already connected!", "success");
        handleCloseLoginModal();
      } else {
        showSnackbar("Failed to login: " + result, "error");
      }
    } catch (error) {
      showSnackbar("Error during login: " + error.message, "error");
    }
  };

  const handleDone = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            number: mobileNumber,
            api_key: apiKey,
          }),
        }
      );

      const result = await response.json();
      // console.log("Done API Response:", result); // Log the API response

      if (result.login_status === "Session already open") {
        setIsLoggedIn(true);
        // Set cookies with phone number and connection status
        Cookies.set("phone", mobileNumber);
        Cookies.set("connection_status", "active");
        showSnackbar("Device already connected!", "success");
        handleCloseLoginModal();
        // Router.reload();
        //reload after 2 seconds
        setTimeout(() => {
          // window.location.reload();
        }, 2000);
      } else {
        showSnackbar("Failed to confirm connection: " + result.msg, "error");
      }
    } catch (error) {
      showSnackbar("Error during confirmation: " + error.message, "error");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            number: Cookies.get("phone"),
          }),
        }
      );

      const result = await response.text();
      // console.log("Logout API Response:", result); // Log the API response

      if (result === "Logged out and credentials deleted") {
        // Cookies.remove("phone");
        Cookies.remove("connection_status");
        setIsLoggedIn(false);
        setMobileNumber("");
        showSnackbar("Device disconnected successfully.", "success");
      } else {
        showSnackbar("Failed to disconnect device: " + result, "error");
      }
    } catch (error) {
      // console.log("Error during logout:", error);
      showSnackbar("Error during logout: " + error.message, "error");
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length === 0) {
      // window.location.reload();
    }

    if (!searchQuery) return; // Don't search if the query is empty

    try {
      const userId = Cookies.get("userId");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/telecallerSearch?search=${searchQuery}&filter=${filterType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = await response.json();

      // console.log("Search Results:", data); // Log the search results
      const filteredData = data.filter(customer => customer.leads_owner === userId);

      // Ensure each row has the expected structure
      const formattedData = filteredData.map((row) => ({
        ...row,
        telecall: {
          callStatus: row.telecall?.callStatus || "", // Default to empty string
          callFeedback: row.telecall?.callFeedback || "", // Default to empty string
          scheduledDate: row.telecall?.scheduledDate || "", // Default to empty string
          comment: row.telecall?.comment || "", // Default to empty string
        },
      }));

      setRows(formattedData); // Update rows with the formatted search results
      showSnackbar("Search completed successfully!", "success");
    } catch (error) {
      showSnackbar("No results found", "error");
    }
  };

  useEffect(() => {
    let storedToken = Cookies.get("token");
    let storedUserId = Cookies.get("userId");
    setToken(storedToken);
    setUserId(storedUserId);
    // console.log({ storedUserId });

    getAllLeads(
      storedToken,
      setRows,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackbarSeverity,
      limit,
      isLoading,
      setIsLoading,
      hasMore,
      setHasMore,
      offset,
      setOffset,
      filterType,
      storedUserId
    );
  }, []);

  // Add this helper function near the top of the file with other helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [day, month, year] = dateString.split("-");
    // console.log({ year, month, day });
    // return `${day}-${month}-${year}`;  yyyy-mm-dd
    return `${day}-${month}-${year}`; //  dd-mm-yyyy
  };

  // Function to handle sorting
  const handleSort = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);

    const sortedRows = [...rows].sort((a, b) => {
      if (!a.telecall?.scheduledDate) return 1;
      if (!b.telecall?.scheduledDate) return -1;

      const parseDate = (dateStr) => {
        const [day, month, year] = dateStr.split("-");
        return new Date(year, month - 1, day);
      };

      const dateA = parseDate(a.telecall.scheduledDate);
      const dateB = parseDate(b.telecall.scheduledDate);

      return newSortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setRows(sortedRows);
  };



  return (
    <div>
      {pageType !== null && pageType !== "tab" && <Navbar pageName="Calls" />}

      <Box
        sx={{
          backgroundSize: "cover",
          minHeight: "89vh",
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
            <div style={{ display: "flex" }}>
              {/* <BackButton />
              <h1 style={{ marginLeft: "10px", color: "white" }}>Telecaller</h1> */}
            </div>

            <div style={{ display: "flex", gap: 5 }}>
              <Button
                variant="contained"
                color={isLoggedIn ? "success" : "error"}
                size="small"
                onClick={handleOpenLoginModal}
              >
                {isLoggedIn ? "Active" : "Not Active"}
              </Button>

              {/* Filter Dropdown */}
              <Select
                value={filterType || ""}
                onChange={(e) => setFilterType(e.target.value)}
                displayEmpty
                variant="outlined"
                size="small"
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Lead">Lead</MenuItem>
                <MenuItem value="Customer Sales">Customer Sales</MenuItem>
                <MenuItem value="Customer Service">Customer Service</MenuItem>
              </Select>

              {/* Search Field */}
              <TextField
                label="Search"
                variant="outlined"
                size="small"
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(); // Call the new search function
                  }
                }}
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              />

              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={handleLogout}
                disabled={!isLoggedIn}
              >
                Logout
              </Button>
            </div>
          </div>

          {isMobileView ? (
            // Render cards for mobile view
            <Box>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <Paper
                    key={index}
                    sx={{ marginBottom: 2, padding: 2, position: "relative" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingBottom: 1,
                      }}
                    >
                      <b>Type:</b> {row.type}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingBottom: 1,
                      }}
                    >
                      <b>Customer Name:</b> {row.customer_name}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingBottom: 1,
                      }}
                    >
                      <b>Phone Number:</b> {row.phone}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingBottom: 1,
                      }}
                    >
                      <b>Call Status:</b>{" "}
                      {editRowId === row.customer_id ? (
                        <Select
                          value={
                            mobileEditedData.telecall.callStatus ||
                            row.telecall?.callStatus ||
                            ""
                          }
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            setMobileEditedData((prevData) => ({
                              ...prevData,
                              telecall: {
                                ...prevData.telecall,
                                callStatus: newStatus,
                                callFeedback:
                                  newStatus === "Not Attended"
                                    ? ""
                                    : prevData.telecall.callFeedback,
                              },
                            }));
                          }}
                        >
                          <MenuItem value="Attended">Attended</MenuItem>
                          <MenuItem value="Not Attended">Not Attended</MenuItem>
                          <MenuItem value="Call Back Later">
                            Call Back Later
                          </MenuItem>

                          <MenuItem value="Don't Call">Don't Call</MenuItem>
                        </Select>
                      ) : (
                        row.telecall?.callStatus || ""
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingBottom: 1,
                      }}
                    >
                      <b>Call Feedback:</b>{" "}
                      {editRowId === row.customer_id ? (
                        <Select
                          value={
                            mobileEditedData.telecall.callFeedback ||
                            row.telecall?.callFeedback ||
                            ""
                          }
                          onChange={(e) =>
                            setMobileEditedData((prevData) => ({
                              ...prevData,
                              telecall: {
                                ...prevData.telecall,
                                callFeedback: e.target.value,
                              },
                            }))
                          }
                          disabled={
                            mobileEditedData.telecall.callStatus ===
                            "Not Attended"
                          } // Disable if Not Attended
                        >
                          <MenuItem value="Interested">Interested</MenuItem>
                          <MenuItem value="Not Interested">
                            Not Interested
                          </MenuItem>
                        </Select>
                      ) : (
                        row.telecall?.callFeedback || ""
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingBottom: 1,
                      }}
                    >
                      <b>Scheduled Date:</b>{" "}
                      {editRowId === row.customer_id ? (
                        <TextField
                          type="date"
                          value={
                            mobileEditedData.telecall.scheduledDate ||
                            row.telecall?.scheduledDate ||
                            ""
                          }
                          onChange={(e) =>
                            setMobileEditedData((prevData) => ({
                              ...prevData,
                              telecall: {
                                ...prevData.telecall,
                                scheduledDate: e.target.value,
                              },
                            }))
                          }
                          inputProps={{
                            min: getCurrentDateForInput(),
                          }}
                        />
                      ) : (
                        formatDate(row.telecall?.scheduledDate)
                      )}
                      <b>Comment:</b>{" "}
                      {editRowId === row.customer_id ? (
                        <TextField
                          value={
                            mobileEditedData.telecall.comment ||
                            row.telecall?.comment ||
                            ""
                          }
                          onChange={(e) =>
                            setMobileEditedData((prevData) => ({
                              ...prevData,
                              telecall: {
                                ...prevData.telecall,
                                comment: e.target.value,
                              },
                            }))
                          }
                        />
                      ) : (
                        row.telecall?.comment || ""
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        paddingBottom: 1,
                      }}
                    >
                      {editRowId === row.customer_id ? (
                        <>
                          <IconButton
                            onClick={() => {
                              if (
                                mobileEditedData &&
                                mobileEditedData.telecall
                              ) {
                                handleSaveClick(
                                  token,
                                  row.customer_id,
                                  mobileEditedData,
                                  setRows,
                                  setEditRowId,
                                  setEditedData,
                                  setSnackbarMessage,
                                  setOpenSnackbar,
                                  setSnackbarSeverity,
                                  limit,
                                  isLoading,
                                  setIsLoading,
                                  setHasMore,
                                  offset,
                                  setOffset,
                                  filterType,
                                  hasMore
                                );
                                setEditRowId("");
                                setMobileEditedData({
                                  type: "",
                                  customer_id: "",
                                  customer_name: "",
                                  phone: "",
                                  street: "",
                                  city: "",
                                  state: "",
                                  telecall: {
                                    callStatus: "",
                                    scheduledDate: "",
                                    callFeedback: "",
                                    comment: "",
                                  },
                                });
                              } else {
                                // console.log(
                                //   "mobileEditedData or mobileEditedData.telecall is undefined"
                                // );
                              }
                            }}
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setEditRowId(""); // Reset edit state
                              setMobileEditedData({
                                // Reset mobileEditedData on cancel
                                type: "",
                                customer_id: "",
                                customer_name: "",
                                phone: "",
                                street: "",
                                city: "",
                                state: "",
                                telecall: {
                                  callStatus: "",
                                  scheduledDate: "",
                                  callFeedback: "",
                                  comment: "",
                                },
                              });
                            }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => {
                              setEditRowId(row.customer_id);
                              setMobileEditedData({
                                // Set mobileEditedData when starting to edit
                                type: row.type,
                                customer_id: row.customer_id,
                                customer_name: row.customer_name,
                                phone: row.phone,
                                street: row.street,
                                city: row.city,
                                state: row.state,
                                telecall: {
                                  callStatus: row.telecall?.callStatus || "",
                                  callFeedback:
                                    row.telecall?.callFeedback || "",
                                  scheduledDate:
                                    row.telecall?.scheduledDate || "",
                                  comment: row.telecall?.comment || "",
                                },
                              });
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
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
              }}
              onScroll={(event) => {
                scrollToTopButtonDisplay(event, setShowFab);
                let storedUserId = Cookies.get("userId");
                infiniteScroll(
                  event,
                  token,
                  setRows,
                  searchQuery,
                  setOpenSnackbar,
                  setSnackbarMessage,
                  setSnackbarSeverity,
                  limit,
                  isLoading,
                  setIsLoading,
                  hasMore,
                  setHasMore,
                  offset,
                  setOffset,
                  filterType,
                  storedUserId
                );
              }}
            >
              {isLoggedIn ? (
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <b>Type</b>
                      </TableCell>
                      <TableCell>
                        <b>Customer Name</b>
                      </TableCell>
                      <TableCell>
                        <b>Phone Number</b>
                      </TableCell>
                      <TableCell>
                        <b>City</b>
                      </TableCell>
                      <TableCell>
                        <b>Call Status</b>
                      </TableCell>
                      <TableCell>
                        <b>Call Feedback</b>
                      </TableCell>
                      <TableCell>
                        <b>Scheduled Date</b>
                        {/* <IconButton onClick={handleSort}>
                          {sortOrder === "asc" ? "🔼" : "🔽"}
                        </IconButton> */}
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
                    {rows.length > 0 ? (
                      rows.map((row, index) => {
                        // console.log({ row });
                        return row.type != "BlackList" ? (
                          <TableRow key={index}>
                            <TableCell>{row.type}</TableCell>
                            <TableCell>{row.customer_name}</TableCell>
                            <TableCell>{row.phone}</TableCell>
                            <TableCell>{row.city}</TableCell>
                            <TableCell>
                              {editRowId === row.customer_id ? (
                                <Select
                                  name="callStatus"
                                  value={row.telecall?.callStatus || ""}
                                  onChange={(e) => {
                                    // console.log(e.target.value);
                                    const updatedRows = [...rows];

                                    if (!updatedRows[index].telecall) {
                                      updatedRows[index].telecall = {};
                                    }

                                    const newStatus = e.target.value;
                                    updatedRows[index].telecall.callStatus =
                                      newStatus;

                                    // Clear comment when Not Attended is selected
                                    if (newStatus === "Not Attended") {
                                      updatedRows[index].telecall.comment = ""; // Clear comment
                                      updatedRows[index].telecall.callFeedback =
                                        ""; // Clear feedback
                                    }

                                    // Set type to "Blacklisted" if "Don't Call" is selected
                                    if (newStatus === "Don't Call") {
                                      updatedRows[index].type = "BlackList";
                                    }

                                    setRows(updatedRows);

                                    // Update editedData state as well
                                    setEditedData((prev) => ({
                                      ...prev,
                                      telecall: {
                                        ...prev.telecall,
                                        callStatus: newStatus,
                                        comment:
                                          newStatus === "Not Attended"
                                            ? ""
                                            : prev.telecall?.comment,
                                        callFeedback:
                                          newStatus === "Not Attended"
                                            ? ""
                                            : prev.telecall?.callFeedback,
                                      },
                                    }));
                                  }}
                                  variant="standard"
                                  disableUnderline
                                  sx={{ width: "100%" }}
                                >
                                  <MenuItem value="Attended">Attended</MenuItem>
                                  <MenuItem value="Not Attended">
                                    Not Attended
                                  </MenuItem>
                                  <MenuItem value="Call Back Later">
                                    Call Back Later
                                  </MenuItem>
                                  <MenuItem value="Don't Call">
                                    Don't Call
                                  </MenuItem>
                                </Select>
                              ) : (
                                <span>{row.telecall?.callStatus || ""}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editRowId === row.customer_id ? (
                                <Select
                                  name="callFeedback"
                                  value={
                                    row.telecall?.callFeedback ||
                                    editedData.telecall?.callFeedback ||
                                    ""
                                  }
                                  onChange={(e) => {
                                    handleCallFeedbackChange(
                                      index,
                                      editedData,
                                      rows,
                                      setRows,
                                      e.target.value
                                    );
                                    handleInputChange(e, setEditedData);
                                  }}
                                  variant="standard"
                                  disableUnderline
                                  sx={{ width: "100%" }}
                                  disabled={
                                    row.telecall?.callStatus ===
                                    "Not Attended" ||
                                    row.telecall?.callStatus === "Don't Call"
                                  }
                                >
                                  <MenuItem value="Interested">
                                    Interested
                                  </MenuItem>
                                  <MenuItem value="Not Interested">
                                    Not Interested
                                  </MenuItem>
                                </Select>
                              ) : (
                                row.telecall?.callFeedback
                              )}
                            </TableCell>
                            <TableCell>
                              {editRowId === row.customer_id ? (
                                <>
                                  <TextField
                                    fullWidth
                                    margin="normal"
                                    name="scheduledDate"
                                    type="date"
                                    variant="standard"
                                    value={row.telecall?.scheduledDate || ""}
                                    disabled={
                                      row.telecall?.callStatus ===
                                      "Not Attended" ||
                                      row.telecall?.callFeedback ===
                                      "Not Interested" ||
                                      row.telecall?.callStatus === "Don't Call"
                                    }
                                    onChange={(e) => {
                                      let selectedDate = new Date(
                                        e.target.value
                                      );
                                      const day = selectedDate.getDay();

                                      if (day === 0) {
                                        setOpenSnackbar(true);
                                        setSnackbarMessage(
                                          "Sundays are not allowed. Please choose another date."
                                        );
                                        setSnackbarSeverity("error");
                                        const updatedrows = [...rows];
                                        updatedrows[
                                          index
                                        ].telecall.scheduledDate = "";
                                        setRows(updatedrows);
                                        handleInputChange(e, setEditedData);
                                        return;
                                      }

                                      const updatedrows = [...rows];
                                      updatedrows[
                                        index
                                      ].telecall.scheduledDate = e.target.value;
                                      setRows(updatedrows);
                                      handleInputChange(e, setEditedData);
                                    }}
                                    inputProps={{
                                      min: getCurrentDateForInput(),
                                    }}
                                    sx={{
                                      "& .MuiSelect-icon": {
                                        display: "none",
                                      },
                                      width: "100%",
                                    }}
                                  />
                                </>
                              ) : (
                                formatDate(row.telecall?.scheduledDate)
                              )}
                            </TableCell>
                            <TableCell>
                              {editRowId === row.customer_id ? (
                                <>
                                  <TextField
                                    fullWidth
                                    name="comment"
                                    margin="normal"
                                    type="text"
                                    variant="standard"
                                    value={row.telecall?.comment || ""}
                                    onChange={(e) => {
                                      const updatedRows = [...rows];

                                      if (!updatedRows[index].telecall) {
                                        updatedRows[index].telecall = {};
                                      }

                                      updatedRows[index].telecall.comment =
                                        e.target.value;
                                      setRows(updatedRows);
                                    }}
                                    disabled={
                                      row.callStatus === "Not Attended" ||
                                      row.callStatus === "Don't Call"
                                    }
                                    onBlur={() =>
                                      stopEditing(index, rows, setRows)
                                    }
                                    sx={{
                                      "& .MuiSelect-icon": {
                                        display: "none",
                                      },
                                      width: "100%",
                                    }}
                                  />
                                </>
                              ) : (
                                row.telecall?.comment
                              )}
                            </TableCell>
                            <TableCell>
                              {editRowId === row.customer_id ? (
                                <>
                                  <IconButton
                                    onClick={() => {
                                      if (
                                        (editedData.telecall.callStatus ===
                                          "Attended" &&
                                          !editedData.telecall.scheduledDate) ||
                                        (editedData.telecall.callStatus ===
                                          "Call Back Later" &&
                                          !editedData.telecall.scheduledDate)
                                      ) {
                                        setSnackbarMessage("Date is Required");
                                        setOpenSnackbar(true);
                                        setSnackbarSeverity("error");
                                      } else {
                                        handleSaveClick(
                                          token,
                                          row.customer_id,
                                          editedData,
                                          setRows,
                                          setEditRowId,
                                          setEditedData,
                                          setSnackbarMessage,
                                          setOpenSnackbar,
                                          setSnackbarSeverity,
                                          limit,
                                          isLoading,
                                          setIsLoading,
                                          setHasMore,
                                          offset,
                                          setOffset,
                                          filterType,
                                          hasMore
                                        );
                                      }
                                    }}
                                  >
                                    <SaveIcon />
                                  </IconButton>
                                  <IconButton
                                    onClick={() =>
                                      handleCancelClick(
                                        setEditRowId,
                                        setEditedData
                                      )
                                    }
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <Tooltip title="Edit">
                                    <span>
                                      <IconButton
                                        disabled={editRowId}
                                        onClick={() =>
                                          handleEditClick(
                                            row,
                                            setEditRowId,
                                            setEditedData
                                          )
                                        }
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Send WhatsApp Message">
                                    <span>
                                      <IconButton
                                        onClick={() => handleOpenModal(row)}
                                      >
                                        <img
                                          src="/assets/images/WhatsApp.svg"
                                          alt="WhatsApp"
                                          style={{ width: 24, height: 24 }}
                                        />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Details">
                                    <span>
                                      <IconButton
                                        onClick={() =>
                                          fetchComments(row.customer_id)
                                        }
                                      >
                                        <InfoIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Vehicles">
                                    <span>
                                      <IconButton
                                        onClick={() =>
                                          fetchVehicles(row.customer_id)
                                        }
                                      >
                                        <DirectionsCarFilledIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          ""
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} align="center">
                          No Customer Found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <div style={{ position: "relative" }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <b>Type</b>
                        </TableCell>
                        <TableCell>
                          <b>Customer Name</b>
                        </TableCell>
                        <TableCell>
                          <b>Phone Number</b>
                        </TableCell>
                        <TableCell>
                          <b>City</b>
                        </TableCell>
                        <TableCell>
                          <b>Call Status</b>
                        </TableCell>
                        <TableCell>
                          <b>Call Feedback</b>
                        </TableCell>
                        <TableCell>
                          <b>Scheduled Date</b>
                          {/* <IconButton onClick={handleSort}>
                            {sortOrder === "asc" ? "🔼" : "🔽"}
                          </IconButton> */}
                        </TableCell>
                        <TableCell>
                          <b>Comment</b>
                        </TableCell>
                        <TableCell>
                          <b>Action</b>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.type}</TableCell>
                          <TableCell>{row.customer_name}</TableCell>
                          <TableCell>{row.phone}</TableCell>
                          <TableCell>{row.city}</TableCell>
                          <TableCell>
                            {editRowId === row.customer_id ? (
                              <Select
                                name="callStatus"
                                value={
                                  row.callStatus ||
                                  editedData.telecall?.callStatus ||
                                  ""
                                }
                                onChange={(e) => {
                                  handleCallStatusChange(
                                    index,
                                    editedData,
                                    rows,
                                    setRows,
                                    e.target.value
                                  );
                                  handleInputChange(e, setEditedData);
                                }}
                                variant="standard"
                                disableUnderline
                                sx={{ width: "100%" }}
                              >
                                <MenuItem value="Attended">Attended</MenuItem>
                                <MenuItem value="Not Attended">
                                  Not Attended
                                </MenuItem>
                                <MenuItem value="Call Back Later">
                                  Call Back Later
                                </MenuItem>
                                <MenuItem value="Don't Call">
                                  Don't Call
                                </MenuItem>
                              </Select>
                            ) : (
                              row.telecall?.callStatus
                            )}
                          </TableCell>

                          <TableCell>
                            {editRowId === row.customer_id ? (
                              <Select
                                name="callFeedback"
                                value={
                                  row.callFeedback ||
                                  editedData.telecall?.callFeedback ||
                                  ""
                                }
                                onChange={(e) => {
                                  handleCallFeedbackChange(
                                    index,
                                    editedData,
                                    rows,
                                    setRows,
                                    e.target.value
                                  );
                                  handleInputChange(e, setEditedData);
                                }}
                                variant="standard"
                                disableUnderline
                                sx={{ width: "100%" }}
                                disabled={
                                  row.callStatus === "Not Attended" ||
                                  row.callStatus === "Don't Call"
                                }
                              >
                                <MenuItem value="Interested">
                                  Interested
                                </MenuItem>
                                <MenuItem value="Not Interested">
                                  Not Interested
                                </MenuItem>
                              </Select>
                            ) : (
                              row.telecall?.callFeedback
                            )}
                          </TableCell>

                          <TableCell>
                            {editRowId === row.customer_id ? (
                              <>
                                <TextField
                                  fullWidth
                                  margin="normal"
                                  name="scheduledDate"
                                  type="date"
                                  variant="standard"
                                  value={row.telecall?.scheduledDate || ""}
                                  disabled={
                                    row.callFeedback === "Not Interested" ||
                                    row.callStatus === "Not Attended" ||
                                    row.callStatus === "Don't Call"
                                  }
                                  onChange={(e) => {
                                    let selectedDate = new Date(e.target.value);
                                    const day = selectedDate.getDay();

                                    if (day === 0) {
                                      setOpenSnackbar(true);
                                      setSnackbarMessage(
                                        "Sundays are not allowed. Please choose another date."
                                      );
                                      setSnackbarSeverity("error");
                                      const updatedrows = [...rows];
                                      updatedrows[
                                        index
                                      ].telecall.scheduledDate = "";
                                      setRows(updatedrows);
                                      handleInputChange(e, setEditedData);
                                      return;
                                    }

                                    const updatedrows = [...rows];
                                    updatedrows[index].telecall.scheduledDate =
                                      e.target.value;
                                    setRows(updatedrows);
                                    handleInputChange(e, setEditedData);
                                  }}
                                  inputProps={{
                                    min: getCurrentDateForInput(),
                                  }}
                                  sx={{
                                    "& .MuiSelect-icon": {
                                      display: "none",
                                    },
                                    width: "100%",
                                  }}
                                />
                              </>
                            ) : (
                              <span>
                                {formatDate(row.telecall?.scheduledDate)}
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            {editRowId === row.customer_id ? (
                              <TextField
                                fullWidth
                                name="comment"
                                margin="normal"
                                type="text"
                                variant="standard"
                                value={
                                  row.comment ||
                                  editedData.telecall?.comment ||
                                  ""
                                }
                                onChange={(e) => {
                                  handlePendingAmountChange(
                                    index,
                                    rows,
                                    setRows,
                                    e.target.value
                                  );
                                  handleInputChange(e, setEditedData);
                                }}
                                disabled={
                                  // row.callStatus === "Not Attended" ||
                                  row.callStatus === "Don't Call"
                                }
                                onBlur={() => stopEditing(index, rows, setRows)}
                                sx={{
                                  "& .MuiSelect-icon": {
                                    display: "none",
                                  },
                                  width: "100%",
                                }}
                              />
                            ) : (
                              row.telecall?.comment
                            )}
                          </TableCell>

                          <TableCell>
                            {editRowId === row.customer_id ? (
                              <>
                                <IconButton
                                  onClick={() => {
                                    if (
                                      (editedData.telecall.callStatus ===
                                        "Attended" &&
                                        !editedData.telecall.scheduledDate) ||
                                      (editedData.telecall.callStatus ===
                                        "Call Back Later" &&
                                        !editedData.telecall.scheduledDate)
                                    ) {
                                      setSnackbarMessage("Date is Required");
                                      setOpenSnackbar(true);
                                      setSnackbarSeverity("error");
                                    } else {
                                      handleSaveClick(
                                        token,
                                        row.customer_id,
                                        editedData,
                                        setRows,
                                        setEditRowId,
                                        setEditedData,
                                        setSnackbarMessage,
                                        setOpenSnackbar,
                                        setSnackbarSeverity,
                                        limit,
                                        isLoading,
                                        setIsLoading,
                                        setHasMore,
                                        offset,
                                        setOffset,
                                        filterType,
                                        hasMore
                                      );
                                    }
                                  }}
                                >
                                  <SaveIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() =>
                                    handleCancelClick(
                                      setEditRowId,
                                      setEditedData
                                    )
                                  }
                                >
                                  <CancelIcon />
                                </IconButton>
                              </>
                            ) : (
                              <>
                                <Tooltip title="Edit">
                                  <span>
                                    <IconButton
                                      disabled={editRowId}
                                      onClick={() =>
                                        handleEditClick(
                                          row,
                                          setEditRowId,
                                          setEditedData
                                        )
                                      }
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>

     {/* old whatsapp code */}

                                 {/* {isWhatsappEnabled && row?.phone && (
  <Tooltip title="Send WhatsApp Message">
    <span>
      <IconButton
        onClick={() => {
          const phone = row.phone.replace(/\D/g, "");
          window.open(`https://wa.me/91${phone}`, "_blank");
        }}
      >
        <img
          src="/assets/images/WhatsApp.svg"
          alt="WhatsApp"
          style={{ width: 24, height: 24 }}
        />
      </IconButton>
    </span>
  </Tooltip>
)}   */}


                                {/* new code whatsapp always show */}

     
  <Tooltip title="Send WhatsApp Message">
    <span>
      <IconButton
        onClick={() => {
          const phone = row.phone.replace(/\D/g, "");
          window.open(`https://wa.me/91${phone}`, "_blank");
        }}
      >
        <img
          src="/assets/images/WhatsApp.svg"
          alt="WhatsApp"
          style={{ width: 24, height: 24 }}
        />
      </IconButton>
    </span>
  </Tooltip>



                                

                                <Tooltip title="Details">
                                  <span>
                                    <IconButton
                                      onClick={() =>
                                        fetchComments(row.customer_id)
                                      }
                                    >
                                      <InfoIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Vehicles">
                                  <span>
                                    <IconButton
                                      onClick={() =>
                                        fetchVehicles(row.customer_id)
                                      }
                                    >
                                      <DirectionsCarFilledIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
            </TableContainer>
          )}
        </Box>
      </Box>

      <Modal open={modalOpen} onClose={handleCloseModal}>
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
          <h2>Send WhatsApp Message</h2>
          <TextField
            label="Message Content"
            variant="outlined"
            multiline
            rows={8}
            fullWidth
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
          >
            Send
          </Button>
        </Box>
      </Modal>

      {/* Login Modal */}
      <Modal open={loginModalOpen} onClose={handleCloseLoginModal}>
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
          {isLoggedIn ? (
            <h2>
              {" "}
              Already Connected 😊 <br></br>
              <p>{mobileNumber}</p>
            </h2>
          ) : (
            <>
              <h2>Login</h2>
              <TextField
                label="Mobile Number"
                variant="outlined"
                fullWidth
                value={mobileNumber}
                inputProps={{ maxLength: 10 }}
                onChange={(e) => {
                  let value = e.target.value;

                  setMobileNumber(value);
                }}
                sx={{ mb: 2 }}
              />

              <Button variant="contained" color="primary" onClick={handleLogin}>
                Generate QR Code
              </Button>

              {qrCode && (
                <div style={{ marginTop: "20px" }}>
                  <img src={qrCode} alt="QR Code" style={{ width: "100%" }} />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDone}
                    sx={{ mt: 2 }}
                  >
                    Done
                  </Button>
                </div>
              )}
            </>
          )}
        </Box>
      </Modal>

      {/* Snackbar for Error Message */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Comments History Modal */}
      <Modal
        open={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h2>Comments History</h2>
          {commentsHistory.map((comment, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mb: 2,
                backgroundColor: "#f5f5f5",
              }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="subtitle1">
                  <strong>Type:</strong> {comment.type}
                </Typography>

                <Typography variant="subtitle1">
                  <strong>Time:</strong> {comment.currentTime}
                </Typography>
              </Box>
              <Typography sx={{ mb: 1 }}>
                <strong>Status:</strong> {comment.callStatus}
                {comment.callFeedback && ` - ${comment.callFeedback}`}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Scheduled Date:</strong> {formatDate(comment.scheduledDate)}              
                  {/* <strong>Scheduled Date</strong> {formatDate(comment.scheduledDate)} */}
              </Typography>

              {comment.comment && (
                <Typography>
                  <strong>Comment:</strong> {comment.comment}
                </Typography>
              )}    
            </Paper>
          ))}
          <Button
            variant="contained"
            onClick={() => setCommentsModalOpen(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      </Modal>

      {/* Vehicle Modal */}
      <Modal
        open={openVehicleModal}
        onClose={() => setOpenVehicleModal(false)}
        aria-labelledby="vehicle-modal-title"
        aria-describedby="vehicle-modal-description"
      >
        <Box
          sx={{
            position: "absolute", // Positioning modal absolutely within viewport
            top: "50%", // Center vertically
            left: "50%", // Center horizontally
            transform: "translate(-50%, -50%)", // Shift modal back to exact center
            padding: 2,
            bgcolor: "white", // Background color white
            borderRadius: 2, // Rounded corners
            boxShadow: 24, // Shadow effect
            width: "80vw", // Modal width 80% of viewport
            maxWidth: "900px", // Set a max width to avoid overflow on large screens
          }}
        >
          <h2 id="vehicle-modal-title">Vehicles</h2>
          {vehicles.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle ID</TableCell>
                  <TableCell>Make</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Plate Number</TableCell>
                  <TableCell>Registration Date</TableCell>
                  <TableCell>Chassis Number</TableCell>
                  <TableCell>Engine Number</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.vehicle_id}</TableCell>
                    <TableCell>{vehicle.make}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.plate_number}</TableCell>
                    <TableCell>{vehicle.registration_date}</TableCell>
                    <TableCell>{vehicle.chassis_number}</TableCell>
                    <TableCell>{vehicle.engine_number}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No vehicles found </p>
          )}
        </Box>
      </Modal>
    </div>
  );
}
