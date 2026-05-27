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
  IconButton,
  Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
import Navbar from "../../components/navbar";
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function Sidebar() {
  const router = useRouter();
  const [tilesToDisplay, setTilesToDisplay] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pageType, setPageType] = useState("tile");
  const [tabValue, setTabValue] = useState(0);
  const isPopstateRef = React.useRef(false);

  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down("sm"));

  // ---------- NORMALIZER ----------
  const normalize = (str = "") =>
  str
    .toString()
    .normalize("NFKC")              // normalize unicode
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width junk
    .replace(/\u00A0/g, " ")        // NBSP
    .replace(/\p{Zs}/gu, " ")       // ALL unicode spaces
    .replace(/\r?\n/g, "")          // newlines
    .replace(/\s+/g, " ")           // collapse multiple spaces
    .trim();


  // ---------- FETCH COMPANY ----------
  const fetchCompanyDetails = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`);
      const data = await res.json();
      const pageType = data?.company_details?.[0]?.page_type;

      if (pageType) {
        setPageType(pageType);
        Cookies.set("page_type", pageType, { expires: 7, sameSite: "lax" });
      }
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  // ---------- FETCH TILES ----------
  const fetchTiles = async () => {
    try {
      const token = Cookies.get("token");
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/tiles", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const tileData = await res.json();

      const accessCookie = Cookies.get("access");
      if (!accessCookie) return;

      let accessList = JSON.parse(accessCookie);

      accessList = accessList.map((a) =>
        typeof a === "string"
          ? normalize(a)
          : normalize(a?.name || a?.moduleName || a?.module)
      );

      const excludedTiles = [
        "telecaller",
        "leads",
        "software settings",
        "feedback",
        "Material Reports",
        "CustomerReport",
        "Gst Reports",
      ].map(normalize);

      const filteredTiles = tileData.filter((tile) => {
        const tileId = normalize(tile.tile_id);

        if (excludedTiles.includes(tileId)) return false;

        if (
          isMobileView &&
          (tileId === "job card" || tileId === "service center")
        )
          return false;

        return accessList.includes(tileId);
      });

      const orderedTiles = [];
      accessList.forEach((name) => {
        const match = filteredTiles.find(
          (t) => normalize(t.tile_id) === name
        );
        if (match && !orderedTiles.includes(match))
          orderedTiles.push(match);
      });

      setTilesToDisplay(orderedTiles);
    } catch (err) {
      console.error("Error fetching tiles:", err);
    }
  };

  // ---------- INIT ----------
  useEffect(() => {
    const token = Cookies.get("token");

    if (!token) {
      router.push("/");
      return;
    }

    setIsAuthenticated(true);
    fetchCompanyDetails();
    fetchTiles();

    // Read tab from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tabIndex = parseInt(params.get('tab')) || 0;
    setTabValue(tabIndex);
  }, []);

  // Update URL when tab value changes (skip if change is from popstate)
  useEffect(() => {
    if (tilesToDisplay.length > 0 && pageType === "tab" && !isPopstateRef.current) {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tabValue);
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
    isPopstateRef.current = false;
  }, [tabValue, pageType, tilesToDisplay]);

  // Sync tab state when URL changes (e.g., when back button is clicked)
  useEffect(() => {
    const handlePopState = () => {
      isPopstateRef.current = true;
      const params = new URLSearchParams(window.location.search);
      const tabIndex = parseInt(params.get('tab')) || 0;
      setTabValue(tabIndex);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!isAuthenticated) return null;

  // ---------- TILE GRID ----------
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
              cursor: "pointer",
            }}
            onClick={() => router.push(tile.route)}
          >
            <Box sx={{ width: "60px", height: "60px", mb: "15px" }}>
              <img
                src={tile.image}
                alt={tile.tile_name}
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  objectFit: "contain",
                  filter: "brightness(0) invert(1)",
                }}
              />
            </Box>
            <Typography sx={{ color: "white", textAlign: "center" }}>
              {tile.tile_name}
            </Typography>
          </Card>
        </motion.div>
      ))}
    </Box>
  );

  // ---------- TAB LAYOUT ----------
  const TabLayout = (
    <Box sx={{ width: "100%", color: "white" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.2)",
          backgroundColor: "rgba(0,0,0,0.3)",
          position: "sticky",
          top: "64px",
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={() => router.back()}
          sx={{
            color: "white",
            minWidth: "50px",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

       <Tabs
  value={tabValue}
  onChange={(e, newValue) => setTabValue(newValue)}
  variant="scrollable"
  scrollButtons="auto"
  sx={{
    flex: 1,
    "& .MuiTab-root": { color: "white" },
    "& .Mui-selected": { color: "#90caf9" },
  }}
>
  {tilesToDisplay.map((tile, index) => (
    <Tab
      key={index}
      label={tile.tile_name}       //  This shows the name
      icon={
        <img
          src={tile.image}
          alt={tile.tile_name}
          style={{
            width: 35,
            height: 35,
            filter: "brightness(0) invert(1)",
          }}
        />
      }
      iconPosition="top"            //  Icon above the text
    />
  ))}
</Tabs>

      </Box>

      <Box sx={{ height: "calc(100vh - 128px)" }}>
        {tilesToDisplay[tabValue] && (
          <iframe
            key={tabValue}
            src={tilesToDisplay[tabValue].route}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <Navbar pageName="" />
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {pageType === "tab" ? TabLayout : TileGrid}
      </Box>
    </>
  );
}
