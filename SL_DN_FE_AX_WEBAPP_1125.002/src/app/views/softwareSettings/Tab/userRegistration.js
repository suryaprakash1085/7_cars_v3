"use client";
import React, { useState, useEffect } from 'react';
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
  Radio
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';



// const roleOptions = ["Admin", "ServiceCenter", "FrontDesk", "Supervisor"];

export default function UserRegistration({ onRegistrationComplete }) {

  const [roles, setRoles] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [companyCodeOptions, setCompanyCodeOptions] = useState([]);
  const [hideFields, setHideFields] = useState(false);
  const [buttonStatus, setButtonStatus] = useState('x');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/roles`
        );
        const data = await response.json();
        console.log("data:", data);
        setRoles(data);
        setRoleOptions(data.map(role => role.role_name));
      } catch (error) {
        console.log("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchCompanyCodes = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ss/codes/all`
        );
        const data = await response.json();
        console.log("Company codes:", data);
        setCompanyCodeOptions(
          data.map((item) => ({
            code: item.company_code,
            label: `${item.company_code} - ${item.company_name}`,
          }))
        );
      } catch (error) {
        console.log("Error fetching company codes:", error);
      }
    };
    fetchCompanyCodes();
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: '',
    firstName: '',
    lastName: '',
    phone: '',
    company_code: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const onlyAlphabets = /^[a-zA-Z\s]*$/; // Allow only alphabets and spaces

    if (name === 'phone') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      if (numbersOnly.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: numbersOnly
        }));
      }
    } else if ((name === 'firstName' || name === 'lastName') && !onlyAlphabets.test(value)) {
      // Do nothing if the input is invalid
      return;
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const isFormValid = () => {
    const { firstName, phone, email, role } = formData;
    return firstName.trim() !== '' && phone.trim() !== '' && email.trim() !== '' && role.trim() !== '';
  };

  const getMissingFields = () => {
    const { firstName, lastName, phone, email, role } = formData;
    const missingFields = [];
    if (firstName.trim() === '') missingFields.push('First Name');
    if (lastName.trim() === '') missingFields.push('Last Name');
    if (phone.trim() === '') missingFields.push('Phone');
    if (email.trim() === '') missingFields.push('Email');
    if (role.trim() === '') missingFields.push('Role');
    return missingFields;
  };

  const handleUserRegistration = async () => {
    const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailPattern.test(formData.email)) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
        severity: 'warning'
      });
      return;
    }

    const missingFields = getMissingFields();
    if (missingFields.length > 0) {
      setSnackbar({
        open: true,
        message: `Please fill in the following fields: ${missingFields.join(', ')}`,
        severity: 'warning'
      });
      return;
    }

    const dataToSend = { ...formData, button_status: buttonStatus };

    if (hideFields) {
      delete dataToSend.username;
      delete dataToSend.password;
    }

    
    if(hideFields){
      try {
         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/create/employee`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });
        const data = await response.json();
        setSnackbar({
          open: true,
          message: 'User registered successfully',
          severity: 'success'
        });
        if (onRegistrationComplete) {
          setTimeout(() => {
            onRegistrationComplete();
          }, 2000);
        }
      } catch (error) {
        console.log('Registration error:', error);
        setSnackbar({
          open: true,
          message: 'Failed to register user',
          severity: 'error'
        });
      }
    }
    else{
    try {

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      
      setSnackbar({
        open: true,
        message: 'User registered successfully',
        severity: 'success'
      });

      setFormData({
        username: '',
        password: '',
        email: '',
        role: '',
        firstName: '',
        lastName: '',
        phone: '',
        company_code: ''
      });

      if (onRegistrationComplete) {
        setTimeout(() => {
          onRegistrationComplete();
        }, 2000);
      }
    } catch (error) {
      console.log('Registration error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to register user',
        severity: 'error'
      });
    }
  }
  };

  const handleRadioChange = (e) => {
    const value = e.target.value;
    setButtonStatus(value);
    setHideFields(value !== 'x'); 
    if (value === 'y') {
      setFormData(prev => ({
        ...prev,
        role: 'Mechanic'
      }));
    } else if (value === 'z') {
      setFormData(prev => ({
        ...prev,
        role: 'Employee' 
      }));
    }
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: "space-between", p: 2, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 3, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            User Registration
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Cancel">
            <IconButton
              variant="contained"
              onClick={() => onRegistrationComplete()}
              sx={{ mb: 2, marginRight: '10px' }}
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

      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, p: 2 }}>
        {/* <Typography variant="body1">Select Option</Typography> */}
        <RadioGroup
          row
          value={buttonStatus}
          onChange={handleRadioChange}
        >
          <FormControlLabel value="x" control={<Radio />} label="Users" />
          <FormControlLabel value="y" control={<Radio />} label="Mechanics" />
          <FormControlLabel value="z" control={<Radio />} label="Employees" />
        </RadioGroup>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, p: 2 }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, p: 2 }}>
          <TextField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            fullWidth
            inputProps={{
              maxLength: 10,
              inputMode: 'numeric',
              pattern: '[0-9]*'
            }}
          />
          <TextField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            fullWidth
            inputProps={{
              pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, p: 2 }}>
          <Autocomplete
            options={companyCodeOptions}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.label
            }
            value={
              companyCodeOptions.find((opt) => opt.code === formData.company_code) || null
            }
            onChange={(event, newValue) => {
              if (newValue) {
                setFormData((prev) => ({
                  ...prev,
                  company_code: newValue.code,
                }));
              } else {
                setFormData((prev) => ({
                  ...prev,
                  company_code: "",
                }));
              }
            }}
            fullWidth
            renderInput={(params) => (
              <TextField {...params} label="Company Code (optional)" />
            )}
          />
        </Box>
        {!hideFields && (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, p: 2 }}>
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        )}
        {buttonStatus === 'x' && (
          <Box sx={{ marginLeft: '1%', marginRight: '1%' }}>
            <Autocomplete
              options={roleOptions}
              value={formData.role}
              onChange={(event, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  role: newValue || ''
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Role" fullWidth />
              )}
            />
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
