"use client";
// React and Next imports
import * as React from "react";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

import dayjs from "dayjs";
// Function imports
import {
  getRevenueData,
  getAtvData,
  getRevenueByServiceData,
} from "@/components/reports/helpers/finanaceHelper";
import {
  getNewCustomersData,
  getPerformanceScore,
} from "@/components/reports/helpers/customerHelper";
import {
  getCustomersServiced,
  getVehiclesServiced,
  getServicesCount,
} from "@/components/reports/helpers/vehicleHelper";

import { getButtonRevenue } from "@/components/reports/helpers/buttonHelper";

// Component imports
import Navbar from "@/components/navbar";
import Dashboard from "@/components/reports/dashboard";
import SalesReport from "@/components/reports/salesReport";
import CrmReport from "@/components/reports/crmReports";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import SettingsAccessibilityIcon from "@mui/icons-material/SettingsAccessibility";
// import { start } from "repl";
import Button from "@mui/material/Button";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import dayjs from 'dayjs';

import SearchIcon from "@mui/icons-material/Search";

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});
const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
  ],
}));

const DrawerListItems = [
  { name: "Dashboard", icon: <DashboardIcon /> },
  { name: "Sales Report", icon: <TrendingUpIcon /> },
  { name: "Employee Report", icon: <GroupIcon /> },
  { name: "CRM Report", icon: <SettingsAccessibilityIcon /> },
];

export default function Reports() {
  const theme = useTheme();
  const [startDate, setStartDate] = useState(dayjs().month(0).startOf("month")); // Start of January of current year
  const [startDateDisplay, setStartDateDisplay] = useState(
    dayjs().month(0).startOf("month")
  ); // Current date to display in the DatePicker

  const [endDateDisplay, setEndDateDisplay] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [token, setToken] = useState();
  let [revenueData, setRevenueData] = useState();
  let [customersServiceData, setCustomersServiceData] = useState();
  let [vehiclesServiceData, setVehiclesServiceData] = useState();
  let [newCustomersData, setNewCustomersData] = useState();
  let [atv, setAtv] = useState();
  let [servicesByType, setServicesByType] = useState();
  let [revenueByService, setRevenueByService] = useState();
  let [performanceScore, setPerformanceScore] = useState();
  let [buttonRevenue, setButtonRevenue] = useState();

  const [showIndex, setShowIndex] = useState(0);
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    let storedToken = Cookies.get("token");
    setToken(storedToken);
    getRevenueData(storedToken, setRevenueData, startDate, endDate);
    getCustomersServiced(
      storedToken,
      setCustomersServiceData,
      startDate,
      endDate
    );
    getVehiclesServiced(
      storedToken,
      setVehiclesServiceData,
      startDate,
      endDate
    );
    getNewCustomersData(storedToken, setNewCustomersData, startDate, endDate);
    getPerformanceScore(storedToken, setPerformanceScore, startDate, endDate);
    getAtvData(storedToken, setAtv, startDate, endDate);
    getServicesCount(storedToken, setServicesByType, startDate, endDate);
    getRevenueByServiceData(
      storedToken,
      setRevenueByService,
      startDate,
      endDate
    );
    getButtonRevenue(storedToken, setButtonRevenue, startDate, endDate);
  }, [startDate, endDate]);
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {/* <Navbar pageName="Reports" /> */}
      {pageType !== "tab" && <Navbar pageName="Reports" />  }
      <Box sx={{ display: "flex" }}>
        <CssBaseline />

        <Drawer
          variant="permanent"
          open={open}
          sx={{
            "& .MuiDrawer-paper": {
              marginTop: "82px",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
            },
          }}
        >
          <DrawerHeader>
            <IconButton
              onClick={handleDrawerClose}
              sx={[
                {
                  color: "white",
                },
                !open && { display: "none" },
              ]}
            >
              {theme.direction === "rtl" ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={[
                {
                  color: "white",
                  marginRight: 0.6,
                },
                open && { display: "none" },
              ]}
            >
              <MenuIcon />
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List>
            {DrawerListItems.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  sx={[
                    {
                      minHeight: 48,
                      px: 2.5,
                    },
                    open
                      ? {
                          justifyContent: "initial",
                        }
                      : {
                          justifyContent: "center",
                        },
                  ]}
                  onClick={() => setShowIndex(index)}
                >
                  <ListItemIcon
                    sx={[
                      {
                        color: "white",
                        minWidth: 0,
                        justifyContent: "center",
                      },
                      open
                        ? {
                            mr: 3,
                          }
                        : {
                            mr: "auto",
                          },
                    ]}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    sx={[
                      open
                        ? {
                            opacity: 1,
                          }
                        : {
                            opacity: 0,
                          },
                    ]}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </Drawer>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                views={["year", "month"]}
                value={startDateDisplay}
                onChange={(newValue) => {
                  setStartDateDisplay(newValue);
                  const formattedDate = dayjs(newValue).format("YYYY-MM");
                  console.log({ formattedDate });
                  setStartDate(formattedDate);
                  console.log({ startDate: formattedDate });
                }}
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  "& .MuiInputBase-root": {
                    color: "black",
                  },
                }}
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                views={["year", "month"]}
                value={endDateDisplay}
                onChange={(newValue) => {
                  setEndDateDisplay(newValue);
                  const formattedDate = dayjs(newValue).format("YYYY-MM");
                  setEndDate(formattedDate);
                  console.log({ end: formattedDate });
                }}
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  "& .MuiInputBase-root": {
                    color: "black",
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              display: showIndex === 0 ? "block" : "none",
              maxHeight: "87vh",
              overflowY: "auto",
            }}
          >
            {console.log({
              revenueData,
              customersServiceData,
              vehiclesServiceData,
              newCustomersData,
              atv,
              performanceScore,
            })}
            <Dashboard
              revenueData={revenueData}
              customersServiceData={customersServiceData}
              vehiclesServiceData={vehiclesServiceData}
              newCustomersData={newCustomersData}
              atv={atv}
              performanceScore={performanceScore}
            />
          </Box>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              maxHeight: "87vh",
              overflowY: "auto",
              display: showIndex === 1 ? "block" : "none",
            }}
          >
            <SalesReport
              revenueData={revenueData}
              customersServiceData={customersServiceData}
              vehiclesServiceData={vehiclesServiceData}
              newCustomersData={newCustomersData}
              servicesByType={servicesByType}
              revenueByService={revenueByService}
              performanceScore={performanceScore}
              buttonRevenue={buttonRevenue}
              startDate={startDate}
              endDate={endDate}
            />
          </Box>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              maxHeight: "87vh",
              overflowY: "auto",
              display: showIndex === 2 ? "block" : "none",
            }}
          >
            <Typography
              sx={{
                marginBottom: 2,
              }}
            >
              EMPLOYEE REPORT
            </Typography>
          </Box>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              maxHeight: "87vh",
              overflowY: "auto",
              display: showIndex === 3 ? "block" : "none",
            }}
          >
            {/* <CrmReport startDate={startDate} endDate={endDate} /> */}
            <CrmReport />
          </Box>
        </Box>
      </Box>
    </div>
  );
}
