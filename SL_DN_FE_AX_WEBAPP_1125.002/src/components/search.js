"use client";
// React and Next imports
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

// UI package imports
import { TextField } from "@mui/material";

export default function Search() {
  // FrontEnd form input states
  const [searchQuery, setSearchQuery] = useState("");

  const filterRows = async (token, searchQuery) => {
    try {
      // Make the backend API call to search customers
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/search?search=${searchQuery}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRows(data);
      } else {
        setOpenSnackbar(true);
        setSnackbarMessage("Error fetching search results. Please try again.");
        setSnackbarSeverity("error");
        return rows; // Return existing rows if there's an error
      }
    } catch (error) {
      setOpenSnackbar(true);
      setSnackbarMessage("Error fetching search results. Please try again.");
      return rows; // Return existing rows if the fetch fails
    }
  };

  useEffect(() => {
    let storedToken = Cookies.get("token");
    setToken(storedToken);
  }, []);

  return (
    <>
      <TextField
        label="Search"
        variant="outlined"
        disabled={editRowId ? true : false}
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyUp={(e) => {
          e.key === "Enter"
            ? filterRows(
                token,
                rows,
                setRows,
                searchQuery,
                filterType,
                setOpenSnackbar,
                setSnackbarMessage,
                setSnackbarSeverity
              )
            : null;
        }}
        sx={{ backgroundColor: "white", borderRadius: 1 }}
      />
    </>
  );
}
