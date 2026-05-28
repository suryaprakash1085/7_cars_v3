"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { State, City } from "country-state-city";
// import Cookies from "js-cookie";

import {
  Box,
  Typography,
  Modal,
  TextField,
  Button,
  Autocomplete,
  Snackbar,
  Alert,
} from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "95%",
  maxWidth: 600,
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  borderRadius: "10px",
  boxShadow: 24,
  p: 2.5,
};

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

const type = [
  { name: "Lead" },
  { name: "BlackList" },
  { name: "Customer Sales" },
  { name: "Customer Service" },
];

const userRole = Cookies.get("role");

export default function CreateUpdateModal({
  openCreateUpdateModal,
  setOpenCreateUpdateModal,
  details,
  data,
  stateOptions,
  url,
  method,
  disabledFields = [],
  onAddSuccess,
}) {
  const router = useRouter();

  const idKey = data
    ? Object.keys(data).find((key) => key.toLowerCase().endsWith("id"))
    : null;

  const idValue = idKey ? data[idKey] : "N/A";

  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [token, setToken] = useState(null);
  const [refer, setRefer] = useState(null);
  const [prefix, setprefix] = useState(null);
  const [addcustomerssOptions, setaddcustomerssOptions] = useState([]);
  const [formData, setFormData] = useState({ leadsOwner: "" });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    setToken(Cookies.get("token"));
  }, []);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  useEffect(() => {
    if (data && data.state && stateOptions && stateOptions.length > 0) {
      const state = stateOptions.find((option) => option.name === data.state);
      if (state) {
        setSelectedState(state);

        const citiesData = City.getCitiesOfState("IN", state.isoCode).map(
          (city) => ({
            ...city,
            label: city.name,
          }),
        );
        setCities(citiesData);

        const initialCity = citiesData.find((city) => city.name === data.city);
        setSelectedCity(initialCity || null);
      }
    }
  }, [data, stateOptions]);

  const [userName, setUserName] = useState("");

  useEffect(() => {
    setUserName(Cookies.get("userName") || "");
  }, []);

  useEffect(() => {
    if (!data?.leads_owner) {
      setFormData((prev) => ({
        ...prev,
        leads_owner: Cookies.get("userName") || "",
      }));
    }
  }, [data]);

  const handleInputChange = (key, value) => {
    if (key.toLowerCase().includes("name")) {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    }

    if (key.toLowerCase().includes("phone")) {
      value = value.replace(/[^0-9]/g, "").slice(0, 10);
    }

    if (key.toLowerCase().includes("mail")) {
      value = value.replace(/[^a-zA-Z0-9@._-]/g, "");
    }

    if (key.toLowerCase().includes("street")) {
      value = value.replace(/[^a-zA-Z0-9\s/_-]/g, "");
    }

    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleStateChange = (event, state) => {
    if (state) {
      const citiesData = City.getCitiesOfState("IN", state.isoCode).map(
        (city) => ({ ...city, label: city.name }),
      );
      setCities(citiesData);
      setSelectedState(state);
      setSelectedCity(null);
      setFormData((prev) => ({
        ...prev,
        state: state.name,
        city: "",
      }));
    } else {
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
    }
  };

  const handleSave = async () => {
    event.preventDefault();
    let errors = [];

    if (!formData.customer_name) errors.push("Customer Name is required");

    if (!formData.phone) errors.push("Phone Number is required");
    else if (formData.phone.length !== 10)
      errors.push("Phone must be 10 digits");

    if (!selectedState) errors.push("State required");
    if (!selectedCity) errors.push("City required");
    if (!formData.reference) errors.push("Reference required");
    if (!formData.prefix) errors.push("Prefix required");

    if (refer?.label === "Customer reference" && !formData.referred_by)
      errors.push("Referred By required");

    if (errors.length > 0) {
      setSnackbarMessage(errors.join(", "));
      setSnackbarOpen(true);
      return;
    }

    const dataToSend = {
      ...formData,
      prefix: prefix ? prefix.name : "",
      state: selectedState ? selectedState.name : null,
      city: selectedCity ? selectedCity.name : null,
    };

    try {
      const fetchUrl = method === "POST" ? url : `${url}/${idValue}`;

      const response = await fetch(fetchUrl, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error("Save failed");

      const result = await response.json();
      const newRow = {
        ...dataToSend,
        customer_id: result.customer_id || idValue,
      };

      onAddSuccess(newRow);
      setOpenCreateUpdateModal(false);
    } catch (e) {
      setSnackbarMessage(e.message);
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Modal open={openCreateUpdateModal}>
        <Box sx={style}>
          <Typography fontWeight={700} fontSize="16px">
            {details.action} {details.name}
          </Typography>

          <Typography fontSize="13px" color="text.secondary" mt={1}>
            Please enter the required details below
          </Typography>

          <Typography fontSize="13px" mt={1}>
            <strong>Leads Owner:</strong>{" "}
            {data.leads_owner || Cookies.get("userName")}
          </Typography>

          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: 1.5,
            }}
          >
            {formData &&
              Object.keys(formData).map((key, index) => {
                if (key === "state")
                  return (
                    <Autocomplete
                      key={index}
                      size="small"
                      disablePortal
                      options={stateOptions}
                      value={selectedState}
                      onChange={handleStateChange}
                      renderInput={(p) => <TextField {...p} label="State" />}
                    />
                  );

                if (key === "leads_owner")
                  return (
                    <TextField
                      key={index}
                      size="small"
                      label="Leads Owner"
                      value={formData.leads_owner || userName}
                      disabled // remove if you want editing
                    />
                  );

                if (key === "prefix")
                  return (
                    <Autocomplete
                      key={index}
                      size="small"
                      options={prefixOptions}
                      getOptionLabel={(o) => o.name}
                      value={formData.prefix ? { name: formData.prefix } : null}
                      onChange={(e, v) => {
                        setprefix(v);
                        handleInputChange(key, v ? v.name : "");
                      }}
                      renderInput={(p) => <TextField {...p} label="Prefix" />}
                    />
                  );

                if (key === "type")
                  return (
                    <Autocomplete
                      key={index}
                      size="small"
                      options={type}
                      getOptionLabel={(o) => o.name}
                      value={formData.type ? { name: formData.type } : null}
                      onChange={(e, v) => {
                        handleInputChange(key, v ? v.name : "");
                      }}
                      renderInput={(p) => <TextField {...p} label="Type" />}
                    />
                  );

                if (key === "city")
                  return (
                    <Autocomplete
                      key={index}
                      size="small"
                      disablePortal
                      options={cities}
                      value={selectedCity}
                      onChange={(e, newVal) => {
                        setSelectedCity(newVal);
                        handleInputChange(key, newVal ? newVal.name : "");
                      }}
                      renderInput={(p) => <TextField {...p} label="City" />}
                    />
                  );

                if (key === "reference")
                  return (
                    <Autocomplete
                      key={index}
                      size="small"
                      options={references}
                      getOptionLabel={(o) => o.name}
                      value={
                        formData.reference
                          ? {
                              name: formData.reference,
                              label: formData.reference,
                            }
                          : null
                      }
                      onChange={(e, v) => {
                        setRefer(v);
                        handleInputChange(key, v ? v.name : "");
                      }}
                      renderInput={(p) => (
                        <TextField {...p} label="Reference" />
                      )}
                    />
                  );

                // hide referred_by unless Customer reference is selected
                if (key === "referred_by") {
                  if (formData.reference !== "Customer reference") return null;

                  return (
                    <TextField
                      key={index}
                      size="small"
                      label="Referred By"
                      value={formData.referred_by || ""}
                      onChange={(e) =>
                        handleInputChange("referred_by", e.target.value)
                      }
                    />
                  );
                }

                return (
                  <TextField
                    key={index}
                    size="small"
                    label={key}
                    value={formData[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    disabled={disabledFields.includes(key)}
                  />
                );
              })}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              mt: 1,
            }}
          >
            <Button
              onClick={() => setOpenCreateUpdateModal(false)}
              variant="outlined"
              sx={{
                textTransform: "none",
                borderRadius: "6px",
                px: 2,
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: "6px",
                px: 2,
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert severity="error">{snackbarMessage}</Alert>
      </Snackbar>
    </>
  );
}
