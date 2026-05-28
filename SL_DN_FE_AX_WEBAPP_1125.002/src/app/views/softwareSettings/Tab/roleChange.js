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
  Autocomplete,
  TextField,
  Button,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  Modal,
  Icon,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function DraggableChip({ id, label, onDelete, roleId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const filteredListeners = {
    ...listeners,
    onPointerDown: (e) => {
      // Allow delete icon clicks to pass through without triggering drag
      if (!e.target.closest('.MuiChip-deleteIcon')) {
        listeners?.onPointerDown?.(e);
      }
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...filteredListeners}
    >
      <Chip
        label={label}
        size="small"
        onDelete={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDelete();
        }}
        sx={{
          fontSize: "0.75rem",
          height: "24px",
          cursor: isDragging ? "grabbing" : "grab",
          "& .MuiChip-deleteIcon": {
            fontSize: "16px",
            cursor: "pointer",
            pointerEvents: "auto",
          },
        }}
      />
    </div>
  );
}

export default function RoleChange() {
  const [tileData, setTileData] = useState([]);
  const [allTiles, setAllTiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAccess, setEditedAccess] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [roleIdToDelete, setRoleIdToDelete] = useState(null);
  const [token, setToken] = useState(null);
  const [rolename, setRole] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/tiles";

  const fetchTiles = async (token) => {
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      let data = await response.json();
      // Check if data exists and handle the response structure
      if (data) {
        setTileData(data); // Assuming the array is directly in data
        console.log({data})
        const tileNames = data.map(tile => tile.tile_id);
        setAllTiles(tileNames);
        console.log('Available tiles:', tileNames); // Debug log
      } else {
        console.log("No tile data received from API");
        setAllTiles([]);
      }
    } catch (error) {
      console.log("Error fetching Tile Data:", error);
      setAllTiles([]);
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);

    const role = Cookies.get("role");
    setRole(role);
    fetchTiles(token);
  }, []);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // Reusable function to fetch roles
  const fetchRoles = async (authToken = token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/roles`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const data = await response.json();

      // Ensure data is an array
      const rolesArray = Array.isArray(data) ? data : [];

      setRoles(rolesArray);

      const initialAccess = {};
      rolesArray.forEach((role) => {
        initialAccess[role.role_id] = Array.isArray(role.access)
          ? role.access
          : JSON.parse(role.access || "[]");
      });
      setEditedAccess(initialAccess);
    } catch (error) {
      console.log("Error fetching roles:", error);
      setSnackbar({
        open: true,
        message: "Failed to refresh roles",
        severity: "error",
      });
    }
  };

  const handleCreateRole = async () => {
    // Logic to create a new role
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/add-role`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role_name: newRoleName }),
      }
    );
    const data = await response.json();
    handleCloseModal();
    setSnackbar({
      open: true,
      message: "Role created successfully",
      severity: "success",
    });
    await fetchRoles(token);
  };

  useEffect(() => {
    if (token) {
      fetchRoles(token);
    }
  }, [token]);

  const handleAccessChange = (roleId, newValue) => {
    setEditedAccess((prev) => ({
      ...prev,
      [roleId]: newValue,
    }));
  };

  const handleDelete = (roleId, indexToDelete) => {
    setEditedAccess((prev) => ({
      ...prev,
      [roleId]: prev[roleId].filter((_, index) => index !== indexToDelete),
    }));
  };

  const handleSubmit = async () => {
    try {
      const accessData = roles.reduce((acc, role) => {
        acc[role.role_name] = editedAccess[role.role_id] || [];
        return acc;
      }, {});

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/update-access`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessData }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update access");
      }

      const data = await response.json();
      setIsEditing(false);
      setEditingRoleId(null);
      setSnackbar({
        open: true,
        message: "Access updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.log("Error updating access:", error);
      setSnackbar({
        open: true,
        message: "Failed to update access",
        severity: "error",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingRoleId(null);
  };

  //that data successfully deleted snackbar show

  const handleDeleteRole = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/role/${roleIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role_id: roleIdToDelete }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete role");
      }

      setSnackbar({
        open: true,
        message: "Role deleted successfully",
        severity: "success",
      });
      // Refresh the roles list after deletion
      await fetchRoles(token);
    } catch (error) {
      console.log("Error deleting role:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete role",
        severity: "error",
      });
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  const handleOpenDeleteDialog = (roleId) => {
    setRoleIdToDelete(roleId);
    setOpenDeleteDialog(true);
  };

  const handleEdit = (roleId) => {
    setEditingRoleId(roleId);
  };

  const handleDragEnd = (event, roleId) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const currentAccess = editedAccess[roleId] || [];
      const oldIndex = currentAccess.indexOf(active.id);
      const newIndex = currentAccess.indexOf(over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newAccess = arrayMove(currentAccess, oldIndex, newIndex);
        setEditedAccess((prev) => ({
          ...prev,
          [roleId]: newAccess,
        }));
      }
    }
  };

  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}
        >
          Role Change Form
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {!isEditing && (
            // <Button variant="contained" onClick={handleOpenModal} sx={{ height: "40px" }}>
            //   Create Role
            // </Button>
            //   <Tooltip title="Add Lead">
            //   <IconButton
            //     aria-label="addLead"
            //     onClick={() => {
            //       onClick={handleOpenModal}
            //     }}
            //     sx={{
            //       borderRadius: 1,
            //       padding: "3px 10px",
            //       backgroundColor: "pink",
            //       "&:hover": {
            //         backgroundColor: "pink",
            //       },
            //     }}
            //   >
            //     <AddIcon fontSize="small" />
            //   </IconButton>
            // </Tooltip>
            <Tooltip title="Add Role">
              <IconButton
                variant="contained"
                onClick={handleOpenModal}
                sx={{ height: "40px", backgroundColor: "pink" }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
          {/* {!isEditing ? (
            <IconButton variant="contained" onClick={() => setIsEditing(true)} sx={{ height: "40px", backgroundColor: "pink"}}>
        <EditIcon/>
            </IconButton>
          ) : (
            <Box sx={{ display: "flex", gap: 2 }}>
              <IconButton variant="outlined" onClick={handleCancel} sx={{ height: "40px" }}>
                <CancelIcon/>
              </IconButton>
              <IconButton variant="contained" onClick={handleSubmit} sx={{ height: "40px" }}>
                <SaveIcon/>
              </IconButton>
            </Box>
          )} */}
        </Box>
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
            width: 300,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Create New Role
          </Typography>
          <TextField
            fullWidth
            label="Role Name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleCreateRole}
            sx={{
              height: "40px",
            }}
          >
            Create
          </Button>
        </Box>
      </Modal>

      <Box sx={{ height: "60vh", display: "flex", flexDirection: "column" }}>
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
            sx={{
              minWidth: { xs: "100%", sm: 650 },
            }}
            aria-label="role access table"
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    backgroundColor: "white",
                    width: "20%",
                  }}
                >
                  Role
                </TableCell>
                <TableCell
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    backgroundColor: "white",
                    width: "70%",
                  }}
                >
                  Access Tiles
                </TableCell>
                <TableCell
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    backgroundColor: "white",
                    width: "10%",
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.role_id}>
                  <TableCell>{role.role_name}</TableCell>
                  <TableCell>
                    {editingRoleId === role.role_id ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, role.role_id)}
                      >
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
                          <Autocomplete
                            multiple
                            options={allTiles}
                            value={[
                              ...new Set(
                                editedAccess[role.role_id] || role.access || []
                              ),
                            ]}
                            onChange={(event, newValue) =>
                              handleAccessChange(role.role_id, [
                                ...new Set(newValue),
                              ])
                            }
                            disableCloseOnSelect
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                                fullWidth
                                placeholder="Type to add tiles"
                              />
                            )}
                            renderTags={() => null}
                            isOptionEqualToValue={(option, value) =>
                              option === value
                            }
                            filterSelectedOptions={false}
                            sx={{
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                padding: "4px",
                                minHeight: "40px",
                              },
                            }}
                          />
                          <SortableContext
                            items={editedAccess[role.role_id] || []}
                            strategy={verticalListSortingStrategy}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                                width: "100%",
                                padding: "8px 0",
                              }}
                            >
                              {(editedAccess[role.role_id] || []).map(
                                (tile, index) => (
                                  <DraggableChip
                                    key={tile}
                                    id={tile}
                                    label={tile}
                                    onDelete={() => {
                                      handleDelete(role.role_id, index);
                                    }}
                                    roleId={role.role_id}
                                  />
                                )
                              )}
                            </Box>
                          </SortableContext>
                        </Box>
                      </DndContext>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                          width: "100%", // Make the container full width
                        }}
                      >
                        {(editedAccess[role.role_id] || []).map(
                          (tile, index) => (
                            <span
                              key={index}
                              style={{
                                backgroundColor: "#e0e0e0",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                              }}
                            >
                              {tile}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRoleId === role.role_id ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Cancel">
                          <IconButton onClick={handleCancel}>
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Save">
                          <IconButton
                            onClick={() => handleSubmit(role.role_id)}
                          >
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Edit">
                          <span>
                            <IconButton
                              disabled={rolename !== "Admin" && role.role_name === "admin"}
                              onClick={() => handleEdit(role.role_id)}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              onClick={() =>
                                handleOpenDeleteDialog(role.role_id)
                              }
                              disabled={rolename !== "Admin" && role.role_name === "admin"}
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
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this role? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteRole} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
