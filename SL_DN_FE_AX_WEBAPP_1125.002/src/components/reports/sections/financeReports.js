"use client";

import IconButton from "@mui/material/IconButton";
import InfoIcon from "@mui/icons-material/Info";
import axios from "axios";

import * as React from "react";
import { useEffect, useState } from "react";

import Bars from "../charts/barChart";
import Pie from "../charts/pieChart";

import { styled } from "@mui/material/styles";

import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import { Typography } from "@mui/material";
import Popup from "./button";
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

export default function FinanceReports({
  revenueData,
  revenueByService,
  buttonRevenue,
}) {
  // console.log({ revenueData });

  const [isPopupOpen, setIsPopupOpen] = useState(false); // State to manage popup visibility
  const [customerbydate, setcustomerbydate] = useState();
  const handleOpenPopup = () => {
    setIsPopupOpen(true); // Open popup
    fetchcustomerbydate();
  };
  const fetchcustomerbydate = async (start, end) => {
    let result = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/customersbydate?startDate=${start}&endDate=${end}`
    );
    setcustomerbydate(result.data);

    console.log("con", result.data);
  };
  const handleClosePopup = () => {
    setIsPopupOpen(false); // Close popup
  };
  // console.log("saved thing", customerbydate);
  return (
    <Grid container spacing={2}>
      <Grid
        size={{ xs: 7, sm: 12, md: 8, lg: 8 }}
        sx={{ position: "relative" }}
      >
        <Item>
          <Bars
            chartData={revenueData?.revenueSplitup}
            datas={buttonRevenue}
            name="Revenue"
          />
        </Item>
        //! DND Icon i can use
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
        size={{ xs: 7, sm: 12, md: 4, lg: 4 }}
        sx={{ position: "relative" }}
      >
        <Item
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "94%",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Pie chartData={revenueByService} title="Sales by Service Type" />
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
      {isPopupOpen && (
        <Popup data={customerbydate} onClose={handleClosePopup} />
      )}
    </Grid>
  );
}
