"use client";
// React and Next imports
import * as React from "react";
import { useState } from "react";

// Section Imports

// Functional package imports
import { styled } from "@mui/material/styles";

// UI package imports
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid2";
import { Container, Typography } from "@mui/material";
import VehiclesServiced from "./sections/vehicleReports";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  height: "150px", // Added fixed height
  width: "100%", // Added full width
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

export default function Dashboard({
  revenueData,
  customersServiceData,
  vehiclesServiceData,
  newCustomersData,
  atv,
  performanceScore,
}) {
  // Modals and alert states
  const [showIndex, setShowIndex] = useState(0);
  // console.log({ atv: atv && atv[0]?.average_invoice_amount });

  let score = performanceScore && performanceScore[0]?.performanceScore;

  return (
    <Box>
      <Typography variant="h5" color="white">
        Dashboard
      </Typography>
      <Box sx={{ flexGrow: 1, maxHeight: "80vh", overflowY: "auto" }}>
        <Grid container spacing={2}>
          <Grid
            size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
            sx={{ cursor: "pointer" }}
            onClick={() => setShowIndex(0)}
          >
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1">Total Revenue</Typography>
              <Typography variant="h4">
                ₹ {revenueData?.total_revenue}
              </Typography>
            </Item>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
            sx={{ cursor: "pointer" }}
            onClick={() => setShowIndex(1)}
          >
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1">New Customers</Typography>
              <Typography variant="h4">
                {newCustomersData?.total_new_customers}
              </Typography>
            </Item>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
            sx={{ cursor: "pointer" }}
            onClick={() => setShowIndex(2)}
          >
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1">Customers Serviced</Typography>
              <Typography variant="h4">
                {customersServiceData?.total_customers_serviced}
              </Typography>
            </Item>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
            sx={{ cursor: "pointer" }}
            onClick={() => setShowIndex(3)}
          >
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1">Vehicles Serviced</Typography>
              <Typography variant="h4">
                {vehiclesServiceData?.total_vehicles_serviced}
              </Typography>
            </Item>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
            sx={{ cursor: "pointer" }}
            onClick={() => setShowIndex(4)}
          >
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {" "}
              <Typography variant="subtitle1">
                Average Transaction Value
              </Typography>
              <Typography variant="h4">
                {atv && atv[0]?.average_invoice_amount}
              </Typography>
            </Item>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
            sx={{ cursor: "pointer" }}
            onClick={() => setShowIndex(5)}
          >
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1">Satisfaction Rate</Typography>
              <Typography variant="h4">{score}</Typography>
            </Item>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
