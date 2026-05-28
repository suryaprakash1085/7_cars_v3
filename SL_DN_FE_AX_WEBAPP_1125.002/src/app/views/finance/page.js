"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";
import Cookies from "js-cookie";
import { Tabs, Tab, Box, Tooltip } from "@mui/material";

// 🔹 All possible tabs
const allTiles = [
  // Inventory

  // Finance
  { name: "Customers", route: "/views/finance/customerPayment", icon: "/icons/customer1.png" },
  { name: "Supplier", route: "/views/finance/vendorPayment", icon: "/icons/supplier.png" },
  { name: "Ledger Book", route: "/views/finance/ledgerBook", icon: "/icons/ledger_books.png" },
];

const normalize = (str = "") => str.toLowerCase().replace(/[\s_-]/g, "");

export default function InventoryActivityTabs() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tilesToDisplay, setTilesToDisplay] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  // 🔹 Client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🔹 Auth + Access filter
  useEffect(() => {
    if (!isClient) return;

    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
      return;
    }
    setIsAuthenticated(true);

    const access = Cookies.get("access");
    if (!access) {
      setTilesToDisplay(allTiles);
      return;
    }

    try {
      const accessList = JSON.parse(access);

      const filteredTiles = allTiles.filter((tile) => {
        // Force Ledger Book / Goods Receipt to always show
        if (["Ledger Book", "Goods Receipt"].includes(tile.name)) return true;

        const tileName = normalize(tile.name);

        return accessList.some((accessItem) => {
          const accessName =
            typeof accessItem === "string"
              ? normalize(accessItem)
              : normalize(accessItem?.name || accessItem?.moduleName || accessItem?.module || "");

          return tileName.includes(accessName) || accessName.includes(tileName);
        });
      });

      setTilesToDisplay(filteredTiles.length ? filteredTiles : allTiles);
    } catch {
      setTilesToDisplay(allTiles);
    }
  }, [isClient, router]);

  // 🔹 Reset tab index when tiles change
  useEffect(() => {
    if (tilesToDisplay.length > 0) setTabValue(0);
  }, [tilesToDisplay]);

  // 🔹 Wait until client + authenticated
  if (!isClient) {
    return <Box sx={{ width: "100%", height: "89vh" }} />;
  }

  if (!isAuthenticated || tilesToDisplay.length === 0) return null;

  const pageType = Cookies.get("page_type");

  return (
    <>
      {pageType !== "tab" && <Navbar pageName="Finance" />}

      <Box sx={{ width: "100%", height: "89vh" }}>
     <Tabs
  value={tabValue}
  onChange={(e, newValue) => setTabValue(newValue)}
  variant="scrollable"
  scrollButtons="auto"
  sx={{
    backgroundColor: "rgba(0,0,0,0.35)",
    borderBottom: "1px solid rgba(255,255,255,0.25)",
    minHeight: 60,
    "& .MuiTab-root": { minHeight: 60, color: "white" },
    "& .Mui-selected": { color: "#90caf9" },
    "& .MuiTabs-indicator": { backgroundColor: "#90caf9", height: 3 },
  }}
>
  {tilesToDisplay.map((tile, index) => (
    <Tab
      key={index}
      label={tile.name}          //   Add this to show tab name
      icon={
        <img
          src={tile.icon}
          alt={tile.name}
          style={{
            width: 32,
            height: 32,
            objectFit: "contain",
            filter: "brightness(0) invert(1)", // white icon
          }}
        />
      }
      iconPosition="top"          // icon above text
    />
  ))}
</Tabs>



        <Box sx={{ width: "100%", height: "calc(89vh - 56px)", background: "rgba(255,255,255,0.03)" }}>
          {tilesToDisplay[tabValue] && (
            <iframe
              key={tilesToDisplay[tabValue].route}
              src={tilesToDisplay[tabValue].route}
              title={tilesToDisplay[tabValue].name}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </Box>
      </Box>
    </>
  );
}
