"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { State, City } from "country-state-city";

import BackButton from "@/components/backButton";
// import Navbar from "../../../../../components/navbar";
import Navbar from "@/components/navbar";
import {
  Box,
  Typography,
  Snackbar,
  Button,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from "@mui/material";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import EditIcon from "@mui/icons-material/Edit";
import Cookies from "js-cookie";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function SupplierDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [supplier, setsupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [rows, setRows] = useState([]);

  // Modal and form states for vehicle and appointment
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [openRetryDialog, setOpenRetryDialog] = useState(false);
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [supplierOutstanding, setSupplierOutstanding] = useState(0);

  const [value, setValue] = React.useState(0);

  // Add new state for Snackbar position
  const [snackbarPosition] = useState({
    vertical: "bottom",
    horizontal: "right",
  });

  const [editMode, setEditMode] = useState(false);
  const [editedSupplier, setEditedSupplier] = useState({
    supplier_name: "",
    contact: {
      phone: "",
      email: "",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
      },
    },
  });

  // Add new state for GST entitlement
  const [gstsupplier, setGstsupplier] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState("");

  // Function to handle edit button click
  const handleEditClick = () => {
    console.log({ editedSupplier });
    setEditedSupplier(supplier || editedSupplier); // Ensure supplier is defined
    const state =
      State.getStatesOfCountry("IN").find(
        (state) => state.name === supplier?.contact?.address?.state
      ) || null;
    setSelectedState(state);

    const city =
      City.getCitiesOfState("IN", state?.isoCode || "").find(
        (city) => city.name === supplier?.contact?.address?.city
      ) || null;
    setSelectedCity(city);

    setEditMode(true);
  };

  // Function to handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    setEditedSupplier((prev) => {
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  // Function to validate form fields
  const validateFormFields = () => {
    const { supplier_name, contact } = editedSupplier;
    const { phone, email, address } = contact;
    const { street, city, state, zip } = address;

    if (!supplier_name || !phone || !street || !city || !state) {
      setSnackbarMessage("Please fill in all the required fields.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }
    // phone
    if (!/^\d{10}$/.test(phone)) {
      setSnackbarMessage("Phone number must be 10 digits.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSnackbarMessage("Invalid email address.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }

    // if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    //   setSnackbarMessage("Invalid email address.");
    //   setSnackbarSeverity("error");
    //   setSnackbarOpen(true);
    //   return false;
    // }

    // if (!/^\d+$/.test(zip)) {
    //   setSnackbarMessage("Pincode must be an Number.");
    //   setSnackbarSeverity("error");
    //   setSnackbarOpen(true);
    //   return false;
    // }

    return true;
  };

  // Function to handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (!validateFormFields()) {
      return;
    }

    // Update editedSupplier with selected city and state
    const updatedSupplier = {
      ...editedSupplier,
      contact: {
        ...editedSupplier.contact,
        address: {
          ...editedSupplier.contact.address,
          city: selectedCity?.name || editedSupplier.contact.address.city,
          state: selectedState?.name || editedSupplier.contact.address.state,
        },
      },
      outstanding: editedSupplier?.outstanding || supplierOutstanding,
    };

    const token = Cookies.get("token");
    // Make the API call with updatedSupplier
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/supplier/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSupplier),
        }
      );

      const ledgerData = {
        id: supplier?.ledger_id,
        customer_id: supplier.supplier_id,
        creation_date: new Date().toISOString().split("T")[0],
        expense_type: "Credit",
        type: "supplier",
        description: `Outstanding amount for supplier #${supplier.supplier_id}`,
        credit: editedSupplier?.outstanding,
        debit: null,
      };

      const response2 = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/finance/update_ledger`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(ledgerData),
        }
      );

      if (!response.ok) throw new Error("Failed to update supplier details");
      const updatedSupplierData = await response.json();
      setsupplier(updatedSupplierData);
      setEditMode(false);
      setSnackbarMessage("Supplier details updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      // setTimeout(() => {
      //   window.location.reload();
      // }, 1000);
      fetchSupplierDetails();
    } catch (err) {
      setError(err.message);
    }
  };


  const fetchSupplierDetails = async () => {
    const token = Cookies.get("token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/supplier/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch supplier details");

      const data = await response.json();

      setsupplier(data);

      console.log({ data });

      const response2 = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/finance/supplier/outstanding/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      let res = await response2.json();

      setSupplierOutstandi
      ng(res.outstanding);
      // setSelectedState(State.getStatesOfCountry("IN").find(state => state.name === data?.contact?.address?.state) || null);
      // console.log("selectedState", selectedState);
      // console.log("data", data.contact.address);
      // setSelectedCity(City.getCitiesOfState("IN", data?.contact?.address?.state).find(city => city.name === data?.contact?.address?.city) || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    fetchSupplierDetails();

    const fetchPrDetails = async () => {
      const token = Cookies.get("token");
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/procurement/supplier/prDetails/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok)
          throw new Error("Failed to fetch procurement details");

        const data = await response.json();
        console.log({ PR: data });
        setRows(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrDetails();
  }, [id]);

  // MUI Tabs requisite - START
  function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  // MUI Tabs requisite - END
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {pageType !== "tab" && <Navbar pageName="Supplier Details" />}
      {/* <Navbar pageName="Supplier Details" /> */}

      <Box
        sx={{
          backgroundSize: "cover",
          minHeight: "89vh",
          marginTop: pageType !== "tab" ? "0px" : "40px",
        }}
      >
        {loading && <Typography>Loading supplier details...</Typography>}
        {supplier && (
          <Box display="flex" flexDirection="column" gap={2}>
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
              <Box paddingX={"1%"}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex" }}>
                    {/* <BackButton />
                    <h3 style={{ marginLeft: "10px" }}>Supplier Details</h3> */}
                  </div>
                  <IconButton color="primary" onClick={handleEditClick}>
                    <EditIcon />
                  </IconButton>
                </div>
              </Box>
              <Grid container spacing={2} alignItems="center" paddingLeft={5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h3">
                    {supplier?.supplier_name}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Phone:</strong>{" "}
                    <a href={`tel://${supplier?.contact?.phone}`}>
                      {supplier?.contact?.phone}
                    </a>
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography>
                      <strong>Outstanding:</strong> ₹{supplierOutstanding}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        router.push(`/views/VendorOutstand?id=${id}`)
                      }
                    >
                      <InfoOutlinedIcon color="primary" />
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body1">
                    <strong>Email:</strong>{" "}
                    <a href={`mailto:${supplier?.contact?.email}`}>
                      {supplier?.contact?.email}
                    </a>
                  </Typography>

                  <Typography variant="body1">
                    <strong>Address:</strong>{" "}
                    {supplier?.contact?.address?.street},{" "}
                    {supplier?.contact?.address?.city}
                  </Typography>
                  <Typography variant="body1">
                    {supplier?.contact?.address?.state} -{" "}
                    {supplier?.contact?.address?.zip}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
        {/* Tab Panels */}
        <Box
          sx={{ width: "100%", backgroundColor: "rgba(255, 255, 255, 0.85)" }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              <Tab label="PR Details" {...a11yProps(0)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={value} index={0}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ padding: "10px 16px" }}>PR No</TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>Product</TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>Details</TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>
                      Quantity
                    </TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>
                      Estimated Delivery
                    </TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>Item ID</TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>
                      Supplier Name
                    </TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>
                      Supplier Number
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length > 0 ? (
                    rows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.pr_no}</TableCell>
                        <TableCell>{row.product}</TableCell>
                        <TableCell>{row.details}</TableCell>
                        <TableCell>{row.qty}</TableCell>
                        <TableCell>
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }).format(new Date(row.estimatedDelivery))}
                        </TableCell>
                        <TableCell>{row.item_id}</TableCell>
                        <TableCell>{row.supplierName}</TableCell>
                        <TableCell>{row.supplierNumber}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No Procurement Records Found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CustomTabPanel>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={snackbarPosition}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog
        open={openRetryDialog}
        onClose={() => setOpenRetryDialog(false)}
        aria-labelledby="retry-dialog-title"
      >
        <DialogTitle id="retry-dialog-title">
          Appointment Already Booked
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">{appointmentError}</Typography>
          <Typography variant="body2" color="textSecondary">
            Would you like to Redirect to the appointment ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRetryDialog(false)} color="primary">
            No
          </Button>
          <Button
            onClick={() => {
              if (appointmentId) {
                router.push(`/views/jobCard/${appointmentId}`);
              } else {
                console.log("No appointment ID available for redirection");
                setSnackbarMessage(
                  "No appointment ID available for redirection."
                );
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
              }
              setOpenRetryDialog(false);
            }}
            color="primary"
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editMode}
        fullWidth
        maxWidth="md"
        // onClose={() => setEditMode(false)}
      >
        <DialogTitle>Edit Supplier Details</DialogTitle>
        <DialogContent>
          <Box marginTop="1rem" style={{ overflowY: "auto" }}>
            <div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <Typography>For GST?</Typography>
                <Checkbox
                  checked={gstsupplier}
                  size="small"
                  onChange={(event) => setGstsupplier(event.target.checked)}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <TextField
                  required
                  label="Supplier Name"
                  size="small"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  name="supplier_name"
                  value={editedSupplier.supplier_name}
                  onChange={handleInputChange}
                />
                {gstsupplier && (
                  <TextField
                    required
                    label="GST Number"
                    size="small"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    name="gst_number"
                    value={editedSupplier.gst_number || ""}
                    onChange={handleInputChange}
                  />
                )}
              </div>

              <Box
                display="flex"
                justifyContent="space-between"
                marginY="normal"
              >
                <TextField
                  required
                  label="Phone"
                  size="small"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  name="contact.phone"
                  value={editedSupplier.contact.phone}
                  onChange={handleInputChange}
                  inputProps={{ maxLength: 10 }}
                  sx={{ flex: 1, marginRight: "8px" }}
                />
                <TextField
                  label="Email"
                  size="small"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  name="contact.email"
                  value={editedSupplier.contact.email}
                  onChange={handleInputChange}
                  sx={{ flex: 1, marginTop: "16px" }}
                />
              </Box>

              <Box
                display="flex"
                justifyContent="space-between"
                marginY="normal"
              >
                <Autocomplete
                  options={State.getStatesOfCountry("IN")}
                  getOptionLabel={(option) => option?.name || ""}
                  value={selectedState}
                  onChange={(event, newValue) => {
                    setSelectedState(newValue);
                    setSelectedCity("");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="State"
                      size="small"
                      variant="outlined"
                      margin="normal"
                      fullWidth
                    />
                  )}
                  sx={{ flex: 1, marginRight: "8px" }}
                />

                <Autocomplete
                  options={City.getCitiesOfState(
                    "IN",
                    selectedState?.isoCode || ""
                  )}
                  getOptionLabel={(option) => option?.name || ""}
                  value={selectedCity}
                  onChange={(event, newValue) => {
                    setSelectedCity(newValue);
                  }}
                  disabled={!selectedState}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="City"
                      size="small"
                      variant="outlined"
                      margin="normal"
                      fullWidth
                    />
                  )}
                  sx={{ flex: 1, marginRight: "8px" }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  flex: 1,
                  marginRight: "8px",
                }}
              >
                <TextField
                  required
                  label="Street"
                  size="small"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  name="contact.address.street"
                  value={editedSupplier.contact.address.street}
                  onChange={handleInputChange}
                  sx={{ flex: 1, marginRight: "8px" }}
                />

                <TextField
                  label="Pincode"
                  size="small"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  name="contact.address.zip"
                  value={editedSupplier.contact.address.zip}
                  onChange={handleInputChange}
                  inputProps={{ maxLength: 6 }}
                  sx={{ flex: 1, marginRight: "8px" }}
                />

                <TextField
                  label="Outstanding"
                  size="small"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  name="outstanding"
                  value={editedSupplier?.outstanding || supplierOutstanding}
                  onChange={handleInputChange}
                  sx={{ flex: 1, marginRight: "8px" }}
                />
              </Box>
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMode(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleFormSubmit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
