"use client";
import React, { useState, useEffect } from "react";

import Navbar from "@/components/navbar";
import * as XLSX from "xlsx";

import {
  handleEditClick,
  handleCancelClick,
  handleInputChange,
  handleAddClick,
  handleSaveNewRow,
  handleDeleteClick,
  confirmDelete,
  filterRows,
  handleOpenTransaction,
  infiniteScroll,
  scrollToTopButtonDisplay,
  handleScrollToTop,
} from "../../../../../controllers/movementControllers.js";
import { fetchCompanyDetails } from "../../../../../controllers/LeadsControllers.js";

import { styled } from "@mui/material/styles";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Cookies from "js-cookie";

import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Tooltip,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Fab,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import LoadingScreen from "@/components/loadingScreen.js";

export default function Inventory() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
  }, []);

  const [rows, setRows] = useState([
    {
      inventory_id: "",
      part_name: "",
      part_number: "",
      description: "",
      category: "",
      quantity: "",
      price: "",
      buying_price: "",
    },
  ]);

  const [editRowId, setEditRowId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorSeverity, setErrorSeverity] = useState("error");
  const [deleteRowId, setDeleteRowId] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [transcationData, setTranscationData] = useState([]);
  const [OpenTranscationModalState, setOpenTranscationModalState] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [uomOptions, setUomOptions] = useState([]);
  const [showFab, setShowFab] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [limit, setLimit] = useState(null);

  const isMobile = useMediaQuery("(max-width:900px)");
  const [currentTransactionDetails, setCurrentTransactiondetails] = useState({
    inventory_name: "",
    stock: "",
  });
  const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
  });

  // const filteredRows = filterRows(token, rows, searchQuery, filterType);

useEffect(() => {
  if (token) {
    fetchCompanyDetails(token, setLimit);
  }
}, [token]);




