"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Modal,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";

export default function MakeModal() {
  const [makes, setMakes] = useState([]);
  const [editingMakeId, setEditingMakeId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMakeName, setNewMakeName] = useState("");
  const [newModels, setNewModels] = useState(['']);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [makeIdToDelete, setMakeIdToDelete] = useState(null);
  const [token, setToken] = useState(null);
  const [rolename, setRole] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [models, setModels] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMake, setEditingMake] = useState({ make_name: '', models: [] });

  const fetchMakes = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      console.log("🚀 ~ fetchMakes ~ data:", data);
      // Convert comma-separated models string to array
      const formattedData = Array.isArray(data) ? data.map(make => ({
        ...make,
        models: typeof make.models === 'string' ? make.models.split(',') : []
      })) : [];
      setMakes(formattedData);
    } catch (error) {
      console.log("Error fetching makes:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch vehicle makes",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);
    const role = Cookies.get("role");
    setRole(role);
    
    if (token) {
      fetchMakes(token);
    }
  }, []);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewMakeName("");
    setNewModels(['']);
  };

  const handleAddModelInput = () => {
    setNewModels([...newModels, '']);
  };

  const handleRemoveModelInput = (index) => {
    const updatedModels = newModels.filter((_, i) => i !== index);
    setNewModels(updatedModels);
  };

  const handleModelChange = (index, value) => {
    const updatedModels = [...newModels];
    updatedModels[index] = value;
    setNewModels(updatedModels);
  };

  const handleCreateMake = async () => {
    try {
        const formattedData = {
            make_name: newMakeName,
            models: newModels.filter(model => model.trim() !== '').join(',')
          };
          console.log({formattedData})

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles/make`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedData),
        }
      );
      const data = await response.json();
      console.log("🚀 ~ handleCreateMake ~ data:", data);
      handleCloseModal();
      setNewModels(['']);
      setSnackbar({
        open: true,
        message: "Make and Models created successfully",
        severity: "success",
      });
      fetchMakes(token);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to create Make and Models",
        severity: "error",
      });
    }
  };

  const handleEdit = (makeId) => {
    const makeToEdit = makes.find(make => make.make_id === makeId);
    if (makeToEdit) {
      setEditingMake({
        make_id: makeToEdit.make_id,
        make_name: makeToEdit.make_name,
        models: makeToEdit.models
      });
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMake({ make_name: '', models: [] });
  };

  const handleUpdateMake = async () => {
    try {
      const formattedData = {
        make_name: editingMake.make_name,
        models: editingMake.models.filter(model => model.trim() !== '').join(',')
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles/make/${editingMake.make_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedData),
        }
      );

      const data = await response.json();
      console.log("🚀 ~ handleUpdateMake ~ data:", data);

      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: "Make and Models updated successfully",
          severity: "success",
        });
        fetchMakes(token);
        handleCloseEditModal();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to update Make and Models",
        severity: "error",
      });
    }
  };

  const handleEditModelChange = (index, value) => {
    const updatedModels = [...editingMake.models];
    updatedModels[index] = value;
    setEditingMake({ ...editingMake, models: updatedModels });
  };

  const handleAddEditModel = () => {
    setEditingMake({
      ...editingMake,
      models: [...editingMake.models, '']
    });
  };

  const handleRemoveEditModel = (index) => {
    const updatedModels = editingMake.models.filter((_, i) => i !== index);
    setEditingMake({ ...editingMake, models: updatedModels });
  };

  const handleOpenDeleteDialog = (makeId) => {
    setMakeIdToDelete(makeId);
    setOpenDeleteDialog(true);
  };

  const handleDeleteMake = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles/make/${makeIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Refresh the makes list regardless of the response
      await fetchMakes(token);
      
      setSnackbar({
        open: true,
        message: "Make deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.log("Delete error:", error);
      // Still refresh the makes list even if there's an error
      await fetchMakes(token);
      
      setSnackbar({
        open: true,
        message: "The item may have been deleted. Refreshing list...",
        severity: "info",
      });
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}>
          Vehicle Make & Model
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Tooltip title="Add Make & Model">
            <IconButton
              onClick={handleOpenModal}
              sx={{ height: "40px", backgroundColor: "pink" }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ height: "60vh", display: "flex", flexDirection: "column" }}>
        <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: "auto" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width="30%">Make</TableCell>
                <TableCell width="50%">Models</TableCell>
                <TableCell width="20%">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {makes.map((make) => (
                <TableRow key={make.make_id}>
                  <TableCell>{make.make_name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Array.isArray(make.models) && make.models.map((model, index) => (
                        <Chip
                          key={`${make.make_id}-${model}-${index}`}
                          label={model}
                          size="small"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            disabled={rolename !== "Admin"}
                            onClick={() => handleEdit(make.make_id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            disabled={rolename !== "Admin"}
                            onClick={() => handleOpenDeleteDialog(make.make_id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            p: 4,
            backgroundColor: "white",
            boxShadow: 24,
            borderRadius: '10px',
            width: 400,
            maxHeight: '50vh',
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add New Make & Models
          </Typography>
          <TextField
            fullWidth
            label="Make Name"
            value={newMakeName}
            onChange={(e) => setNewMakeName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {newModels.map((model, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label={`Model ${index + 1}`}
                value={model}
                onChange={(e) => handleModelChange(index, e.target.value)}
              />
              {index > 0 && (
                <IconButton 
                  onClick={() => handleRemoveModelInput(index)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}
          
          <Button
            variant="outlined"
            onClick={handleAddModelInput}
            sx={{ mb: 2, width: '100%' }}
          >
            Add Another Model
          </Button>
          
          <Button
            variant="contained"
            onClick={handleCreateMake}
            sx={{ height: "40px", width: '100%' }}
          >
            Create
          </Button>
        </Box>
      </Modal>

      <Modal open={isEditModalOpen} onClose={handleCloseEditModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            p: 4,
            backgroundColor: "white",
            boxShadow: 24,
            borderRadius: '10px',
            width: 400,
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Edit Make & Models
          </Typography>
          <TextField
            fullWidth
            label="Make Name"
            value={editingMake.make_name}
            onChange={(e) => setEditingMake({ ...editingMake, make_name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          {editingMake.models.map((model, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label={`Model ${index + 1}`}
                value={model}
                onChange={(e) => handleEditModelChange(index, e.target.value)}
              />
              <IconButton 
                onClick={() => handleRemoveEditModel(index)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          
          <Button
            variant="outlined"
            onClick={handleAddEditModel}
            sx={{ mb: 2, width: '100%' }}
          >
            Add Another Model
          </Button>
          
          <Button
            variant="contained"
            onClick={handleUpdateMake}
            sx={{ height: "40px", width: '100%' }}
          >
            Update
          </Button>
        </Box>
      </Modal>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this make? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteMake} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
