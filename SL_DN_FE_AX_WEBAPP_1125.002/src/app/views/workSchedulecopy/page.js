"use client";
import React, { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Checkbox,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import Navbar from "@/components/navbar";
import Cookies from "js-cookie";

// const roleOptions = ["Admin", "ServiceCenter", "FrontDesk", "Supervisor"];

export default function UserRegistration({ onRegistrationComplete }) {
  const [roles, setRoles] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [buttonStatus, setButtonStatus] = useState("y");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/roles`
        );
        const data = await response.json();
        console.log("data:", data);
        setRoles(data);
        setRoleOptions(data.map((role) => role.role_name));
      } catch (error) {
        console.log("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    role: "",
    firstName: "",
    lastName: "",
    phone: "",
    emergencyContact: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    aadharCardNumber: "",
    panCardNumber: "",
    dateOfBirth: "",
    dateOfJoining: "",
    dateOfLeaving: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const onlyAlphabets = /^[a-zA-Z\s]*$/; // Allow only alphabets and spaces

    if (name === "phone") {
      const numbersOnly = value.replace(/[^0-9]/g, "");
      if (numbersOnly.length <= 10) {
        setFormData((prev) => ({
          ...prev,
          [name]: numbersOnly,
        }));
      }
    } else if (
      (name === "firstName" || name === "lastName") &&
      !onlyAlphabets.test(value)
    ) {
      // Do nothing if the input is invalid
      return;
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const isFormValid = () => {
    const {
      firstName,
      lastName,
      phone,
      email,
      role,
      emergencyContact,
      emergencyContactName,
      aadharCardNumber,
      panCardNumber,
      dateOfJoining
    } = formData;
    return (
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      phone.trim() !== "" &&
      email.trim() !== "" &&
      role.trim() !== "" &&
      emergencyContact.trim() !== "" &&
      emergencyContactName.trim() !== "" &&
      aadharCardNumber.trim() !== "" &&
      panCardNumber.trim() !== "" &&
      dateOfJoining.trim() !== ""
    );
  };

  const getMissingFields = () => {
    const {
      firstName,
      lastName,
      phone,
      email,
      emergencyContact,
      emergencyContactName,
      emergencyContactRelationship,
      dateOfJoining
    } = formData;
    const missingFields = [];
    if (firstName.trim() === "") missingFields.push("First Name");
    if (lastName.trim() === "") missingFields.push("Last Name");
    if (phone.trim() === "") missingFields.push("Phone");
    if (email.trim() === "") missingFields.push("Email");
    if (emergencyContact.trim() === "") missingFields.push("Emergency Contact");
    if (emergencyContactName.trim() === "") missingFields.push("Emergency Contact Name");
    if (emergencyContactRelationship.trim() === "") missingFields.push("Emergency Contact Relationship");
    if (dateOfJoining.trim() === "") missingFields.push("Date of Joining");
    return missingFields;
  };

  const handleUserRegistration = async () => {
    const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailPattern.test(formData.email)) {
      setSnackbar({
        open: true,
        message: "Please enter a valid email address",
        severity: "warning",
      });
      return;
    }

    const missingFields = getMissingFields();
    if (missingFields.length > 0) {
      setSnackbar({
        open: true,
        message: `Please fill in the following fields: ${missingFields.join(
          ", "
        )}`,
        severity: "warning",
      });
      return;
    }

    const dataToSend = { ...formData, button_status: buttonStatus };

    // try {
    //   const response = await fetch(
    //     `${process.env.NEXT_PUBLIC_API_URL}/auth/create/employee`,
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify(dataToSend),
    //     }
    //   );
    //   const data = await response.json();
    //   setSnackbar({
    //     open: true,
    //     message: "User registered successfully",
    //     severity: "success",
    //   });
    //   if (onRegistrationComplete) {
    //     setTimeout(() => {
    //       onRegistrationComplete();
    //     }, 2000);
    //   }
    // } catch (error) {
    //   console.log("Registration error:", error);
    //   setSnackbar({
    //     open: true,
    //     message: "Failed to register user",
    //     severity: "error",
    //   });
    // }
    console.log("dataToSend:", dataToSend);
  };

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setButtonStatus(value);
    if (value === "y") {
      setFormData((prev) => ({
        ...prev,
        role: "Mechanic",
      }));
    } else if (value === "z") {
      setFormData((prev) => ({
        ...prev,
        role: "Employee",
      }));
    }
  };
  const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {/* <Navbar pageName="Employee Registration" /> */}
      {pageType !== "tab" && <Navbar pageName="Employee Registration" />}
      <Box
        sx={{ padding: "20px", backgroundColor: "#f0f0f0", marginTop: "50px" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: 2,
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ mb: 3, fontSize: { xs: "1.5rem", md: "2rem" } }}
            >
              Employee Registration
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Cancel">
              <IconButton
                variant="contained"
                onClick={() => onRegistrationComplete()}
                sx={{ mb: 2, marginRight: "10px" }}
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
            {/* <Button
            variant="outlined"
            onClick={() => onRegistrationComplete()}
            sx={{ mb: 2, marginRight: '10px' }}
          >
            Cancel
          </Button> */}
            <Tooltip title="Submit">
              <IconButton
                variant="contained"
                onClick={handleUserRegistration}
                sx={{ mb: 2 }}
              >
                <SendIcon />
              </IconButton>
            </Tooltip>
            {/* <Button
            variant="contained"
            onClick={handleUserRegistration}
            sx={{ mb: 2 }}
          >
            Register
          </Button> */}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            p: 2,
          }}
        >
          <RadioGroup row value={buttonStatus} onChange={handleRadioChange}>
            <FormControlLabel value="y" control={<Radio />} label="Mechanics" />
            <FormControlLabel value="z" control={<Radio />} label="Employees" />
          </RadioGroup>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, p: 1 }}>
            <TextField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, p: 1 }}>
            <TextField
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              fullWidth
              inputProps={{
                maxLength: 10,
                inputMode: "numeric",
                pattern: "[0-9]*",
              }}
            />
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              inputProps={{
                pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
              }}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, p: 1 }}>
            <TextField
              label="Emergency Contact"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Name of the Emergency Contact"
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Relationship with the Emergency Contact"
              name="emergencyContactRelationship"
              value={formData.emergencyContactRelationship}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, p: 1 }}>
            <TextField
              label="Aadhar Card Number"
              name="aadharCardNumber"
              value={formData.aadharCardNumber}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="PAN Card Number"
              name="panCardNumber"
              value={formData.panCardNumber}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, p: 1 }}>
            <TextField
              label="Date of Birth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, p: 1 }}>
            <TextField
              label="Date of Joining"
              name="dateOfJoining"
              value={formData.dateOfJoining}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Date of Leaving"
              name="dateOfLeaving"
              value={formData.dateOfLeaving}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
