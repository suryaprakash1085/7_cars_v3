import { cleanDigitSectionValue } from "@mui/x-date-pickers/internals/hooks/useField/useField.utils";
import axios from "axios";

export const fetchCustomerDetails = async (
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
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch customer details");

    const data = await response.json();

    // setCustomer(data);

    setCustomerName(data.customer_name);
    setPrefix(data.prefix || "");
    setPhone(data.contact.phone);
    setGstNumber(data.gst_number || "");
    setEmail(data.contact.email || "");
    setStreet(data.contact.address.street || "");
    setCity(data.contact.address.city || "");
    setState(data.contact.address.state || "");
    setPinCode(data.contact.address.pinCode || "");
    setRefer(data.reference || "");
    setReferBy(data.referred_by || "");
    setLeadOwner(data.leads_owner || "");

    data.gst_number ? setGstCustomer(true) : setGstCustomer(false);
    // Ensure vehicles array exists and is properly formatted
    const formattedData = {
      ...data,
      vehicles: data.vehicles || [],
    };

    // Filter out any vehicles with null vehicle_id and ensure all required fields
    formattedData.vehicles = formattedData.vehicles
      .filter((vehicle) => vehicle && vehicle.vehicle_id)
      .map((vehicle) => ({
        ...vehicle,
        vehicle_id: vehicle.vehicle_id,
        make: vehicle.make || "N/A",
        model: vehicle.model || "N/A",
        plateNumber: vehicle.plateNumber || vehicle.plate_number || "N/A",
        fuelType: vehicle.fuelType || vehicle.fuel_type || "",
        year: vehicle.year || "",
        vin: vehicle.vin || "",
        registration_date: vehicle.registration_date || vehicle.registrationDate || "",
        chassis_number: vehicle.chassis_number || vehicle.chassisNumber || "",
        engine_number: vehicle.engine_number || vehicle.engineNumber || "",
      }));
    setCustomer(formattedData);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

export const handleAddVehicle = async (
  token,
  customer_id,
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
) => {
  const errorMessages = [];
  const currentYear = new Date().getFullYear();

  // Validate plate number
  const numberPlatePattern = /^[A-Z]{2}[0-9]{2}[A-Z -]{0,2}[0-9]{4}$/;
  if (
    !isPlateNumberHidden &&
    plateNumber &&
    !numberPlatePattern.test(plateNumber)
  ) {
    errorMessages.push("Valid Plate Number");
  }

  // Validate year
  const yearNumber = parseInt(year);
  if (!year || isNaN(yearNumber) || yearNumber > currentYear) {
    errorMessages.push("Valid Year (Past or Present only)");
  }

  // Validate other mandatory fields
  if (!make) errorMessages.push("Make");
  if (!fuelType) errorMessages.push("Fuel Type");
  if (!model) errorMessages.push("Model");

  // If there are any errors, show snackbar and return
  // if (errorMessages.length > 0) {
  //   setSnackbarMessage(`Please correct: ${errorMessages.join(", ")}`);
  //   setSnackbarSeverity("error");
  //   setSnackbarOpen(true);
  //   return;
  // }

  const normalizedFuelType = fuelType ? normalizeFuelType(fuelType) : "";

  // Prepare vehicle data
  const newVehicle = {
    make,
    model,
    year,
    fuelType: normalizedFuelType,
    vin: vin || "",
    plate_number: plateNumber,
    registrationDate: registrationDate || "",
    chassisNumber: chassisNumber || "",
    engineNumber: engineNumber || "",
  };

  const payload = {
    customer_id: customer_id,
    vehicles: [newVehicle],
  };

  console.log({ payload });

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/vehicles/${customer_id}/`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    console.log({ data });

    if (response.status === 409) {
      setSnackbarMessage("This plate number is already registered");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to add vehicle");
    }

    // Add the new vehicle to the existing customer state
    setCustomer((prevCustomer) => ({
      ...prevCustomer,
      vehicles: [
        ...prevCustomer.vehicles,
        {
          ...data.vehicle,
          vehicle_id: data.vehicle.vehicle_id,
          make: data.vehicle.make || "N/A",
          model: data.vehicle.model || "N/A",
          plateNumber:
            data.vehicle.plateNumber || data.vehicle.plate_number || "N/A",
          fuelType: data.vehicle.fuelType || data.vehicle.fuel_type || "",
          year: data.vehicle.year || "",
          vin: data.vehicle.vin || "",
          registration_date: data.vehicle.registration_date || data.vehicle.registrationDate || "",
          chassis_number: data.vehicle.chassis_number || data.vehicle.chassisNumber || "",
          engine_number: data.vehicle.engine_number || data.vehicle.engineNumber || "",
        },
      ],
    }));

    // Clear form fields
    setModalOpen(false);
    setPlateNumber("");
    setMake("");
    setModel("");
    setYear("");
    setVin("");
    setRegistrationDate("");
    setChassisNumber("");
    setEngineNumber("");

    // Show success message
    setSnackbarMessage("Vehicle added successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  } catch (err) {
    console.log(err);
    setSnackbarMessage(err.message || "Failed to add vehicle");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};

export const handleCloseModal = (
  setIsEditing,
  setModalOpen,
  setIsPlateNumberHidden,
  setFuelType,
  setPlateNumber,
  setMake,
  setModel,
  setYear,
  setVin
) => {
  setIsEditing(false);
  setModalOpen(false);
  setIsPlateNumberHidden(false);
  setFuelType("Petrol");
  setPlateNumber("");
  setMake("");
  setModel("");
  setYear("");
  setVin("");
};

export const handleCloseVehicleEditModal = (setEditModalOpen) => {
  setEditModalOpen(false);
};

export const handleCloseCustomerEditModal = (setCustomerEditModalOpen) => {
  setCustomerEditModalOpen(false);
};

export const handleCheckboxChange = (
  e,
  isPlateNumberHidden,
  setIsPlateNumberHidden,
  setPlateNumber,
  setYear
) => {
  setIsPlateNumberHidden(!isPlateNumberHidden); // Toggle visibility
  if (!isPlateNumberHidden) {
      setYear(new Date().getFullYear());
    setPlateNumber("For Registration"); // Set plate number when the checkbox is checked
  } else {
      setYear("");
    setPlateNumber(""); // Clear plate number if unchecked
  }
};

export const normalizeFuelType = (value) => {
  if (value === undefined || value === null || value === "") return "Petrol";
  const normalized = value.toString().trim().toLowerCase();
  if (normalized === "petrol") return "Petrol";
  if (normalized === "diesel") return "Diesel";
  if (normalized === "ev") return "EV";
  if (normalized === "helmat" || normalized === "helmet") return "Helmet";
  return value;
};

export const handleFuelTypeChange = (e, setFuelType) => {
  setFuelType(normalizeFuelType(e.target.value));
};

export const handleAddAppointment = async (
  router,
  token,
  vehId,
  plateNumber,
  customer_id,
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
) => {
  const appointmentPayload = {
    customer_id: customer_id,
    vehicle_id: vehId,
    plateNumber: plateNumber,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    status,
    telecaller,
    notes,
  };

  console.log(appointmentPayload);

  try {
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

    // Retrieve the appointment ID from the response
    const AppointmentId = data.AppointmentsArray?.appointment_id;
    console.log("Retrieved Appointment ID:", AppointmentId);

    if (data.error === "Cannot") {
      if (AppointmentId) {
        setAppointmentId(AppointmentId);
        setSnackbarOpen(true);
        setOpenRetryDialog(true);
      } else {
        console.log("Appointment ID not found in response");
        setSnackbarMessage("Failed to retrieve appointment ID.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } else if (response.ok) {
      if (AppointmentId) {
        setAppointmentId(AppointmentId);
        setAppointmentModalOpen(false);
        setAppointmentDate("");
        setAppointmentTime("");
        setStatus("scheduled");
        setTelecaller("self");
        setNotes("");

        // Redirect to the appointment inspection page with the appointment ID
        router.push(`/views/jobCard/${AppointmentId}`);
      } else {
        console.log("Appointment ID not found in response");
        setSnackbarMessage("Failed to retrieve appointment ID.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } else {
      throw new Error("Failed to add appointment");
    }
  } catch (err) {
    console.log("Error:", err);
    setSnackbarMessage("Failed to add appointment. Please try again.");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};

export const editVehicleClick = (
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
  // setRegistrationDate
  setRegistrationDate
) => {
  console.log({ vehicle });
  setIsEditing(true);
  setModalOpen(true);
  setVehicleId(vehicle.vehicle_id);
  setIsPlateNumberHidden(vehicle.plateNumber.split("-").includes("For"));
  setFuelType(normalizeFuelType(vehicle.fuelType || vehicle.fuel_type || ""));
  setPlateNumber(vehicle.plateNumber);
  setMake(vehicle.make);
  setModel(vehicle.model);
  setYear(vehicle.year);
  setVin(vehicle.vin);
  setEngineNumber(vehicle.engine_number || "");
  setChassisNumber(vehicle.chassis_number || "");
  setRegistrationDate(vehicle.registration_date || "");
  // resgistration_date
};

export const deleteVehicle = async (
  token,
  vehicle_id,
  setCustomer,
  setSnackbarOpen,
  setSnackbarMessage,
  setSnackbarSeverity
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/vehicle/${vehicle_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 409) {
      setSnackbarOpen(true);
      setSnackbarMessage("Cannot Delete Vehicle - Appointments Exist.");
      setSnackbarSeverity("error");
      return;
    }

    if (response.status === 404) {
      setSnackbarOpen(true);
      setSnackbarMessage("Vehicle not found.");
      setSnackbarSeverity("warning");
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to delete vehicle");
    }

    // Update customer state by removing the deleted vehicle
    setCustomer((prevCustomer) => ({
      ...prevCustomer,
      vehicles: prevCustomer.vehicles.filter(
        (v) => v.vehicle_id !== vehicle_id
      ),
    }));

    setSnackbarOpen(true);
    setSnackbarMessage("Vehicle deleted successfully.");
    setSnackbarSeverity("success");
  } catch (err) {
    setSnackbarOpen(true);
    setSnackbarMessage("Cannot Delete Vehicle - Appointments Exist.");
    setSnackbarSeverity("error");
  }
};

export const updateVehicle = async (
  token,
  customer_id,
  vehicle_id,
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
) => {
  const errorMessages = [];
  const currentYear = new Date().getFullYear();

  // Validate plate number
  const numberPlatePattern = /^[A-Z]{2}[0-9]{2}[A-Z -]{0,2}[0-9]{4}$/;
  if (
    !isPlateNumberHidden &&
    plateNumber &&
    !numberPlatePattern.test(plateNumber)
  ) {
    errorMessages.push("Valid Plate Number");
  }

  // Validate year
  const yearNumber = parseInt(year);
  if (!year || isNaN(yearNumber) || yearNumber > currentYear) {
    setSnackbarMessage("Please enter a valid year (past or present only)");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    return;
  }

  // Other validations
  if (!make) errorMessages.push("Make");
  if (!fuelType) errorMessages.push("fuelType");
  if (!model) errorMessages.push("Model");

  if (errorMessages.length > 0) {
    setSnackbarMessage(
      `Please fill in the following mandatory fields: ${errorMessages.join(
        ", "
      )}`
    );
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    return;
  }

  const normalizedFuelType = fuelType ? normalizeFuelType(fuelType) : "";

  const newVehicle = {
    make,
    model,
    year,
    fuelType: normalizedFuelType,
    vin,
    plate_number: plateNumber,
    registration_date: registrationDate || "",
    chassis_number: chassisNumber || "",
    engine_number: engineNumber || "",
  };

  const payload = {
    customer_id: customer_id,
    vehicles: [newVehicle],
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer/vehicle/${vehicle_id}/`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) throw new Error("Failed to update vehicle");

    const data = await response.json();

    // Update the customer state by replacing the updated vehicle
    setCustomer((prevCustomer) => ({
      ...prevCustomer,
      vehicles: prevCustomer.vehicles.map((v) =>
        v.vehicle_id === vehicle_id ? data.vehicle : v
      ),
    }));

    // After successfully adding the vehicle, fetch fresh customer details
    await fetchCustomerDetails(
      token,
      customer_id,
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

    // Clear form fields and close modal
    setModalOpen(false);
    setPlateNumber("");
    setMake("");
    setModel("");
    setYear("");
    setVin("");
  } catch (err) {
    console.log(err);
    setSnackbarOpen(true);
    setSnackbarMessage("Failed to update vehicle");
    setSnackbarSeverity("error");
  }
};

