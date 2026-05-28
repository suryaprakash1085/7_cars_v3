"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  useMediaQuery,
  Tabs,
  Tab,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import Navbar from "../../../components/navbar";
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";

const order = [
  "Leads",
  "Customers",
  "Inventory",
  "Work Schedule",
  "Telecaller",
  "Feedback",
  "Inventory Activity",
  "Job Card",
  "Job Assessment",
  "Purchase",
  "Counter Sales",
  "Service Center",
  "Service Inspection",
  "Invoice",
  "Cancel Invoice",
  "Convert to GST",
  "Job Status",
  "Customer Outstanding",
  "Vendor Outstanding",
  "Finance",
  "Reports",
  "Time Entry",
  "Time Report",
  "Gallery",
];

export default function Sidebar() {
  const router = useRouter();
  const [tiles, setTiles] = useState([]);
  const [tilesToDisplay, setTilesToDisplay] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");
  const [pageType, setPageType] = useState("tile");
  const [tabValue, setTabValue] = useState(0);

  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch company details
  const fetchCompanyDetails = async () => {
    try {
      const res = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/ss`);
      const data = await res.json();
      if (data?.company_details?.[0]?.page_type) {
        setPageType(data.company_details[0].page_type);
      }
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  // Fetch tiles
  const fetchTiles = async () => {
    const url = process.env.NEXT_PUBLIC_API_URL + "/tiles";
    try {
      const token = Cookies.get("token");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const tileData = await response.json();
      setTiles(tileData);

      const access = Cookies.get("access");
      if (access) {
        const accessList = JSON.parse(access);
        const filteredTiles = tileData.filter((tile) => {
          const tileId = tile.tile_id.toLowerCase().trim();
          if (
            isMobileView &&
            (tileId === "job card" || tileId === "service center")
          ) {
            return false;
          }

          return accessList.some((accessItem) => {
            let accessName = "";
            if (typeof accessItem === "string") {
              accessName = accessItem.toLowerCase().trim();
            } else if (typeof accessItem === "object") {
              accessName =
                accessItem.name?.toLowerCase().trim() ||
                accessItem.moduleName?.toLowerCase().trim() ||
                accessItem.module?.toLowerCase().trim() ||
                "";
            }
            return tileId.includes(accessName) || accessName.includes(tileId);
          });
        });

        const orderedTiles = [];
        order.forEach((item) => {
          filteredTiles.forEach((tile) => {
            if (tile.tile_id === item) orderedTiles.push(tile);
          });
        });
        setTilesToDisplay(orderedTiles);
      }
    } catch (error) {
      console.error("Error fetching tiles:", error);
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    const userRole = Cookies.get("role");

    if (!token) {
      router.push("/");
      return;
    }

    setIsAuthenticated(true);
    setRole(userRole);
    fetchCompanyDetails();
    fetchTiles();
  }, []);

  if (!isAuthenticated) return null;

  // ---- TILE VIEW ----
  const TileGrid = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(6, 1fr)",
          lg: "repeat(7, 1fr)",
        },
        gap: { xs: "10px", sm: "15px", md: "20px" },
        maxWidth: "1200px",
        width: "95%",
        padding: { xs: "20px", md: "40px" },
        position: "relative",
        zIndex: 1,
      }}
    >
      {tilesToDisplay.map((tile, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              background: "rgba(12, 12, 12, 0.15)",
              backdropFilter: "blur(50px)",
              borderRadius: "15px",
              padding: { xs: "10px", md: "20px" },
              height: { xs: "100px", md: "120px" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "1",
              cursor: "pointer",
            }}
            onClick={() => router.push(tile.route)}
          >
            <Box
              sx={{
                width: "60px",
                height: "60px",
                marginBottom: "15px",
              }}
            >
              <img
                src={tile.image}
                alt={tile.name}
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  objectFit: "contain",
                  filter: "brightness(0) invert(1)",
                }}
              />
            </Box>
            <Typography
              sx={{
                color: "white",
                textAlign: "center",
                fontSize: "1rem",
                fontWeight: "500",
              }}
            >
              {tile.tile_name}
            </Typography>
          </Card>
          
        </motion.div>
      ))}
    </Box>
  );

  // ---- TAB VIEW ----
  const TabLayout = (
    <Box sx={{ width: "100%", color: "white", height: "100vh" }}>
      {/* Tabs on Top */}
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="tile 
        "
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
          <Tab key={index} label={tile.tile_name} />
        ))}
      </Tabs>

      {/* Iframe area below tabs */}
      <Box
        sx={{
          width: "100%",
          height: "calc(100vh - 64px)",
          backgroundColor: "rgba(255,255,255,0.05)",
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
  );

  return (
    <div>
      {/* ✅ Show Navbar only when not in tab mode */}
      {pageType !== "tab" && <Navbar pageName="" />}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          minHeight: "89vh",
          position: "relative",
          // backgroundColor: "black",
        }}
      >
        {pageType === "tab" ? TabLayout : TileGrid}
      </Box>
    </div>
  );
}
