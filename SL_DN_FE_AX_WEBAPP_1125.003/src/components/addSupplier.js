"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";

// UI package imports - Alphabetical
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { Theme, useTheme } from "@mui/material/styles";
import { SelectChangeEvent } from "@mui/material/Select";
import { Country, State, City } from "country-state-city";

// Constants
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

// Helper functions
const getStyles = (name, personName, theme) => {
  return {
    fontWeight: personName.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
};

export default function AddSupplier({
  initialData,
  onSuccess,
  onClose,
  typedname,
  setTypedname,
}) {
  // Frontend extracted data states
  const router = useRouter();
  const theme = useTheme();

  // Modal and Alert states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [errorMessage, setErrorMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Frontend form input states
  const [supplierName, setsupplierName] = useState(
    initialData?.supplier_name || ""
  );
  const [gstNumber, setGstNumber] = useState(initialData?.gst_number || "");
  const [phone, setPhone] = useState(initialData?.contact?.phone || "");
  const [email, setEmail] = useState(initialData?.contact?.email || "");
  const [street, setStreet] = useState(
    initialData?.contact?.address?.street || ""
  );
  const [city, setCity] = useState(initialData?.contact?.address?.city || "");
  const [state, setState] = useState(
    initialData?.contact?.address?.state || ""
  );
  const [zip, setZip] = useState(initialData?.contact?.address?.zip || "");
  const [gstsupplier, setGstsupplier] = useState(false);
  const [personName, setPersonName] = React.useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [telecaller, setTelecaller] = useState("self");
  const [notes, setNotes] = useState("");
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [outstanding, setOutstanding] = useState();

  // // Backend Data states
  // const [existingProducts, setExistingProducts] = useState([
  //   {
  //     inventory_id: "INVT-100",
  //     part_name: "Air Filer",
  //     part_number: "1234590",
  //     description: "Filters air",
  //     category: "Spares",
  //     quantity: "100",
  //     price: "200",
  //   },
  //   {
  //     inventory_id: "INVT-101",
  //     part_name: "Seat Cover",
  //     part_number: "1234510",
  //     description: "Covers Seat",
  //     category: "Accessories",
  //     quantity: "50",
  //     price: "1500",
  //   },
  // ]);

  // UI position states
  const [snackbarPosition] = useState({
    vertical: "bottom",
    horizontal: "right",
  });

  // Functions that has to be in the same file
  const validateStep = () => {
    console.log(phone, supplierName);
  };

  const handleFinish = async (
    phone,
    email,
    supplierName,
    street,
    zip,
    gstNumber,
    gstsupplier,
    outstanding
  ) => {
    const gstPattern =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    const errorMessages = [];
    const indianPhoneRegex =
      /^(\+91|91)?\s?-?\(?[6-9]\d{2}\)?\s?-?\d{3}\s?-?\d{4}$/;

    const onlyAlphabets = /^[a-zA-Z\s]+$/;

    const numberOnly = /^[0-9]{6}$/;

    const streetValid = /^[a-zA-Z0-9\s,/-]*$/;

    const emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!phone || !indianPhoneRegex.test(phone)) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Invalid phone number");
    } else if (!supplierName || !onlyAlphabets.test(supplierName)) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Only alphabets are allowed for supplier name.");
    } else if (email && !emailValid.test(email)) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Invalid email address");
    } else if (zip && !numberOnly.test(zip)) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Please enter a valid 6-digit pincode");
    } else if (!street || !streetValid.test(street)) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Invalid characters in street name");
    } else if (gstsupplier && !gstPattern.test(gstNumber)) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Invalid GST Number");
    } else {
      const supplierData = {
        supplier_name: supplierName,
        gst_number: gstNumber || "",
        contact: {
          phone: phone,
          email: email,
          address: {
            street: street,
            city: selectedCity ? selectedCity.name : "",
            state: selectedState ? selectedState.name : "",
            zip: zip,
          },
        },
      };

      const token = Cookies.get("token");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/supplier`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(supplierData),
          }
        );

        const result = await response.json();
        console.log({ status: result });
        // if (!response.ok) {
        //   throw new Error(`Error: ${response.statusText}`);
        // }

        if (result.error) {
          setSnackbarMessage(result.error);
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        } else {
          // setsupplierId(result.supplier_id);
          // Reset all state variables to their initial values
          setActiveStep(0);
          // setFirstName("");
          // setLastName("");
          setsupplierName("");
          setPhone("");
          setEmail("");
          setStreet("");
          setCity("");
          setState("");
          setZip("");

          if (onSuccess) {
            if (outstanding && outstanding > 0) {
              const ledgerData = {
                customer_id: result.supplier_id,
                creation_date: new Date().toISOString().split("T")[0],
                expense_type: "Credit",
                type: "supplier",
                description: `Outstanding amount for supplier #${result.supplier_id}`,
                credit: outstanding,
                debit: null,
              };
              console.log({ ledgerData });
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/finance/post_ledger`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(ledgerData),
                }
              );
            }
            onSuccess();
          }
          // handleAddAppointment(result.supplier_id);
          setSnackbarMessage("Supplier added successfully!");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);

          if (onClose) onClose();
        }
      } catch (error) {
        console.log("Failed to send supplier data: ", error);
        setOpenSnackbar(true);
        setSnackbarMessage(error);
        setSnackbarSeverity("error");
      }
    }
  };

  const handlePhoneChange = (e) => {
    const newValue = e.target.value.replace(/\D/g, "");
    if (newValue.length <= 10) {
      setPhone(newValue);
    }
  };

  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);
  };

  const handleEmailBlur = () => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (email && !emailPattern.test(email)) {
      setErrorMessage("Improper Email format");
    } else {
      setErrorMessage("");
    }
  };

  const handleAddAppointment = async (custId) => {
    const appointmentPayload = {
      supplier_id: custId,
      // vehicle_id: plateNumber,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status,
      telecaller,
      notes,
    };

    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(appointmentPayload),
        }
      );

      const data = await response.json();

      // Log response data to ensure appointment_id is in the response
      console.log("API Response Data:", data);
      const AppointmentId = data.AppointmentsArray.appointment_id;
      console.log("Apmid", AppointmentId);
      router.push(`/views/jobCard/${AppointmentId}`);
    } catch (err) {
      // setError(err.message);
      setSnackbarMessage("Failed to add appointment. Please try again.");
    }
  };

  // useEffect and other React Hooks
  useEffect(() => {
    const now = new Date();
    setAppointmentDate(now.toISOString().split("T")[0]);
    setAppointmentTime(now.toTimeString().slice(0, 5));
    setsupplierName(supplierName || typedname || "");
    setTypedname(supplierName || typedname || "");
  });

  // UI Code
  return (
    <div>
      <Box marginTop="1rem" style={{ overflowY: "auto" }}>
        <div>
          <h1>Add New supplier</h1>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <Typography>Is supplier Entitled for GST?</Typography>
            <Checkbox
              checked={gstsupplier}
              size="small"
              onChange={(event) => {
                setGstsupplier(event.target.checked);
              }}
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
              value={supplierName || typedname}
              onChange={(e) => {
                const newValue = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                setsupplierName(newValue);
                setTypedname(e.target.value);
              }}
            />
            {gstsupplier && (
              <TextField
                required
                label="GST Number"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
              />
            )}
          </div>

          <Box display="flex" justifyContent="space-between" marginY="normal">
            <TextField
              required
              label="Phone"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={phone}
              onChange={handlePhoneChange}
              inputProps={{ maxLength: 10 }}
              sx={{ flex: 1, marginRight: "8px" }}
            />
            <TextField
              label="Email"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              sx={{ flex: 1, marginTop: "16px" }}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" marginY="normal">
            <Box sx={{ display: "flex", flex: 1 }}>
              <TextField
                required
                label="Street"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                value={street}
                onChange={(e) => {
                  const newValue = e.target.value.replace(
                    /[^a-zA-Z0-9\s,/-]/g,
                    ""
                  );
                  setStreet(newValue);
                }}
                sx={{ flex: 1, marginRight: "8px" }}
              />
            </Box>

            {/* <Box sx={{ flex: 1, marginRight: "8px" }}>
              
            </Box> */}

            <Box sx={{ flex: 1, marginLeft: "8px" }}>
              <Autocomplete
                options={State.getStatesOfCountry("IN")}
                getOptionLabel={(option) => option.name}
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
                  />
                )}
              />
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" marginY="normal">
            <Box sx={{ display: "flex", flex: 1 }}>
              <Box sx={{ flex: 1, marginRight: "8px" }}>
                <Autocomplete
                  options={City.getCitiesOfState(
                    "IN",
                    selectedState?.isoCode || ""
                  )}
                  getOptionLabel={(option) => option.name}
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
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Pincode"
                  size="small"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={zip}
                  onChange={(e) => {
                    const newValue = e.target.value.replace(/\D/g, "");
                    if (newValue.length <= 6) {
                      setZip(newValue);
                    }
                  }}
                  inputProps={{ maxLength: 6 }}
                />
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TextField
              label="Outstanding Amount"
              size="small"
              variant="outlined"
              fullWidth
              margin="normal"
              value={outstanding || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  // Only digits allowed
                  setOutstanding(value);
                }
              }}
            />
          </Box>
        </div>
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
      <Box display="flex" justifyContent="flex-end" marginTop="1rem" gap="1rem">
        <Button
          variant="contained"
          onClick={() =>
            handleFinish(
              phone,
              email,
              supplierName,
              street,
              zip,
              gstNumber,
              gstsupplier,
              outstanding
            )
          }
        >
          Finish
        </Button>
        {/* Cancel Button */}
        <Button
          variant="outlined"
          onClick={() => onClose()} // Close the modal on click
        >
          Cancel
        </Button>
      </Box>
    </div>
  );
}
