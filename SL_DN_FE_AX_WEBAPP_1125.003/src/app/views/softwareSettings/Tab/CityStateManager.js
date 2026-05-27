"use client";
import React, { useEffect, useState } from "react";
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
    Button,
    Snackbar,
    Alert,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    Chip,
    CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import Cookies from "js-cookie";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/citystate`; // Replace with your actual server URL

export default function CityStateManager() {
    const [data, setData] = useState({});
    const [fetching, setFetching] = useState(true);

    // Add state/city
    const [newState, setNewState] = useState("");
    const [newCity, setNewCity] = useState("");
    const [selectedState, setSelectedState] = useState("");

    // Edit city dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingCity, setEditingCity] = useState({ state: "", oldCity: "", newCity: "" });

    // Delete dialogs
    const [deleteStateDialog, setDeleteStateDialog] = useState({ open: false, state: "" });
    const [deleteCityDialog, setDeleteCityDialog] = useState({ open: false, state: "", city: "" });

    // Loading states
    const [addingState, setAddingState] = useState(false);
    const [addingCity, setAddingCity] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingState, setDeletingState] = useState(false);
    const [deletingCity, setDeletingCity] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // New state for filtering
    const [stateFilter, setStateFilter] = useState("");

    const token = typeof window !== "undefined" ? Cookies.get("token") : "";

    // Fetch data only on mount
    useEffect(() => {
        const fetchData = async () => {
            setFetching(true);
            try {
                const res = await fetch(API_URL, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                setData(json);
            } catch {
                setData({});
            }
            setFetching(false);
        };
        fetchData();
        // eslint-disable-next-line
    }, []);

    // Optimistic Add new state
    const handleAddState = async () => {
        if (!newState.trim()) return;
        setAddingState(true);
        // Optimistically update UI
        setData((prev) => ({ ...prev, [newState.trim()]: [] }));
        setNewState("");
        setSnackbar({ open: true, message: "State added", severity: "success" });
        try {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ state: newState.trim() }),
            });
        } catch {
            setSnackbar({ open: true, message: "Failed to add state", severity: "error" });
        }
        setAddingState(false);
    };

    // Optimistic Add new city
    const handleAddCity = async () => {
        if (!selectedState || !newCity.trim()) return;
        setAddingCity(true);
        // Optimistically update UI
        setData((prev) => ({
            ...prev,
            [selectedState]: prev[selectedState]
                ? [...prev[selectedState], newCity.trim()]
                : [newCity.trim()],
        }));
        setNewCity("");
        setSnackbar({ open: true, message: "City added", severity: "success" });
        try {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ state: selectedState, city: newCity.trim() }),
            });
        } catch {
            setSnackbar({ open: true, message: "Failed to add city", severity: "error" });
        }
        setAddingCity(false);
    };

    // Optimistic Delete state
    const handleDeleteState = async () => {
        setDeletingState(true);
        // Optimistically update UI
        setData((prev) => {
            const newData = { ...prev };
            delete newData[deleteStateDialog.state];
            return newData;
        });
        if (selectedState === deleteStateDialog.state) setSelectedState("");
        setDeleteStateDialog({ open: false, state: "" });
        setSnackbar({ open: true, message: "State deleted", severity: "success" });
        try {
            await fetch(`${API_URL}/state`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ state: deleteStateDialog.state }),
            });
        } catch {
            setSnackbar({ open: true, message: "Failed to delete state", severity: "error" });
        }
        setDeletingState(false);
    };

    // Optimistic Delete city
    const handleDeleteCity = async () => {
        setDeletingCity(true);
        // Optimistically update UI
        setData((prev) => ({
            ...prev,
            [deleteCityDialog.state]: prev[deleteCityDialog.state].filter(
                (c) => c !== deleteCityDialog.city
            ),
        }));
        setDeleteCityDialog({ open: false, state: "", city: "" });
        setSnackbar({ open: true, message: "City deleted", severity: "success" });
        try {
            await fetch(`${API_URL}/city`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ state: deleteCityDialog.state, city: deleteCityDialog.city }),
            });
        } catch {
            setSnackbar({ open: true, message: "Failed to delete city", severity: "error" });
        }
        setDeletingCity(false);
    };

    // Optimistic Edit city
    const handleEditCity = async () => {
        setSavingEdit(true);
        // Optimistically update UI
        setData((prev) => ({
            ...prev,
            [editingCity.state]: prev[editingCity.state].map((c) =>
                c === editingCity.oldCity ? editingCity.newCity : c
            ),
        }));
        setEditDialogOpen(false);
        setEditingCity({ state: "", oldCity: "", newCity: "" });
        setSnackbar({ open: true, message: "City updated", severity: "success" });
        try {
            await fetch(`${API_URL}/city`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(editingCity),
            });
        } catch {
            setSnackbar({ open: true, message: "Failed to update city", severity: "error" });
        }
        setSavingEdit(false);
    };

    // Filtered states for display
    const filteredStates = Object.keys(data).filter((state) =>
        state.toLowerCase().includes(stateFilter.toLowerCase())
    );

    return (
        <div>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
                <Typography
                    variant="h4"
                    sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}
                >
                    City/State Manager
                </Typography>

            </Box>
            <Box sx={{ display: "flex", gap: 2, p: 2, flexWrap: "wrap" }}>
                <TextField
                    label="New State"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    size="small"
                />
                <Button
                    variant="contained"
                    onClick={handleAddState}
                    startIcon={addingState ? <CircularProgress size={18} /> : <AddIcon />}
                    disabled={addingState || !newState.trim()}
                    sx={{ height: "40px" }}
                >
                    Add State
                </Button>
                <Select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    displayEmpty
                    size="small"
                    sx={{ minWidth: 180 }}
                >
                    <MenuItem value="">Select State</MenuItem>
                    {Object.keys(data).map((state) => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                    ))}
                </Select>
                <TextField
                    label="New City"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    size="small"
                />
                <Button
                    variant="contained"
                    onClick={handleAddCity}
                    startIcon={addingCity ? <CircularProgress size={18} /> : <AddIcon />}
                    disabled={addingCity || !selectedState || !newCity.trim()}
                    sx={{ height: "40px" }}
                >
                    Add City
                </Button>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                        size="small"
                        placeholder="Search State"
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
                        }}
                        sx={{ minWidth: 200 }}
                    />
                </Box>
            </Box>
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
                    <Table stickyHeader aria-label="city state table">
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
                                    State
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
                                    Cities
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
                            {fetching ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : filteredStates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        No states found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStates.map((state) => (
                                    <TableRow key={state}>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography>{state}</Typography>
                                                <Tooltip title="Delete State">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => setDeleteStateDialog({ open: true, state })}
                                                            disabled={deletingState}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {data[state].length === 0 && (
                                                    <Typography variant="body2" color="text.secondary">No cities</Typography>
                                                )}
                                                {data[state].map((city) => (
                                                    <Chip
                                                        key={city}
                                                        label={city}
                                                        sx={{ m: 0.25, fontSize: "0.75rem", height: "24px" }}
                                                        onDelete={() => setDeleteCityDialog({ open: true, state, city })}
                                                        deleteIcon={
                                                            <DeleteIcon fontSize="small" />
                                                        }
                                                        onClick={() => {
                                                            setEditingCity({ state, oldCity: city, newCity: city });
                                                            setEditDialogOpen(true);
                                                        }}
                                                        icon={<EditIcon fontSize="small" />}
                                                    />
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Delete State">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeleteStateDialog({ open: true, state })}
                                                        disabled={deletingState}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            {/* Edit City Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Edit City</DialogTitle>
                <DialogContent>
                    <TextField
                        label="City Name"
                        value={editingCity.newCity}
                        onChange={(e) => setEditingCity({ ...editingCity, newCity: e.target.value })}
                        fullWidth
                        autoFocus
                        disabled={savingEdit}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={savingEdit}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleEditCity}
                        disabled={savingEdit || !editingCity.newCity.trim()}
                        startIcon={savingEdit ? <CircularProgress size={18} /> : <SaveIcon />}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Delete State Dialog */}
            <Dialog
                open={deleteStateDialog.open}
                onClose={() => setDeleteStateDialog({ open: false, state: "" })}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete state <b>{deleteStateDialog.state}</b> and all its cities? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteStateDialog({ open: false, state: "" })} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteState} color="error" disabled={deletingState}>
                        {deletingState ? <CircularProgress size={18} /> : "Confirm"}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Delete City Dialog */}
            <Dialog
                open={deleteCityDialog.open}
                onClose={() => setDeleteCityDialog({ open: false, state: "", city: "" })}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete city <b>{deleteCityDialog.city}</b> from state <b>{deleteCityDialog.state}</b>?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteCityDialog({ open: false, state: "", city: "" })} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteCity} color="error" disabled={deletingCity}>
                        {deletingCity ? <CircularProgress size={18} /> : "Confirm"}
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