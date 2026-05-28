"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

import {
  Box,
  Typography,
  Modal,
  TextField,
  Button,
  Autocomplete,
  Snackbar,
  Alert,
  Grid,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: 600,
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  p: 4,
};

const prefixOptions = [
  { name: "Mr." },
  { name: "Ms." },
  { name: "Mrs." },
  { name: "M/S" },
];

export default function OneTimeCustomerModal({
  open,
  onClose,
  onSuccess,
}) {
  const [token, setToken] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  const [selectedPrefix, setSelectedPrefix] = useState(null);
  const [isPlateNumberHidden, setIsPlateNumberHidden] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    prefix: "",
    plate_number: "",
    phone: "",
  });

  useEffect(() => {
    const storedToken = Cookies.get("token");

    setToken(storedToken);
  }, []);


  const handleInputChange = (key, value) => {
    if (key.toLowerCase().includes("name")) {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    }

    if (key.toLowerCase().includes("phone")) {
      value = value.replace(/[^0-9]/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const generateRandomPhone = () => {
    const randomSuffix = Math.random().toString().slice(2, 6).padStart(4, "0");
    return `99999${randomSuffix}`;
  };

  const handleSave = async () => {
    const errors = [];

    // Validation for required fields
    if (!selectedPrefix) {
      errors.push("Prefix is required");
    }

    if (!formData.customer_name) {
      errors.push("Customer Name is required");
    }

    if (!isPlateNumberHidden && !formData.plate_number) {
      errors.push("Plate Number is required");
    }

    if (errors.length > 0) {
      setSnackbarMessage(errors.join(", "));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const phoneNumber = formData.phone || generateRandomPhone();

    const customerData = {
      customer_name: formData.customer_name,
      prefix: selectedPrefix ? selectedPrefix.name : "",
      phone: phoneNumber,
      plate_number: formData.plate_number,
      new_vehicle: isPlateNumberHidden,
      one_time: true,
    };

    try {
      // Create customer
      const customerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerData),
        }
      );

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        throw new Error(errorData.error || "Failed to create customer");
      }

      const customerResult = await customerResponse.json();

      setSnackbarMessage("One-Time Customer created successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      if (onSuccess) {
        onSuccess(customerResult);
      }

      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error saving customer:", error);
      setSnackbarMessage(error.message || "Error creating customer");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: "",
      prefix: "",
      plate_number: "",
      phone: "",
    });
    setSelectedPrefix(null);
    setIsPlateNumberHidden(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="one-time-customer-title"
      >
        <Box sx={style}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Checkbox checked disabled />
            <Typography
              id="one-time-customer-title"
              variant="h5"
              component="h2"
              sx={{
                fontWeight: "bold",
                fontSize: "1.3rem",
                color: "#1976d2",
              }}
            >
              One Time Customer
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: "1rem",
              color: "#1976d2",
              fontWeight: "600",
              mb: 2,
            }}
          >
            One Time Customer Mode Enabled
          </Typography>

          <Typography
            sx={{
              fontSize: "0.9rem",
              color: "#999",
              mb: 3,
            }}
          >
            Please enter the customer details.
          </Typography>

          {/* Form Content */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  size="small"
                  disablePortal
                  options={prefixOptions}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.name === value?.name
                  }
                  onChange={(event, newValue) => {
                    setSelectedPrefix(newValue);
                    handleInputChange("prefix", newValue ? newValue.name : "");
                  }}
                  value={selectedPrefix}
                  renderInput={(params) => (
                    <TextField {...params} label="Prefix *" required />
                  )}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  label="Customer Name *"
                  variant="outlined"
                  fullWidth
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    handleInputChange("customer_name", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  label="Phone Number"
                  variant="outlined"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  helperText="Optional - will auto-generate if empty"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isPlateNumberHidden}
                      onChange={(e) => {
                        setIsPlateNumberHidden(e.target.checked);
                        if (e.target.checked) {
                          handleInputChange("plate_number", "");
                        }
                      }}
                    />
                  }
                  label="New Vehicle (No Number Plate)"
                />
              </Grid>

              {!isPlateNumberHidden && (
                <Grid item xs={12}>
                  <TextField
                    size="small"
                    label="Plate Number *"
                    variant="outlined"
                    fullWidth
                    required
                    value={formData.plate_number}
                    onChange={(e) =>
                      handleInputChange("plate_number", e.target.value.toUpperCase())
                    }
                  />
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              mt: 4,
            }}
          >
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
              sx={{
                textTransform: "none",
                fontWeight: "600",
                borderRadius: "8px",
                padding: "10px 24px",
              }}
            >
              FINISH
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
