"use client";
//? React and Next imports
import React, { useState,useEffect  } from "react";
import { useRouter, useParams } from "next/navigation";

//? Function imports
import {
  handleAddVehicle,
  handleAddAppointment,
  handleFuelTypeChange,
  handleCheckboxChange,
  handleCloseModal,
  fetchCustomerDetails,
  deleteVehicle,
  handleCloseCustomerEditModal,
  editVehicleClick,
  updateVehicle,
  updateCustomer,
  fetchVehicles,
} from "../../../../../../controllers/customerIDControllers";

//? Component imports
// import Navbar from "../../../../components/navbar";
import Navbar from "@/components/navbar";
import ConformationDialogue from "@/components/conformationDialogue";

//? Data imports
// import { makes, models, variants } from "@/components/database";

//? Functional package imports
import { motion } from "framer-motion";

// import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";

//? UI package imports
import {
  TextField,
  Box,
  Typography,
  Card,
  Snackbar,
  CardHeader,
  CardActions,
  Button,
  Paper,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Modal,
  Autocomplete,
  Alert,
  IconButton,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Tooltip,
} from "@mui/material";
import Cookies from "js-cookie";

// Images and icon imports
import BuildIcon from "@mui/icons-material/Build";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { State, City } from "country-state-city";
import { set } from "date-fns";

// Utility function for GST validation
const validateGstNumber = (gstNumber) => {
  const gstPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  return gstPattern.test(gstNumber);
};

// Utility function for phone number validation
const validatePhoneNumber = (phone) => {
  const indianPhoneRegex =
    /^(\+91|91)?\s?-?\(?[6-9]\d{2}\)?\s?-?\d{3}\s?-?\d{4}$/;
  return indianPhoneRegex.test(phone);
};

let references = [
  { label: "Online", name: "Online" },
  { label: "Tele in ", name: "Tele in" },
  { label: "Telecalling out", name: "Telecalling out" },
  { label: "Walk-in", name: "Walk-in" },
  { label: "Customer reference", name: "Customer reference" },
];

