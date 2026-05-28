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

export default function Service() {
  const [services, setServices] = useState([]);
  const [token, setToken] = useState(null);
  const [rolename, setRole] = useState("");
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editedData, setEditedData] = useState({ service_name: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/ss/service"; // Adjust API URL

  useEffect(() => {
    fetchServices();
    const token = Cookies.get("token");
    setToken(token);
    const role = Cookies.get("role");
    setRole(role);
  }, []);

  const fetchServices = () => {
    fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data);
        } else if (data.services && Array.isArray(data.services)) {
          // If the data has a 'services' key that is an array
          setServices(data.services);
        } else {
          console.log(
            "Fetched data is not an array or does not contain a 'services' array:",
            data
          );
          setServices([]); // Set to empty array if data is not an array
        }
      })
      .catch((error) => {
        console.log("Error fetching services:", error);
        setServices([]); // Set to empty array on error
      });
  };

  const handleSaveService = async () => {
    const method = editingServiceId ? "PUT" : "POST";
    const url = editingServiceId ? `${apiUrl}/${editingServiceId}` : apiUrl;
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) throw new Error("Failed to save service");

      fetchServices(); // Refresh services
      setSnackbar({
        open: true,
        message: editingServiceId
          ? "Service updated successfully"
          : "Service created successfully",
        severity: "success",
      });
      setEditingServiceId(null);
      setEditedData({ service_name: "" });
      setIsCreating(false);
    } catch (error) {
      console.log("Error saving service:", error);
      setSnackbar({
        open: true,
        message: "Error saving service",
        severity: "error",
      });
    }
  };

  const handleDeleteService = (id) => {
    setDeleteServiceId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteService = () => {
    fetch(`${apiUrl}/${deleteServiceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (response.ok) {
          fetchServices(); // Refresh services
          setSnackbar({
            open: true,
            message: "Service deleted successfully",
            severity: "success",
          });
        } else {
          throw new Error("Failed to delete service");
        }
      })
      .catch((error) => {
        console.log("Error deleting service:", error);
        setSnackbar({
          open: true,
          message: "Error deleting service",
          severity: "error",
        });
      })
      .finally(() => {
        setOpenDeleteDialog(false);
        setDeleteServiceId(null);
      });
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", p: 0 }}>
        <Typography variant="h4">{/* Service Management */}</Typography>
        {/* <Button
          variant="contained"
          sx={{ mb: 2 }}
          onClick={() => {
            setEditingServiceId(null);
            setEditedData({ service_name: ""});
            setIsCreating(true);
          }}
        >
          Create Service
        </Button> */}
        <Tooltip title="Add Service">
          <IconButton
            variant="contained"
            onClick={() => {
              setEditingServiceId(null);
              setEditedData({ service_name: "" });
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
          <Table stickyHeader aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Service Name</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isCreating && (
                <TableRow>
                  <TableCell>
                    <TextField
                      name="service_name"
                      value={editedData.service_name}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          service_name: e.target.value,
                        })
                      }
                      variant="standard"
                      placeholder="Enter Service Name"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={handleSaveService}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setIsCreating(false)}>
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    {editingServiceId === service.id ? (
                      <TextField
                        name="service_name"
                        value={editedData.service_name}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            service_name: e.target.value,
                          })
                        }
                        variant="standard"
                      />
                    ) : (
                      service.service_name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingServiceId === service.id ? (
                      <>
                        <IconButton onClick={handleSaveService}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={() => setEditingServiceId(null)}>
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          onClick={() => {
                            setEditingServiceId(service.id);
                            setEditedData({
                              service_name: service.service_name,
                            });
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <span>
                          <IconButton
                            disabled={rolename !== "Admin"}
                            onClick={() => handleDeleteService(service.id)}
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

      {/* Deletion Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this service? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteService} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
