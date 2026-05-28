"use client";
// import Cookies from "js-cookie";
// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";
import { faker } from "@faker-js/faker";

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
  Grid,
} from "@mui/material";

import { Close } from "@mui/icons-material";

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

export default function AddCustomer({ onSuccess, onClose, selectedCustomer, salesType: initialSalesType, source,routerPush }) {
  // FrontEnd extracted data states
  const router = useRouter();
  const [salesType, setSalesType] = useState(initialSalesType || "customer");
  const [openSalesTypeModal, setOpenSalesTypeModal] = useState(!initialSalesType);
const [gstCustomer, setGstCustomer] = useState(!!selectedCustomer?.gst_number);
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
  // const [gstCustomer, setGstCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Address states
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Sivakasi");
  const [state, setState] = useState("Tamil Nadu");
  const [zip, setZip] = useState("");

  // Vehicle states
  const [plateNumber, setPlateNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPlateNumberHidden, setIsPlateNumberHidden] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [openAddVehicleDialog, setOpenAddVehicleDialog] = useState(false);
  // Local dialog form states to avoid clearing main form when dialog opens
  const [dlgPlateNumber, setDlgPlateNumber] = useState("");
  const [dlgMake, setDlgMake] = useState("");
  const [dlgModel, setDlgModel] = useState("");
  const [dlgYear, setDlgYear] = useState("");
  const [dlgVin, setDlgVin] = useState("");
  const [dlgFuelType, setDlgFuelType] = useState("Petrol");
  const [dlgRegistrationDate, setDlgRegistrationDate] = useState("");
  const [dlgChassisNumber, setDlgChassisNumber] = useState("");
  const [dlgEngineNumber, setDlgEngineNumber] = useState("");

  // Appointment states
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [telecaller, setTelecaller] = useState("self");
  const [notes, setNotes] = useState("");

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("Tamil Nadu");
  const [selectedCity, setSelectedCity] = useState("Sivakasi");
  const [stateCityData, setStateCityData] = useState({});

  const [prefix, setPrefix] = useState(null);

  const [refer, setRefer] = useState(null);
  const [referBy, setReferBy] = useState("");
  const [companyDetails, setCompanyDetails] = useState(null);

  // Add new state for makes and models
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);

  const [registrationDate, setRegistrationDate] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [chassisError, setChassisError] = useState("");
  const [engineError, setEngineError] = useState("");

  const [oneTimeCustomer, setOneTimeCustomer] = useState(false);

  useEffect(() => {
    const now = new Date();
    setAppointmentDate(now.toISOString().split("T")[0]);
    setAppointmentTime(now.toTimeString().slice(0, 5));
  });

  // Set default year when Add Vehicle dialog opens
  useEffect(() => {
    if (openAddVehicleDialog) {
      setDlgYear(new Date().getFullYear().toString());
      setDlgFuelType("Petrol");
    } else {
      // Reset dialog fields when closing
      setDlgYear("");
      setDlgPlateNumber("");
      setDlgMake("");
      setDlgModel("");
      setDlgVin("");
      setDlgFuelType("Petrol");
      setDlgRegistrationDate("");
      setDlgChassisNumber("");
      setDlgEngineNumber("");
      setIsPlateNumberHidden(false);
    }
  }, [openAddVehicleDialog]);

  // Fetch state/city data from API on mount
  useEffect(() => {
    const fetchStateCityData = async () => {
      try {
        const token = Cookies.get("token"); // Or however you store your JWT
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
        // Populate cities for default state (Tamil Nadu)
        if (data["Tamil Nadu"]) {
          setCities(data["Tamil Nadu"]);
        }
      } catch (error) {
        setErrorMessage("Could not load state/city data");
      }
    };
    fetchStateCityData();
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

  // Populate form with selected customer data
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.customer_name || "");
      setPhone(selectedCustomer.contact?.phone || "");
      setEmail(selectedCustomer.contact?.email || "");
      setStreet(selectedCustomer.contact?.address?.street || "");
      setCity(selectedCustomer.contact?.address?.city || "Sivakasi");
      setState(selectedCustomer.contact?.address?.state || "Tamil Nadu");
      setZip(selectedCustomer.contact?.address?.pinCode || "");
      setPrefix(prefixOptions.find((p) => p.name === selectedCustomer.prefix) || null);
      setGstNumber(selectedCustomer.gst_number || "");
      setGstCustomer(selectedCustomer.gst_number);

      // Set reference and referred by
      if (selectedCustomer.reference) {
        const refObj = references.find((r) => r.label === selectedCustomer.reference);
        setRefer(refObj || null);
      }
      setReferBy(selectedCustomer.referred_by || "");

      // Set selected state and city for autocomplete
      setSelectedState(selectedCustomer.contact?.address?.state || "Tamil Nadu");
      if (stateCityData[selectedCustomer.contact?.address?.state || "Tamil Nadu"]) {
        setCities(stateCityData[selectedCustomer.contact?.address?.state || "Tamil Nadu"]);
        setSelectedCity(selectedCustomer.contact?.address?.city || "Sivakasi");
      }

      // Fetch customer vehicles from API
      const fetchCustomerVehicles = async () => {
        try {
          const token = Cookies.get("token");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/customer/${selectedCustomer.customer_id}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (response.ok) {
            const customerData = await response.json();
            const vehicles = customerData.vehicles || [];
            setVehiclesList(vehicles);

            // Populate first vehicle if available
            if (vehicles.length > 0) {
              const firstVehicle = vehicles[0];
              setPlateNumber(firstVehicle.plateNumber || firstVehicle.plate_number || "");
              setMake(firstVehicle.make || "");
              setModel(firstVehicle.model || "");
              setYear(firstVehicle.year?.toString() || "");
              setVin(firstVehicle.vin || "");
              setFuelType(normalizeFuelType(firstVehicle.fuel_type || firstVehicle.fuelType || ""));
              setRegistrationDate(firstVehicle.registration_date || firstVehicle.registrationDate || "");
              setChassisNumber(firstVehicle.chassis_number || firstVehicle.chassisNumber || "");
              setEngineNumber(firstVehicle.engine_number || firstVehicle.engineNumber || "");
              setSelectedVehicleId(firstVehicle.vehicle_id || null);
            } else {
              // No vehicles exist - show option to add new vehicle
              setSnackbarMessage("No existing vehicles found. Please add a vehicle.");
              setSnackbarSeverity("info");
              setSnackbarOpen(true);
            }
          }
        } catch (error) {
          console.error("Error fetching customer vehicles:", error);
          // Fallback to vehicles from selectedCustomer prop
          setVehiclesList(selectedCustomer.vehicles || []);
          if (selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0) {
            const firstVehicle = selectedCustomer.vehicles[0];
            setPlateNumber(firstVehicle.plateNumber || firstVehicle.plate_number || "");
            setMake(firstVehicle.make || "");
            setModel(firstVehicle.model || "");
            setYear(firstVehicle.year?.toString() || "");
            setVin(firstVehicle.vin || "");
            setFuelType(normalizeFuelType(firstVehicle.fuel_type || firstVehicle.fuelType || ""));
            setRegistrationDate(firstVehicle.registration_date || firstVehicle.registrationDate || "");
            setChassisNumber(firstVehicle.chassis_number || firstVehicle.chassisNumber || "");
            setEngineNumber(firstVehicle.engine_number || firstVehicle.engineNumber || "");
            setSelectedVehicleId(firstVehicle.vehicle_id || null);
          }
        }
      };

      fetchCustomerVehicles();
    }
  }, [selectedCustomer, stateCityData]);

  // Initialize dialog fields when dialog opens
  useEffect(() => {
    if (openAddVehicleDialog) {
      // Always clear dialog fields when opening for a new vehicle
      setDlgPlateNumber("");
      setDlgMake("");
      setDlgModel("");
      setDlgYear("");
      setDlgVin("");
      setDlgFuelType("Petrol");
      setDlgRegistrationDate("");
      setDlgChassisNumber("");
      setDlgEngineNumber("");
      setModels([]);
    }
  }, [openAddVehicleDialog]);

  // Auto-populate vehicle details when plate number is selected from existing vehicles
  useEffect(() => {
    if (vehiclesList && plateNumber) {
      const selectedVehicle = vehiclesList.find(
        (v) => (v.plateNumber || v.plate_number)?.toUpperCase() === plateNumber.toUpperCase()
      );

      if (selectedVehicle) {
        setMake(selectedVehicle.make || "");
        setModel(selectedVehicle.model || "");
        setYear(selectedVehicle.year?.toString() || "");
        setVin(selectedVehicle.vin || "");
        setFuelType(normalizeFuelType(selectedVehicle.fuel_type || selectedVehicle.fuelType || ""));
        setRegistrationDate(selectedVehicle.registration_date || selectedVehicle.registrationDate || "");
        setChassisNumber(selectedVehicle.chassis_number || selectedVehicle.chassisNumber || "");
        setEngineNumber(selectedVehicle.engine_number || selectedVehicle.engineNumber || "");
        setSelectedVehicleId(selectedVehicle.vehicle_id || null);
      }
    }
  }, [plateNumber, selectedCustomer]);

  // When state changes, update cities
  const handleStateChange = (event, value) => {
    setSelectedState(value);
    if (value && stateCityData[value]) {
      setCities(stateCityData[value]);
    } else {
      setCities([]);
    }
    setSelectedCity(null);
  };

  const handleCityChange = (event, value) => {
    setSelectedCity(value);
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
      if (phone && phone.length !== 10) errorMessages.push("Phone");

      if (gstCustomer && !gstNumber) {
        errorMessages.push("GST Number");
      } else if (gstCustomer && !gstPattern.test(gstNumber)) {
        errorMessages.push("Invalid GST Number");
      }
      if (!city) errorMessages.push("City");
      if (!state) errorMessages.push("State");
      if (!refer) errorMessages.push("Reference");
    } else if (activeStep === 1 && salesType === "customer") {
      // Check if plate number is from existing vehicles
      const isExistingVehicle = vehiclesList?.some(
        (v) => (v.plateNumber || v.plate_number)?.toUpperCase() === plateNumber.toUpperCase()
      );

      if (isPlateNumberHidden) {
        // New vehicle flow: require vehicle details
        if (!make) errorMessages.push("Make");
        if (!model) errorMessages.push("Model");
        if (!fuelType) errorMessages.push("Fuel Type");
      } else {
        // Existing vehicle flow: ensure plate number is provided or selected
        if (!isExistingVehicle) {
          if (!plateNumber) {
            errorMessages.push("Plate Number");
          } else if (!plateNumberPattern.test(plateNumber)) {
            errorMessages.push("Valid Plate Number");
          }
        }
      }

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

    if (phone && !indianPhoneRegex.test(phone)) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Invalid phone number");
    } else if (!customerName) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Customer Name Is Mandatory");
    } else if (email && !emailValid.test(email)) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Invalid email address");
    } else if (zip && !numberOnly.test(zip)) {
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSnackbarMessage("Please enter a valid pin code");
    } else if (street && !streetValid.test(street)) {
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
    if (!refer) {
      setSnackbarOpen(true);
      setSnackbarMessage("Reference is required");
      setSnackbarSeverity("error");
      return;
    }

    if (validateStep()) {
      // Auto-generate phone number if empty in format "99999XXXXX"
      let finalPhone = phone;
      if (!phone) {
        const randomDigits = Array.from({ length: 5 }, () =>
          Math.floor(Math.random() * 10)
        ).join("");
        finalPhone = `99999${randomDigits}`;
      }

      // if oneTimeCustomer, add one_time: true
    const shouldIncludeVehicle =
  (make || model || plateNumber || isPlateNumberHidden);
  
      const vehiclePayload = {
        registration_date: registrationDate || "",
        chassis_number: chassisNumber || "",
        engine_number: engineNumber || "",
        plate_number: plateNumber || "",
        make: make || "",
        model: model || "",
        fuel_type: fuelType,
        year: year ? parseInt(year, 10) : undefined,
        vin: vin || "",
        address: {
          street,
          city: selectedCity || city,
          state: selectedState || state,
          zip,
        },
      };

      const customerData = {
        one_time: oneTimeCustomer,
        leads_owner: Cookies.get("userId") || "",
        prefix: prefix?.name || "",
        customer_name: customerName,
        gst_number: gstNumber,
        sales_type: salesType,
        contact: {
          phone: finalPhone,
          email: email,
          address: {
            street: street,
            city: selectedCity || city,
            state: selectedState || state,
            zip: zip,
          },
        },
        reference: refer?.label,
        referred_by: referBy,
        vehicles: shouldIncludeVehicle ? [vehiclePayload] : [],
      };

      const token = Cookies.get("token");

      // If selectedCustomer exists, use it directly (old customer flow)
      if (selectedCustomer) {
        try {
          // Find the selected vehicle's actual vehicle_id
          let vehicleId = null;
          let isExistingVehicle = false;

          if (vehiclesList && vehiclesList.length > 0) {
            const selectedVehicle = vehiclesList.find(
              (v) => (v.plateNumber || v.plate_number)?.toUpperCase() === plateNumber.toUpperCase()
            );
            if (selectedVehicle) {
              vehicleId = selectedVehicle.vehicle_id;
              isExistingVehicle = true;
            }
          }

          // If this flow is for counter sales we don't need to force a vehicle selection.
          // Create counter sale immediately and return to avoid the vehicle validation below.
          if (source === "salescustomers") {
            // For Salescustomers page, just navigate to customer detail page
            if (onSuccess) onSuccess(selectedCustomer.customer_id);
            if (onClose) onClose();
            return;
          }

          if (salesType === "counterSales") {
            const counterSaleResult = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/add_countersales`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  name: selectedCustomer.customer_name,
                  phone: selectedCustomer.contact.phone,
                  gst: selectedCustomer.gst_number || "",
                  street: selectedCustomer.contact.address.street || "",
                  customer_id: selectedCustomer.customer_id,
                  vehicle_id: vehicleId,
                }),
              }
            );

            const counterData = await counterSaleResult.json();
            if (counterData && counterData.appointment_id) {
              router.push(`/views/shoppingcart/${counterData.appointment_id}`);
              return;
            } else {
              setSnackbarMessage("Failed to create counter sale");
              setSnackbarSeverity("error");
              setSnackbarOpen(true);
              return;
            }
          }

          // If no vehicle_id found, check if it's a new vehicle to add
          if (!vehicleId) {
            // If it's a new vehicle (not "For Registration" and not in existing list)
            if (!isPlateNumberHidden && plateNumber && make && model && fuelType) {
              // Add new vehicle first
              const addVehiclePayload = {
                customer_id: selectedCustomer.customer_id,
                vehicles: [
                  {
                    make,
                    model,
                    year: parseInt(year, 10),
                    fuelType,
                    vin: vin || "",
                    plate_number: plateNumber,
                    registrationDate: registrationDate || "",
                    chassisNumber: chassisNumber || "",
                    engineNumber: engineNumber || "",
                  },
                ],
              };

              const addVehicleResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/customer/vehicles/${selectedCustomer.customer_id}/`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(addVehiclePayload),
                }
              );

              if (addVehicleResponse.status === 409) {
                setSnackbarMessage("This plate number is already registered");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
                return;
              }

              if (!addVehicleResponse.ok) {
                const errorData = await addVehicleResponse.json();
                throw new Error(errorData.error || "Failed to add vehicle");
              }

              const vehicleData = await addVehicleResponse.json();
              vehicleId = vehicleData.vehicle.vehicle_id;
            } else if (isPlateNumberHidden) {
              // New vehicle (For Registration) — require vehicle details and add vehicle record
              if (!make || !model || !fuelType || !year) {
                setSnackbarOpen(true);
                setSnackbarMessage("Please provide vehicle details for the new vehicle");
                setSnackbarSeverity("error");
                return;
              }

              // Add new vehicle for customer
              const addVehiclePayloadForRegistration = {
                customer_id: selectedCustomer.customer_id,
                vehicles: [
                  {
                    make,
                    model,
                    year: parseInt(year, 10),
                    fuelType,
                    vin: vin || "",
                    plate_number: plateNumber,
                    registrationDate: registrationDate || "",
                    chassisNumber: chassisNumber || "",
                    engineNumber: engineNumber || "",
                  },
                ],
              };

              const addVehicleResp = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/customer/vehicles/${selectedCustomer.customer_id}/`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(addVehiclePayloadForRegistration),
                }
              );

              if (addVehicleResp.status === 409) {
                setSnackbarMessage("This plate number is already registered");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
                return;
              }

              if (!addVehicleResp.ok) {
                const err = await addVehicleResp.json();
                throw new Error(err.error || "Failed to add vehicle");
              }

              const addedVehicleData = await addVehicleResp.json();
              vehicleId = addedVehicleData.vehicle.vehicle_id;
            } else {
              setSnackbarOpen(true);
              setSnackbarMessage("Please select or add a vehicle");
              setSnackbarSeverity("error");
              return;
            }
          }

          // Create appointment for existing customer (non-counterSales flows)
          await handleAddAppointment(
            selectedCustomer.customer_id,
            vehicleId,
            appointmentDate,
            appointmentTime,
            status,
            telecaller,
            notes
          );

          // Success - navigate will happen in handleAddAppointment
          if (onClose) onClose();
        } catch (error) {
          console.error("Error creating appointment for existing customer:", error);
          setSnackbarMessage(error.message || "Failed to process request");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        }
      } else {
        // New customer flow
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

            // Reset form fields
            setActiveStep(0);
            setCustomerName("");
            setPhone("");
            setEmail("");
            setStreet("");
            setCity("");
            setState("");
            setZip("");

            if (source === "salescustomers") {
              // For Salescustomers page, just navigate to customer detail page
              if (onSuccess) onSuccess(result.customer_id);
              if (onClose) onClose();
            } else if (salesType === "counterSales") {
              // For counter sales, generate counter sale and redirect
              const counterSaleResult = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/add_countersales`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    name: customerName,
                    phone: phone,
                    gst: gstNumber || "",
                    street: street,
                    customer_id: result.customer_id,
                    vehicle_id: result.vehicle_id, 
                  }),
                }
              );

              const counterData = await counterSaleResult.json();
              if (counterData) {
                router.push(`/views/shoppingcart/${counterData.appointment_id}`);
              }
            } else {
              // For regular customers, handle appointment and redirect
              await handleAddAppointment(
                result.customer_id,
                result.vehicle_id,
                appointmentDate,
                appointmentTime,
                status,
                telecaller,
                notes
              );
              if (onClose) onClose();
            }
          }
        } catch (error) {
          console.log("my error", error);
          setSnackbarOpen(true);
          setSnackbarMessage(
            error.error ? error.error : "Error creating customer"
          );
          setSnackbarSeverity("error");
        }
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
    const newVal = !isPlateNumberHidden;
    setIsPlateNumberHidden(newVal);
    if (newVal) {
      setPlateNumber("For Registration");
      setSelectedVehicleId(null);
      // Set registration date to current date when "New Vehicle" is checked
      const today = new Date().toISOString().split("T")[0];
      setRegistrationDate(today);
  setYear(String(new Date().getFullYear())); // "2026"
// setMake(" ")
// setModel(" ")
// setVin(" ")
// setFuelType("Diesel")




    } else {
      setPlateNumber("");
      setYear("");
    }
  };

  const handleAddAppointment = async (
    custId,
    vehicleId,
    appointmentDate,
    appointmentTime,
    status,
    telecaller,
    notes
  ) => {
    const companyCode = getCompanyCodeFromCookies();
    const appointmentPayload = {
      customer_id: custId,
      vehicle_id: vehicleId,
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

      if (data.error) {
        // Better error messages for specific scenarios
        if (data.error === "Cannot") {
          const existingAppointment = data.AppointmentsArray;
          const errorMsg = `This vehicle already has an open appointment (${existingAppointment?.appointment_id}). Please invoice or complete it first before creating a new appointment.`;
          throw new Error(errorMsg);
        }
        throw new Error(data.error || "Failed to create appointment");
      }

      const AppointmentId = data.AppointmentsArray.appointment_id;
      router.push(`/views/${routerPush}/${AppointmentId}`);
    } catch (err) {
      const errorMsg = err.message || "Failed to add appointment. Please try again.";
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      throw err;
    }
  };

  const normalizeFuelType = (value) => {
    if (!value && value !== 0) return "Petrol";
    const normalized = value.toString().trim().toLowerCase();
    if (normalized === "petrol") return "Petrol";
    if (normalized === "diesel") return "Diesel";
    if (normalized === "ev") return "EV";
    if (normalized === "helmat" || normalized === "helmet") return "Helmet";
    return value;
  };

  const handleFuelTypeChange = (e) => {
    setFuelType(normalizeFuelType(e.target.value));
  };

 const handleMakeChange = (value) => {
  setMake(value);
  setModel("");

  const selectedMake = makes.find(
    (item) => item.make_name === value
  );

  if (selectedMake && Array.isArray(selectedMake.models)) {
    const modelList = selectedMake.models.map(
      (m) => m.model_name || m
    );

    setModels(modelList);
  } else {
    setModels([]);
  }
};