const validateStep = (
  customerDetails,
  setSnackbarOpen,
  setSnackbarMessage,
  setSnackbarSeverity
) => {
  const indianPhoneRegex =
    /^(\+91|91)?\s?-?\(?[6-9]\d{2}\)?\s?-?\d{3}\s?-?\d{4}$/;

  const onlyAlphabets = /^[a-zA-Z\s]+$/;

  const numberOnly = /^[0-9]{6}$/;

  const streetValid = /^[a-zA-Z0-9\s,/-]*$/;

  const emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!customerDetails.phone || !indianPhoneRegex.test(customerDetails.phone)) {
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    setSnackbarMessage("Invalid phone number");
  } else if (!customerDetails.customer_name) {
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    setSnackbarMessage("Customer name is mandatory");
  } else if (customerDetails.email && !emailValid.test(customerDetails.email)) {
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    setSnackbarMessage("Invalid email address");
  } else if (
    customerDetails.pin_code &&
    !numberOnly.test(customerDetails.pin_code)
  ) {
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    setSnackbarMessage("Please enter a valid pin code");
  } else if (
    !customerDetails.street ||
    !streetValid.test(customerDetails.street)
  ) {
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    setSnackbarMessage("Invalid characters in street name");
  } else {
    return true;
  }
};

export const updateCustomer = async (
  token,
  customer_id,
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
) => {
  if (
    validateStep(
      newCustomerDetails,
      setSnackbarOpen,
      setSnackbarMessage,
      setSnackbarSeverity
    )
  ) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/${customer_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCustomerDetails),
        }
      );

      console.log({ ok: response.ok });

      if (response.ok) {
        const updatedData = await response.json();

        // After successful update, fetch fresh customer details
        await fetchCustomerDetails(
          token,
          customer_id,
          setCustomer,
          setGstCustomer,
          setGstNumber,
          () => {}, // setLoading - pass empty function since we don't need it
          () => {}, // setError - pass empty function since we don't need it
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
        );

        setSnackbarOpen(true);
        setSnackbarMessage("Customer updated successfully");
        setSnackbarSeverity("success");
        setCustomerEditModalOpen(false);
      }
    } catch (err) {
      console.log(err.message);
      setSnackbarOpen(true);
      setSnackbarMessage("Failed to update customer");
      setSnackbarSeverity("error");
    }
  }
};

export const fetchVehicles = async (token, setModels, setMakes) => {
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
