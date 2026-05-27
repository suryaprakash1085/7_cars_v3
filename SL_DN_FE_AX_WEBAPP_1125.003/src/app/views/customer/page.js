"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Cookies from "js-cookie";

import { motion } from "framer-motion";
import { Box, Card, Tabs, Tab } from "@mui/material";

// Define tiles (you can separate inventory/customer if needed)
const allTiles = [
  // { name: "Suppliers", route: "/views/inventory/suppliers", img: "/icons/supplier.png" },
  { name: "Leads", route: "/views/customer/leads", icon: "/icons/leads1.png" },
  { name: "Customers", route: "/views/customer/Salescustomers", icon: "/icons/customer1.png" },
];

export default function Sidebar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tilesToDisplay, setTilesToDisplay] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [pageType, setPageType] = useState("");

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
      return;
    }

    setIsAuthenticated(true);
    const access = Cookies.get("access");
    const page = Cookies.get("page_type") || "";
    setPageType(page);

    if (access) {
      try {
        const accessList = JSON.parse(access);

        const filteredTiles = allTiles.filter((tile) => {
          const tileName = tile.name.toLowerCase().trim();

          return accessList.some((accessItem) => {
            let accessName = "";
            if (typeof accessItem === "string") accessName = accessItem.toLowerCase().trim();
            else if (accessItem && typeof accessItem === "object")
              accessName =
                accessItem.name?.toLowerCase().trim() ||
                accessItem.moduleName?.toLowerCase().trim() ||
                accessItem.module?.toLowerCase().trim() ||
                "";

            return tileName.includes(accessName) || accessName.includes(tileName);
          });
        });

        setTilesToDisplay(filteredTiles);
      } catch {
        setTilesToDisplay([]);
      }
    }
  }, [router]);

  if (!isAuthenticated) return null;

  return (
    <div>
      {pageType !== "tab" && <Navbar pageName="Customer" />}

      {pageType === "tab" ? (
        <>
          {/* 🔹 Tabs View */}
          <Box sx={{ width: "100%" }}>
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
                  label={tile.name}
                  icon={
                    <img
                      src={tile.icon || tile.img}
                      alt={tile.name}
                      style={{ width: 32, height: 32, objectFit: "contain", filter: "brightness(0) invert(1)" }}
                    />
                  }
                  iconPosition="top"
                />
              ))}
            </Tabs>

            <Box sx={{ width: "100%", height: "calc(89vh - 56px)", background: "rgba(255,255,255,0.03)" }}>
              {tilesToDisplay[tabValue] && (
                <iframe
                  src={tilesToDisplay[tabValue].route}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              )}
            </Box>
          </Box>
        </>
      ) : (
        <>
          {/* 🔹 Card View */}
          <Box
            sx={{
              display: "flex",
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              minHeight: "89vh",
              position: "relative",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "20px",
                width: "30%",
                maxWidth: "1200px",
                padding: "40px",
              }}
            >
              {tilesToDisplay.map((tile, index) => (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                  <Link href={tile.route} passHref style={{ textDecoration: "none" }}>
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Card
                        sx={{
                          background: "rgba(12,12,12,0.15)",
                          backdropFilter: "blur(50px)",
                          borderRadius: "15px",
                          padding: "20px",
                          height: "120px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        <Box sx={{ width: "60px", height: "60px", marginBottom: "15px" }}>
                          <img
                            src={tile.img || tile.icon}
                            alt={tile.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                          />
                        </Box>
                        <Box sx={{ color: "white", textAlign: "center", fontSize: "1rem", fontWeight: 500 }}>{tile.name}</Box>
                      </Card>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </Box>
          </Box>
        </>
      )}
    </div>
  );
}
