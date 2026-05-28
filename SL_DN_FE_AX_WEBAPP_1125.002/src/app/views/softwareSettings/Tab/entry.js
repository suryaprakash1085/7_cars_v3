"use client";
import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import UOM from "./uom";
import Service from "./service";
import Expences from "./expences";
import Tiles from "./tiles";
import MakeModal from "./makemodal";
import GstModal from "./gst";
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <div>{children}</div>
        </Box>
      )}
    </div>
  );
}

export default function SimpleTabs() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Get tab from URL parameter
    const params = new URLSearchParams(window.location.search);
    const tabIndex = parseInt(params.get('tab')) || 0;
    setValue(tabIndex);
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    // Update URL when tab changes
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newValue);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <Box sx={{ width: "100%", height: "80vh", overflow: "auto" }}>
      <Tabs value={value} onChange={handleChange} aria-label="tabs">
        <Tab label="Tiles" />
        <Tab label="Unit of Measurement" />
        <Tab label="Service" />
        <Tab label=" Expences" />
        <Tab label="Make" />
        <Tab label="GST" />
      </Tabs>
      <TabPanel value={value} index={0}>
        <Tiles />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <UOM />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Service />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Expences />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <MakeModal />
      </TabPanel>
      <TabPanel value={value} index={5}>
        <GstModal />
      </TabPanel>
    </Box>
  );
}
