"use client";
import IconButton from "@mui/material/IconButton";
import InfoIcon from "@mui/icons-material/Info";
import Popup from "./button";
import { useState } from "react";

import * as React from "react";

import Bars from "../charts/barChart";
import StackedBars from "../charts/stackedChart";

import { styled } from "@mui/material/styles";

import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import { Typography } from "@mui/material";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

export default function VehicleReports({
  vehiclesServiceData,
  servicesByType,
}) {
  // console.log({ vehiclesServiceData: vehiclesServiceData });

  const [isPopupOpen, setIsPopupOpen] = useState(false); // State to manage popup visibility

  const handleOpenPopup = () => {
    setIsPopupOpen(true); // Open popup
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false); // Close popup
  };

  return (
    <Grid container spacing={2}>
      <Grid
        size={{ xs: 7, sm: 12, md: 6, lg: 6 }}
        sx={{ position: "relative" }}
      >
        <Item>
          <Bars
            chartData={vehiclesServiceData?.vehicleSplitup}
            name="Vehicles Serviced"
          />
        </Item>
        {/*//! DND Icon i can use */}
        {/* <IconButton
          onClick={handleOpenPopup}
          sx={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 1)",
            },
            padding: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <InfoIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
        </IconButton> */}
      </Grid>

      <Grid
        size={{ xs: 7, sm: 12, md: 6, lg: 6 }}
        sx={{ position: "relative" }}
      >
        <Item>
          {/* {console.log({ servicesByType })} */}
          <StackedBars servicesByType={servicesByType} />
        </Item>

        {/*//! DND Icon i can use */}
        {/* <IconButton
          onClick={handleOpenPopup}
          sx={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 1)",
            },
            padding: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <InfoIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
        </IconButton> */}
      </Grid>

      <Grid
        size={{ xs: 7, sm: 12, md: 4, lg: 4 }}
        sx={{ position: "relative" }}
      >
        <Item
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1">Total Number of Services</Typography>
          <Typography variant="h1">
            {vehiclesServiceData?.total_vehicles_serviced}
          </Typography>
        </Item>

        {/*//! DND Icon i can use */}
        {/* <IconButton
          onClick={handleOpenPopup}
          sx={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 1)",
            },
            padding: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <InfoIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
        </IconButton> */}
      </Grid>

      <Grid
        size={{ xs: 7, sm: 12, md: 4, lg: 4 }}
        sx={{ position: "relative" }}
      >
        <Item
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1">
            Average Number of Services
          </Typography>
          <Typography variant="h1">
            {vehiclesServiceData?.total_vehicles_serviced &&
            vehiclesServiceData?.vehicleSplitup?.length
              ? (
                  vehiclesServiceData.total_vehicles_serviced /
                  vehiclesServiceData.vehicleSplitup.length
                ).toFixed(0)
              : "N/A"}
          </Typography>
        </Item>

        {/*//! DND Icon i can use */}
        {/* <IconButton
          onClick={handleOpenPopup}
          sx={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 1)",
            },
            padding: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <InfoIcon sx={{ fontSize: "20px", color: "#1976d2" }} />
        </IconButton> */}
      </Grid>
      {isPopupOpen && <Popup onClose={handleClosePopup} />}
    </Grid>
  );
}
