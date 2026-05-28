"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/navbar";
import BackButton from "@/components/backButton";
import Cookies from "js-cookie";
import {
  Box,
  Tabs,
  Tab,
  useMediaQuery,
} from "@mui/material";
import Range from "./Tab/range";
import UserManagement from "./Tab/userManagement";
import WorkScheduleEntry from "./Tab/workScheduleEntry";
import Entry from "./Tab/entry";
import CompanyDetails from "./Tab/companyDetails";
import RoleChange from "./Tab/roleChange";
import Whatsapp from "./Tab/whatsappTemplate";
import CityStateManager from "./Tab/CityStateManager";
import CompanyNumberRanges from "./Tab/companyNumberRanges";
import TimezoneManager from "./Tab/timezoneManager";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`,
  };
}

export default function SoftwareSettings() {
  const [value, setValue] = useState(0);
  const isSmallScreen = useMediaQuery("(max-width:600px)");
  const [rolename, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = Cookies.get("role");
    setRole(role);
    
    // Retrieve and safely parse the selected tab value from cookies
    const savedValue = Cookies.get("selectedTab");
    if (savedValue) {
      try {
        setValue(JSON.parse(savedValue));
      } catch (e) {
        console.error("Error parsing saved selectedTab:", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Update cookies whenever the selected tab changes
  useEffect(() => {
    Cookies.set("selectedTab", JSON.stringify(value));
  }, [value]);

  // Check if the role is not Admin or Power Admin or Lead Tester
  if (isLoading) {
    return null;
  }

  const access = Cookies.get("access");
  const hasSoftwareSettingsAccess = access && access.includes("Software Settings");

  if (!hasSoftwareSettingsAccess && rolename !== "Admin" && rolename !== "Power Admin" && rolename !== "Lead Tester") {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f0f0" }}>
          <h1>Access Denied</h1>
        </div>
      </div>
    );
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      <Navbar pageName="Software Settings" /> 
      {/* {pageType !== "tab" && <Navbar pageName="Software Settings" /> } */}
      <Box sx={{ backgroundSize: "cover", minHeight: "89vh" }}>
        <Box paddingX="1%">
          <Box sx={{ flexGrow: 1, bgcolor: "background.paper", display: "flex", height: "90vh", borderRadius: "2px", flexDirection: "column", overflow: "auto" }}>
            <Tabs
              orientation={isSmallScreen ? "vertical" : "horizontal"}
              variant="scrollable"
              scrollButtons="auto"
              value={value}
              onChange={handleChange}
              aria-label="Settings tabs"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="UserRole" {...a11yProps(0)} />
              <Tab label="Range" {...a11yProps(1)} />
              <Tab label="Company Ranges" {...a11yProps(2)} />
              <Tab label="Users" {...a11yProps(3)} />
              <Tab label="Work schedule" {...a11yProps(4)} />
              <Tab label="Entry" {...a11yProps(5)} />
              <Tab label="Company Details" {...a11yProps(6)} />
              <Tab label="Whatsapp" {...a11yProps(7)} />
              <Tab label="City/State" {...a11yProps(8)} />
              <Tab label="Timezone" {...a11yProps(9)} />
            </Tabs>
            <TabPanel value={value} index={0}>
              <RoleChange style={{ overflow: "auto" }} />
            </TabPanel>
            <TabPanel value={value} index={1}>
              <Range />
            </TabPanel>
            <TabPanel value={value} index={2}>
              <CompanyNumberRanges />
            </TabPanel>
            <TabPanel value={value} index={3}>
              <UserManagement />
            </TabPanel>
            <TabPanel value={value} index={4}>
              <WorkScheduleEntry />
            </TabPanel>
            <TabPanel value={value} index={5}>
              <Entry />
            </TabPanel>
            <TabPanel value={value} index={6}>
              <CompanyDetails />
            </TabPanel>
            <TabPanel value={value} index={7}>
              <Whatsapp />
            </TabPanel>
            <TabPanel value={value} index={8}>
              <CityStateManager />
            </TabPanel>
            <TabPanel value={value} index={9}>
              <TimezoneManager />
            </TabPanel>
          </Box>
        </Box>
      </Box>
    </div>
  );
}
