"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { searchSupplier, handleBulkUpload } from "../../../../../controllers/supplierControllers";

import AddSupplier from "@/components/addSupplier";
import BackButton from "@/components/backButton";
import Navbar from "../../../../components/navbar";

import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";

import { motion } from "framer-motion";

import {
  Box,
  TextField,
  IconButton,
  Select,
  MenuItem,
  Button,
  Card,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  Snackbar,
  DialogTitle,
  Paper,
  Typography,
  Tooltip,
  Autocomplete,
  Alert,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ContactMailOutlinedIcon from "@mui/icons-material/ContactMailOutlined";
import CloseIcon from "@mui/icons-material/Close";
import Cookies from "js-cookie";
import DataNotFound from "@/components/dataNotFound";
import LoadingScreen from "@/components/loadingScreen";
export default function UserEntry() {
  const router = useRouter();
  const [token, setToken] = useState();
  const [selectedOption, setSelectedOption] = useState("customerName");
  const [searchText, setSearchText] = useState("");
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddCustomerModal, setOpenAddCustomerModal] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [typedname, setTypedname] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);

    async function fetchSuppliers() {
      try {
        if (!storedToken) {
          throw new Error("No token found. Please log in.");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/supplier`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch entries");

        const data = await response.json();

        console.log("supplier", data);
        setEntries(data);
        setFilteredEntries(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setSnackbarMessage(err.message);
        setOpenSnackbar(true);
        setLoading(false);
      }
    }
    fetchSuppliers();
  }, []);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  // const handleSearch = () => {
  //   if (!searchText) {
  //     setFilteredEntries(entries);
  //     return;
  //   }

  //   const results = entries.filter((tile) => {
  //     if (selectedOption === "customerName") {
  //       return `${tile.customer_name}`
  //         .toLowerCase()
  //         .includes(searchText.toLowerCase());
  //     } else if (selectedOption === "phone") {
  //       return tile.contact.phone.includes(searchText);
  //     }
  //     return false;
  //   });
  //   setFilteredEntries(results);
  // };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      searchSupplier(
        token,
        searchText,
        entries,
        setFilteredEntries,
        setOpenSnackbar,
        setSnackbarMessage,
        setSnackbarSeverity
      );
    }
  };

  const handleCardClick = (supplierId) => {
    router.push(`/views/inventory/suppliers/${supplierId}`);
  };

  const handleOpenModal = () => {
    setOpenAddCustomerModal(true); // Open modal
  };

  const handleCloseModal = () => setOpenAddCustomerModal(false);

  const handleSupplierSuccess = () => {
    setLoading(true);
    setSnackbarMessage("Supplier Added Successfully!");
    setOpenAddCustomerModal(false);
    setOpenSnackbar(true);
    window.location.reload();
    snackbarSeverity("success");
    // refresh the page after 2 seconds
    // setTimeout(() => {
    //   window.location.reload();
    // }, 2000);
  };

  const handleSnackbarClose = () => setOpenSnackbar(false);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/supplier/download-template`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Auto_Doc_Cockpit_Supplier-Template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setSnackbarMessage("Failed to download template");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      console.error(error);
    }
  };
 const pageType = Cookies.get("page_type"); // "tab" or others

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <div>
      {/* <Navbar pageName="Supplier" />
       */}
      {pageType !== "tab" && <Navbar pageName="Supplier" />}
      <Box
        sx={{
          backgroundSize: "cover",
          color: "white",

          minHeight: "89vh",
        }}
      >
        <Box paddingX="1%">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            {/* <div style={{ display: "flex" }}>
               <BackButton />
              <h1 style={{ marginLeft: "10px" }}>Supplier Registration</h1> 
            </div> */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                width: "100%",
                gap: 5,
                marginBottom: "16px",
                // color: "white",
              }}
            >
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search Suppliers"
                value={searchText}
                onChange={handleSearchChange}
                style={{ backgroundColor: "white" }}
                onKeyDown={handleKeyPress}
              />
              <Tooltip title="Add Supplier">
                <IconButton
                  variant="contained"
                  sx={{
                    borderRadius: 1,
                    padding: "10 10px",
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                  onClick={handleOpenModal}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <input
                type="file"
                accept=".xlsx"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(event) =>
                  handleBulkUpload(
                    event,
                    token,
                    setSnackbarMessage,
                    setSnackbarSeverity,
                    setOpenSnackbar,
                    setIsLoading
                  )
                }
              />

              <Tooltip title="Download Template">
                <IconButton
                  variant="contained"
                  onClick={handleDownloadTemplate}
                  sx={{
                    borderRadius: 1,
                    padding: "10 10px",
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                >
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>

              {/* </Button> */}
              <Tooltip title="Upload Excel">
                <IconButton
                  variant="contained"
                  sx={{
                    borderRadius: 1,
                    padding: "10 10px",
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                  onClick={() => fileInputRef.current.click()}
                >
                  <FileUploadIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </Box>
        <Box
          paddingX="1%"
          sx={{
            paddingTop: "1%",
            paddingBottom: "1%",
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : entries.length === 0 ? (
            <DataNotFound />
          ) : (
            <>
              <Box
                display="flex"
                flexWrap="wrap"
                gap={2}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                {filteredEntries.map((tile, index) => (
                  <motion.div
                    key={index}
                    className="box"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: [0, 0.71, 0.2, 1.01] }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleCardClick(tile.supplier_id)}
                    >
                      <Card
                        sx={{
                          height: "135px",
                          cursor: "pointer",
                          width: "180px",
                          borderRadius: "20px",
                          position: "relative",
                          padding: "10px 20px 20px 20px",
                          textAlign: "left",
                          boxShadow: 3,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ fontSize: "0.9rem" }}>
                          {/* <Tooltip title={tile.customer_name}> */}
                          <Typography variant="h5">
                            {tile.name?.length > 12
                              ? `${tile.name.substring(0, 12)}...`
                              : tile.name}
                          </Typography>
                          {/* </Tooltip> */}
                          <Typography variant="p" sx={{ marginTop: "0px" }}>
                            {tile.gst_number}
                          </Typography>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              margin: "15px 0px",
                            }}
                          >
                            <b>
                              <PhoneIphoneIcon
                                style={{
                                  fontSize: 15,
                                  verticalAlign: "middle",
                                  color: "#454546",
                                }}
                              />
                            </b>{" "}
                            <span
                              style={{ verticalAlign: "middle", color: "gray" }}
                            >
                              {tile.contact.phone}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 5,
                              color: "gray",
                            }}
                          >
                            <b>
                              <ContactMailOutlinedIcon
                                style={{
                                  fontSize: 15,
                                  verticalAlign: "middle",
                                  color: "#454546",
                                }}
                              />
                            </b>{" "}
                            <span
                              style={{ verticalAlign: "middle", color: "gray" }}
                            >
                              {`${tile.contact.address.street}, ${tile.contact.address.city}`}
                              ,<br />{" "}
                              {`${tile.contact.address.state} - ${tile.contact.address.zip}`}
                            </span>
                          </div>
                        </Box>
                      </Card>
                    </motion.div>
                  </motion.div>
                ))}
              </Box>
            </>
          )}
        </Box>

        {/* Modal for AddCustomer */}
        <Dialog
          open={openAddCustomerModal}
          // onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
        >
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent>
            <AddSupplier
              onSuccess={handleSupplierSuccess}
              onClose={handleCloseModal}
              typedname={typedname}
              setTypedname={setTypedname}
            />
          </DialogContent>
        </Dialog>

        <Snackbar open={openSnackbar}>
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}
