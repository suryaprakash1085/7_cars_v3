"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Card, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";

let order = [
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
  "UDV",
];

export default function Sidebar() {
  const router = useRouter();

  const [tiles, setTiles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");
  const [tilesToDisplay, setTilesToDisplay] = useState([]);
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchTiles = async () => {
    let url = process.env.NEXT_PUBLIC_API_URL + "/tiles";
    try {
      const token = Cookies.get("token");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let tileData = await response.json();
      // console.log({ tileData });
      setTiles(tileData);

      const access = Cookies.get("access");
      if (access) {
        try {
          const accessList = JSON.parse(access);
          const filteredTiles = tileData.filter((tile) => {
            const tileId = tile.tile_id.toLowerCase().trim();

            // Exclude "Job Card" and "Service Center" on mobile view
            if (
              isMobileView &&
              (tileId === "job card" || tileId === "service center​")
            ) {
              return false;
            }

            return accessList.some((accessItem) => {
              let accessName;
              if (typeof accessItem === "string") {
                accessName = accessItem.toLowerCase().trim();
              } else if (accessItem && typeof accessItem === "object") {
                accessName =
                  accessItem.name?.toLowerCase().trim() ||
                  accessItem.moduleName?.toLowerCase().trim() ||
                  accessItem.module?.toLowerCase().trim() ||
                  "";
              }

              return tileId.includes(accessName) || accessName.includes(tileId);
            });
          });

          let list = [];

          const orderedTiles = order.map((item) => {
            filteredTiles.map((tile) => {
              // console.log({ item, tileID: tile.tile_id });
              if (tile.tile_id === item) {
                // console.log({ item, tileID: tile.tile_id });
                list.push(tile);
                tile;
              }
            });
          });

          setTilesToDisplay(list);
        } catch (error) {
          setTilesToDisplay([]);
        }
      }
    } catch (error) {
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    fetchTiles();
  }, []);

  useEffect(() => {
    const token = Cookies.get("token");
    const userRole = Cookies.get("role");

    if (!token) {
      router.push("/");
    } else {
      setIsAuthenticated(true);
      setRole(userRole);

      const access = Cookies.get("access");
      if (access) {
        try {
          const accessList = JSON.parse(access);
          // console.log({ tiles });
          const filteredTiles = tiles.filter((tile) => {
            // console.log("OMG!");
            const tileId = tile.tile_id.toLowerCase().trim();

            // // Exclude "Job Card" and "Service Center" on mobile view
            // if (
            //   isMobileView &&
            //   (tileId === "job card" || tileId === "service center​")
            // ) {
            //   return false;
            // }

            return accessList.some((accessItem) => {
              let accessName;
              if (typeof accessItem === "string") {
                accessName = accessItem.toLowerCase().trim();
              } else if (accessItem && typeof accessItem === "object") {
                accessName =
                  accessItem.name?.toLowerCase().trim() ||
                  accessItem.moduleName?.toLowerCase().trim() ||
                  accessItem.module?.toLowerCase().trim() ||
                  "";
              }

              return tileId.includes(accessName) || accessName.includes(tileId);
            });
          });

          // console.log({ filteredTiles, accessList });

          setTilesToDisplay(filteredTiles);
        } catch (error) {
          setTilesToDisplay([]);
        }
      }
    }
  }, [router, isMobileView]);

  if (!isAuthenticated) {
    return null; // Render nothing until authentication is confirmed
  }

  return (
    <div>
      <Navbar pageName="" />
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          minHeight: "89vh",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-5px",
            right: "-5px",
            bottom: "-8px",
            filter: "blur(2px)",
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(6, 1fr)",
              lg: "repeat(7, 1fr)",
            },
            gap: {
              xs: "10px",
              sm: "15px",
              md: "20px",
            },
            maxWidth: "1200px",
            width: "95%",
            padding: {
              xs: "20px",
              md: "40px",
            },
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
              <Link
                href={tile.route}
                passHref
                style={{ textDecoration: "none" }}
              >
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Card
                    sx={{
                      background: "rgba(12, 12, 12, 0.150)",
                      backdropFilter: "blur(50px)",
                      borderRadius: "15px",
                      padding: {
                        xs: "10px",
                        md: "20px",
                      },
                      height: {
                        xs: "100px",
                        md: "120px",
                      },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "1",
                    }}
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
                          filter: "brightness(0) invert(1)", // Makes icons white
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontSize: "1rem",
                        fontWeight: "500",
                      }}
                    >
                      {tile.tile_name}
                    </Box>
                  </Card>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </Box>
      </Box>
    </div>
  );
}
