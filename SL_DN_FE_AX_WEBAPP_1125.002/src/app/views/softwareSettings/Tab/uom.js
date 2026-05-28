"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Snackbar,
  Alert,
  Paper,
  IconButton,
  Select,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";

export default function UOM() {
  const [uoms, setUoms] = useState([]);
  const [token, setToken] = useState("");
  const [rolename, setRole] = useState("");
  const [editingUomId, setEditingUomId] = useState(null);
  const [editedData, setEditedData] = useState({
    unit_name: "",
    unit_shortcode: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteUomId, setDeleteUomId] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/uom"; // Adjust API URL

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);

    const role = Cookies.get("role");
    setRole(role);
  }, []);

  useEffect(() => {
    if (token) {
      fetchUoms();
    }
  }, [token]);

  const fetchUoms = () => {
    if (!token) {
      console.log("No token available, skipping fetch");
      return;
    }

    fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched UOMs:", data);
        setUoms(data);
      })
      .catch((error) => {
        console.log("Error fetching UOMs:", error);
        setUoms([]); // Set empty array on error
      });
  };

  const handleSaveUom = async () => {
    const method = editingUomId ? "PUT" : "POST";
    const url = editingUomId ? `${apiUrl}/${editingUomId}` : apiUrl;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedData),
      });

      if (response.ok) {
        fetchUoms();
        setSnackbar({
          open: true,
          message: editingUomId
            ? "UOM updated successfully"
            : "UOM created successfully",
          severity: "success",
        });
        setEditingUomId(null);
        setEditedData({ unit_name: "", unit_shortcode: "" });
        setIsCreating(false);
      } else {
        const errorData = await response.json();
        if (
          errorData.details &&
          errorData.details.includes("Duplicate entry")
        ) {
          setSnackbar({
            open: true,
            message: "Already exists. Please use a different one.",
            severity: "error",
          });
        } else {
          throw new Error("Failed to save UOM");
        }
      }
    } catch (error) {
      console.log("Error saving UOM:", error);
      setSnackbar({
        open: true,
        message: "Error saving UOM",
        severity: "error",
      });
    }
  };

  const handleDeleteUom = (id) => {
    setDeleteUomId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteUom = () => {
    fetch(`${apiUrl}/${deleteUomId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (response.ok) {
          fetchUoms();
          setSnackbar({
            open: true,
            message: "UOM deleted successfully",
            severity: "success",
          });
        } else {
          throw new Error("Failed to delete UOM");
        }
      })
      .catch((error) => {
        console.log("Error deleting UOM:", error);
        setSnackbar({
          open: true,
          message: "Error deleting UOM",
          severity: "error",
        });
      })
      .finally(() => {
        setOpenDeleteDialog(false);
        setDeleteUomId(null);
      });
  };

  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", p: 0 }}>
        <Typography variant="h4">{/* Unit of Measurement */}</Typography>
        {/* <Button variant="contained" sx={{ mb: 2 }}>
          Create UOM
        </Button> */}
        <Tooltip title="Add UOM">
          <IconButton
            variant="contained"
            onClick={() => {
              setEditingUomId(null);
              setEditedData({ unit_name: "", unit_shortcode: "" });
              setIsCreating(true);
            }}
            sx={{ height: "40px", backgroundColor: "pink", marginTop: -3 }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          height: "60vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        }}
      >
        <TableContainer
          component={Paper}
          sx={{
            maxWidth: "100%",
            flexGrow: 1,
            overflow: "auto",
            "& .MuiTable-root": {
              tableLayout: "fixed",
              width: "100%",
            },
          }}
        >
          <Table
            stickyHeader
            sx={{ minWidth: { xs: "100%", sm: 650 } }}
            aria-label="simple table"
          >
            <TableHead>
              <TableRow>
                <TableCell>Unit Name</TableCell>
                <TableCell>Unit Shortcode</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isCreating && (
                <TableRow>
                  <TableCell>
                    <TextField
                      name="unit_name"
                      value={editedData.unit_name}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          unit_name: e.target.value,
                        })
                      }
                      variant="standard"
                      placeholder="Enter Unit Name"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      name="unit_shortcode"
                      value={editedData.unit_shortcode}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          unit_shortcode: e.target.value,
                        })
                      }
                      variant="standard"
                      placeholder="Enter Unit Shortcode"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={handleSaveUom}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setIsCreating(false)}>
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
              {uoms.map((uom) => (
                <TableRow key={uom.id}>
                  <TableCell>
                    {editingUomId === uom.id ? (
                      <TextField
                        name="unit_name"
                        value={editedData.unit_name}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            unit_name: e.target.value,
                          })
                        }
                        variant="standard"
                      />
                    ) : (
                      uom.unit_name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUomId === uom.id ? (
                      <TextField
                        name="unit_shortcode"
                        value={editedData.unit_shortcode}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            unit_shortcode: e.target.value,
                          })
                        }
                        variant="standard"
                      />
                    ) : (
                      uom.unit_shortcode
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUomId === uom.id ? (
                      <>
                        <IconButton onClick={handleSaveUom}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={() => setEditingUomId(null)}>
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          onClick={() => {
                            setEditingUomId(uom.id);
                            setEditedData({
                              unit_name: uom.unit_name,
                              unit_shortcode: uom.unit_shortcode,
                            });
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <span>
                          <IconButton
                            disabled={rolename !== "Admin"}
                            onClick={() => handleDeleteUom(uom.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </>
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
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
          Are you sure you want to delete this UOM? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteUom} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
