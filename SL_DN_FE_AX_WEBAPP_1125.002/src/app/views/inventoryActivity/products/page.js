"use client";
import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navbar";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import * as XLSX from "xlsx";
import {
  handleEditClick, handleCancelClick, handleInputChange,
  handleAddClick, handleSaveNewRow, handleDeleteClick,
  confirmDelete, scrollToTopButtonDisplay, handleScrollToTop, fetchInventory,
} from "../../../../../controllers/materialsControllers.js";
import Cookies from "js-cookie";
import { filterRows } from "../../../../../controllers/movementControllers.js";
import { styled } from "@mui/material/styles";
import {
  Box, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, TextField, Tooltip,
  Snackbar, Alert, Select, MenuItem, Dialog, DialogActions,
  DialogContent, DialogTitle, Fab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import LoadingScreen from "@/components/loadingScreen.js";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
});

export default function Inventory() {
  const [token, setToken] = useState(null);
  const [rows, setRows] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [editedData, setEditedData] = useState({
    _id: "", inventory_id: "", part_name: "", part_number: "",
    description: "", category: "", quantity: "", uom: "",
    orders: [], suppliers: [], price: "", gst: "",
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
  const [limit, setLimit] = useState(20);
  const [uomOptions, setUomOptions] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [gstOptions, setGstOptions] = useState([]);

  // ✅ refs
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const totalRef = useRef(0);
  const tokenRef = useRef("");
  const offsetRef = useRef(0);
  const limitRef = useRef(20);

  // ✅ fetch options
  useEffect(() => {
    async function fetchUomData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uom`, {
          headers: { Authorization: `Bearer ${Cookies.get("token")}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch UOM data");
        setUomOptions(await res.json());
      } catch (err) { console.error(err); }
    }

    async function fetchServiceData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss/service`, {
          headers: { Authorization: `Bearer ${Cookies.get("token")}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch service data");
        const data = await res.json();
        setServiceOptions(data.services);
      } catch (err) { console.error(err); }
    }

    async function fetchGstData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gst`, {
          headers: { Authorization: `Bearer ${Cookies.get("token")}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch GST data");
        setGstOptions(await res.json());
      } catch (err) { console.error(err); }
    }

    fetchUomData();
    fetchServiceData();
    fetchGstData();
  }, []);

  // ✅ set token
  useEffect(() => {
    const storedToken = Cookies.get("token");
    if (!storedToken) return;
    setToken(storedToken);
    tokenRef.current = storedToken;
  }, []);

  // ✅ initial load
  useEffect(() => {
    if (!token) return;

    const init = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const lim = data.company_details?.[0]?.fetch_limit || 20;
        setLimit(lim);
        limitRef.current = lim;

        offsetRef.current = 0;
        hasMoreRef.current = true;
        loadingRef.current = false;
        setRows([]);

        const result = await fetchInventory(
          token, setRows, lim, 0, false, setIsLoading, null, null, totalRef
        );
        if (result) {
          totalRef.current = result.total;
          offsetRef.current = result.data.length;
          hasMoreRef.current = result.data.length < result.total;
        }
        loadingRef.current = false;

      } catch (err) {
        console.error("Error in init:", err);
        setIsLoading(false);
      }
    };

    init();
  }, [token]);

  // ✅ scroll handler
  const handleScroll = (event) => {
    scrollToTopButtonDisplay(event, setShowFab);

    const { scrollTop, scrollHeight, clientHeight } = event.target;

    if (searchQuery) return;
    if (!hasMoreRef.current) return;
    if (loadingRef.current) return;

    if (scrollHeight - scrollTop <= clientHeight + 200) {
      console.log("✅ API calling offset:", offsetRef.current);
      loadingRef.current = true;

      fetchInventory(
        tokenRef.current, setRows, limitRef.current,
        offsetRef.current, true, null, null, null, totalRef
      ).then((result) => {
        if (!result || result.data.length === 0) {
          hasMoreRef.current = false;
          loadingRef.current = false;
        } else {
          const newOffset = offsetRef.current + result.data.length;
          offsetRef.current = newOffset;
          if (newOffset >= totalRef.current) {
            hasMoreRef.current = false;
          } else {
            hasMoreRef.current = true;
          }
          // ✅ delay unlock so DOM settles before next scroll fires
          setTimeout(() => {
            loadingRef.current = false;
          }, 300);
        }
      });
    }
  };

  const handleCloseError = () => setShowError(false);

  const handleExcelUpload = async (event) => {
    setIsLoading(true);
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const workbook = XLSX.read(e.target.result, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const dataRows = jsonData.slice(5);
      const result = [];

      dataRows.forEach((row) => {
        const rowData = {
          category: row[0], part_name: row[1], quantity: row[2],
          price: row[3], HSNCode: row[4], description: row[5], uom: row[6], gst: row[7],
        };
        if (rowData.category != undefined) result.push(rowData);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/bulkUpload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: result }),
      });

      const res = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        setShowError(true);
        setErrorSeverity("error");
        setErrorMessage(res.error);
      } else {
        setIsLoading(false);
        const message = {
          updatedItems: res.result.existingItemUpdated,
          newItemAdded: res.result.newItemAdded,
          failedItems: res.result.failedInventory,
        };
        if (message.failedItems.length > 0) downloadFailedDataAsExcel(message.failedItems);
        setShowError(true);
        setErrorSeverity("success");
        setErrorMessage(`Items Added: ${message.newItemAdded} | Items Updated: ${message.updatedItems} | Failed Items: ${message.failedItems.length}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveClick = async (inventoryId, editedData, setRows, setEditRowId, setEditedData) => {
    try {
      const updatedData = {
        part_name: editedData.part_name, part_number: editedData.part_number,
        description: editedData.description, category: editedData.category,
        quantity: parseInt(editedData.quantity, 10),
        price: parseFloat(editedData.price),
        uom: editedData.uom, gst: editedData.gst,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/${inventoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error("Failed to update inventory item");

      const updatedItem = await response.json();
      setRows((prevRows) => prevRows.map((row) => row.inventory_id === inventoryId ? updatedItem : row));
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
      const sheet = XLSX.utils.json_to_sheet(failedInventory);
      XLSX.utils.book_append_sheet(workbook, sheet, "Failed Inventory");
    }
    XLSX.writeFile(workbook, "failed_uploads.xlsx");
  };

  const downloadExcel = async () => {
    setIsLoading(true);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/excelDownload`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!response.ok) { setIsLoading(false); return; }

    const data = await response.json();
    const worksheetData = data.map((row) => ({
      "Material ID": row.inventory_id, Category: row.category,
      Name: row.part_name, Description: row.description, gst: row.gst, UOM: row.uom || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, "Inventory.xlsx");
    setIsLoading(false);
  };

  const pageType = Cookies.get("page_type");

  return isLoading ? (
    <LoadingScreen Dialogue={"Please Wait..."} />
  ) : (
    <div>
      {pageType !== "tab" && <Navbar pageName="Product Master" />}
      <Box sx={{ minHeight: "80vh" }}>
        <Box paddingX="1%">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", marginTop: pageType !== "tab" ? "0px" : "16px" }}>
            <div style={{ display: "flex" }} />
            <div style={{ display: "flex", gap: 5 }}>
              <Select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); filterRows(token, rows, setRows, searchQuery, e.target.value); }}
                displayEmpty disabled={editRowId ? true : false}
                variant="outlined" size="small" sx={{ backgroundColor: "white", borderRadius: 1 }}
              >
                <MenuItem value="">All</MenuItem>
                {serviceOptions.map((s) => <MenuItem key={s.id} value={s.service_name}>{s.service_name}</MenuItem>)}
              </Select>

              <TextField
                label="Search" variant="outlined" disabled={editRowId ? true : false}
                size="small" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => { if (e.key === "Enter") filterRows(token, rows, setRows, searchQuery, filterType); }}
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              />

              <Tooltip title="Add Item">
                <IconButton disabled={editRowId ? true : false}
                  onClick={() => handleAddClick(setEditRowId, setEditedData, setIsAdding)}
                  sx={{ borderRadius: 1, padding: "0 10px", backgroundColor: "white", "&:hover": { backgroundColor: "white" } }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Download Template">
                <IconButton disabled={editRowId ? true : false} href="/Auto_Doc_Cockpit_INV-Template.xlsx"
                  sx={{ borderRadius: 1, padding: "0 10px", backgroundColor: "white", "&:hover": { backgroundColor: "white" } }}>
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Upload Inventory">
                <Button component="label" disabled={editRowId ? true : false} variant="contained" tabIndex={-1}
                  sx={{ color: "#616161", borderRadius: 1, backgroundColor: "white", "&:hover": { backgroundColor: "white" } }}
                  startIcon={<FileUploadIcon sx={{ color: "#616161" }} />}>
                  Upload Products
                  <VisuallyHiddenInput type="file" onChange={handleExcelUpload} multiple />
                </Button>
              </Tooltip>

              <Tooltip title="Download Excel">
                <IconButton disabled={editRowId ? true : false} onClick={downloadExcel}
                  sx={{ borderRadius: 1, padding: "0 10px", backgroundColor: "white", "&:hover": { backgroundColor: "white" } }}>
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <TableContainer
              component={Paper}
              id="scrollable-table"
              onScroll={handleScroll}
              style={{ maxHeight: "70vh", overflowY: "auto", overflowX: "auto" }}
            >
              <Table>
                <TableHead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 20 }}>
                  <TableRow>
                    <TableCell sx={{ padding: "10px 16px", fontWeight: "bold" }}>Material ID</TableCell>
                    <TableCell sx={{ padding: "10px 16px", fontWeight: "bold" }}>Category</TableCell>
                    <TableCell sx={{ padding: "10px 16px", fontWeight: "bold" }}>Name</TableCell>
                    <TableCell sx={{ padding: "10px 16px", fontWeight: "bold" }}>Description</TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>UOM</TableCell>
                    <TableCell sx={{ padding: "10px 16px" }}>GST</TableCell>
                    <TableCell sx={{ padding: "10px 16px", fontWeight: "bold", whiteSpace: "nowrap", width: 120, minWidth: 120, maxWidth: 120, position: "sticky", right: 0, backgroundColor: "white", zIndex: 6 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {isAdding && (
                    <TableRow>
                      <TableCell>
                        <TextField name="inventory_id" value={editedData.inventory_id || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" placeholder="Enter Material ID" disabled />
                      </TableCell>
                      <TableCell>
                        <Select name="category" value={editedData.category || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" displayEmpty>
                          {serviceOptions.map((s) => <MenuItem key={s.id} value={s.service_name}>{s.service_name}</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField name="part_name" value={editedData.part_name || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" placeholder="Enter Name" />
                      </TableCell>
                      <TableCell>
                        <TextField name="description" value={editedData.description || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" placeholder="Enter Description" />
                      </TableCell>
                      <TableCell>
                        <Select name="uom" value={editedData.uom || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" displayEmpty>
                          {uomOptions.map((u) => <MenuItem key={u.id} value={u.unit_shortcode}>{u.unit_name}</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select name="gst" value={editedData.gst || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" displayEmpty>
                          <MenuItem value="">Select GST</MenuItem>
                          {gstOptions.map((g) => <MenuItem key={g.id} value={g.gst_percentage}>{g.gst_name} %</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => {
                          if (!editedData.category || !editedData.part_name) {
                            setErrorMessage("Category and Name are required.");
                            setShowError(true);
                            setErrorSeverity("error");
                          } else {
                            handleSaveNewRow(token, { ...editedData }, setRows, setEditRowId, setEditedData, setIsAdding, setErrorMessage, setShowError, setErrorSeverity);
                          }
                        }}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={() => handleCancelClick(setEditRowId, setEditedData, setIsAdding)}>
                          <CancelIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )}

                  {rows.length > 0 ? rows.map((row, index) => (
                    <TableRow key={row.inventory_id + index}
                      sx={{ backgroundColor: editRowId && row.inventory_id === editRowId ? "lightGray" : "" }}>
                      <TableCell>{row.inventory_id}</TableCell>
                      <TableCell>
                        {editRowId === row.inventory_id ? (
                          <Select name="category" value={editedData?.category || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" displayEmpty>
                            {serviceOptions.map((s) => <MenuItem key={s.id} value={s.service_name}>{s.service_name}</MenuItem>)}
                          </Select>
                        ) : row.category}
                      </TableCell>
                      <TableCell sx={{ padding: "10px 16px", fontWeight: "bold", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {editRowId === row.inventory_id ? (
                          <TextField name="part_name" value={editedData.part_name || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" />
                        ) : row.part_name}
                      </TableCell>
                      <TableCell sx={{ padding: "10px 16px", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {editRowId === row.inventory_id ? (
                          <TextField name="description" value={editedData.description || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" />
                        ) : row.description}
                      </TableCell>
                      <TableCell>
                        {editRowId === row.inventory_id ? (
                          <Select name="uom" value={editedData.uom || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" displayEmpty>
                            {uomOptions.map((u) => <MenuItem key={u.id} value={u.unit_shortcode}>{u.unit_name}</MenuItem>)}
                          </Select>
                        ) : (row.uom || "N/A")}
                      </TableCell>
                      <TableCell>
                        {editRowId === row.inventory_id ? (
                          <Select name="gst" value={editedData.gst || ""} onChange={(e) => handleInputChange(e, setEditedData)} variant="standard" displayEmpty>
                            <MenuItem value="">Select GST</MenuItem>
                            {gstOptions.map((g) => <MenuItem key={g.id} value={g.gst_percentage}>{g.gst_name} - {g.gst_percentage}%</MenuItem>)}
                          </Select>
                        ) : row.gst}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", width: "110px", minWidth: "110px", maxWidth: "110px" }}>
                        {editRowId === row.inventory_id ? (
                          <>
                            <IconButton onClick={() => {
                              handleSaveClick(
                                row.inventory_id,
                                { ...editedData, quantity: parseInt(editedData.quantity, 10), price: parseInt(editedData.price, 10) },
                                setRows, setEditRowId, setEditedData
                              );
                            }}>
                              <SaveIcon />
                            </IconButton>
                            <IconButton onClick={() => handleCancelClick(setEditRowId, setEditedData, setIsAdding)}>
                              <CancelIcon />
                            </IconButton>
                          </>
                        ) : (
                          <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                            <Tooltip title="Edit">
                              <IconButton disabled={editRowId != null} onClick={() => handleEditClick(row, setEditRowId, setEditedData)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton disabled={editRowId !== null} onClick={() => handleDeleteClick(row.inventory_id, setDeleteRowId, setOpenDeleteDialog)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">No Product Found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {showFab && (
                <Fab size="small" onClick={handleScrollToTop}
                  style={{ backgroundColor: "white", position: "absolute", bottom: 40, right: 40, zIndex: 10 }}>
                  <ArrowUpwardIcon />
                </Fab>
              )}
            </TableContainer>
          </div>
        </Box>
      </Box>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>Are you sure you want to delete this item? This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">Cancel</Button>
          <Button onClick={async () => {
            await confirmDelete(token, setRows, deleteRowId, setOpenDeleteDialog, setShowError, setErrorMessage, setErrorSeverity);
          }} color="error">Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={showError} autoHideDuration={4000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity={errorSeverity} sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}