export default function CustomerDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const prefixOptions = [
    { name: "Mr." },
    { name: "Mrs." },
    { name: "Dr." },
    { name: "M/s." },
    { name: "Prof." },
  ];

  const [prefix, setPrefix] = useState(prefixOptions[0]); // Default to "Mr."

  const [addcustomerssOptions, setaddcustomerssOptions] = useState([]);

  // FrontEnd extracted data states
  let [token, setToken] = useState(null);

  // Backend Data states
  const [customer, setCustomer] = useState();
  const [refresh, setRefresh] = useState(false);


  // FrontEnd form input states
  const [gstCustomer, setGstCustomer] = useState(false);
  const [gstNumber, setGstNumber] = useState();
  const [isPlateNumberHidden, setIsPlateNumberHidden] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");

  const [plateNumber, setPlateNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [customerName, setCustomerName] = useState();
  const [phone, setPhone] = useState();
  const [email, setEmail] = useState();
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [pinCode, setPinCode] = useState("");
  const [refer, setRefer] = useState("");
  const [referBy, setReferBy] = useState("");
  const [leads_owner, setLeadOwner] = useState("");

  // Modal and form states for vehicle and appointment
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [openRetryDialog, setOpenRetryDialog] = useState(false);
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [customerEditModalOpen, setCustomerEditModalOpen] = useState(false);

  // Appointment fields
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [telecaller, setTelecaller] = useState("self");
  const [notes, setNotes] = useState("");

  const [openPopup, setOpenPopup] = useState(false);

  // State for Select Sales Type modal
  const [openSalesTypeModal, setOpenSalesTypeModal] = useState(false);
  const [selectedVehicleForSalesType, setSelectedVehicleForSalesType] = useState(null);

  // Add new state for Snackbar position
  const [snackbarPosition] = useState({
    vertical: "bottom",
    horizontal: "left",
  });

  // Add states and cities state
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Add state for confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const [makes, setMakes] = useState([]); //  Fixed State Type
  const [models, setModels] = useState([]); // Fixed State Type

  const [registrationDate, setRegistrationDate] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");

  // Initialize formData with default values or fetched data
  const [formData, setFormData] = useState({
    leads_owner: "", // Example field
    // Add other fields as necessary
  });

  // Ensure formData is updated with customer data when fetched
  useEffect(() => {
    if (customer) {
      setFormData({
        ...formData,
        leads_owner: leads_owner || "",
        // Set other fields from customer data
      });
    }
  }, [customer]);

  useEffect(() => {
    let storedToken = Cookies.get("token");
    setToken(storedToken);

    fetchVehicles(storedToken, setModels, setMakes);
    fetchLeadOwner();
    const now = new Date();
    setAppointmentDate(now.toISOString().split("T")[0]); // YYYY-MM-DD
    setAppointmentTime(now.toTimeString().slice(0, 5)); // HH:MM
  }, []);

  useEffect(() => {
 const storedToken = Cookies.get("token");
  if (!storedToken) return;

  setToken(storedToken);

    fetchCustomerDetails(
      token,
      id,
      setCustomer,
      setGstCustomer,
      setGstNumber,
      setLoading,
      setError,
      setCustomerName,
      setPrefix,
      setPhone,
      setEmail,
      setStreet,
      setCity,
      setState,
      setPinCode,
      setRefer,
      setReferBy,
      setRegistrationDate,
      setChassisNumber,
      setEngineNumber,
      setLeadOwner
    );
}, [token, id, refresh]);   // refresh triggers auto re-fetch

  useEffect(() => {
    if (customer) {
      // Set initial state and city
      setSelectedState({ label: customer.contact.address.state });
      setSelectedCity({ label: customer.contact.address.city });

      // Set the prefix from customer data
      const customerPrefix = prefixOptions.find(
        (option) => option.name === customer.prefix
      );
      setPrefix(customerPrefix || prefixOptions[0]); // Default to "Mr." if not found

      // console.log({ prefix: customerPrefix }); // Log the prefix to verify
    }
  }, [customer]);

  useEffect(() => {
    // Load states for India initially
    const statesData = State.getStatesOfCountry("IN").map((state) => ({
      ...state,
      label: state.name,
    }));
    setStates(statesData);
  }, []);

  // Reset vehicle form when opening modal in add mode (prevents stale values)
  useEffect(() => {
    if (modalOpen && !isEditing) {
      setIsPlateNumberHidden(false);
      setFuelType("Petrol");
      setPlateNumber("");
      setMake("");
      setModel("");
      setYear("");
      setVin("");
      setEngineNumber("");
      setChassisNumber("");
      setRegistrationDate("");
    }
  }, [modalOpen, isEditing]);

  const handleMakeChange = (value) => {
    setMake(value);
    setModel("");

    //  Find the Selected Make in State
    const selectedMake = makes.find((item) => item.make_name === value);

    //  Set Models Based on Make
    if (selectedMake) {
      setModels(selectedMake.models);
    } else {
      setModels([]);
    }
  };

  // generate counter sale and redirect to shopping cart
  const generate_counter = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/add_countersales`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: customer.customer_name,
            phone: customer.contact.phone,
            gst: customer.gst_number || "",
            street: customer.contact.address.street || "",
            appointment_id: appointmentId || "", // Using vehicleId as appointment_id
            vehicle_id: vehicleId,
            customer_id: customer.customer_id,
            status: "invoiced"
          }),
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error during counter sale generation:", error);
      return null;
    }
  };

  // generate counter sale for a specific vehicle
  const generate_counter_for_vehicle = async (specifiedVehicleId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/add_countersales`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: customer.customer_name,
            phone: customer.contact.phone,
            gst: customer.gst_number || "",
            street: customer.contact.address.street || "",
            appointment_id: "", // No appointment_id for counter sales from SummarizeIcon
            vehicle_id: specifiedVehicleId,
            customer_id: customer.customer_id,
            status: "invoiced"
          }),
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error during counter sale generation:", error);
      return null;
    }
  };

  // ue
  const fetchLeadOwner = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        const LeadArray = data.map((element) => ({
          name: element.username,
          userid: element.user_id,
        }));
        setaddcustomerssOptions(LeadArray);
      } else {
        setaddcustomerssOptions([]);
      }
    } catch (error) {
      setaddcustomerssOptions([]);
      console.error("Error fetching User List:", error);
    }
  };

  const handleStateChange = (event, state) => {
    setSelectedState(state);
    if (state) {
      const citiesData = City.getCitiesOfState("IN", state.isoCode).map(
        (city) => ({
          ...city,
          label: city.name,
        })
      );
      setCities(citiesData);
    } else {
      setCities([]);
    }
    setSelectedCity(null);
  };

  const handleCityChange = (event, city) => {
    setSelectedCity(city);
  };

  // Example usage in a function
  const handleCustomerUpdate = () => {
    if (!validatePhoneNumber(phone)) {
      setSnackbarMessage("Invalid phone number");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    if (gstCustomer && !validateGstNumber(gstNumber)) {
      setSnackbarMessage("Invalid GST Number");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const newCustomerDetails = {
      customer_name: customerName,
      prefix: prefix.name,
      gst_number: gstCustomer ? gstNumber : "",
      phone: phone,
      street: street,
      city: selectedCity ? selectedCity.label : city,
      state: selectedState ? selectedState.label : state,
      pin_code: pinCode,
      email: email,
      reference: refer?.label == "Customer reference" ? refer.label : refer,
      referred_by: referBy,
      leads_owner: formData.leads_owner,
    };
    updateCustomer(
  token,
  customer.customer_id,
  newCustomerDetails,
  setCustomer,
  setSnackbarOpen,
  setSnackbarMessage,
  setSnackbarSeverity,
  setCustomerEditModalOpen,
  setGstCustomer,
  setGstNumber,
  setCustomerName,
  setPrefix,
  setPhone,
  setEmail,
  setStreet,
  setCity,
  setState,
  setPinCode,
  setRefer,
  setReferBy,
  setLeadOwner
).then(()=>{
  setRefresh(prev => !prev); 
});

  };

  // Function to handle Add Counter Sale button click
  const handleAddCounterSale = async () => {
    try {
      const counterSaleData = await generate_counter();
      if (counterSaleData) {
        router.push(`/views/shoppingcart/${counterSaleData.appointment_id}`);
      } else {
        setSnackbarMessage("Failed to generate counter sale.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error during counter sale generation:", error);
      setSnackbarMessage("Error during counter sale generation.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
 const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {/* <Navbar pageName="Customer Details" /> */}
  {pageType !== "tab" && <Navbar pageName="Customer Details" />}

      <Box>
        {loading && <Typography>Loading customer details...</Typography>}
        {customer && (
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
                    <h3 style={{ marginLeft: "10px" }}>Customer Details</h3> */}
                  </div>
                  <IconButton
                    color="primary"
                    onClick={() => setCustomerEditModalOpen(true)}
                  >
                    <EditIcon />
                  </IconButton>
                </div>
              </Box>
              <Grid container spacing={2} alignItems="center" paddingLeft={5}>
                {/* Name and Title */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="h3">
  {customer?.customer_name?.slice(0, 15)}
</Typography>

                  <Typography variant="body1">
                    <strong>Phone:</strong>{" "}
                    {/* <a href={`tel://${customer.contact.phone}`}> */}
                    {customer.contact.phone}
                    {/* </a> */}
                  </Typography>
                </Grid>

                {/* Contact Information */}
                <Grid item xs={12} sm={4}>
                  {customer.contact.email ? (
                    <Typography variant="body1">
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${customer.contact.email}`}>
                        {customer.contact.email}
                      </a>
                    </Typography>
                  ) : null}

                  <Typography variant="body1">
                    <strong>Address:</strong> {customer.contact.address.street},
                    {customer.contact.address.city}
                  </Typography>
                  <Typography variant="body1">
                    {customer.contact.address.state}{" "}
                    {customer.contact.address.pinCode
                      ? `- ${customer.contact.address.pinCode}`
                      : ""}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Box paddingX={"2%"}>
              {/* Vehicles */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                width="100%"
              >
                <Typography variant="h5" gutterBottom sx={{ color: "white" }}>
                  Vehicles
                </Typography>
                {/* <Button variant="contained" onClick={() => setModalOpen(true)}>
                  Add Vehicle
                </Button> */}
                <Box display="flex" gap={2}>
                  <Tooltip title="Add Vehicle">
                    <IconButton
                      aria-label="addLead"
                      onClick={() => setModalOpen(true)}
                      sx={{
                        borderRadius: 1,
                        padding: "10px 10px",
                        backgroundColor: "white",
                        "&:hover": {
                          backgroundColor: "white",
                        },
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {/* <Tooltip title="Add Counter Sale">
                    <IconButton
                      aria-label="addCounterSale"
                      onClick={handleAddCounterSale}
                      sx={{
                        borderRadius: 1,
                        padding: "10px 10px",
                        backgroundColor: "white",
                        "&:hover": {
                          backgroundColor: "white",
                        },
                      }}
                    >
                      <PointOfSaleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip> */}
                </Box>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {customer &&
                customer.vehicles &&
                customer.vehicles.length === 0 ? (
                  <motion.div
                    className="box"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "180px",
                        padding: "5%",
                        height: "130px",
                        position: "relative",
                        textAlign: "center",
                        cursor: "pointer",
                        padding: "20px",
                      }}
                      onClick={() => setModalOpen(true)}
                    >
                      <AddIcon sx={{ fontSize: "50px", color: "gray" }} />

                      <Box sx={{ fontSize: "0.9rem" }}>
                        <Typography variant="h5">Add Vehicle</Typography>
                      </Box>
                    </Card>
                  </motion.div>
                ) : (
                  customer?.vehicles?.filter(Boolean)?.map((vehicle) => (
                    <motion.div
                      key={vehicle.vehicle_id || vehicle.plate_number}
                      className="box"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card
                        sx={{
                          width: "180px",
                          padding: "5%",
                          position: "relative",
                          textAlign: "center",
                          cursor: "pointer",
                          padding: "20px",
                        }}
                      >
                        <CardHeader />
                        <Typography variant="h5" component="div">
                          {vehicle?.make || "N/A"}
                        </Typography>
                        <Typography
                          sx={{ color: "text.secondary", mb: 1.5 }}
                          variant="h6"
                        >
                          {vehicle?.model || "N/A"}
                        </Typography>
                        <Box sx={{ fontSize: "0.9rem" }}>
                          <Typography variant="body1">
                            {vehicle?.plateNumber || "N/A"}
                          </Typography>
                        </Box>

                        {/* Appointment button */}
                        <CardActions sx={{ mt: 1 }}>
                          <IconButton
                            sx={{
                              position: "absolute",
                              top: "5px",
                              right: "5px",
                            }}
                            onClick={() => {
                              setSelectedVehicleForSalesType(vehicle);
                              setOpenSalesTypeModal(true);
                            }}
                          >
                            <SummarizeIcon />
                          </IconButton>

                          <Box
                            sx={{
                              position: "absolute",
                              bottom: "5px",
                              right: "5px",
                            }}
                          >
                            <IconButton
                              onClick={() => {
                                editVehicleClick(
                                  setIsEditing,
                                  setModalOpen,
                                  vehicle,
                                  setVehicleId,
                                  setIsPlateNumberHidden,
                                  setFuelType,
                                  setPlateNumber,
                                  setMake,
                                  setModel,
                                  setYear,
                                  setVin,
                                  setEngineNumber,
                                  setChassisNumber,
                                  setRegistrationDate
                                );
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => {
                                setVehicleToDelete(vehicle);
                                setOpenDeleteDialog(true);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </CardActions>
                      </Card>
                    </motion.div>
                  ))
                )}
              </Box>
            </Box>

            {/* Select Sales Type Modal */}
            <Dialog open={openSalesTypeModal} onClose={() => setOpenSalesTypeModal(false)}>
              <DialogContent>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                  <IconButton
                    aria-label="close"
                    onClick={() => setOpenSalesTypeModal(false)}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, mt: 1 }}>
                  Select Sales Type
                </Typography>

                <Box display="flex" gap={2}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={async () => {
                      setOpenSalesTypeModal(false);
                      if (selectedVehicleForSalesType) {
                        await handleAddAppointment(
                          router,
                          token,
                          selectedVehicleForSalesType.vehicle_id,
                          selectedVehicleForSalesType.plateNumber,
                          customer.customer_id,
                          appointmentDate,
                          appointmentTime,
                          setAppointmentDate,
                          setAppointmentTime,
                          status,
                          setStatus,
                          telecaller,
                          notes,
                          setAppointmentId,
                          setTelecaller,
                          setNotes,
                          setAppointmentModalOpen,
                          setSnackbarOpen,
                          setSnackbarMessage,
                          setSnackbarSeverity,
                          setOpenRetryDialog
                        );
                      }
                    }}
                    fullWidth
                  >
                    Appointment
                  </Button>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      setOpenSalesTypeModal(false);
                      if (selectedVehicleForSalesType) {
                        try {
                          const counterSaleData = await generate_counter_for_vehicle(
                            selectedVehicleForSalesType.vehicle_id
                          );
                          if (counterSaleData) {
                            router.push(`/views/shoppingcart/${counterSaleData.appointment_id}`);
                          } else {
                            setSnackbarMessage("Failed to generate counter sale.");
                            setSnackbarSeverity("error");
                            setSnackbarOpen(true);
                          }
                        } catch (error) {
                          console.error("Error during counter sale generation:", error);
                          setSnackbarMessage("Error during counter sale generation.");
                          setSnackbarSeverity("error");
                          setSnackbarOpen(true);
                        }
                      }
                    }}
                    fullWidth
                  >
                    Counter Sales
                  </Button>
                </Box>
              </DialogContent>
            </Dialog>

            {/* Appointment Modal */}
            <Modal
              open={appointmentModalOpen}
              onClose={() => setAppointmentModalOpen(false)}
            >
              <Box
                sx={{
                  width: 400,
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  boxShadow: 24,
                  p: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  margin: "auto",
                  marginTop: "100px",
                  position: "relative",
                }}
              >
                {/* Close Icon */}
                <IconButton
                  onClick={() => setAppointmentModalOpen(false)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                >
                  <CloseIcon />
                </IconButton>

                <Typography variant="h6" component="h2">
                  Add Appointment
                </Typography>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  marginY="normal"
                >
                  <TextField
                    label="Appointment Date"
                    type="date"
                    variant="outlined"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    sx={{ flex: 1, marginRight: "8px" }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  <TextField
                    label="Appointment Time"
                    type="time"
                    variant="outlined"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    sx={{ flex: 1 }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  marginY="normal"
                >
                  <TextField
                    label="Status"
                    variant="outlined"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    sx={{ flex: 1, marginRight: "8px" }}
                  />
                  <TextField
                    label="Telecaller"
                    variant="outlined"
                    value={telecaller}
                    onChange={(e) => setTelecaller(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <TextField
                  label="Notes"
                  variant="outlined"
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button variant="contained" onClick={handleAddAppointment}>
                  Add Appointment
                </Button>
              </Box>
            </Modal>
          </Box>
        )}
      </Box>

      {/* Add / Edit Vehicle Modal */}
      <Dialog
        open={modalOpen}
        // onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="md"
        gap={5}
      >
        <IconButton
          aria-label="close"
          onClick={() => {
            handleCloseModal(
              setIsEditing,
              setModalOpen,
              setIsPlateNumberHidden,
              setFuelType,
              setPlateNumber,
              setMake,
              setModel,
              setYear,
              setVin,
              setEngineNumber,
              setChassisNumber,
              setRegistrationDate
            );
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
            {isEditing ? "Update Vehicle" : "Add Vehicle"}
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FormControlLabel
              sx={{ width: "170px" }}
              control={
                <Checkbox
                  checked={isPlateNumberHidden}
                  // disabled={!isEditing}
                  onChange={(e) => {
                    handleCheckboxChange(
                      e,
                      isPlateNumberHidden,
                      setIsPlateNumberHidden,
                      setPlateNumber,
                      setYear
                    );
                  }}
                />
              }
              label="New vehicle"
              margin="normal"
            />

            <TextField
              required
              label="Vehicle Number"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              // onBlur={validateNumberPlate}
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              style={{ display: isPlateNumberHidden ? "none" : "block" }} // Conditionally hide the text field
            />
          </Box>

          <Box display="flex" alignItems="center" sx={{ mt: 1.5, mb: 1.5 }}>
            <FormControl
              component="fieldset"
              sx={{ display: "flex", flexDirection: "row" }}
            >
              <FormLabel component="legend">Fuel Type*</FormLabel>
              <RadioGroup
                row
                aria-label="fuel type"
                name="fuelType"
                value={fuelType}
                onChange={(e) => {
                  handleFuelTypeChange(e, setFuelType);
                }}
              >
                <FormControlLabel
                  value="Petrol"
                  control={<Radio />}
                  label="Petrol"
                />
                <FormControlLabel
                  value="Diesel"
                  control={<Radio />}
                  label="Diesel"
                />
                <FormControlLabel
                  value="EV"
                  control={<Radio />}
                  label="EV"
                />
                 <FormControlLabel
                  value="Helmet"
                  control={<Radio />}
                  label="Helmet"
                />
              </RadioGroup>
            </FormControl>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            flexWrap="wrap"
            paddingBottom={2}
            gap={2}
          >
            {/*  Make Dropdown - FIXED */}
            <Autocomplete
              options={makes.map((item) => item.make_name || "")}
              onChange={(event, value) => handleMakeChange(value)}
              value={make || ""}
              freeSolo
              fullWidth
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Make*"
                  size="small"
                  required
                  onChange={(e) => {
                    if (e.target.value) setMake(e.target.value);
                  }}
                />
              )}
              onInputChange={(event, newInputValue) => {
                setMake(newInputValue);
              }}
            />

            {/*  Model Dropdown - FIXED */}
            <Autocomplete
              options={Array.isArray(models) ? models : []}
              onChange={(event, value) => setModel(value)}
              value={model || ""}
              freeSolo
              fullWidth
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Model*"
                  size="small"
                  required
                  onChange={(e) => {
                    if (e.target.value) setModel(e.target.value);
                  }}
                />
              )}
              onInputChange={(event, newInputValue) => {
                setModel(newInputValue);
              }}
            />

            {/*  Variant Field */}
            <TextField
            
              label="Variant"
              size="small"
              variant="outlined"
              fullWidth
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
            <TextField
              required
              label="Registration Date"
              type="date"
              size="small"
              variant="outlined"
              value={registrationDate || ""}
              onChange={(e) => setRegistrationDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                width: "33.33%",
                "& .MuiFormLabel-asterisk": {
                  display: "none", // Hide the asterisk
                },
              }}
              // sx={{ width: "33.33%" }} //  1/3 width
            />

            <TextField
              required
              label="Chassis Number"
              size="small"
              variant="outlined"
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
              sx={{
                width: "33.33%",
                "& .MuiFormLabel-asterisk": {
                  display: "none", // Hide the asterisk
                },
              }} //  1/3 width
            />
            <TextField
              required
              label="Engine Number"
              size="small"
              variant="outlined"
              value={engineNumber}
              onChange={(e) => setEngineNumber(e.target.value)}
              sx={{
                width: "33.33%",
                "& .MuiFormLabel-asterisk": {
                  display: "none", // Hide the asterisk
                },
              }} //  1/3 width
            />
          </Box>

          <Box display="flex" justifyContent="space-between" marginY="normal">
            <TextField
              required
              label="Year"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={year || ""}
              onChange={(e) => setYear(e.target.value)}
              sx={{ flex: 1, marginRight: "8px" }}
            />
          </Box>
        </DialogContent>
        <div style={{ marginLeft: "100px" }}>
          {errorMessage && (
            <Typography color="error">{errorMessage}</Typography>
          )}
        </div>
        <DialogActions>
          <Button
            onClick={() => {
              setModalOpen(false);
              handleCloseModal(
                setIsEditing,
                setModalOpen,
                setIsPlateNumberHidden,
                setFuelType,
                setPlateNumber,
                setMake,
                setModel,
                setYear,
                setVin,
                 setEngineNumber,
              setChassisNumber,
              setRegistrationDate
              );
            }}
            color="primary"
          >
            Cancel
          </Button>

          {isEditing ? (
            <Button
              variant="contained"
              onClick={() => {
                updateVehicle(
                  token,
                  customer.customer_id,
                  vehicleId,
                  setCustomer,
                  isPlateNumberHidden,
                  setIsPlateNumberHidden,
                  fuelType,
                  setFuelType,
                  plateNumber,
                  setPlateNumber,
                  make,
                  setMake,
                  model,
                  setModel,
                  year,
                  setYear,
                  vin,
                  setVin,
                  setSnackbarOpen,
                  setSnackbarMessage,
                  setSnackbarSeverity,
                  setModalOpen,
                   registrationDate,
                  chassisNumber,     
                  engineNumber, 
               
                  setGstCustomer,
                  setGstNumber,
                  setLoading,
                  setError,
                  setCustomerName,
                  setPrefix,
                  setPhone,
                  setEmail,
                  setStreet,
                  setCity,
                  setState,
                  setPinCode,
                  setRefer,
                  setReferBy,
                  setRegistrationDate,
                  setChassisNumber,
                  setEngineNumber,
                  setLeadOwner
                );
              }}
              color="primary"
            >
              Update Vehicle
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => {
                handleAddVehicle(
                  token,
                  customer.customer_id,
                  setCustomer,
                  isPlateNumberHidden,
                  setIsPlateNumberHidden,
                  fuelType,
                  setFuelType,
                  plateNumber,
                  setPlateNumber,
                  make,
                  setMake,
                  model,
                  setModel,
                  year,
                  setYear,
                  vin,
                  setVin,
                  setSnackbarOpen,
                  setSnackbarMessage,
                  setSnackbarSeverity,
                  setOpenRetryDialog,
                  setAppointmentId,
                  setModalOpen,
                  setRegistrationDate,
                  setChassisNumber,
                  setEngineNumber,
                  registrationDate,
                  chassisNumber,
                  engineNumber
                );
              }}
              color="primary"
            >
              Add Vehicle
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog
        open={customerEditModalOpen}
        // onClose={() => setCustomerEditModalOpen(false)}
        fullWidth
        maxWidth="md"
        gap={5}
      >
        <IconButton
          aria-label="close"
          onClick={() => {
            handleCloseCustomerEditModal(setCustomerEditModalOpen);
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
            Edit Customer Details
          </Typography>

          {/* GST Checkbox */}
          <Box display="flex" alignItems="center" mb={2} width="100%">
            {/* Left side: Checkbox & Label */}
            <Box display="flex" alignItems="center" width="50%">
              <Checkbox
                onChange={() => setGstCustomer(!gstCustomer)}
                checked={gstCustomer}
              />
              <Typography>GST Customer?</Typography>
            </Box>

            {/* Right side: Autocomplete */}
            <Box width="50%">
              <Autocomplete
                size="small"
                disablePortal
                options={addcustomerssOptions}
                getOptionLabel={(option) => option?.name || ""}
                isOptionEqualToValue={(option, value) =>
                  option?.name === value?.name
                }
                onChange={(event, newValue) => {
                  setFormData((prevData) => ({
                    ...prevData,
                    leads_owner: newValue ? newValue.userid : "",
                  }));
                }}
                value={
                  addcustomerssOptions.find(
                    (option) => option.userid === formData.leads_owner
                  ) || null
                }
                sx={{ width: "50%" }}
                renderInput={(params) => (
                  <TextField {...params} label="Leads Owner" />
                )}
              />
            </Box>
          </Box>

          {/* Prefix, Customer Name, GST Fields */}
          <Box display="flex" gap={1} alignItems="center">
            {/* Prefix Field */}
            <Autocomplete
              options={prefixOptions}
              getOptionLabel={(option) => option?.name || ""} // Handle null safely
              isOptionEqualToValue={(option, value) =>
                option?.name === value?.name
              }
              onChange={(e, value) => setPrefix(value)} // Updates state on selection
              value={prefix} // Shows selected value if exists, else empty
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Prefix"
                  size="small"
                  required
                  fullWidth
                />
              )}
              sx={{ width: gstCustomer ? "30%" : "50%" }} // Dynamic width
            />
            {/* Customer Name Field */}
            <TextField
              required
              label="Customer Name"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              sx={{ width: gstCustomer ? "40%" : "50%" }} // Dynamic width
            />

            {/* GST Number Field - Show only if gstCustomer is true */}
            {gstCustomer && (
              <TextField
                required
                label="GST Number"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                sx={{ width: "30%" }}
              />
            )}
          </Box>

          {/* Phone & Email Fields */}
          <Box display="flex" justifyContent="space-between" marginY="normal">
            <TextField
              required
              label="Phone Number"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              sx={{ flex: 1, marginRight: "8px" }}
            />

            <TextField
              label="E-Mail"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* State & City Fields */}
          <Box display="flex" justifyContent="space-between" marginY="normal">
            <Autocomplete
              options={states}
              getOptionLabel={(option) => option.label}
              onChange={handleStateChange}
              value={selectedState}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="State"
                  size="small"
                  required
                  fullWidth
                />
              )}
              sx={{ flex: 1, marginRight: "8px" }}
            />
            <Autocomplete
              options={cities}
              onChange={handleCityChange}
              value={selectedCity}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="City"
                  size="small"
                  required
                  fullWidth
                />
              )}
              disabled={!selectedState}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Street & Pin Code Fields */}
          <Box display="flex" justifyContent="space-between" marginY="normal">
            <TextField
              label="Street"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              sx={{ flex: 1, marginRight: "8px" }}
            />

            <TextField
              label="Pin Code"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Reference Fields */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            marginY="normal"
            paddingBottom={2}
            gap={1}
          >
            <Autocomplete
              options={references}
              onChange={(e, value) => setRefer(value?.label || "")}
              value={references.find((ref) => ref.label === refer) || null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Reference"
                  size="small"
                  required
                  fullWidth
                />
              )}
              sx={{ flex: 1 }}
            />
            {refer === "Customer reference" && (
              <TextField
                label="Referred By"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                value={referBy}
                onChange={(e) => {
                  setReferBy(e.target.value);
                }}
                sx={{ flex: refer === "Customer reference" ? 1 : 0 }}
              />
            )}
          </Box>
        </DialogContent>

        <div style={{ marginLeft: "100px" }}>
          {errorMessage && (
            <Typography color="error">{errorMessage}</Typography>
          )}
        </div>
        <DialogActions>
          <Button
            onClick={() =>
              handleCloseCustomerEditModal(setCustomerEditModalOpen)
            }
            color="primary"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // console.log({ customer });
              handleCustomerUpdate();
            }}
            // onClick={handleCustomerUpdate}
            color="primary"
          >
            Update Customer
          </Button>
        </DialogActions>
      </Dialog>

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
          Vehicle Already Registered
        </DialogTitle>
        <DialogContent>
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
                // console.log("No appointment ID available for redirection");
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

      {/* ConformationDialogue component */}
      <ConformationDialogue
        openConformationModal={openDeleteDialog}
        setOpenConformationModal={setOpenDeleteDialog}
        details={{
          name: "Vehicle",
          action: "delete",
        }}
        selectedRow={vehicleToDelete}
        deleteurl={`${process.env.NEXT_PUBLIC_API_URL}/customer/vehicle`}
        deleteMethod="DELETE"
        onDeleteSuccess={(deletedId) => {
          setCustomer((prev) => ({
            ...prev,
            vehicles: prev.vehicles.filter((v) => v.vehicle_id !== deletedId),
          }));
          setSnackbarMessage("Vehicle deleted successfully");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        }}
      />
    </div>
  );
}
