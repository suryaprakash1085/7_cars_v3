"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";
import Cookies from "js-cookie";

import { Tabs, Tab, Box,Tooltip } from "@mui/material";

// 🔹 Define all tabs (SPELLING FIXED)
const allTiles = [
  {
    name: "Products",
    route: "/views/inventoryActivity/products",
     icon: "/icons/Products.png",
  },
  {
    name: "Movement",
    route: "/views/inventoryActivity/movement",
     icon: "/icons/Movement.png",
  },
  {
    name: "Goods Receipt",
    route: "/views/inventoryActivity/goodsreceipt",
     icon: "/icons/goods_receipt.png",
  },
];

export default function InventoryActivityTabs() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tilesToDisplay, setTilesToDisplay] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  // 🔹 Auth + Access Filter
  useEffect(() => {
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
        const tileName = tile.name.toLowerCase();

        return accessList.some((accessItem) => {
          const accessName =
            typeof accessItem === "string"
              ? accessItem.toLowerCase()
              : accessItem?.name?.toLowerCase() ||
                accessItem?.moduleName?.toLowerCase() ||
                accessItem?.module?.toLowerCase() ||
                "";

          return (
            tileName.includes(accessName) ||
            accessName.includes(tileName)
          );
        });
      });

      // 🔹 Fallback if no access matches
      setTilesToDisplay(filteredTiles.length ? filteredTiles : allTiles);
    } catch (err) {
      setTilesToDisplay(allTiles);
    }
  }, [router]);

  // 🔹 Reset tab index when tiles change
  useEffect(() => {
    if (tilesToDisplay.length > 0) {
      setTabValue(0);
    }
  }, [tilesToDisplay]);

  if (!isAuthenticated) return null;

 const pageType = Cookies.get("page_type"); // "tab" or others


  return (
    <>
      {/* <Navbar pageName="Inventory Activity" /> */}
  {pageType !== "tab" && <Navbar pageName="Inventory Activity" />}

      <Box
        sx={{
          width: "100%",
          height: "89vh",
          // mt: "70px", // ✅ prevents navbar overlap
        }}
      >
        {/* 🔹 Tabs */}
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
      label={tile.name}           // ✅ This displays the name
      icon={
        <img
          src={tile.icon}
          alt={tile.name}
          style={{
            width: 32,
            height: 32,
            objectFit: "contain",
            filter: "brightness(0) invert(1)", // optional white effect
          }}
        />
      }
      iconPosition="top"          // ✅ icon above the text
    />
  ))}
</Tabs>


        {/* 🔹 IFRAME CONTENT */}
        <Box
          sx={{
            width: "100%",
            height: "calc(89vh - 56px)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          {tilesToDisplay[tabValue] && (
            <iframe
              src={tilesToDisplay[tabValue].route}
              title={tilesToDisplay[tabValue].name}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          )}
        </Box>
      </Box>
    </>
  );
}
