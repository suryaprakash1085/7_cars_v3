"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataNotFound from "@/components/dataNotFound";
// Function imports
import {
  fetchEntries,
  handleSearch,
  handleCardClick,
  handleEditClick,
  deleteAppointment,
  handleCloseSnackBar,
  handleCloseAppointmentEditModal,
  updateAppointment,
} from "./statsHelper";

import Cookies from "js-cookie";
// Functional package imports
import { motion } from "framer-motion";

// Component imports
import Navbar from "../../../components/navbar";
import BackButton from "../../../components/backButton";

// UI package imports
import {
  Box,
  TextField,
  IconButton,
  Card,
  Typography,
  InputAdornment,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

// Images and icon imports
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { set } from "date-fns";

export default function Stats() {
  const router = useRouter();

  // FrontEnd extracted data states
  let [token, setToken] = useState();

  // Backend Data states
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [groupedEntries, setGroupedEntries] = useState({});

  // Modal and Alert states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [appointmentEditModalOpen, setAppointmentEditModalOpen] = useState();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackbarSeverity, setSnackbarSeverity] = useState();

  // FrontEnd form input states
  const [searchQuery, setSearchQuery] = useState("");
  const [deletionID, setDeletionID] = useState();
  const [editAppointmentData, setEditAppointmentData] = useState();
  const [appointmentDate, setAppointmentDate] = useState();
  const [appointmentTime, setAppointmentTime] = useState();

  // State for collapsed statuses
  const [collapsedStatuses, setCollapsedStatuses] = useState({});

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);

    if (storedToken) {
      setLoading(true); // Set loading to true before fetching

      // Simulate fetching data for debugging
      const mockFetchEntries = async () => {
        try {
          console.log("Fetching entries..."); // Log before fetching
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointment`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch entries");
          }

          const data = await response.json();
          console.log("Fetched data:", data); // Log fetched data
          const entries = Array.isArray(data) ? data : data.data || [];
          setEntries(entries);
          setFilteredEntries(entries);
          const grouped = entries.reduce((acc, entry) => {
            (acc[entry.status] = acc[entry.status] || []).push(entry);
            return acc;
          }, {});
          setGroupedEntries(grouped);
        } catch (err) {
          console.error("Fetch error:", err); // Log the error
        } finally {
          setLoading(false); // Ensure loading is set to false
        }
      };

      mockFetchEntries(); // Call the mock function
    } else {
      setLoading(false); // Set loading to false if no token is found
    }
  }, [token]); // Add token as a dependency

  // Toggle collapse/expand for a specific status
  const toggleCollapse = (status) => {
    setCollapsedStatuses((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {/* <Navbar pageName="Stats" /> */}
      {pageType !== "tab" && <Navbar pageName="Stats" /> }
      <Box
        sx={{
          backgroundSize: "cover",
          color: "white",
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
            }}
          >
            <div style={{ display: "flex" }}>
              {/* <BackButton /> */}
              {/* <h1 style={{ marginLeft: "10px" }}>Job Cards</h1> */}
            </div>
            {/* Search Field
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
            /> */}
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : entries ? (
           <DataNotFound/>
          ) : error ? (
            <p>Error: {error}</p>
          ) : (
            <div>
              {Object.keys(groupedEntries).length === 0 ? (
                <p>No entries available.</p>
              ) : (
                Object.keys(groupedEntries).map((status) => (
                  <div key={status}>
                    <Typography
                      variant="h4"
                      onClick={() => toggleCollapse(status)}
                      sx={{ cursor: "pointer", marginBottom: "10px" }}
                    >
                      {status} {collapsedStatuses[status] ? "▼" : "▲"}
                    </Typography>
                    {!collapsedStatuses[status] && (
                      <Box
                        id="scrollable-table"
                        display="flex"
                        flexWrap="wrap"
                        gap={2}
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          maxHeight: "70vh",
                          overflowY: "auto",
                          padding: "0.5% 0.5% 0.5% 0.5%",
                        }}
                      >
                        {groupedEntries[status].map((tile) => (
                          <motion.div
                            key={tile._id}
                            className="box"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: [0, 0.71, 0.2, 1.01] }}
                          >
                            <Card
                              onClick={() => handleCardClick(router, tile.appointment_id)}
                              sx={{
                                height: "110px",
                                cursor: "pointer",
                                width: "160px",
                                borderRadius: "20px",
                                position: "relative",
                                padding: "10px 20px 20px 20px",
                                textAlign: "left",
                                boxShadow: 3,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                              }}
                            >
                              <Box sx={{ fontSize: "0.9rem" }}>
                                <Typography
                                  variant="h6"
                                  component="div"
                                  sx={{ marginBottom: "10px" }}
                                >
                                  {tile.plateNumber || tile.vehicle_id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Date:{" "}
                                  {new Date(
                                    tile.appointment_date
                                  ).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Time: {tile.appointment_time}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Status: {tile.status}
                                </Typography>
                              </Box>
                              {/* Add your action buttons here */}
                            </Card>
                          </motion.div>
                        ))}
                      </Box>
                    )}
                  </div>
                ))
              )}
            </div>
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
          onClose={() => handleCloseSnackBar(setOpenSnackbar)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Deletion Conformation Dialogue */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this appointment? This action cannot
          be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={(e) =>
              deleteAppointment(
                token,
                deletionID,
                setOpenDeleteDialog,
                setSnackbarMessage,
                setOpenSnackbar,
                setSnackbarSeverity
              )
            }
            color="error"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog
        open={appointmentEditModalOpen}
        onClose={() => setAppointmentEditModalOpen(false)}
        fullWidth
        maxWidth="sm"
        gap={5}
      >
        <IconButton
          aria-label="close"
          onClick={() => {
            handleCloseAppointmentEditModal(setAppointmentEditModalOpen);
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent>
          <Typography variant="h6" paddingBottom={2}>
            Edit Appointment Details
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              required
              type="date"
              label="Appointment Date"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
            <TextField
              required
              label="Appointment Time"
              size="small"
              type="time"
              variant="outlined"
              fullWidth
              margin="normal"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setAppointmentEditModalOpen(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              editAppointmentData.appointment_date = appointmentDate;
              editAppointmentData.appointment_time = appointmentTime;

              updateAppointment(
                token,
                editAppointmentData,
                setOpenSnackbar,
                setSnackbarMessage,
                setSnackbarSeverity,
                setAppointmentEditModalOpen
              );
            }}
            color="primary"
          >
            Update Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
