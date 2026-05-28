"use client";
import React, { useState, useEffect } from "react";

import Navbar from "@/components/navbar";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

import * as XLSX from "xlsx";

import {
  handleEditClick,
  handleCancelClick,
  handleInputChange,
  handleAddClick,
  handleSaveNewRow,
  handleDeleteClick,
  confirmDelete,
  scrollToTopButtonDisplay,
  infiniteScroll,
  handleScrollToTop,
} from "../../../../../controllers/materialsControllers.js";

import { fetchCompanyDetails } from "../../../../../controllers/LeadsControllers.js";

import Cookies from "js-cookie";
import { filterRows } from "../../../../../controllers/movementControllers.js";

import { styled } from "@mui/material/styles";
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
  Fab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { set } from "date-fns";
import LoadingScreen from "@/components/loadingScreen.js";
export default function Inventory() {
  const [token, setToken] = useState(null);


  const [rows, setRows] = useState([
    // {
    //   inventory_id: "",
    //   part_name: "",
    //   part_number: "",
    //   description: "",
    //   category: "",
    //   quantity: "",
    //   price: "",
    // },
  ]);

  const [editRowId, setEditRowId] = useState(null);
  const [editedData, setEditedData] = useState({
    _id: "",
    inventory_id: "",
    part_name: "",
    part_number: "",
    description: "",
    category: "",
    quantity: "",
    uom: "",
    orders: [],
    suppliers: [],
    price: "",
    gst: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorSeverity, setErrorSeverity] = useState("");
  const [deleteRowId, setDeleteRowId] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showFab, setShowFab] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  // const limit = 10;
  const [limit, setLimit] = useState();

  const [uomOptions, setUomOptions] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [gstOptions, setGstOptions] = useState([]);

  useEffect(() => {
    async function fetchUomData() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uom`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch UOM data");
        const data = await response.json();
        setUomOptions(data);
      } catch (error) {
        console.error("Error fetching UOM data:", error);
      }
    }

    fetchUomData();

    async function fetchServiceData() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ss/service`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch service data");
        const data = await response.json();
        console.log(data.services);
        setServiceOptions(data.services);
      } catch (error) {
        console.error("Error fetching service data:", error);
      }
    }

    async function fetchGstData() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gst`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch GST data");
        const data = await response.json();
        setGstOptions(data);
      } catch (error) {
        console.error("Error fetching GST data:", error);
      }
    }

    fetchUomData();
    fetchServiceData();
    fetchGstData();
  }, []);

  const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
  });

  // const filteredRows = filterRows(rows, searchQuery, filterType);
  useEffect(() => {
  const storedToken = Cookies.get("token");
  if (!storedToken) return;
  setToken(storedToken);
}, []);

useEffect(() => {
  if (!token) return; // wait until token is set

  const getLimit = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data.company_details?.[0]?.fetch_limit;
    } catch (err) {
      console.error("Error fetching limit:", err);
      return 10; 
    }
  };

  const fetchInventory = async (lim) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory/?limit=${lim}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setRows(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  

  (async () => {
    const lim = await getLimit();
    setLimit(lim);
    fetchInventory(lim);   // ONLY ONE CALL
  })();
}, [token]);


  // useEffect(() => {
  //   const storedToken = Cookies.get("token");

  //   const getLimit = async () => {
  //     try {
  //       const url = `${process.env.NEXT_PUBLIC_API_URL}/ss`;
  //       // console.log("Fetching data from:", url);

  //       const response = await fetch(url, {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       });

  //       if (!response.ok) {
  //         throw new Error(`API error: ${response.status}`);
  //       }

  //       const data = await response.json();
  //       return data.company_details[0]?.fetch_limit;
  //     } catch (error) {
  //       console.error("Error fetching limit:", error);
  //       return null; // Handle the error gracefully
  //     }
  //   };
  //   // Call the function and log the result
  //   getLimit().then((lim) => {
  //     setLimit(lim);
  //     fetchInventory(lim);
  //   });

  //   async function fetchInventory(lim) {
  //     console.log({ lim });
  //     try {
  //       if (!token) {
  //         throw new Error("No token found. Please log in.");
  //       }

  //       const response = await fetch(
  //         `${process.env.NEXT_PUBLIC_API_URL}/inventory/?limit=${lim}`,
  //         {
  //           method: "GET",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );

  //       if (!response.ok) throw new Error("Failed to fetch entries");

  //       const data = await response.json();
  //       setRows(data);

  //       // setFilteredEntries(data);
  //       setIsLoading(false);
  //     } catch (err) {
  //       // setError(err.message);
  //       // setSnackbarMessage(err.message); // Set error message for Snackbar
  //       // setOpenSnackbar(true); // Show Snackbar with error message
  //       // setLoading(false);
  //     }
  //   }
  //   if (token) {
  //     fetchInventory();
  //   }
  // }, [token]);

  // useEffect(() => {
  //   async function fetchUomData() {
  //     try {
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uom`);
  //       if (!response.ok) throw new Error("Failed to fetch UOM data");
  //       const data = await response.json();
  //       setUomOptions(data);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }
  //   fetchUomData();
  // }, []);

  // Close Error Message
  const handleCloseError = () => {
    setShowError(false);
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

        console.log({ rowData });

        inc++;

        if (rowData.category != undefined) {
          result.push(rowData);
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

      if (!response.ok) {
        setIsLoading(false);
        setShowError(true);
        setErrorSeverity("Error");
        setErrorMessage(res.error);
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

        setShowError(true);
        setErrorSeverity("success");
        setErrorMessage(
          `Items Added: ${message.newItemAdded} | Items Updated: ${message.updatedItems} | Failed Items: ${message.failedItems.length}`
        );
        // location.reload();
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveClick = async (
    inventoryId,
    editedData,
    setRows,
    setEditRowId,
    setEditedData
  ) => {
    try {
      // Ensure quantity and price are numbers
      const quantity = parseInt(editedData.quantity, 10);
      const price = parseFloat(editedData.price);

      // Prepare the data in the required format
      const updatedData = {
        part_name: editedData.part_name,
        part_number: editedData.part_number,
        description: editedData.description,
        category: editedData.category,
        quantity: quantity,
        price: price,
        uom: editedData.uom,
        gst: editedData.gst,
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

      setShowError(true);
      setErrorMessage("Material updated successfully.");
      setErrorSeverity("success");

      setEditRowId(null);
      setEditedData({});
    } catch (error) {
      setErrorMessage("Error updating inventory item");
      setShowError(true);
      setErrorSeverity("error");
    }
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

  const downloadExcel = async () => {
    setIsLoading(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inventory/excelDownload`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      setIsLoading(false);
      throw new Error("Failed to download inventory item");
    }

    const data = await response.json();

    const worksheetData = data.map((row) => ({
      "Material ID": row.inventory_id,
      Category: row.category,
      Name: row.part_name,
      Description: row.description,
      gst: row.gst,
      UOM: row.uom || "N/A",
    }));

    console.log({ worksheetData });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    XLSX.writeFile(workbook, "Inventory.xlsx");
    setIsLoading(false);
  };

    const pageType = Cookies.get("page_type"); // "tab" or others
  

  return isLoading ? (
    <LoadingScreen Dialogue={"Please Wait..."} />
  ) : (
    <div>
      {/* <Navbar pageName="Product Master" /> */}
      {pageType !== "tab" && <Navbar pageName="Product Master" />}
      <Box
        sx={{
          backgroundSize: "cover",

          minHeight: "80vh",
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
                {serviceOptions.map((service) => (
                  <MenuItem key={service.id} value={service.service_name}>
                    {service.service_name}
                  </MenuItem>
                ))}
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

              <Tooltip title="Add Item">
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
              </Tooltip>

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
                  Upload Products
                  <VisuallyHiddenInput
                    type="file"
                    onChange={handleExcelUpload}
                    multiple
                  />
                </Button>
              </Tooltip>

              <Tooltip title="Download Excel">
                <IconButton
                  aria-label="downloadExcel"
                  disabled={editRowId ? true : false}
                  onClick={downloadExcel}
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
            </div>
          </div>

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
                overflowX: "auto",
              }}  
              onScroll={(event) => {
                scrollToTopButtonDisplay(event, setShowFab);
                
  const target = event.target;

  // Check if user reached bottom of container
  const isBottom =
    target.scrollHeight - target.scrollTop <= target.clientHeight + 10;

                if (isBottom && !isLoading && hasMore) {
                infiniteScroll(
                  
                  token,
                  setRows,
                  searchQuery,
                  limit,
                  
                  setIsLoading,
                 
                  setHasMore,
                  offset,
                  setOffset
                );}
              }}
            >
              <Table>
                <TableHead
                  style={{
                     position: "sticky",
    top: 0,
    backgroundColor: "#fff",
    zIndex: 20,  
                  }}
                >
                  <TableRow>
                    <TableCell
                      sx={{ padding: "10px 16px", fontWeight: "bold" }}
                    >
                      Material ID
                    </TableCell>
                    <TableCell
                      sx={{ padding: "10px 16px", fontWeight: "bold" }}

                    >
                      Category
                    </TableCell>
                    <TableCell
                      sx={{ padding: "10px 16px", fontWeight: "bold" }}
                      className="whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      Name
                    </TableCell>

                    <TableCell
                      sx={{ padding: "10px 16px", fontWeight: "bold" }}
                      className="overflow-hidden text-ellipsis line-clamp-2"
                    >
                      Description
                    </TableCell>
                    {/* <TableCell sx={{ padding: "10px 16px" }}>
                      Available Quantity
                    </TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>Price</TableCell> */}
                    <TableCell sx={{ padding: "10px 16px" }}>UOM</TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>GST</TableCell>
                    <TableCell
   sx={{   padding: "10px 16px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    width: 120,
    minWidth: 120,
    maxWidth: 120,
    position: "sticky",
    right: 0,
    backgroundColor: "white",
    zIndex: 6,
  }}  >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isAdding && (
                    <TableRow>
                      <TableCell>
                        <TextField
                          name="inventory_id"
                          value={editedData.inventory_id || ""}
                          onChange={(e) => handleInputChange(e, setEditedData)}
                          variant="standard"
                          placeholder="Enter Material ID"
                          disabled
                        />
                      </TableCell>

                      <TableCell>
                        <Select
                          name="category"
                          value={editedData.category || ""}
                          onChange={(e) => handleInputChange(e, setEditedData)}
                          variant="standard"
                          displayEmpty
                        >
                          {serviceOptions.map((service) => (
                            <MenuItem
                              key={service.id}
                              value={service.service_name}
                            >
                              {service.service_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>

                      <TableCell>
                        <TextField
                          name="part_name"
                          value={editedData.part_name || ""}
                          onChange={(e) => handleInputChange(e, setEditedData)}
                          variant="standard"
                          placeholder="Enter Name"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          name="description"
                          value={editedData.description || ""}
                          onChange={(e) => handleInputChange(e, setEditedData)}
                          variant="standard"
                          placeholder="Enter Description"
                        />
                      </TableCell>

                      {/* <TableCell>
                        <TextField
                          name="quantity"
                          value={editedData.quantity || ""}
                          onChange={(e) => handleInputChange(e, setEditedData)}
                          variant="standard"
                          placeholder="Enter Available Quantity"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          name="price"
                          value={editedData.price || ""}
                          onChange={(e) => handleInputChange(e, setEditedData)}
                          variant="standard"
                          placeholder="Enter Price"
                        />
                      </TableCell> */}

                      <TableCell>
                        <Select
                          name="uom"
                          value={editedData.uom || ""}
                          onChange={(e) => handleInputChange(e, setEditedData)}
                          variant="standard"
                          displayEmpty
                        >
                          {uomOptions.map((uom) => (
                            <MenuItem key={uom.id} value={uom.unit_shortcode}>
                              {uom.unit_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Select
                          name="gst"
                          value={editedData.gst || ""}
                          onChange={(e) => handleInputChange(e, setEditedData)}
                          variant="standard"
                          displayEmpty
                        >
                          <MenuItem value="">Select GST</MenuItem>
                          {gstOptions.map((g) => (
                            <MenuItem key={g.id} value={g.gst_percentage}>
                              {g.gst_name} %
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>

                      <TableCell>
                        <IconButton
                          onClick={() => {
                            const isAlphabetOnly = /^[a-zA-Z]+$/;

                            const quantity = parseInt(editedData.quantity, 10);
                            const price = parseInt(editedData.price, 10);

                            if (!editedData.category || !editedData.part_name) {
                              setErrorMessage(
                                "Category and Name are required."
                              );
                              setShowError(true);
                              setErrorSeverity("error");
                            } else {
                              let added = handleSaveNewRow(
                                token,
                                { ...editedData },
                                setRows,
                                setEditRowId,
                                setEditedData,
                                setIsAdding,
                                setErrorMessage,
                                setShowError,
                                setErrorSeverity
                              );

                              // added ? location.reload() : null;
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
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.length > 0 ? (
                    rows.map((row, index) => (
                      <TableRow
                        key={row.inventory_id + index}
                        sx={{
                          backgroundColor:
                            editRowId && row.inventory_id === editRowId
                              ? "lightGray"
                              : "",
                        }}
                      >
                        <TableCell>{row.inventory_id}</TableCell>

                        <TableCell>
                          {editRowId === row.inventory_id ? (
                            <Select
                              name="category"
                              value={editedData?.category}
                              onChange={(e) =>
                                handleInputChange(e, setEditedData)
                              }
                              variant="standard"
                              displayEmpty
                            >
                              {console.log(serviceOptions)}
                              {serviceOptions.map((service) => (
                                <MenuItem
                                  key={service.id}
                                  value={service.service_name}
                                >
                                  {service.service_name}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            row.category
                          )}
                        </TableCell>

                        <TableCell
                         sx={{ padding: "10px 16px",fontWeight: "bold",maxWidth: 150, overflow: "hidden",textOverflow: "ellipsis",whiteSpace: "nowrap"}}>
                          {editRowId === row.inventory_id ? (
                            <TextField
                              name="part_name"
                              value={editedData.part_name || ""}
                              onChange={(e) =>
                                handleInputChange(e, setEditedData)
                              }
                              variant="standard"
                            />
                          ) : (
                            row.part_name
                          )}
                        </TableCell>

                        <TableCell   sx={{ padding: "10px 16px",maxWidth: 250,overflow: "hidden",textOverflow: "ellipsis",whiteSpace: "nowrap",}} >
                          {editRowId === row.inventory_id ? (
                            <TextField
                              name="description"
                              value={editedData.description || ""}
                              onChange={(e) =>
                                handleInputChange(e, setEditedData)
                              }
                              variant="standard"
                            />
                          ) : (
                            row.description
                          )}
                        </TableCell>

                        {/* <TableCell>
                          {editRowId === row.inventory_id ? (
                            <TextField
                              name="quantity"
                              value={editedData.quantity || ""}
                              onChange={(e) => handleInputChange(e, setEditedData)}
                              variant="standard"
                            />
                          ) : (
                            row.quantity
                          )}
                        </TableCell> */}

                        {/* <TableCell>
                          {editRowId === row.inventory_id ? (
                            <TextField
                              name="price"
                              value={editedData.price || ""}
                              onChange={(e) => handleInputChange(e, setEditedData)}
                              variant="standard"
                            />
                          ) : (
                            row.price
                          )}
                        </TableCell> */}


                        <TableCell>
                          {editRowId === row.inventory_id ? (
                            <Select
                              name="uom"
                              value={editedData.uom || ""}
                              onChange={(e) =>
                                handleInputChange(e, setEditedData)
                              }
                              variant="standard"
                              displayEmpty
                            >
                              {uomOptions.map((uom) => (
                                <MenuItem
                                  key={uom.id}
                                  value={uom.unit_shortcode}
                                >
                                  {uom.unit_name}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            row.uom || "N/A"
                          )}

                        </TableCell>
     <TableCell>
                          {editRowId === row.inventory_id ? (
                            <Select
                              name="gst"
                              value={editedData.gst || ""}
                              onChange={(e) => handleInputChange(e, setEditedData)}
                              variant="standard"
                              displayEmpty
                            >
                              <MenuItem value="">Select GST</MenuItem>
                              {gstOptions.map((g) => (
                                <MenuItem key={g.id} value={g.gst_percentage}>
                                  {g.gst_name} - {g.gst_percentage}%
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            row.gst
                          )}
                        </TableCell>
                        <TableCell   sx={{whiteSpace: "nowrap", width: "110px",minWidth: "110px", maxWidth: "110px", }}>
                          {editRowId === row.inventory_id ? (
                            <>
                              <IconButton
                                onClick={() => {
                                  // Validate that quantity and price are integers
                                  const quantity = parseInt(
                                    editedData.quantity,
                                    10
                                  );
                                  const price = parseInt(editedData.price, 10);

                                  handleSaveClick(
                                    row.inventory_id,
                                    { ...editedData, quantity, price },
                                    setRows,
                                    setEditRowId,
                                    setEditedData,
                                    setShowError,
                                    setErrorMessage,
                                    setErrorSeverity
                                  );
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
                            <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                              <Tooltip title="Edit">
                                <IconButton
                                  disabled={editRowId!= null }
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
                                  // disabled={editRowId ? true : false}
                                      disabled={editRowId !== null}

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
                              </Box>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No Product Found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Back to Top FAB */}
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
            // onClick={() => {
            //   let deleted = confirmDelete(
            //     token,
            //     setRows,
            //     deleteRowId,
            //     setOpenDeleteDialog,
            //     setShowError,
            //     setErrorMessage,
            //     setErrorSeverity
            //   );

            //   deleted ? location.reload() : null;
            // }}
             onClick={async () => {
    const deleted = await confirmDelete(
      token,
      setRows,
      deleteRowId,
      setOpenDeleteDialog,
      setShowError,
      setErrorMessage,
      setErrorSeverity
    );

    if (deleted) {
         
      // optional: reload if needed
      // location.reload();
    }
  }}
            color="error"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Error Message */}
      <Snackbar
        open={showError}
        autoHideDuration={4000}
        onClose={handleCloseError}
      >
        <Alert
          onClose={handleCloseError}
          severity={errorSeverity}
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
