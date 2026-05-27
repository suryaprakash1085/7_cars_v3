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

export default function GST() {
  const [gsts, setGsts] = useState([]);
  const [token, setToken] = useState("");
  const [rolename, setRole] = useState("");
  const [editingGstId, setEditingGstId] = useState(null);
  const [editedData, setEditedData] = useState({
    gst_name: "",
    gst_percentage: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteGstId, setDeleteGstId] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/gst";

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);

    const role = Cookies.get("role");
    setRole(role);
  }, []);

  useEffect(() => {
    if (token) {
      fetchGsts();
    }
  }, [token]);

  const fetchGsts = () => {
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
        console.log("Fetched GSTs:", data);
        setGsts(data);
      })
      .catch((error) => {
        console.log("Error fetching GSTs:", error);
        setGsts([]);
      });
  };

  const handleSaveGst = async () => {
    const method = editingGstId ? "PUT" : "POST";
    const url = editingGstId ? `${apiUrl}/${editingGstId}` : apiUrl;

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
        fetchGsts();
        setSnackbar({
          open: true,
          message: editingGstId
            ? "GST updated successfully"
            : "GST created successfully",
          severity: "success",
        });
        setEditingGstId(null);
        setEditedData({ gst_name: "", gst_percentage: "" });
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
          throw new Error("Failed to save GST");
        }
      }
    } catch (error) {
      console.log("Error saving GST:", error);
      setSnackbar({
        open: true,
        message: "Error saving GST",
        severity: "error",
      });
    }
  };

  const handleDeleteGst = (id) => {
    setDeleteGstId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteGst = () => {
    fetch(`${apiUrl}/${deleteGstId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (response.ok) {
          fetchGsts();
          setSnackbar({
            open: true,
            message: "GST deleted successfully",
            severity: "success",
          });
        } else {
          throw new Error("Failed to delete GST");
        }
      })
      .catch((error) => {
        console.log("Error deleting GST:", error);
        setSnackbar({
          open: true,
          message: "Error deleting GST",
          severity: "error",
        });
      })
      .finally(() => {
        setOpenDeleteDialog(false);
        setDeleteGstId(null);
      });
  };

  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", p: 0 }}>
        <Typography variant="h4">{/* GST Management */}</Typography>
        <Tooltip title="Add GST">
          <IconButton
            variant="contained"
            onClick={() => {
              setEditingGstId(null);
              setEditedData({ gst_name: "", gst_percentage: "" });
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
                <TableCell>GST Name</TableCell>
                <TableCell>GST Percentage</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isCreating && (
                <TableRow>
                  <TableCell>
                    <TextField
                      name="gst_name"
                      value={editedData.gst_name}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          gst_name: e.target.value,
                        })
                      }
                      variant="standard"
                      placeholder="Enter GST Name"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      name="gst_percentage"
                      type="number"
                      step="0.01"
                      value={editedData.gst_percentage}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          gst_percentage: e.target.value,
                        })
                      }
                      variant="standard"
                      placeholder="Enter GST Percentage"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={handleSaveGst}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setIsCreating(false)}>
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
              {gsts.map((gst) => (
                <TableRow key={gst.id}>
                  <TableCell>
                    {editingGstId === gst.id ? (
                      <TextField
                        name="gst_name"
                        value={editedData.gst_name}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            gst_name: e.target.value,
                          })
                        }
                        variant="standard"
                      />
                    ) : (
                      gst.gst_name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingGstId === gst.id ? (
                      <TextField
                        name="gst_percentage"
                        type="number"
                        step="0.01"
                        value={editedData.gst_percentage}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            gst_percentage: e.target.value,
                          })
                        }
                        variant="standard"
                      />
                    ) : (
                     `${gst.gst_percentage}%`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingGstId === gst.id ? (
                      <>
                        <IconButton onClick={handleSaveGst}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={() => setEditingGstId(null)}>
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          onClick={() => {
                            setEditingGstId(gst.id);
                            setEditedData({
                              gst_name: gst.gst_name,
                              gst_percentage: gst.gst_percentage,
                            });
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <span>
                          <IconButton
                            disabled={rolename !== "Admin"}
                            onClick={() => handleDeleteGst(gst.id)}
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
          Are you sure you want to delete this GST? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteGst} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
