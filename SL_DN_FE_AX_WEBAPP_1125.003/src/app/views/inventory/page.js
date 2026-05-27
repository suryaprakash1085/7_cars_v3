"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import BackButton from "@/components/backButton";
import Navbar from "../../../components/navbar";
import Cookies from "js-cookie";

import { motion } from "framer-motion";

import { Box, Card } from "@mui/material";

// Define all tiles globally
const allTiles = [
  {
    name: "Suppliers",
    img: "/icons/supplier.png",
    route: "/views/inventory/suppliers",
  },
  // {
  //   name: "Products",
  //   img: "/icons/material.png",
  //   route: "/views/inventory/products",
  // },
  // {
  //   name: "Movement",
  //   img: "/icons/inventory_movements.png",
  //   route: "/app/inventory/movement",
  // },
  // {
  //   name: "Goods Receipt",
  //   img: "/icons/goods_receipt.png",
  //   route: "/app/inventory/goodsreceipt",
  // },
  
];

export default function Sidebar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");
  const [tilesToDisplay, setTilesToDisplay] = useState([]);

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

          const filteredTiles = allTiles.filter((tile) => {
            const tileName = tile.name.toLowerCase().trim();

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

              return (
                tileName.includes(accessName) || accessName.includes(tileName)
              );
            });
          });

          setTilesToDisplay(filteredTiles);
        } catch (error) {
          setTilesToDisplay([]);
        }
      }
    }
  }, [router]);

  if (!isAuthenticated) {
    return null; // Render nothing until authentication is confirmed
  }


    const pageType = Cookies.get("page_type"); // "tab" or others
  
  return (
    <div>
      {/* <Navbar pageName="Inventory Master" /> */}
        {pageType !== "tab" && <Navbar pageName="Inventory Master" />}  
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
            top: "6px",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(5px)",
            zIndex: 0,
          },
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
            position: "relative",
            zIndex: 1,
          }}
        >
          {allTiles.map((tile, index) => (
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
                      padding: "20px",
                      height: "120px",
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
                        src={tile.img}
                        alt={tile.name}
                        style={{
                          width: "100%",
                          height: "100%",
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
                      {tile.name}
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
