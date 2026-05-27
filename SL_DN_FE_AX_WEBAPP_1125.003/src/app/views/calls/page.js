"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";
import Cookies from "js-cookie";

import { Tabs, Tab, Box,Tooltip } from "@mui/material";

// 🔹 Define all tabs
const allTiles = [
  {
    name: "Telecaller",
    route: "/views/calls/telecaller",
     icon: "/icons/call.png",
  },
  {
    name: "Feedback",
    route: "/views/calls/feedback",
    icon: "/icons/feedback1.png",
  },
];

export default function Sidebar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tilesToDisplay, setTilesToDisplay] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
      return;
    }

    setIsAuthenticated(true);

    const access = Cookies.get("access");
    if (access) {
      try {
        const accessList = JSON.parse(access);

        const filteredTiles = allTiles.filter((tile) => {
          const tileName = tile.name.toLowerCase().trim();

          return accessList.some((accessItem) => {
            let accessName = "";
            if (typeof accessItem === "string") {
              accessName = accessItem.toLowerCase().trim();
            } else if (accessItem && typeof accessItem === "object") {
              accessName =
                accessItem.name?.toLowerCase().trim() ||
                accessItem.moduleName?.toLowerCase().trim() ||
                accessItem.module?.toLowerCase().trim() ||
                "";
            }

            return (
              tileName.includes(accessName) ||
              accessName.includes(tileName)
            );
          });
        });

        setTilesToDisplay(filteredTiles);
      } catch {
        setTilesToDisplay([]);
      }
    }
  }, [router]);

  if (!isAuthenticated) return null;


    const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <>
      {pageType !== "tab" && <Navbar pageName="Calls" />}

      <Box sx={{ width: "100%", height: "89vh" }}>
        {/* 🔹 Tabs */}
       <Tabs
  value={tabValue}
  onChange={(e, newValue) => setTabValue(newValue)}
  variant="scrollable"
  scrollButtons="auto"
  sx={{
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    "& .MuiTab-root": { color: "white" },
    "& .Mui-selected": { color: "#90caf9" },
    backgroundColor: "rgba(0,0,0,0.3)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  }}
>
  {tilesToDisplay.map((tile, index) => (
    <Tab
      key={index}
      label={tile.name}           //  Add this to show the name
      icon={
        <img
          src={tile.icon}
          alt={tile.name}
          style={{
            width: 32,
            height: 32,
            objectFit: "contain",
            filter: "brightness(0) invert(1)",
          }}
        />
      }
      iconPosition="top"           //  icon above the text
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
