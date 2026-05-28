"use client";
//? React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import DataNotFound from "@/components/dataNotFound.js";
//? Function imports
import {
  fetchEntries,
  handleCardClick,
  handleCustomerSuccess,
  handleOpenModal,
  handleSnackbarClose,
  handleCloseModal,
  scrollToTopButtonDisplay,
  handleScrollToTop,
  infiniteScroll,
  searchFunction,
  fetchTotalCustomers,
  convertToCustomer,
  fetchLeadOwner,
  fetchCompanyDetails,
} from "../../../../controllers/customerControllers.js";
import Cookies from "js-cookie";

//? Component imports
import Navbar from "../../../components/navbar.js";
import AddCustomer from "@/components/addcust";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

//? Functional package imports
import { motion } from "framer-motion";

//? UI package imports
import {
  Box,
  Card,
  Dialog,
  DialogContent,
  IconButton,
  Snackbar,
  TextField,
  Typography,
  Fab,
  Tooltip,
  Badge,
} from "@mui/material";

//? Images and icon imports
import CloseIcon from "@mui/icons-material/Close";
import ContactMailOutlinedIcon from "@mui/icons-material/ContactMailOutlined";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import AddIcon from "@mui/icons-material/Add";

const filterStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f9f9f9",
  color: "black",
  height: "30px",
  width: "60px",
  padding: "10px",
  textAlign: "center",
  cursor: "pointer",
  borderRadius: "15px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
};