useEffect(() => {
  if (token && limit !== null) {

    async function fetchInventory() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inventory/?limit=${limit}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch entries");
        }

        const data = await response.json();

        setRows(data);
        setIsLoading(false);

      } catch (err) {
        console.log(err);
      }
    }

    fetchInventory();
  }

}, [token, limit]);


  useEffect(() => {
    async function fetchUomData() {
      try {
        if (!token) {
          throw new Error("No token available. Please log in again.");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uom`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to fetch UOM data: ${response.status}`
          );
        }

        const data = await response.json();
        setUomOptions(data);
      } catch (error) {
        console.error("UOM fetch error:", error);
        setSnackbarMessage(error.message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        // Set empty array as fallback
        setUomOptions([]);
      }
    }

    if (token) {
      fetchUomData();
    }
  }, [token]);

  // Close Error Message
  const handleCloseError = () => {
    setOpenSnackbar(false);
  };

  const handleExcelUpload = async (event) => {
    setIsLoading(true);
    const file = event.target.files[0];

    const reader = new FileReader();

    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const header = jsonData[4];
      const rows = jsonData.slice(5);
      const uniquePhoneNumbers = new Set();
      const result = [];

      //! remove later
      let inc = 0;
      //!

      rows.forEach((row, index) => {
        const rowData = {
          category: row[0],
          part_name: row[1],
          quantity: row[2],
          price: row[3],
          HSNCode: row[4],
          description: row[5],
          uom: row[6],
          gst: row[7],
        };

        inc++;

        if (rowData.category != undefined) {
          result.push(rowData);
          console.log("rd", rowData);
        } else {
          console.warn("Missing category in row:", rowData);
        }
      });

      // setRows((existingRows) => [...result, ...existingRows]);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory/bulkUpload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: result }),
        }
      );

      let res = await response.json();
      console.log(response);

      if (!response.ok) {
        // setShowError(response.statusText);
        setOpenSnackbar(true);
        setSnackbarSeverity("Error");
        setSnackbarMessage(res.error);
      } else {
        setIsLoading(false);
        let message = {
          updatedItems: res.result.existingItemUpdated,
          newItemAdded: res.result.newItemAdded,
          failedItems: res.result.failedInventory,
        };

        if (message.failedItems.length > 0) {
          downloadFailedDataAsExcel(message.failedItems);
        }

        setOpenSnackbar(true);
        setSnackbarSeverity("success");
        setSnackbarMessage(
          `Items Added: ${message.newItemAdded} | Items Updated: ${message.updatedItems} | Failed Items: ${message.failedItems.length}`
        );
        // location.reload();
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadFailedDataAsExcel = (failedInventory = []) => {
    const workbook = XLSX.utils.book_new();

    if (failedInventory.length > 0) {
      const customerSheet = XLSX.utils.json_to_sheet(failedCustomers);
      XLSX.utils.book_append_sheet(workbook, customerSheet, "Failed Inventory");
    }

    // Create and trigger the file download
    XLSX.writeFile(workbook, "failed_uploads.xlsx");
  };

  const handleSaveClick = async (
    inventoryId,
    editedData,
    setRows,
    setEditRowId,
    setEditedData
  ) => {
    try {
      // Ensure quantity and price are integers
      const quantity = parseInt(editedData.quantity, 10);
      const price = parseFloat(editedData.price);

      if (isNaN(quantity) || isNaN(price)) {
        setErrorMessage("Available Quantity and Price must be valid numbers.");
        setShowError(true);
        return;
      }

      // Prepare the data in the required format
      const updatedData = {
        part_name: editedData.part_name,
        part_number: editedData.part_number,
        description: editedData.description,
        category: editedData.category,
        quantity: quantity,
        price: price,
        buying_price: parseFloat(editedData.buying_price) || 0,
        uom: editedData.uom,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory/${inventoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update inventory item");
      }

      const updatedItem = await response.json();

      setRows((prevRows) =>
        prevRows.map((row) =>
          row.inventory_id === inventoryId ? updatedItem : row
        )
      );

      setEditRowId(null);
      setEditedData({});
    } catch (error) {
      setErrorMessage("Error updating inventory item");
      setShowError(true);
    }
  };

    const pageType = Cookies.get("page_type"); // "tab" or others
  

  return isLoading ? (
    <LoadingScreen Dialogue={"Please Wait..."} />
  ) : (
    <div>
      {/* <Navbar pageName="Inventory Movement" /> */}

       {pageType !== "tab" && <Navbar pageName="Inventory Movement" />}
      
      <Box
        sx={{
          backgroundSize: "cover",

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
              marginTop: pageType !== "tab" ? "0px" : "16px",
            }}
          >
            <div style={{ display: "flex" }}>
              {/* <BackButton />
              <h1 style={{ marginLeft: "10px", color: "white" }}>
                Inventory Master
              </h1> */}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {/* Filter Dropdown */}
              <Select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  filterRows(token, rows, setRows, searchQuery, e.target.value);
                }}
                displayEmpty
                disabled={editRowId ? true : false}
                variant="outlined"
                size="small"
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="spares">spares</MenuItem>
                <MenuItem value="accessories">accessories</MenuItem>
                <MenuItem value="services">services</MenuItem>
              </Select>

              {/* Search Field */}
              <TextField
                label="Search"
                variant="outlined"
                disabled={editRowId ? true : false}
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    filterRows(token, rows, setRows, searchQuery, filterType);
                  }
                }}
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              />

              {/* <Tooltip title="Add Item">
                <IconButton
                  aria-label="addItem"
                  disabled={editRowId ? true : false}
                  onClick={() =>
                    handleAddClick(setEditRowId, setEditedData, setIsAdding)
                  }
                  sx={{
                    borderRadius: 1,
                    padding: "0 10px",
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip> */}

              <Tooltip title="Download Template">
                <IconButton
                  aria-label="downloadTemplate"
                  disabled={editRowId ? true : false}
                  href="/Auto_Doc_Cockpit_INV-Template.xlsx"
                  sx={{
                    borderRadius: 1,
                    padding: "0 10px",
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                >
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upload Inventory">
                <Button
                  component="label"
                  disabled={editRowId ? true : false}
                  role={undefined}
                  variant="contained"
                  tabIndex={-1}
                  sx={{
                    color: "#616161",
                    borderRadius: 1,
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                  startIcon={<FileUploadIcon sx={{ color: "#616161" }} />}
                >
                  Upload Items
                  <VisuallyHiddenInput
                    type="file"
                    onChange={handleExcelUpload}
                    multiple
                  />
                </Button>
              </Tooltip>
            </div>
          </div>

          {isMobile ? (
            <Box
              id="scrollable-table"
              sx={{
                maxHeight: "70vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                pb: 2,
              }}
              onScroll={(event) => {
                scrollToTopButtonDisplay(event, setShowFab);
                infiniteScroll(
                  event,
                  token,
                  setRows,
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
                  setOffset
                );
              }}
            >
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      backgroundColor:
                        editRowId && row.inventory_id === editRowId
                          ? "#f5f5f5"
                          : "white",
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {row.part_name || "Unnamed Item"}
                    </Typography>

                    <Box sx={{ display: "grid", rowGap: 1, columnGap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Material ID
                      </Typography>
                      <Typography>{row.inventory_id || "-"}</Typography>

                      <Typography variant="body2" color="text.secondary">
                        Category
                      </Typography>
                      <Typography>{row.category || "-"}</Typography>

                      <Typography variant="body2" color="text.secondary">
                        Description
                      </Typography>
                      <Typography>{row.description || "-"}</Typography>

                      <Typography variant="body2" color="text.secondary">
                        UOM
                      </Typography>
                      <Typography>{row.uom || "-"}</Typography>

                      <Typography variant="body2" color="text.secondary">
                        Available Quantity
                      </Typography>
                      {editRowId === row.inventory_id ? (
                        <TextField
                          name="quantity"
                          value={editedData.quantity || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              handleInputChange(e, setEditedData);
                            }
                          }}
                          variant="standard"
                        />
                      ) : (
                        <Typography>{row.quantity}</Typography>
                      )}

                      <Typography variant="body2" color="text.secondary">
                        Price
                      </Typography>
                      {editRowId === row.inventory_id ? (
                        <TextField
                          name="price"
                          value={editedData.price || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              handleInputChange(e, setEditedData);
                            }
                          }}
                          variant="standard"
                        />
                      ) : (
                        <Typography>{row.price}</Typography>
                      )}

                      <Typography variant="body2" color="text.secondary">
                        Buying Price
                      </Typography>
                      {editRowId === row.inventory_id ? (
                        <TextField
                          name="buying_price"
                          value={editedData.buying_price || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              handleInputChange(e, setEditedData);
                            }
                          }}
                          variant="standard"
                        />
                      ) : (
                        <Typography>{row.buying_price}</Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      {editRowId === row.inventory_id ? (
                        <>
                          <Tooltip title="Save">
                            <IconButton
                              onClick={() => {
                                const quantity = parseInt(editedData.quantity, 10);
                                const price = parseInt(editedData.price, 10);
                                if (isNaN(quantity) || isNaN(price)) {
                                  setErrorMessage(
                                    "Available Quantity and Price must be integers."
                                  );
                                  setShowError(true);
                                } else {
                                  handleSaveClick(
                                    row.inventory_id,
                                    { ...editedData, quantity, price },
                                    setRows,
                                    setEditRowId,
                                    setEditedData
                                  );
                                }
                              }}
                            >
                              <SaveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton
                              onClick={() =>
                                handleCancelClick(
                                  setEditRowId,
                                  setEditedData,
                                  setIsAdding
                                )
                              }
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              disabled={editRowId}
                              onClick={() =>
                                handleEditClick(row, setEditRowId, setEditedData)
                              }
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              disabled={!!editRowId}
                              onClick={() =>
                                handleDeleteClick(
                                  row.inventory_id,
                                  setDeleteRowId,
                                  setOpenDeleteDialog
                                )
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Transactions">
                            <IconButton
                              disabled={!!editRowId}
                              onClick={() => {
                                setCurrentTransactiondetails({
                                  inventory_name: row.part_name,
                                  stock: row.quantity,
                                });
                                handleOpenTransaction(
                                  row.inventory_id,
                                  token,
                                  setTranscationData,
                                  setOpenTranscationModalState
                                );
                              }}
                            >
                              <ContentPasteSearchIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Paper>
                ))
              ) : (
                <Paper sx={{ p: 2, textAlign: "center" }}>No Items Found</Paper>
              )}
              {showFab && (
                <Fab
                  size="small"
                  onClick={handleScrollToTop}
                  sx={{
                    backgroundColor: "white",
                    color: "primary",
                    position: "sticky",
                    bottom: 16,
                    left: "calc(100% - 56px)",
                    zIndex: 10,
                  }}
                >
                  <ArrowUpwardIcon />
                </Fab>
              )}
            </Box>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TableContainer
                component={Paper}
                id="scrollable-table"
                style={{
                  maxHeight: "70vh",
                  // height:"80vh",
                  overflowY: "auto",
                }}
                onScroll={(event) => {
                  scrollToTopButtonDisplay(event, setShowFab);
                  infiniteScroll(
                    event,
                    token,
                    setRows,
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
                    setOffset
                  );
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                        zIndex: 3,
                      }}
                    >
                      <TableCell
                        sx={{
                          padding: "10px 16px",
                          fontWeight: "bold",
                          position: "sticky",
                          top: 0,
                          zIndex: 3,
                          backgroundColor: "white",
                        }}
                      >
                        Material ID
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "10px 16px",
                          fontWeight: "bold",
                          position: "sticky",
                          top: 0,
                          zIndex: 3,
                          backgroundColor: "white",
                        }}
                      >
                        Category
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "10px 16px",
                          fontWeight: "bold",
                          position: "sticky",
                          top: 0,
                          zIndex: 3,
                          backgroundColor: "white",
                        }}
                      >
                        Name
                      </TableCell>

                      <TableCell
                        sx={{
                          padding: "10px 16px",
                          fontWeight: "bold",
                          position: "sticky",
                          top: 0,
                          zIndex: 3,
                          backgroundColor: "white",
                        }}
                      >
                        Description
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "10px 16px",
                          fontWeight: "bold",
                          position: "sticky",
                          top: 0,
                          zIndex: 3,
                          backgroundColor: "white",
                        }}
                      >
                        UOM
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "10px 16px",
                          fontWeight: "bold",
                          position: "sticky",
                          top: 0,
                          zIndex: 3,
                          backgroundColor: "white",
                        }}
                      >
                        Available Quantity
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "10px 16px",
                          fontWeight: "bold",
                          position: "sticky",
                          top: 0,
                          zIndex: 3,
                          backgroundColor: "white",
                        }}
                      >
                        Price
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "10px 16px",
                          fontWeight: "bold",
                          position: "sticky",
                          top: 0,
                          zIndex: 3,
                          backgroundColor: "white",
                        }}
                      >
                        Buying Price
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "10px 16px",
                          fontWeight: "bold",
                          position: "sticky",
                          top: 0,
                          zIndex: 3,
                          backgroundColor: "white",
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length > 0 ? (
                      rows.map((row, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            backgroundColor:
                              editRowId && row.inventory_id === editRowId
                                ? "lightGray"
                                : "",
                          }}
                        >
                          <TableCell>{row.inventory_id}</TableCell>

                          <TableCell>{row.category || ""}</TableCell>

                          <TableCell>{row.part_name}</TableCell>

                          <TableCell>{row.description || ""}</TableCell>

                          <TableCell>{row.uom || ""}</TableCell>

                          <TableCell>
                            {editRowId === row.inventory_id ? (
                              <TextField
                                name="quantity"
                                value={editedData.quantity || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value)) {
                                    handleInputChange(e, setEditedData);
                                  }
                                }}
                                variant="standard"
                              />
                            ) : (
                              row.quantity
                            )}
                          </TableCell>

                          <TableCell>
                            {editRowId === row.inventory_id ? (
                              <TextField
                                name="price"
                                value={editedData.price || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value)) {
                                    handleInputChange(e, setEditedData);
                                  }
                                }}
                                variant="standard"
                              />
                            ) : (
                              row.price
                            )}
                          </TableCell>

                          <TableCell>
                            {editRowId === row.inventory_id ? (
                              <TextField
                                name="buying_price"
                                value={editedData.buying_price || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value)) {
                                    handleInputChange(e, setEditedData);
                                  }
                                }}
                                variant="standard"
                              />
                            ) : (
                              row.buying_price
                            )}
                          </TableCell>

                          <TableCell>
                            {editRowId === row.inventory_id ? (
                              <>
                                <IconButton
                                  onClick={() => {
                                    const quantity = parseInt(
                                      editedData.quantity,
                                      10
                                    );
                                    const price = parseInt(editedData.price, 10);

                                    if (isNaN(quantity) || isNaN(price)) {
                                      setErrorMessage(
                                        "Available Quantity and Price must be integers."
                                      );
                                      setShowError(true);
                                    } else {
                                      handleSaveClick(
                                        row.inventory_id,
                                        { ...editedData, quantity, price },
                                        setRows,
                                        setEditRowId,
                                        setEditedData
                                      );
                                    }
                                  }}
                                >
                                  <SaveIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() =>
                                    handleCancelClick(
                                      setEditRowId,
                                      setEditedData,
                                      setIsAdding
                                    )
                                  }
                                >
                                  <CancelIcon />
                                </IconButton>
                              </>
                            ) : (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton
                                    disabled={editRowId}
                                    onClick={() =>
                                      handleEditClick(
                                        row,
                                        setEditRowId,
                                        setEditedData
                                      )
                                    }
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    disabled={editRowId ? true : false}
                                    onClick={() =>
                                      handleDeleteClick(
                                        row.inventory_id,
                                        setDeleteRowId,
                                        setOpenDeleteDialog
                                      )
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View Transactions">
                                  <IconButton
                                    disabled={editRowId}
                                    onClick={() => {
                                      setCurrentTransactiondetails({
                                        inventory_name: row.part_name,
                                        stock: row.quantity,
                                      });
                                      handleOpenTransaction(
                                        row.inventory_id,
                                        token,
                                        setTranscationData,
                                        setOpenTranscationModalState
                                      );
                                    }}
                                  >
                                    <ContentPasteSearchIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No Items Found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {showFab && (
                  <Fab
                    size="small"
                    onClick={handleScrollToTop}
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
              </TableContainer>
            </div>
          )}
        </Box>
      </Box>

      {/* Deletion Conformation Dialogue */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this item? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await confirmDelete(
                token,
                setRows,
                deleteRowId,
                setOpenDeleteDialog,
                setShowError,
                setOpenSnackbar,
                setSnackbarMessage,
                setSnackbarSeverity
              );
            }}
            color="error"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {/* showing current transaction modal */}

      <Dialog
        open={OpenTranscationModalState}
        onClose={() => {
          setOpenTranscationModalState(false);
          setTranscationData([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: "black", fontWeight: "bold" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography sx={{ fontSize: "30px" }}>
              Item Name: {currentTransactionDetails.inventory_name}
            </Typography>
            <Typography sx={{ fontSize: "30px" }}>
              Stock: {currentTransactionDetails.stock}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ padding: 2 }}>
          <Box sx={{ width: "100%", overflow: "auto", maxHeight: 500 }}>
            <TableContainer
              component={Paper}
              sx={{ boxShadow: 3, borderRadius: 2, overflow: "auto" }}
            >
              <Table stickyHeader sx={{ minWidth: 700 }}>
                <TableHead sx={{ backgroundColor: "#f1f1f1" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", color: "#333" }}>
                      Sequence
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#333" }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#333" }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#333" }}>
                      Quantity
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#333" }}>
                      Description
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transcationData && transcationData.length > 0 ? (
                    [...transcationData]
                      .sort((a, b) => {
                        const dateA = new Date(a.transaction_date).getTime();
                        const dateB = new Date(b.transaction_date).getTime();
                        return dateA - dateB;
                      })
                      .map((transaction, index) => {
                        const typeColor = {
                          Consumed: "#f44336",
                          Purchase: "#ff9800",
                          Received: "#4caf50",
                          Buy: "#2196f3",
                          Added: "#8bc34a",
                          Reverse: "#9c27b0",
                          "Change Price": "#00bcd4",
                        };
                        const bgColor = typeColor[transaction.transaction_type] || "#999";

                        return (
                          <TableRow
                            key={transaction.transaction_id}
                            sx={{
                              backgroundColor:
                                index % 2 === 0 ? "#f9f9f9" : "white",
                              "&:hover": { backgroundColor: "#f0f0f0" },
                            }}
                          >
                            <TableCell sx={{ fontWeight: "bold", color: "#333" }}>
                              #{index + 1}
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  backgroundColor: bgColor,
                                  color: "white",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  fontSize: "12px",
                                }}
                              >
                                {transaction.transaction_type}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontSize: "12px" }}>
                              {transaction.transaction_date
                                ? new Date(
                                    transaction.transaction_date
                                  ).toLocaleString()
                                : "N/A"}
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              {transaction.quantity}
                            </TableCell>
                            <TableCell sx={{ fontSize: "12px" }}>
                              {transaction.description}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No transaction data available.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: 2, justifyContent: "center" }}>
          <Button
            onClick={() => {
              setOpenTranscationModalState(false), setTranscationData([]);
            }}
            color="inherit"
            sx={{
              backgroundColor: "#fff",
              color: "#1976d2",
              "&:hover": { backgroundColor: "#e3f2fd" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Error Message */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseError}
      >
        <Alert
          onClose={handleCloseError}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