console.log("full Type", fuelType);

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
    console.log("Selected sales type:", type);
  };

  const handleClose = () => {
    setOpenSalesTypeModal(false);
    if (onClose) onClose();
  };

  // // --- RANDOM DATA GENERATION LOGIC ONLY ---
  // useEffect(() => {
  //   if (oneTimeCustomer) {
  //     // Generate plain 10-digit phone number (e.g., 1234567891)
  //     setPhone(
  //       Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("")
  //     );
  //     setEmail(faker.internet.email());
  //     setStreet(faker.location.streetAddress());
  //     setZip(faker.location.zipCode('######'));

  //     // Pick random state/city from loaded data if available
  //     if (states.length > 0) {
  //       const randState = faker.helpers.arrayElement(states);
  //       setSelectedState(randState);

  //       // Find cities for the selected state
  //       let cityList = [];
  //       if (
  //         typeof stateCityData === "object" &&
  //         stateCityData !== null &&
  //         stateCityData[randState]
  //       ) {
  //         cityList = stateCityData[randState];
  //       } else if (Array.isArray(cities) && cities.length > 0) {
  //         cityList = cities;
  //       }
  //       if (cityList.length > 0) {
  //         const randCity = faker.helpers.arrayElement(cityList);
  //         setCities(cityList);
  //         setSelectedCity(randCity);
  //       }
  //     }

  //     // Vehicle
  //     if (makes.length > 0) {
  //       const randMake = faker.helpers.arrayElement(makes);
  //       setMake(randMake.make_name || randMake);
  //       if (randMake.models && randMake.models.length > 0) {
  //         setModels(randMake.models);
  //         setModel(faker.helpers.arrayElement(randMake.models));
  //       }
  //     }
  //     setYear(faker.date.past({ years: 20 }).getFullYear().toString());
  //     setVin(faker.vehicle.vin());
  //     // Generate plate number: 2 random letters + 95x + 4 random digits
  //     const platePrefix = faker.string.alpha({ length: 2, casing: "lower" });
  //     const plateDigits = faker.string.numeric(4);
  //     const final = `${platePrefix}95x${plateDigits}`;
  //     setPlateNumber(final.toUpperCase());
  //     setRegistrationDate(
  //       faker.date.past({ years: 2 }).toISOString().split("T")[0]
  //     );
  //     setChassisNumber(faker.string.alphanumeric(17).toUpperCase());
  //     setEngineNumber(faker.string.alphanumeric(17).toUpperCase());
  //     setFuelType(faker.helpers.arrayElement(["petrol", "diesel"]));
  //     setRefer(faker.helpers.arrayElement(references));
  //     setReferBy(faker.person.fullName());
  //     setGstCustomer(false);
  //     setGstNumber("");
  //   }
  //   // eslint-disable-next-line
  // }, [oneTimeCustomer, states, cities, makes, stateCityData]);

  // In your useEffect for autofill, update as below:
  useEffect(() => {
    if (oneTimeCustomer) {
      // Only fill fields once when One Time Customer is enabled
      // Do not reset phone - let user enter it manually
      setStreet("Thiruthangal Road");
      setCity("Sivakasi");
      setState("Tamil Nadu");
      setZip("");
      setSelectedState("Tamil Nadu");
      setSelectedCity("Sivakasi");
      setGstCustomer(false);
      setGstNumber("");
      const walkInRef = references.find((ref) => ref.label === "Walk-in");
      setRefer(walkInRef || null);
      setReferBy("");
      setPrefix(null);
      // Do not fill make, model, year, vin, plateNumber, registrationDate, chassisNumber, engineNumber, fuelType, or email
      setEmail("none");
      setMake("none");
      setModel("none");
      setYear(new Date().getFullYear().toString());
      setVin("");
      setPlateNumber("");
      setRegistrationDate("");
      setChassisNumber("");
      setEngineNumber("");
      setFuelType("");
    } else if (!oneTimeCustomer) {
      // Reset all fields when unchecking One Time Customer
      setPhone("");
      setEmail("");
      setStreet("");
      setCity("Sivakasi");
      setState("Tamil Nadu");
      setZip("");
      setSelectedState("Tamil Nadu");
      setSelectedCity("Sivakasi");
      if (stateCityData["Tamil Nadu"]) {
        setCities(stateCityData["Tamil Nadu"]);
      }
      setGstCustomer(false);
      setGstNumber("");
      setRefer(null);
      setReferBy("");
      setPrefix(null);
      setMake("");
      setModel("");
      setYear("");
      setVin("");
      setPlateNumber("");
      setRegistrationDate("");
      setChassisNumber("");
      setEngineNumber("");
      setFuelType("");
    }
    // eslint-disable-next-line
  }, [oneTimeCustomer]);

  // Generate random plate number if new vehicle ticked (isPlateNumberHidden)
  useEffect(() => {
    if (oneTimeCustomer && isPlateNumberHidden) {
      // Generate random plate number like "for-regn-2829"
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setPlateNumber(`for-regn-${randomNum}`);
    } else if (oneTimeCustomer && !isPlateNumberHidden) {
      setPlateNumber("");
    }
    // eslint-disable-next-line
  }, [isPlateNumberHidden, oneTimeCustomer]);

  // Fetch company details from /ss on mount
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`);
        const data = await response.json();
        if (data && data.company_details && data.company_details.length > 0) {
          setCompanyDetails(data.company_details[0]);
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchCompanyDetails();
  }, []);

  return (
    <div>
      <Dialog open={openSalesTypeModal}>
        <DialogContent>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton aria-label="close" onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
          <Typography variant="h5" gutterBottom>
            Select Sales Type
          </Typography>

          <Box display="flex" gap={2}>
            <Button
              size="small"
              variant="contained"
              onClick={() => handleSalesTypeSelect("customer")}
              fullWidth
            >
              Appointment
            </Button>
            <Button
              variant="contained"
              onClick={() => handleSalesTypeSelect("counterSales")}
              fullWidth
            >
              Counter Sales
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Box marginTop="1rem" style={{ overflowY: "auto" }}>
        {/* Hide all fields if oneTimeCustomer is true */}
        {!oneTimeCustomer && activeStep === 0 && (
          <div>
            <h1>{selectedCustomer ? "Update Old Customer:" : "Add New Customer:"}</h1>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h4>LeadOwer: {username ? username : "Guest"}</h4>
              {/* <Button variant="contained" size="small" style={{height:"40px"}}>
                old customer{" "}
              </Button> */}
            </div>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                marginBottom: 2,
                padding: 1,
                backgroundColor: "#f5f5f5",
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography>Is Customer Entitled for GST?</Typography>
               <Checkbox
  size="small"
  checked={gstCustomer}
  onChange={(e) => setGstCustomer(e.target.checked)}
  disabled={oneTimeCustomer}
/>

              </Box>
              {!selectedCustomer && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={oneTimeCustomer}
                      onChange={(e) => setOneTimeCustomer(e.target.checked)}
                      size="small"
                    />
                  }
                  label="One Time Customer"
                  sx={{ margin: 0 }}
                />
              )}
            </Box>

          <Grid container spacing={2} alignItems="center">
  {/* Prefix */}
  <Grid item xs={gstCustomer ? 4 : 6}>
    <Autocomplete
      options={prefixOptions}
      getOptionLabel={(option) => option.name || ""}
      isOptionEqualToValue={(option, value) =>
        option.name === value?.name
      }
      value={prefix}
      onChange={(e, value) => setPrefix(value || null)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Prefix"
          size="small"
          required
          fullWidth
        />
      )}
    />
  </Grid>

  {/* Customer Name */}
  <Grid item xs={gstCustomer ? 4 : 6}>
    <TextField
      label="Customer Name"
      size="small"
      required
      fullWidth
      value={customerName}
      onChange={(e) => setCustomerName(e.target.value)}
    />
  </Grid>

  {/* GST Number */}
  {gstCustomer && (
    <Grid item xs={4}>
      <TextField
        label="GST Number"
        size="small"
        required
        fullWidth
        value={gstNumber}
        onChange={(e) =>
          setGstNumber(e.target.value.toUpperCase())
        }
      />
    </Grid>
  )}
</Grid>


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
                disabled={oneTimeCustomer}
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
                disabled={oneTimeCustomer}
              />
            </Box>

            <div></div>

            <div style={{ display: "flex", gap: 8 }}>
              <Autocomplete
                options={states}
                getOptionLabel={(option) => option}
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
                getOptionLabel={(option) => option}
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
                label="Street"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                sx={{ flex: 1 }}
                disabled={oneTimeCustomer}
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
                disabled={oneTimeCustomer}
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
                disabled={oneTimeCustomer}
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
                disabled={oneTimeCustomer}
              />
            </div>
          </div>
        )}

        {!oneTimeCustomer && activeStep === 1 && (
          <div>
            <h1>
              Add Vehicle {salesType === "counterSales" ? "(Optional)" : ""}
            </h1>

            {vehiclesList && vehiclesList.length > 0 && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 1,
                  border: "1px solid #e0e0e0",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Existing Customer Vehicles:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {vehiclesList.map((vehicle, index) => {
                    const plate = vehicle.plateNumber || vehicle.plate_number || "";
                    const isSelected = selectedVehicleId && vehicle.vehicle_id && selectedVehicleId === vehicle.vehicle_id;
                    return (
                      <Box
                        key={index}
                        onClick={() => {
                          setPlateNumber(plate.toUpperCase());
                          setSelectedVehicleId(vehicle.vehicle_id || null);
                          setIsPlateNumberHidden(false);
                        }}
                        sx={{
                          p: 1,
                          backgroundColor: isSelected ? "#e8f0fe" : "white",
                          borderRadius: 0.5,
                          border: isSelected ? "2px solid #1976d2" : "1px solid #ddd",
                          cursor: "pointer",
                        }}
                      >
                        <Typography variant="body2">
                          <strong>Plate:</strong> {plate} |
                          <strong> Make:</strong> {vehicle.make} |
                          <strong> Model:</strong> {vehicle.model} |
                          <strong> Year:</strong> {vehicle.year}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            <Box display="flex" alignItems="center" gap={2}>
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
              {selectedCustomer && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    console.log('Add Vehicle button clicked - opening dialog');
                    setOpenAddVehicleDialog(true);
                  }}
                  sx={{ marginLeft: 1, height: 40, textTransform: "none" }}
                >
                  Add Vehicle
                </Button>
              )}
              {!isPlateNumberHidden && vehiclesList && vehiclesList.length > 0 ? (
                <Autocomplete
                  options={vehiclesList.map((v) => v.plateNumber || v.plate_number)}
                  freeSolo
                  value={plateNumber}
                  onChange={(event, value) => {
                    const val = value?.toUpperCase() || "";
                    setPlateNumber(val);
                    const selected = vehiclesList.find(
                      (v) => (v.plateNumber || v.plate_number)?.toUpperCase() === val
                    );
                    setSelectedVehicleId(selected ? selected.vehicle_id : null);
                  }}
                  onInputChange={(event, newInputValue) => {
                    setPlateNumber(newInputValue.toUpperCase());
                    // typing manually - clear explicit selection
                    setSelectedVehicleId(null);
                  }}
                  onBlur={validateNumberPlate}
                  fullWidth
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Plate Number"
                      variant="outlined"
                      disabled
                      margin="normal"
                    />
                  )}
                  disabled={oneTimeCustomer}
                  sx={{ flex: 1 }}
                />
              ) : (
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
                  disabled={oneTimeCustomer}
                  sx={{ flex: 1 }}
                />
              )}
            </Box>

            <Box display="flex" alignItems="center" marginY="normal">
              <FormControl component="fieldset">
                <FormLabel component="legend" required>Fuel Type</FormLabel>
                <RadioGroup
                  row
                  aria-label="fuel type"
                  name="fuelType"
                  value={fuelType || dlgFuelType}
                  onChange={handleFuelTypeChange}
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
                    label="Make" 
                    size="small"
                    required
                    onChange={(e) => {
                      if (e.target.value) setMake(e.target.value);
                    }}
                    disabled={oneTimeCustomer}
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
                   label="Model"
                    size="small"
                    required
                    onChange={(e) => {
                      if (e.target.value) setModel(e.target.value);
                    }}
                    disabled={oneTimeCustomer}
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
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  width: "33.33%",
                  "& .MuiFormLabel-asterisk": {
                    display: "none", // Hide the asterisk
                  },
                }}
                disabled={oneTimeCustomer}
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
                disabled={oneTimeCustomer}
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
                disabled={oneTimeCustomer}
              />
            </Box>

            <TextField
              label="Year"
              size="small"
              variant="outlined"
              fullWidth
              onBlur={validateYear}
              margin="normal"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={oneTimeCustomer}
            />
          </div>
        )}

        {/* If oneTimeCustomer, show only prefix and name on step 0, and plate number + new/old tick on step 1 */}
        {oneTimeCustomer && activeStep === 0 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="200px"
            gap={2}
          >
            <Box sx={{ width: "100%", marginBottom: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={oneTimeCustomer}
                    onChange={(e) => setOneTimeCustomer(e.target.checked)}
                    size="small"
                  />
                }
                label="One Time Customer"
                sx={{ margin: 0 }}
              />
            </Box>
            <Typography variant="h6" color="primary">
              One Time Customer Mode Enabled
            </Typography>
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
              sx={{ width: "50%" }}
            />
            <TextField
              required
              label="Customer Name"
              size="small"
              variant="outlined"
              margin="normal"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              sx={{ width: "50%" }}
            />
          </Box>
        )}

        {oneTimeCustomer && activeStep === 1 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="200px"
            gap={2}
          >
            <Box sx={{ width: "100%", marginBottom: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={oneTimeCustomer}
                    onChange={(e) => setOneTimeCustomer(e.target.checked)}
                    size="small"
                  />
                }
                label="One Time Customer"
                sx={{ margin: 0 }}
              />
            </Box>
            <Typography variant="h6" color="primary">
              One Time Customer Mode Enabled
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Please enter the vehicle number.
            </Typography>
            <TextField
              required
              label="Plate Number"
              size="small"
              variant="outlined"
              margin="normal"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              sx={{ width: "50%" }}
            />
            <TextField
              label="Phone number"
              size="small"
              variant="outlined"
              margin="normal"
              value={phone}
              onChange={handlePhoneChange}
              inputProps={{ maxLength: 10, type: "tel" }}
              sx={{ width: "50%" }}
              helperText="Enter 10 digits only"
            />
            {/* Old/New vehicle tick logic */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isPlateNumberHidden}
                  onChange={handleCheckboxChange}
                  color="primary"
                />
              }
              label="New Vehicle (No Number Plate)"
            />
          </Box>
        )}
      </Box>

      {/* Add Vehicle Dialog */}
           {/* Add Vehicle Dialog */}
      <Dialog
        open={openAddVehicleDialog}
        onClose={() => setOpenAddVehicleDialog(false)}
        maxWidth="sm"
        fullWidth
        disablePortal
      >
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} paddingTop={1}>
            <Typography variant="h6">Add New Vehicle</Typography>

            {/* Top row: New vehicle checkbox + Plate number */}
            <Box display="flex" alignItems="center" gap={2}>
             <FormControlLabel
  control={
    <Checkbox
      checked={isPlateNumberHidden}
      onChange={(e) => {
        const checked = e.target.checked;
        setIsPlateNumberHidden(checked);

        if (checked) {
          // Auto-generate plate number
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          setDlgPlateNumber(`for-regn-${randomNum}`);

          //   AUTO SELECT CURRENT YEAR (example: 2026)
          setDlgYear(String(new Date().getFullYear()));
        } else {
          setDlgPlateNumber("");
          setDlgYear("");
        }
      }}
    />
  }
  label="New vehicle"
/>

              <TextField
                required
                label="Plate Number "
                size="small"
                fullWidth
                value={dlgPlateNumber}
                onChange={(e) => setDlgPlateNumber(e.target.value.toUpperCase())}
                disabled={isPlateNumberHidden}
                placeholder={isPlateNumberHidden ? "Auto-generated for registration" : ""}
              />
            </Box>

            {/* Fuel type */}
            <Box>
              <FormControl component="fieldset">
                <FormLabel component="legend">Fuel Type</FormLabel>
                <RadioGroup
                  row
                  aria-label="fuel type"
                  name="fuelTypeDialog"
                  value={dlgFuelType}
                  onChange={(e) => setDlgFuelType(normalizeFuelType(e.target.value))}
                >
                  <FormControlLabel value="Petrol" control={<Radio />} label="Petrol" />
                  <FormControlLabel value="Diesel" control={<Radio />} label="Diesel" />
                  <FormControlLabel value="EV" control={<Radio />} label="EV" />
                  <FormControlLabel value="Helmet" control={<Radio />} label="Helmet" />

                </RadioGroup>
              </FormControl>
            </Box>

            {/* Make / Model / Variant row */}
            <Box display="flex" gap={1}>
              <Autocomplete
                options={makes.map((item) => item.make_name)}
                value={dlgMake}
                onChange={(event, value) => {
                  setDlgMake(value || "");
                  // Reset model when make changes
                  setDlgModel("");
                  const selectedMake = makes.find((item) => item.make_name === value);
                  if (selectedMake) {
                    setModels(selectedMake.models);
                  } else {
                    setModels([]);
                  }
                }}
                freeSolo
                size="small"
                renderInput={(params) => (
                  <TextField {...params} label="Make*" />
                )}
                sx={{ flex: 1 }}
              />
              <Autocomplete
                options={Array.isArray(models) ? models : []}
                value={dlgModel}
                onChange={(event, value) => {
                  setDlgModel(value || "");
                }}
                freeSolo
                size="small"
                disabled={!dlgMake}
                renderInput={(params) => (
                  <TextField {...params} label="Model*" />
                )}
                sx={{ flex: 1 }}
              />
              <TextField label="Variant" size="small" value={dlgVin} onChange={(e) => setDlgVin(e.target.value)} sx={{ flex: 1 }} />
            </Box>

            {/* Registration Date / Chassis / Engine row */}
            <Box display="flex" gap={1}>
              <TextField
                label="Registration Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={dlgRegistrationDate}
                onChange={(e) => setDlgRegistrationDate(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField label="Chassis Number" size="small" value={dlgChassisNumber} onChange={(e) => setDlgChassisNumber(e.target.value)} sx={{ flex: 1 }} />
              <TextField label="Engine Number" size="small" value={dlgEngineNumber} onChange={(e) => setDlgEngineNumber(e.target.value)} sx={{ flex: 1 }} />
            </Box>

            {/* Year full width */}
            {/* <TextField
              required
              label="Year "
              size="small"
              fullWidth
              value={dlgYear}
              // onChange={(e) => setDlgYear(e.target.value)}
               onChange={(e) => setDlgYear(e.target.value)}
            /> */}


            <TextField

  label="Year"
  size="small"
  fullWidth
  value={dlgYear}
  onChange={(e) => setDlgYear(e.target.value)}
  // disabled={isPlateNumberHidden}
/>


            <Box display="flex" justifyContent="flex-end" gap={1} paddingTop={1}>
              <Button onClick={() => setOpenAddVehicleDialog(false)}>CANCEL</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  // if (!dlgMake || !dlgModel || !dlgFuelType || !dlgYear) {
                                if (!dlgMake || !dlgModel || !dlgFuelType ) {
                    setSnackbarMessage("Please fill required vehicle details");
                    setSnackbarSeverity("error");
                    setSnackbarOpen(true);
                    return;
                  }
                  try {
                    const token = Cookies.get("token");
                    const payload = {
                      customer_id: selectedCustomer.customer_id,
                      vehicles: [
                        {
                          make: dlgMake,
                          model: dlgModel,
                          year: parseInt(dlgYear, 10),
                          fuelType: dlgFuelType,
                          vin: dlgVin || "",
                          plate_number: dlgPlateNumber,
                          registrationDate: dlgRegistrationDate || "",
                          chassisNumber: dlgChassisNumber || "",
                          engineNumber: dlgEngineNumber || "",
                        },
                      ],
                    };
                    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/vehicles/${selectedCustomer.customer_id}/`, {
                      method: "PUT",
                      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (resp.status === 409) {
                      setSnackbarMessage("This plate number is already registered");
                      setSnackbarSeverity("error");
                      setSnackbarOpen(true);
                      return;
                    }
                    if (!resp.ok) {
                      const err = await resp.json();
                      throw new Error(err.error || "Failed to add vehicle");
                    }
                    const data = await resp.json();
                    const added = data.vehicle;

                    // Update vehicles list with the new vehicle
                    if (added) {
                      setVehiclesList([...vehiclesList, added]);
                      // Populate the form with the newly added vehicle
                      setPlateNumber(added.plateNumber || added.plate_number || dlgPlateNumber);
                      // setFuelType(added.fuelType || dlgFuelType);
                      setMake(added.make || dlgMake);
                      setModel(added.model || dlgModel);
                      setYear(added.year?.toString() || dlgYear);
                      setVin(added.vin || dlgVin);
                      setFuelType(normalizeFuelType(added.fuel_type || added.fuelType || dlgFuelType));
                      setRegistrationDate(added.registration_date || added.registrationDate || dlgRegistrationDate);
                      setChassisNumber(added.chassis_number || added.chassisNumber || dlgChassisNumber);
                      setEngineNumber(added.engine_number || added.engineNumber || dlgEngineNumber);
                      setSelectedVehicleId(added.vehicle_id || null);
                    }

                    // Clear dialog fields for next entry
                    setDlgPlateNumber("");
                    setDlgMake("");
                    setDlgModel("");
                    setDlgYear("");
                    setDlgVin("");
                    setDlgFuelType("");
                    setDlgRegistrationDate("");
                    setDlgChassisNumber("");
                    setDlgEngineNumber("");

                    setOpenAddVehicleDialog(false);
                    setSnackbarMessage("Vehicle added successfully");
                    setSnackbarSeverity("success");
                    setSnackbarOpen(true);
                  } catch (err) {
                    console.error(err);
                    setSnackbarMessage(err.message || "Failed to add vehicle");
                    setSnackbarSeverity("error");
                    setSnackbarOpen(true);
                  }
                }}
              >
                ADD VEHICLE
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

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