export default function UserEntry() {
  const router = useRouter();

  //? FrontEnd extracted data states
  let [token, setToken] = useState(null);

  //? Modal and Alert states
  const [openAddCustomerModal, setOpenAddCustomerModal] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [showFab, setShowFab] = useState(false);
  const [loadingSpinner, setLoadingSpinner] = useState(false);

  //? FrontEnd form input states
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(0);

  //? Backend Data states
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const [CallOwners, setcallowners] = useState([]);

  useEffect(() => {
    let storedToken = Cookies.get("token");
    setToken(storedToken);

    const initializeData = async () => {
      try {
        // First fetch total customers and call owners
        await fetchTotalCustomers(storedToken, setTotalCustomers, setcallowners);
        
        // Then fetch company details to get the limit
        const fetchLimit = await fetchCompanyDetails(storedToken, setLimit);
        
        // Only proceed with fetchEntries if we have a valid limit
        if (fetchLimit) {
          fetchEntries(
            storedToken,
            setOpenSnackbar,
            setSnackbarMessage,
            setSnackbarSeverity,
            fetchLimit,
            hasMore,
            setHasMore,
            offset,
            setOffset,
            setEntries,
            setFilteredEntries,
            setIsLoading,
            setError
          );
        }
      } catch (error) {
        console.error("Error initializing data:", error);
        setError(error.message);
      }
    };

    initializeData();
  }, []);

  return (
    <div>
      <Navbar pageName="Customer" />
      <Box
        sx={{
          color: "white",
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 5,
              }}
            >
              {/* //? Filter Count */}
              <Box>
                <Badge
                  badgeContent={totalCustomers}
                  max={99999}
                  color="primary"
                >
                  <div style={filterStyle}>All</div>
                </Badge>
              </Box>
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {/* //? Search Field */}
                <TextField
                  label="Search"
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={(e) => {
                    e.key === "Enter"
                      ? searchFunction(
                          token,
                          entries,
                          setEntries,
                          setFilteredEntries,
                          searchQuery,
                          setOpenSnackbar,
                          setSnackbarMessage,
                          setcallowners,
                          setSnackbarSeverity
                        )
                      : null;
                  }}
                  sx={{ backgroundColor: "white", borderRadius: 1 }}
                />

                {/* //? Add Customer Button */}
                <Tooltip title="Add Customer">
                  <IconButton
                    aria-label="addCustomer"
                    onClick={() => {
                      handleOpenModal(setOpenAddCustomerModal);
                    }}
                    sx={{
                      borderRadius: 1,
                      padding: "9px 10px",
                      backgroundColor: "white",
                      "&:hover": {
                        backgroundColor: "white",
                      },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </div>
          </div>
        </Box>
        <Box
          id="scrollable-table"
          paddingX="1%"
          sx={{
            paddingTop: "1%",
            paddingBottom: "1%",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
          onScroll={(event) => {
            scrollToTopButtonDisplay(event, setShowFab);
            infiniteScroll(
              event,
              token,
              setEntries,
              setFilteredEntries,
              searchQuery,
              setOpenSnackbar,
              setSnackbarMessage,
              setSnackbarSeverity,
              limit,
              isLoading,
              setIsLoading,
              hasMore,
              setHasMore,
              offset,
              setOffset,
              setLoadingSpinner
            );
          }}
        >
          {error ? (
            <p>Error: {error}</p>
          ) : filteredEntries.length === 0 ? (
            <DataNotFound />
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                id="scrollable-table"
                display="flex"
                flexWrap="wrap"
                gap={2}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: "1%",
                }}
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
                      onClick={() => handleCardClick(tile.customer_id, router)}
                    >
                      <Card
                        sx={{
                          height: "150px",
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
                          <Tooltip title={tile.customer_name}>
                            <Typography
                              variant="h6"
                              sx={{ marginBottom: "10px" }}
                            >
                              {tile.customer_name.length > 12
                                ? `${tile.customer_name.substring(0, 12)}...`
                                : tile.customer_name}
                            </Typography>
                          </Tooltip>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              marginBottom: "5px",
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
                          <Tooltip
                            title={`${tile.contact.address.street}, ${
                              tile.contact.address.city
                            }, ${tile.contact.address.state} ${
                              tile.contact.address.pin || ""
                            }`}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 5,
                                color: "gray",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
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
                                style={{
                                  verticalAlign: "middle",
                                  color: "gray",
                                }}
                              >
                                {`${tile.contact.address.street}, ${tile.contact.address.city}`}
                                ,<br />
                                {`${tile.contact.address.state} `}
                                {tile.contact.address.pin
                                  ? `- ${tile.contact.address.pin}`
                                  : ""}
                              </span>
                            </div>
                            <span
                              style={{ verticalAlign: "middle", color: "gray" }}
                            >
                              Leads Owner:{" "}
                              {CallOwners?.find(
                                (owner) => owner.user_id === tile.leads_owner
                              )?.username || tile.leads_owner}
                            </span>

                            {/* <span style={{ verticalAlign: "middle", color: "gray" }}>
                              Leads Owner:{" "}
                              {savedOwners?.find((owner) => owner.user_id === tile.leads_owner)
                                ?.username || "N/A"}
                            </span> */}
                          </Tooltip>
                          {/* <div
                            style={{
                              width: "100%",
                              display:
                                tile.contact.type == "Customer"
                                  ? "none"
                                  : "flex",
                              justifyContent: "flex-end",
                            }}
                          > */}

                          {tile.contact.type === "Lead" && (
                            <Tooltip title="Convert To Customer">
                              <IconButton
                                onClick={() =>
                                  convertToCustomer(
                                    token,
                                    router,
                                    tile,
                                    setSnackbarMessage,
                                    setOpenSnackbar,
                                    setSnackbarSeverity
                                  )
                                }
                              >
                                <PersonAddAlt1Icon color="primary" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* </div> */}
                        </Box>
                      </Card>
                    </motion.div>
                  </motion.div>
                ))}
              </Box>
            </div>
          )}
        </Box>

        {/* Modal for AddCustomer */}
        <Dialog
          open={openAddCustomerModal}
          // onClose={() => {
          //   handleCloseModal(setOpenAddCustomerModal);
          // }}
          maxWidth="md"
          fullWidth
        >
          <IconButton
            aria-label="close"
            onClick={() => {
              handleCloseModal(setOpenAddCustomerModal);
            }}
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
            <AddCustomer
              onSuccess={() => {
                handleCustomerSuccess(
                  setIsLoading,
                  setSnackbarMessage,
                  setOpenSnackbar,
                  setSnackbarSeverity
                );
              }}
              onClose={() => setOpenAddCustomerModal(false)}
            />
          </DialogContent>
        </Dialog>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          severity={snackbarSeverity}
          onClose={() => {
            handleSnackbarClose(setOpenSnackbar);
          }}
          message={snackbarMessage}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => {
                handleSnackbarClose(setOpenSnackbar);
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />
      </Box>

      {/* Back to Top FAB */}
      {showFab && (
        <Fab
          size="small"
          onClick={() => {
            handleScrollToTop();
            setShowFab(false);
          }}
          style={{
            backgroundColor: "white",
            color: "primary",
            position: "absolute",
            bottom: 40,
            right: 40,
            zIndex: 10,
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      )}
    </div>
  );
}
