"use client";

import { Box, Typography } from "@mui/material";

export default function Footer({ total = 0, label = "Net" }) {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        borderTop: "2px solid #ddd",
        zIndex: 1000,
        boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Typography
        sx={{
          fontWeight: "bold",
          fontSize: "1rem",
          color: "#333",
        }}
      >
        {label}: <span style={{ color: "#0066cc", fontSize: "1.1rem" }}>{typeof total === 'number' ? total.toFixed(2) : total}</span>
      </Typography>
    </Box>
  );
}
