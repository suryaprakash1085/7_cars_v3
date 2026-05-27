"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Autocomplete,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Cookies from "js-cookie";
import { Close } from "@mui/icons-material";

const steps = ["Customer Details", "Vehicle Details"];

const prefixOptions = [
  { name: "Mr." },
  { name: "Ms." },
  { name: "Mrs." },
  { name: "M/S" },
];

export default function EditCustomerModal({
  open,
  onClose,
  customer,
  vehicleId,
  onSuccess,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  // Customer form states
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [prefix, setPrefix] = useState(null);
  const [gstNumber, setGstNumber] = useState("");

  // Vehicle form states
  const [plateNumber, setPlateNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");

  // State/City data
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateCityData, setStateCityData] = useState({});
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Vehicle make/model data
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);

  // Get the selected vehicle
  const selectedVehicle = customer?.vehicles?.find(
    (v) => v.vehicle_id === vehicleId
  );

  useEffect(() => {
    if (customer) {
      // Populate customer fields
      setCustomerName(customer.customer_name || "");
      setPhone(customer.contact?.phone || "");
      setEmail(customer.contact?.email || "");
      setStreet(customer.contact?.address?.street || "");
      setCity(customer.contact?.address?.city || "");
      setState(customer.contact?.address?.state || "");
      setPinCode(customer.contact?.address?.pinCode || "");
      setPrefix(
        prefixOptions.find((p) => p.name === customer.prefix) || null
      );
      setGstNumber(customer.gst_number || "");

      // Populate vehicle fields
      if (selectedVehicle) {
        setPlateNumber(
          selectedVehicle.plateNumber || selectedVehicle.plate_number || ""
        );
        setMake(selectedVehicle.make || "");
        setModel(selectedVehicle.model || "");
        setYear(selectedVehicle.year?.toString() || "");
        setVin(selectedVehicle.vin || "");
        setFuelType(selectedVehicle.fuelType || "");
        setRegistrationDate(selectedVehicle.registrationDate || "");
        setChassisNumber(selectedVehicle.chassisNumber || "");
        setEngineNumber(selectedVehicle.engineNumber || "");
      }

      // Set state/city
      setSelectedState(customer.contact?.address?.state || "");
      setSelectedCity(customer.contact?.address?.city || "");
    }
  }, [customer, selectedVehicle, open]);

  // Fetch state/city data
  useEffect(() => {
    const fetchStateCityData = async () => {
      try {
        const token = Cookies.get("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/citystate`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch state/city data");
        const data = await response.json();
        setStateCityData(data);
        setStates(Object.keys(data));
      } catch (error) {
        console.error("Error fetching state/city data:", error);
      }
    };
    fetchStateCityData();
  }, []);

  // Fetch vehicle makes/models
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = Cookies.get("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/vehicles`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch vehicles");
        const data = await response.json();
        const makesData = data.map((item) => ({
          id: item.id,
          make_name: item.make_name,
          models: item.models.split(","),
        }));
        setMakes(makesData);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };
    fetchVehicles();
  }, []);

  // Update models when make changes
  useEffect(() => {
    if (make) {
      const selectedMake = makes.find((m) => m.make_name === make);
      if (selectedMake) {
        setModels(selectedMake.models);
      }
    }
  }, [make, makes]);

  // Update cities when state changes
  const handleStateChange = (event, value) => {
    setSelectedState(value);
    setState(value || "");
    if (value && stateCityData[value]) {
      setCities(stateCityData[value]);
    } else {
      setCities([]);
    }
    setSelectedCity(null);
  };

  const handleCityChange = (event, value) => {
    setSelectedCity(value);
    setCity(value || "");
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!customerName) {
        setSnackbarMessage("Customer Name is required");
        setSnackbarOpen(true);
        return false;
      }
      if (phone && phone.length !== 10) {
        setSnackbarMessage("Phone number must be 10 digits");
        setSnackbarOpen(true);
        return false;
      }
      if (!street) {
        setSnackbarMessage("Street is required");
        setSnackbarOpen(true);
        return false;
      }
      if (!city) {
        setSnackbarMessage("City is required");
        setSnackbarOpen(true);
        return false;
      }
      if (!state) {
        setSnackbarMessage("State is required");
        setSnackbarOpen(true);
        return false;
      }
    } else if (activeStep === 1) {
      if (!make) {
        setSnackbarMessage("Make is required");
        setSnackbarOpen(true);
        return false;
      }
      if (!model) {
        setSnackbarMessage("Model is required");
        setSnackbarOpen(true);
        return false;
      }
      if (!fuelType) {
        setSnackbarMessage("Fuel Type is required");
        setSnackbarOpen(true);
        return false;
      }
      if (year) {
        const yearPattern = /^\d{4}$/;
        const currentYear = new Date().getFullYear();
        if (!yearPattern.test(year) || parseInt(year) > currentYear) {
          setSnackbarMessage("Please enter a valid year");
          setSnackbarOpen(true);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSave = async () => {
    if (!validateStep()) {
      return;
    }

    setLoading(true);
    const token = Cookies.get("token");

    try {
      // Update customer with flat structure matching database schema
      const customerUpdateData = {
        customer_name: customerName,
        prefix: prefix?.name || "",
        gst_number: gstNumber,
        phone: phone,
        email: email,
        street: street,
        city: city,
        state: state,
        pin_code: pinCode,
      };

      const customerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/${customer.customer_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerUpdateData),
        }
      );

      if (!customerResponse.ok) {
        throw new Error("Failed to update customer");
      }

      // Update vehicle if selected vehicle exists
      if (selectedVehicle && selectedVehicle.vehicle_id) {
        const vehicleUpdateData = {
          customer_id: customer.customer_id,
          vehicles: [
            {
              plate_number: plateNumber,
              make: make,
              model: model,
              year: year ? parseInt(year) : null,
              vin: vin,
              fuel_type: fuelType,
              registration_date: registrationDate,
              chassis_number: chassisNumber,
              engine_number: engineNumber,
            }
          ]
        };

        const vehicleResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/customer/vehicle/${selectedVehicle.vehicle_id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(vehicleUpdateData),
          }
        );

        if (!vehicleResponse.ok) {
          throw new Error("Failed to update vehicle");
        }
      }

      setSnackbarMessage("Customer and vehicle updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // Close modal and notify parent
      setTimeout(() => {
        setActiveStep(0);
        onClose();
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Error updating customer/vehicle:", error);
      setSnackbarMessage(error.message || "Failed to update customer/vehicle");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        Edit Customer Details
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ minWidth: "auto", padding: 0 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ width: "100%", pt: 2 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ pt: 3, pb: 2 }}>
            {activeStep === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Autocomplete
                  options={prefixOptions}
                  getOptionLabel={(option) => option.name}
                  value={prefix}
                  onChange={(event, newValue) => setPrefix(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Prefix" />
                  )}
                />
                <TextField
                  label="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  fullWidth
                />
                <Autocomplete
                  options={states}
                  value={selectedState}
                  onChange={handleStateChange}
                  renderInput={(params) => (
                    <TextField {...params} label="State" />
                  )}
                />
                <Autocomplete
                  options={cities}
                  value={selectedCity}
                  onChange={handleCityChange}
                  renderInput={(params) => (
                    <TextField {...params} label="City" />
                  )}
                />
                <TextField
                  label="Pin Code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="GST Number"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  fullWidth
                />
              </Box>
            )}

            {activeStep === 1 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Autocomplete
                  options={makes.map((m) => m.make_name)}
                  value={make}
                  onChange={(event, newValue) => setMake(newValue || "")}
                  renderInput={(params) => (
                    <TextField {...params} label="Make" />
                  )}
                />
                <Autocomplete
                  options={models}
                  value={model}
                  onChange={(event, newValue) => setModel(newValue || "")}
                  renderInput={(params) => (
                    <TextField {...params} label="Model" />
                  )}
                />
                <TextField
                  label="Plate Number"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  fullWidth
                />
                <Autocomplete
                  options={[
                    "Petrol",
                    "Diesel",
                  ]}
                  value={fuelType}
                  onChange={(event, newValue) => setFuelType(newValue || "")}
                  renderInput={(params) => (
                    <TextField {...params} label="Fuel Type" />
                  )}
                />
                <TextField
                  label="Year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="VIN"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Registration Date"
                  type="date"
                  value={registrationDate}
                  onChange={(e) => setRegistrationDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Chassis Number"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Engine Number"
                  value={engineNumber}
                  onChange={(e) => setEngineNumber(e.target.value)}
                  fullWidth
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 && (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={loading}
          >
            Next
          </Button>
        )}
        {activeStep === steps.length - 1 && (
          <Button
            onClick={handleSave}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        )}
      </DialogActions>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <MuiAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Dialog>
  );
}
