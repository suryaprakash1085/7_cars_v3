"use client";

// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";

// UI package imports - Alphabetical
import {
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  Snackbar,
  TextField,
} from "@mui/material";

import "react-country-state-city/dist/react-country-state-city.css";
import { set } from "date-fns";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function AddProduct({
  token,
  category,
  onProductAdded = () => { },
  setOpenAddProductModal,
  typedname,
}) {
  // FrontEnd extracted data states
  const router = useRouter();

  // Backend Data states
  const [uomOptions, setUomOptions] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [gstOptions, setGstOptions] = useState([]);
  // Modal and Alert states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarPosition] = useState({
    vertical: "bottom",
    horizontal: "right",
  });

  // FrontEnd form input states - Customer Info
  const [type, setType] = useState(category);
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [gst, setGst] = useState("");
  const [uom, setUom] = useState("");
  const [price, setPrice] = useState("");

  const saveProduct = async (dta) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dta),
        }
      );
      if (response.ok) {
        const newProduct = await response.json();
        onProductAdded(Math.random());
        setSnackbarOpen(true);
        setSnackbarMessage("Product Added Successfully");
        setSnackbarSeverity("success");
        setOpenAddProductModal(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    setItem(typedname);
    async function fetchServiceData() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ss/service`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch Service data");
        const data = await response.json();
        setServiceOptions(data.services);
      } catch (error) {
        console.log("Error fetching Service data:", error);
      }
    }
    // const token = Cookies.get("token");
    async function fetchUomData() {
      const token = Cookies.get("token");
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uom`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            // "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch UOM data");
        const data = await response.json();
        setUomOptions(data);
      } catch (error) {
        console.log("Error fetching UOM data:", error);
      }
    }

 async function fetchGstData() {
      const token = Cookies.get("token");
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gst`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            // "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch GST data");
        const data = await response.json();
        setGstOptions(data);
      } catch (error) {
        console.log("Error fetching GST data:", error);
      }
    }
fetchGstData();
    fetchUomData();
    fetchServiceData();
  }, []);

  return (
    <div>
      <Box sx={style}>
        <h1>Create Product</h1>

        <div style={{ display: "flex", gap: 8 }}>
          <Autocomplete
            options={serviceOptions}
            getOptionLabel={(option) => option?.service_name || ""}
            value={
              serviceOptions.find((service) => service.service_name === type) ||
              null
            }
            onChange={(event, newValue) =>
              setType(newValue ? newValue.service_name : "")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Type"
                size="small"
                variant="outlined"
                fullWidth
                margin="normal"
                sx={{ flex: 1, marginRight: "8px", width: "150px" }}
              />
            )}
          />

          <TextField
            required
            label="Product Name"
            size="small"
            variant="outlined"
            fullWidth
            margin="normal"
            value={item || typedname}
            onChange={(e) => setItem(e.target.value)}
          />
        </div>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={"baseline"}
          marginY="normal"
        >
          <FormControl
            variant="outlined"
            size="small"
            sx={{ flex: 1, marginRight: "8px" }}
          >
            <InputLabel id="uom-label">UoM</InputLabel>
            <Select
              name="uom"
              labelId="uom-label"
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              label="UoM"
            >
              {uomOptions.map((uom) => (
                <MenuItem key={uom.id} value={uom.unit_shortcode}>
                  {uom.unit_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* <TextField
            label="Price"
            size="small"
            variant="outlined"
            fullWidth
            margin="normal"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            sx={{ flex: 1, marginTop: "16px" }}
          />*/}

          <TextField
            label="Price"
            size="small"
            variant="outlined"
            fullWidth
            margin="normal"
            type="number"
            value={price}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue === "" || Number(newValue) >= 0) {
                setPrice(newValue);
              }
            }}
            inputProps={{ min: 0 }}
            sx={{ flex: 1, marginTop: "16px" }}
          />
        </Box>
        <TextField
          label="Description"
          size="small"
          variant="outlined"
          fullWidth
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ flex: 1, marginTop: "16px" }}
        />

         <Box mt={2}>
        <FormControl size="small" fullWidth>
          <InputLabel id="gst-label">GST</InputLabel>
          <Select
            labelId="gst-label"
            value={gst}
            label="GST"
            onChange={(e) => setGst(e.target.value)}
          >
            {gstOptions.map((g) => (
              <MenuItem key={g.id} value={g.gst_percentage}>
                {g.gst_percentage}%
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>





        <Box display={"flex"} justifyContent={"flex-end"}>
          <Button
            variant="contained"
            onClick={() => {
              let dta = {
                category: type,
                part_name: item,
                description: description,
                uom: uom,
                price: price,
                gst: gst,
              };

              saveProduct(dta);
            }}
          >
            Save
          </Button>
        </Box>
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
    </div>
  );
}
