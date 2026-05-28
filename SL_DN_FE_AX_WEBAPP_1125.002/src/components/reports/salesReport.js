"use client";
// React and Next imports
import * as React from "react";
import { useState } from "react";

// Section Imports
import FinanceReports from "./sections/financeReports";
import CustomerReports from "./sections/customerReports";

// Search icon
// import SearchIcon from '@mui/icons-material/Search';

// Functional package imports
import { styled } from "@mui/material/styles";

// UI package imports
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid2";
import { Container, Typography } from "@mui/material";
import VehicleReports from "./sections/vehicleReports";

// Add these imports at the top with other imports
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";

import Stack from "@mui/material/Stack";
// import Button from '@mui/material/Button';
// import SearchIcon from '@mui/icons-material/Search';

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

export default function SalesReport({
  revenueData,
  customersServiceData,
  vehiclesServiceData,
  newCustomersData,
  servicesByType,
  revenueByService,
  performanceScore,
  datas,
  buttonRevenue,
  startDate,
  endDate,
}) {
  // Frontend input states
  const [startDateDisplay, setStartDateDisplay] = useState(dayjs());
  const [endDateDisplay, setEndDateDisplay] = useState(dayjs());
  const [start, setStartDate] = useState();
  const [end, setEndDate] = useState();
  const [selectedMonth, setSelectedMonth] = useState();
  const [selectedYear, setSelectedYeat] = useState("2024");

  const [revenueResult, setRevenueResult] = useState();
  const [revenueByServiceResult, setRevenueByServiceResult] = useState();

  const [showIndex, setShowIndex] = useState(0);
  const [Search, setSearch] = useState();

  //   try{
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/dashboard/revenue?startDate=${startDate}&endDate=${endDate}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           // Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     let res = await response.json();

  //     setRevenueResult(res)
  //     console.log({MessageChannel:revenueResult})
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // const filterData1 = async (startDate, endDate) => {
  //   try {
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIoC_API_URL}/dashboard/revenueByServiceType?startDate=${startDate}&endDate=${endDate}`,
  //       {
  //         method: "GET",
  //         headers: {
  //            // Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     const res = await response.json();

  //     setRevenueByServiceResult(res)
  //     console.log({ revenueByService: res });
  //   } catch (error) {
  //     console.error("Error in filterData1:", error);
  //   }
  // };

  // // Wrapper Function to Call Both Filters
  // const handleFilterData = async () => {
  //   await filterData(startDate, endDate);
  //   await filterData1(startDate, endDate);
  // };

  return (
    <Container maxWidth="fluid">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between", // Aligns content on both ends
          alignItems: "center", // Aligns items vertically
          mb: 2,
        }}
      >
        <Typography variant="h5" color="white">
          SALES REPORT
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2, // Adds spacing between the components on the right
          }}
        ></Box>
      </Box>

      <Box sx={{ flexGrow: 1, maxHeight: "80vh", overflowY: "auto" }}>
        <Grid container spacing={2}>
          <Grid
            size={{ xs: 7, sm: 6, md: 4, lg: 2 }}
            sx={{ cursor: "pointer" }}
            onClick={() => setShowIndex(0)}
          >
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1">Finance Reports</Typography>
            </Item>
          </Grid>
          <Grid
            size={{ xs: 7, sm: 6, md: 4, lg: 2 }}
            sx={{ cursor: "pointer" }}
            onClick={() => setShowIndex(1)}
          >
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1">Customers Reports</Typography>
            </Item>
          </Grid>
          <Grid
            size={{ xs: 7, sm: 6, md: 4, lg: 2 }}
            sx={{ cursor: "pointer" }}
            onClick={() => setShowIndex(2)}
          >
            <Item
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1">Vehicle Reports</Typography>
            </Item>
          </Grid>
          {/* Charts */}
          {/* Total Revenue */}
          <Grid
            size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
            sx={{ display: showIndex === 0 ? "block" : "none" }}
          >
            <FinanceReports
              revenueData={revenueData}
              revenueByService={revenueByService}
              // datas={datas}
              // buttonRevenue={buttonRevenue}
            />
          </Grid>

          {/* Customer Reports */}
          <Grid
            size={{ xs: 7, sm: 12, md: 12, lg: 12 }}
            sx={{ display: showIndex === 1 ? "block" : "none" }}
          >
            <CustomerReports
              newCustomersData={newCustomersData}
              customersServiceData={customersServiceData}
              performanceScore={performanceScore}
              datas={datas}
              startDate={startDate}
              endDate={endDate}
            />
          </Grid>

          {/* Vehicles Serviced */}
          <Grid
            size={{ xs: 7, sm: 12, md: 12, lg: 12 }}
            sx={{ display: showIndex === 2 ? "block" : "none" }}
          >
            <VehicleReports
              vehiclesServiceData={vehiclesServiceData}
              servicesByType={servicesByType}
              datas={datas}
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
