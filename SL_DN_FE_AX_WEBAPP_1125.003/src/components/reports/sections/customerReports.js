"use client";
import IconButton from "@mui/material/IconButton";
import InfoIcon from "@mui/icons-material/Info";
import Popup from "./button";

import * as React from "react";
import { useState } from "react";
import Line from "../charts/lineChart";
import Bars from "../charts/barChart";
import GaugeCh from "../charts/gaugeChart";
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

export default function CustomerReports({
  newCustomersData,
  customersServiceData,
  performanceScore,
  startDate,
  endDate,
}) {
  let [token, setToken] = useState();
  const [isPopupOpen, setIsPopupOpen] = useState(false); // State to manage popup visibility

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
    getNoOfCustomersServicedDetails(token, startDate, endDate); // Open popup
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false); // Close popup
  };

  const getNoOfCustomersServicedDetails = async (token, startDate, endDate) => {
    console.log({ info: "getting info" });
    try {
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/customersPerMonth/fullData?startDate=${startDate}&endDate=${endDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let details = await response.json();
      console.log({ details });
    } catch (error) {
      console.log({ error });
    }
  };

  React.useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid
        size={{ xs: 12, sm: 12, md: 4, lg: 4 }}
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
          {/*//! DND Icon i can use */}
          <IconButton
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
          </IconButton>
          <Typography variant="subtitle1">
            Number of Customers Serviced
          </Typography>
          <Typography variant="h1">
            {customersServiceData?.total_customers_serviced}
          </Typography>
        </Item>
      </Grid>
      <Grid
        size={{ xs: 12, sm: 12, md: 4, lg: 4 }}
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
          {/*//! DND Icon i can use */}
          <IconButton
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
          </IconButton>

          <Typography variant="subtitle1">
            Average Number of New Customers Per Month
          </Typography>
          <Typography variant="h1">
            {newCustomersData?.total_new_customers &&
            newCustomersData?.newCustomerSplitup
              ? (
                  newCustomersData.total_new_customers /
                  newCustomersData.newCustomerSplitup.length
                ).toFixed(0) // Optional: round to 2 decimal places
              : "0"}
          </Typography>
        </Item>
        {/*//! DND Icon i can use */}
        <IconButton
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
        </IconButton>
        {/* console.log(chartData)
        console.log(revenueData)
        console.log(getAtvData) */}

        {/* console.log(retive then datas) */}
      </Grid>

      <Grid
        size={{ xs: 12, sm: 12, md: 4, lg: 4 }}
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
          {/*//! DND Icon i can use */}
          <IconButton
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
          </IconButton>
          <Typography variant="subtitle1">
            Total Number of New Customers
          </Typography>
          <Typography variant="h1">
            {newCustomersData?.total_new_customers}
          </Typography>
        </Item>
      </Grid>

      <Grid
        size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
        sx={{ position: "relative" }}
      >
        <Item>
          <Bars
            chartData={customersServiceData?.customerSplitup}
            name="Customers Serviced"
          />
        </Item>
        {/*//! DND Icon i can use */}
        <IconButton
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
        </IconButton>
      </Grid>

      <Grid
        size={{ xs: 12, sm: 12, md: 6, lg: 6 }}
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
          <Line chartData={newCustomersData?.newCustomerSplitup} />
        </Item>

        {/*//! DND Icon i can use */}
        <IconButton
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
        </IconButton>
      </Grid>
      {/*  */}

      {/* <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
        <Item>
          <Pie />
        </Item>
      </Grid> */}
      <Grid
        size={{ xs: 12, sm: 12, md: 6, lg: 6 }}
        sx={{ position: "relative" }}
      >
        <Item>
          <GaugeCh chartData={performanceScore} />
        </Item>
        {/*//! DND Icon i can use */}
        <IconButton
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
        </IconButton>
      </Grid>
      {isPopupOpen && <Popup onClose={handleClosePopup} />}
    </Grid>
  );
}
