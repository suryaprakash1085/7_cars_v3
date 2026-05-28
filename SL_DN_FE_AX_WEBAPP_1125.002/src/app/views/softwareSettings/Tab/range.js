"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Range() {
  const [editedRanges, setEditedRanges] = useState({});
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [rangeData, setRangeData] = useState([]);
  const [isEditingRow, setIsEditingRow] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newRangeData, setNewRangeData] = useState({
    type: "",
    startRange: "",
    endRange: "",
    currentRange: "",
    prefix: "",
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState(null);

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);

    const role = Cookies.get("role");
    setRole(role);
  }, []);

  useEffect(() => {
    fetchRangeData();
  }, []);

  const fetchRangeData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss/number_range`
      );
      const data = await response.json();
      if (response.ok) {
        const formattedData = data.number_range.map((item) => ({
          id: item.id,
          type: item.id_type,
          startRange: item.range_start.toString(),
          endRange: item.range_end.toString(),
          currentRange: item.running_number.toString(),
          prefix: item.prefix,
        }));
        setRangeData(formattedData);
      } else {
        console.log("Failed to fetch data:", data.message);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const handleRangeEdit = (type, field, value) => {
    if (["startRange", "endRange", "currentRange"].includes(field)) {
      value = value.replace(/[^0-9]/g, "");
    }
    if (field === "prefix") {
      value = value.toUpperCase();
    }

    setEditedRanges((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleRangeSubmit = async (type) => {
    try {
      const originalRow = rangeData.find((row) => row.type === type);
      const changes = {};

      // Compare edited values with original values and only include changed fields
      if (
        editedRanges[type]?.type &&
        editedRanges[type].type !== originalRow.type
      ) {
        changes.id_type = editedRanges[type].type;
      }
      if (
        editedRanges[type]?.startRange &&
        editedRanges[type].startRange !== originalRow.startRange
      ) {
        changes.range_start = editedRanges[type].startRange;
      }
      if (
        editedRanges[type]?.endRange &&
        editedRanges[type].endRange !== originalRow.endRange
      ) {
        changes.range_end = editedRanges[type].endRange;
      }
      if (
        editedRanges[type]?.currentRange &&
        editedRanges[type].currentRange !== originalRow.currentRange
      ) {
        changes.running_number = editedRanges[type].currentRange;
      }
      if (
        editedRanges[type]?.prefix &&
        editedRanges[type].prefix !== originalRow.prefix
      ) {
        changes.prefix = editedRanges[type].prefix;
      }

      // If no changes, do not proceed with the request
      if (Object.keys(changes).length === 0) {
        console.log("No changes to submit.");
        return;
      }

      // Include the ID in the changes
      changes.id = originalRow.id;

      // Send the updated data to the server
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss/number_range/${originalRow.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changes),
        }
      );

      const data = await response.json();
      if (response.ok) {
        console.log("Updated row data:", changes);
        setIsEditingRow(null);
        setSnackbar({
          open: true,
          message: "Row updated successfully",
          severity: "success",
        });
        fetchRangeData(); // Refresh the data
      } else {
        throw new Error(data.message || "Failed to update row");
      }
    } catch (error) {
      console.log("Error:", error);
      setSnackbar({
        open: true,
        message: "Failed to update row",
        severity: "error",
      });
    }
  };

  const handleRangeCancel = () => {
    setIsEditingRow(null);
    setEditedRanges({});
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleAddRange = () => {
    setIsCreating(true);
    setNewRangeData({
      type: "",
      startRange: "",
      endRange: "",
      currentRange: "",
      prefix: "",
    });
  };

  const handleSaveNewRange = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss/number_range`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newRangeData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRangeData((prev) => [...prev, data]); // Assuming the API returns the created range
        setSnackbar({
          open: true,
          message: "New range added successfully",
          severity: "success",
        });
        setIsCreating(false);
        fetchRangeData();
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to add new range",
          severity: "error",
        });
      }
    } catch (error) {
      console.log("Error adding new range:", error);
      setSnackbar({
        open: true,
        message: "Error adding new range",
        severity: "error",
      });
    }
  };

  const handleDeleteRange = (id) => {
    setDeleteRowId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss/number_range/${deleteRowId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setRangeData((prev) =>
          prev.filter((range) => range.id !== deleteRowId)
        );
        setSnackbar({
          open: true,
          message: "Range deleted successfully",
          severity: "success",
        });
        fetchRangeData();
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to delete range",
          severity: "error",
        });
      }
    } catch (error) {
      console.log("Error deleting range:", error);
      setSnackbar({
        open: true,
        message: "Error deleting range",
        severity: "error",
      });
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  const handleEditClick = (type) => {
    const rowToEdit = rangeData.find((row) => row.type === type);
    setEditedRanges({
      [type]: {
        startRange: rowToEdit.startRange,
        endRange: rowToEdit.endRange,
        currentRange: rowToEdit.currentRange,
        prefix: rowToEdit.prefix,
      },
    });
    setIsEditingRow(type);
  };

  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              height: "40px",
            }}
          >
            Range Settings
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Add Range">
            <IconButton
              variant="contained"
              onClick={handleAddRange}
              sx={{
                height: "40px",
                backgroundColor: "pink",
                marginRight: "10px",
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ height: "60vh", display: "flex", flexDirection: "column" }}>
        <TableContainer
          component={Paper}
          sx={{
            maxWidth: "100%",
            flexGrow: 1,
            overflow: "auto",
            maxHeight: "100%",
            "& .MuiTable-root": {
              tableLayout: "fixed",
              width: "100%",
            },
          }}
        >
          <Table
            stickyHeader
            sx={{
              minWidth: { xs: "100%", sm: 650 },
              height: "calc(100% - 125px) !important",
            }}
            aria-label="range settings table"
          >
            <TableHead>
              <TableRow>
                {[
                  "Type",
                  "Start Range",
                  "End Range",
                  "Current Range",
                  "Prefix",
                  "Action",
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      // backgroundColor: 'pink',
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      width: "20%",
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isCreating && (
                <TableRow key="new-range">
                  <TableCell>
                    <TextField
                      value={newRangeData.type}
                      variant="standard"
                      onChange={(e) =>
                        setNewRangeData({
                          ...newRangeData,
                          type: e.target.value,
                        })
                      }
                      placeholder="Enter Type"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={newRangeData.startRange}
                      variant="standard"
                      onChange={(e) =>
                        setNewRangeData({
                          ...newRangeData,
                          startRange: e.target.value,
                        })
                      }
                      placeholder="Enter Start Range"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      value={newRangeData.endRange}
                      onChange={(e) =>
                        setNewRangeData({
                          ...newRangeData,
                          endRange: e.target.value,
                        })
                      }
                      placeholder="Enter End Range"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      value={newRangeData.currentRange}
                      onChange={(e) =>
                        setNewRangeData({
                          ...newRangeData,
                          currentRange: e.target.value,
                        })
                      }
                      placeholder="Enter Current Range"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      value={newRangeData.prefix}
                      onChange={(e) =>
                        setNewRangeData({
                          ...newRangeData,
                          prefix: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="Enter Prefix"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={handleSaveNewRange}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setIsCreating(false)}>
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
              {rangeData.map((row, index) => (
                <TableRow
                  key={row.id || `row-${index}`}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>{row.type}</TableCell>
                  <TableCell>
                    {isEditingRow === row.type ? (
                      <TextField
                        size="small"
                        fullWidth
                        variant="standard"
                        value={editedRanges[row.type]?.startRange || ""}
                        onChange={(e) =>
                          handleRangeEdit(
                            row.type,
                            "startRange",
                            e.target.value
                          )
                        }
                        inputProps={{ maxLength: 6 }}
                      />
                    ) : (
                      row.startRange
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditingRow === row.type ? (
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={editedRanges[row.type]?.endRange || ""}
                        onChange={(e) =>
                          handleRangeEdit(row.type, "endRange", e.target.value)
                        }
                        inputProps={{ maxLength: 6 }}
                      />
                    ) : (
                      row.endRange
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditingRow === row.type ? (
                      <TextField
                        size="small"
                        fullWidth
                        variant="standard"
                        value={editedRanges[row.type]?.currentRange || ""}
                        onChange={(e) =>
                          handleRangeEdit(
                            row.type,
                            "currentRange",
                            e.target.value
                          )
                        }
                        inputProps={{ maxLength: 6 }}
                      />
                    ) : (
                      row.currentRange
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditingRow === row.type ? (
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={editedRanges[row.type]?.prefix || ""}
                        onChange={(e) =>
                          handleRangeEdit(row.type, "prefix", e.target.value)
                        }
                        inputProps={{ maxLength: 10 }}
                        // variant="outlined"
                        sx={{
                          backgroundColor: "lightyellow",
                          borderRadius: "4px",
                        }}
                      />
                    ) : (
                      row.prefix
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditingRow === row.type ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Save">
                          <IconButton
                            variant="contained"
                            onClick={() => handleRangeSubmit(row.type)}
                            sx={{ height: "40px" }}
                          >
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton
                            variant="outlined"
                            onClick={handleRangeCancel}
                            sx={{ height: "40px" }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Edit">
                          <span>
                            <IconButton
                              onClick={() => handleEditClick(row.type)}
                              disabled={role !== "Admin"}
                              sx={{ height: "40px" }}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              variant="contained"
                              disabled={role !== "Admin"}
                              onClick={() => handleDeleteRange(row.id)}
                              sx={{ height: "40px" }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this range? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
