"use client";
// import Cookies from "js-cookie";
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
    Dialog,
    DialogContent,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    Paper,
    Radio,
    RadioGroup,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";

import { Country, State, City } from "country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";

// Utilities
import { getCompanyCodeFromCookies, buildHeadersWithCompanyCode } from "@/utils/companyCodeHelper";

// let references = [
//   { label: "Google", name: "Google" },
//   { label: "JustDial", name: "JustDial" },
//   { label: "Person", name: "Person" },
// ];

let references = [
    { label: "Online", name: "Online" },
    { label: "Tele in ", name: "Tele in" },
    { label: "Telecalling out", name: "Telecalling out" },
    { label: "Walk-in", name: "Walk-in" },
    { label: "Customer reference", name: "Customer reference" },
];

const prefixOptions = [
    { name: "Mr." },
    { name: "Ms." },
    { name: "Mrs." },
    { name: "M/S" },
];

export default function AddCustomer({ onSuccess, onClose, typedname, setTypedname, from, onProductAdded }) {
    // FrontEnd extracted data states
    const router = useRouter();
    const [salesType, setSalesType] = useState('customer');
    const [openSalesTypeModal, setOpenSalesTypeModal] = useState(false);

    // Modal and Alert states
    const [activeStep, setActiveStep] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarSeverity, setSnackbarSeverity] = useState("error");
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarPosition] = useState({
        vertical: "bottom",
        horizontal: "right",
    });

    // FrontEnd form input states - Customer Info
    const [customerName, setCustomerName] = useState("");
    const [gstNumber, setGstNumber] = useState("");
    const [gstCustomer, setGstCustomer] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    // Address states
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("Sivakasi");
    const [state, setState] = useState("Tamil Nadu");
    const [zip, setZip] = useState("");

    // Vehicle states
    const [plateNumber, setPlateNumber] = useState("");
    const [isPlateNumberHidden, setIsPlateNumberHidden] = useState(false);
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [vin, setVin] = useState("");
    const [fuelType, setFuelType] = useState("");

    // Appointment states
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");
    const [status, setStatus] = useState("scheduled");
    const [telecaller, setTelecaller] = useState("self");
    const [notes, setNotes] = useState("");

    // Country, State, City states
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState({
        name: "India",
        isoCode: "IN",
        phonecode: "+91",
        label: "India",
    });
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    const [prefix, setPrefix] = useState(null);

    const [refer, setRefer] = useState(null);
    const [referBy, setReferBy] = useState("");

    // Add new state for makes and models
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);

    const [registrationDate, setRegistrationDate] = useState("");
    const [chassisNumber, setChassisNumber] = useState("");
    const [engineNumber, setEngineNumber] = useState("");
    const [chassisError, setChassisError] = useState("");
    const [engineError, setEngineError] = useState("");
    // const [typedname, setTypedname] = useState("");
    useEffect(() => {
        const now = new Date();
        setAppointmentDate(now.toISOString().split("T")[0]);
        setAppointmentTime(now.toTimeString().slice(0, 5));
        // setTypedname(typedname);

    });
    // if from is customerPayment then set the customerName to typedname
    useEffect(() => {
        if (from === "customerPayment") {
            handleSalesTypeSelect('counterSales')
            setOpenSalesTypeModal(false);
        }
    }, [])


    useEffect(() => {
        // Load states for India initially
        const statesData = State.getStatesOfCountry("IN").map((state) => ({
            ...state,
            label: state.name,
        }));
        setStates(statesData);
    }, []);

    const fetchVehicles = async (token, setModels, setMakes) => {
        try {
            if (!token) throw new Error("Token is missing");

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

            //  Convert response to JSON
            const data = await response.json();

            //  Extract Makes and Models
            const makes = data.map((item) => ({
                id: item.id,
                make_name: item.make_name,
                models: item.models.split(","),
            }));

            //  Set Makes and Models
            setMakes(makes);
        } catch (error) {
            console.error("Error fetching vehicles:", error.message);
        }
    };

    useEffect(() => {
        // Fetch makes and models data
        fetchVehicles(Cookies.get("token"), setModels, setMakes);
    }, []);

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

    const validateYear = () => {
        const yearPattern = /^\d{4}$/;
        const currentYear = new Date().getFullYear();

        if (year && (!yearPattern.test(year) || parseInt(year) > currentYear)) {
            setSnackbarMessage("Please enter a valid year (past or present only)");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            return false;
        }
        return true;
    };

    const validateStep = () => {
        const plateNumberPattern = /^[A-Z]{2}[0-9]{2}[A-Z -]{0,2}[0-9]{4}$/;
        const gstPattern =
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        const errorMessages = [];

        if (activeStep === 0) {
            if (!customerName) errorMessages.push("Customer Name");
            if (!phone || phone.length !== 10) errorMessages.push("Phone");
            if (!street) errorMessages.push("Street");

            if (gstCustomer && !gstNumber) {
                errorMessages.push("GST Number");
            } else if (gstCustomer && !gstPattern.test(gstNumber)) {
                errorMessages.push("Invalid GST Number");
            }
            if (!city) errorMessages.push("City");
        } else if (activeStep === 1 && salesType === 'customer') {
            if (
                !isPlateNumberHidden &&
                (!plateNumber || !plateNumberPattern.test(plateNumber))
            ) {
                errorMessages.push("Valid Plate Number");
            }
            if (!make) errorMessages.push("Make");
            if (!fuelType) errorMessages.push("Fuel Type");
            if (!model) errorMessages.push("Model");

            if (!validateYear()) {
                return false;
            }
        }

        if (errorMessages.length > 0) {
            setSnackbarMessage(
                `Please correct the following:\n${errorMessages.join("\n")}`
            );
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            return false;
        }

        return true;
    };

    const handleNext = (phone, email, customerName, street, zip) => {
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
        } else if (!customerName || onlyAlphabets.test(customerName) == false) {
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            setSnackbarMessage("Only alphathabets are allowed for customer name.");
        } else if (email && !emailValid.test(email)) {
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            setSnackbarMessage("Invalid email address");
        } else if (zip && !numberOnly.test(zip)) {
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            setSnackbarMessage("Please enter a valid pin code");
        } else if (!street || !streetValid.test(street)) {
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            setSnackbarMessage("Invalid characters in street name");
        } else {
            if (validateStep()) {
                setActiveStep((prevStep) => prevStep + 1);
            }
        }
    };

    const handleBack = () => {
        setErrorMessage("");
        if (activeStep > 0) {
            setActiveStep((prevStep) => prevStep - 1);
        }
    };

    const handleFinish = async () => {
        if (validateStep()) {
            const customerData = {
                leads_owner: Cookies.get("userId") || "",
                prefix: prefix?.name || "",
                customer_name: customerName,
                gstNumber: gstNumber,
                sales_type: salesType,
                contact: {
                    phone: phone,
                    email: email,
                    address: {
                        street: street,
                        city: selectedCity ? selectedCity.name : city,
                        state: selectedState ? selectedState.name : state,
                        zip: zip,
                    },
                },
                reference: refer?.label,
                referred_by: referBy,
                vehicles: salesType === 'customer' || (make && model) ? [
                    {
                        registration_date: registrationDate,
                        chassis_number: chassisNumber,
                        engine_number: engineNumber,
                        plate_number: plateNumber,
                        make: make,
                        model: model,
                        fuelType: fuelType,
                        year: parseInt(year, 10),
                        vin: vin || "",
                        address: {
                            street: street,
                            city: selectedCity ? selectedCity.name : city,
                            state: selectedState ? selectedState.name : state,
                            zip: zip,
                        },
                    },
                ] : [],
            };

            const token = Cookies.get("token");

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/customer`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(customerData),
                    }
                );

                const result = await response.json();

                if (result.error) {
                    setSnackbarOpen(true);
                    setSnackbarMessage(result.error);
                    setSnackbarSeverity("error");
                } else {
                    setSnackbarOpen(true);
                    setSnackbarMessage("Customer Created Successfully");
                    setSnackbarSeverity("success");
                    onProductAdded(Math.random() * 100)
                    // Reset form fields
                    setActiveStep(0);
                    setCustomerName("");
                    setPhone("");
                    setEmail("");
                    setStreet("");
                    setCity("");
                    setState("");
                    setZip("");


                    if (onClose) onClose();
                }
            } catch (error) {
                console.log("my error", error);
                setSnackbarOpen(true);
                setSnackbarMessage(error.error ? error.error : "Error creating customer");
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

    const validateNumberPlate = () => {
        const numberPlatePattern = /^[A-Z]{2}[0-9]{2}[A-Z -]{0,2}[0-9]{4}$/;

        if (plateNumber && !numberPlatePattern.test(plateNumber)) {
            setErrorMessage("Invalid Number Plate");
        } else {
            setErrorMessage("");
        }
    };

    const handleCheckboxChange = (e) => {
        setIsPlateNumberHidden(!isPlateNumberHidden);
        if (!isPlateNumberHidden) {
            setPlateNumber("For Registration");
        } else {
            setPlateNumber("");
        }
    };

    const handleAddAppointment = async (
        custId,
        plateNumber,
        appointmentDate,
        appointmentTime,
        status,
        telecaller,
        notes
    ) => {
        const companyCode = getCompanyCodeFromCookies();
        const appointmentPayload = {
            customer_id: custId,
            vehicle_id: plateNumber,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            status,
            telecaller,
            notes,
            company_code: companyCode,
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
                        ...buildHeadersWithCompanyCode(),
                    },
                    body: JSON.stringify(appointmentPayload),
                }
            );

            const data = await response.json();

            console.log({ apppaignaofng: data });

            const AppointmentId = data.AppointmentsArray.appointment_id;
            router.push(`/views/jobCard/${AppointmentId}`);
        } catch (err) {
            setSnackbarMessage("Failed to add appointment. Please try again.");
        }
    };

    const handleFuelTypeChange = (e) => {
        setFuelType(e.target.value);
    };

    const handleMakeChange = (value) => {
        setMake(value);
        setModel("");

        // Find the selected make in state
        const selectedMake = makes.find((item) => item.make_name === value);

        // Set models based on make
        if (selectedMake) {
            setModels(selectedMake.models);
        } else {
            setModels([]);
        }
    };

    // const validateChassisNumber = (value) => {
    //   if (value.length !== 17) {
    //     return "Chassis number must be exactly 17 characters.";
    //   }
    //   if (!/^[A-HJ-NPR-Z0-9]*$/.test(value)) {
    //     return "Only A-Z (except I, O, Q) and 0-9 are allowed.";
    //   }
    //   return "";
    // };

    // const validateEngineNumber = (value) => {
    //   if (value.length !== 17) {
    //     return "Engine number must be exactly 17 characters.";
    //   }
    //   if (!/^[A-HJ-NPR-Z0-9]*$/.test(value)) {
    //     return "Only A-Z (except I, O, Q) and 0-9 are allowed.";
    //   }
    //   return "";
    // };

    // const handleChassisNumberChange = (e) => {
    //   const value = e.target.value;
    //   setChassisNumber(value);
    //   setChassisError(validateChassisNumber(value)); // Validate on input change
    // };

    // const handleEngineNumberChange = (e) => {
    //   const value = e.target.value;
    //   setEngineNumber(value);
    //   setEngineError(validateEngineNumber(value)); // Validate on input change
    // };

    // const getCookie = (name) => {
    //   const cookieString = document.cookie
    //     .split("; ")
    //     .find((row) => row.startsWith(`${name}=`));
    //   return cookieString ? cookieString.split("=")[1] : null;
    // };

    const username = Cookies.get("userName");

    const handleSalesTypeSelect = (type) => {
        setSalesType(type);
        setOpenSalesTypeModal(false);
    };

    const handleClose = () => {
        setOpenSalesTypeModal(false);
        if (onClose) onClose();
    };


    return (
        <div>
            <Dialog
                open={openSalesTypeModal}
                onClose={handleClose}
            >
                <DialogContent>
                    <Typography variant="h6" gutterBottom>
                        Select Sales Type
                    </Typography>
                    <Box display="flex" gap={2}>
                        <Button
                            variant="contained"
                            onClick={() => handleSalesTypeSelect('customer')}
                            fullWidth
                        >
                            Appointment
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => handleSalesTypeSelect('counterSales')}
                            fullWidth
                        >
                            Counter Sales
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Box marginTop="1rem" style={{ overflowY: "auto" }}>
                {activeStep === 0 && (
                    <div>
                        <h1>Add New Customer:</h1>

                        <h4>LeadOwer: {username ? username : "Guest"}</h4>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                            }}
                        >
                            <Typography>Is Customer Entitled for GST?</Typography>
                            <Checkbox
                                size="small"
                                onChange={() => {
                                    setGstCustomer(event.target.checked);
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            {/* Prefix Field */}
                            <Autocomplete
                                options={prefixOptions}
                                getOptionLabel={(option) => option.name || ""}
                                isOptionEqualToValue={(option, value) =>
                                    option.name === value?.name
                                }
                                onChange={(e, value) => setPrefix(value || null)}
                                value={prefix}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Prefix"
                                        size="small"
                                        required
                                        fullWidth
                                    />
                                )}
                                sx={{
                                    width: gstCustomer ? "33.33%" : "50%",
                                    paddingBottom: "1px",
                                }}
                            />

                            {/* Customer Name Field */}
                            <TextField
                                required
                                label="Customer Name"
                                size="small"
                                variant="outlined"
                                margin="normal"
                                value={customerName || typedname}
                                onChange={(e) => { setCustomerName(e.target.value); setTypedname(e.target.value) }}
                                sx={{ width: gstCustomer ? "33.33%" : "50%" }}
                            />

                            {/* GST Number Field - Only shown when GST is enabled */}
                            {gstCustomer && (
                                <TextField
                                    required
                                    label="GST Number"
                                    size="small"
                                    variant="outlined"
                                    margin="normal"
                                    fullWidth
                                    value={gstNumber}
                                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                                    sx={{ width: "33.33%" }}
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

                        <div></div>

                        <div style={{ display: "flex", gap: 8 }}>
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
                                sx={{ flex: 1 }}
                            />
                            <Autocomplete
                                options={cities}
                                getOptionLabel={(option) => option.label}
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
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <TextField
                                required
                                label="Street"
                                size="small"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                label="Pincode"
                                size="small"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={zip}
                                inputProps={{ maxLength: 6 }}
                                onChange={(e) => {
                                    setZip(e.target.value);
                                }}
                                sx={{ flex: 1 }}
                            />
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Autocomplete
                                options={references}
                                getOptionLabel={(option) => option.label}
                                onChange={(e, value) => {
                                    console.log(value.label);
                                    setRefer(value);
                                }}
                                value={refer}
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
                                sx={{ flex: refer?.label == "Customer reference" ? 1 : 0 }}
                            />
                        </div>
                    </div>
                )}

                {activeStep === 1 && (
                    <div>
                        <h1>Add Vehicle {salesType === 'counterSales' ? '(Optional)' : ''}</h1>

                        <Box display="flex" alignItems="center">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isPlateNumberHidden}
                                        onChange={handleCheckboxChange}
                                    />
                                }
                                label="New vehicle"
                                margin="normal"
                            />

                            <TextField
                                required
                                label="Plate Number"
                                size="small"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                onBlur={validateNumberPlate}
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                                style={{ display: isPlateNumberHidden ? "none" : "block" }}
                            />
                        </Box>

                        <Box display="flex" alignItems="center" marginY="normal">
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Fuel Type</FormLabel>
                                <RadioGroup
                                    row
                                    aria-label="fuel type"
                                    name="fuelType"
                                    value={fuelType}
                                    onChange={handleFuelTypeChange}
                                >
                                    <FormControlLabel
                                        value="petrol"
                                        control={<Radio />}
                                        label="Petrol"
                                    />
                                    <FormControlLabel
                                        value="diesel"
                                        control={<Radio />}
                                        label="Diesel"
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Box>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            marginY="normal"
                            paddingBottom={2}
                        >
                            <Autocomplete
                                options={makes.map((item) => item.make_name)}
                                onChange={(event, value) => handleMakeChange(value)}
                                value={make}
                                freeSolo
                                fullWidth
                                sx={{ flex: 1, marginRight: "8px" }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Make"
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

                            <Autocomplete
                                options={Array.isArray(models) ? models : []}
                                onChange={(event, value) => setModel(value)}
                                value={model}
                                freeSolo
                                fullWidth
                                sx={{ flex: 1, marginRight: "8px" }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Model"
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
                                disabled={!make}
                            />

                            <TextField
                                label="Variant"
                                size="small"
                                variant="outlined"
                                fullWidth
                                value={vin}
                                onChange={(e) => setVin(e.target.value)}
                                sx={{ flex: 1 }}
                                disabled={!model}
                            />
                        </Box>

                        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                            <TextField
                                required
                                label="Registration Date"
                                type="date"
                                size="small"
                                variant="outlined"
                                onChange={(e) => setRegistrationDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    width: "33.33%",
                                    "& .MuiFormLabel-asterisk": {
                                        display: "none", // Hide the asterisk
                                    },
                                }}
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
                                        display: "none",
                                    },
                                }}
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
                                        display: "none",
                                    },
                                }}
                            />
                        </Box>

                        <TextField
                            required
                            label="Year"
                            size="small"
                            variant="outlined"
                            fullWidth
                            onBlur={validateYear}
                            margin="normal"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                    </div>
                )}
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
            // anchorOrigin={snackbarPosition}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            <Box display="flex" justifyContent="space-between" marginTop="1rem">
                <Button
                    variant="contained"
                    onClick={handleBack}
                    disabled={activeStep === 0}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        if (activeStep === 1) {
                            handleFinish();
                        } else {
                            if (validateStep()) {
                                setActiveStep((prev) => prev + 1);
                            }
                        }
                    }}
                >
                    {activeStep === 1 ? "Finish" : "Next"}
                </Button>
            </Box>
        </div>
    );
}
