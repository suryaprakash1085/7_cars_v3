"use client";
import React, { useCallback, useEffect, useState } from "react";
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
  CircularProgress,
  Switch,
  FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import Cookies from "js-cookie";
import { clearTimezoneCache } from "@/utils/timezoneUtil";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/ss/timezone`;

export default function TimezoneManager() {
  const [timezones, setTimezones] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [addingTimezone, setAddingTimezone] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [searchFilter, setSearchFilter] = useState("");

  const [formData, setFormData] = useState({
    timezone_name: "",
    timezone_code: "",
    utc_offset: "",
    description: "",
  });

  const token = typeof window !== "undefined" ? Cookies.get("token") : "";

  const fetchTimezones = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setTimezones(json.timezones || []);
    } catch (error) {
      console.error("Error fetching timezones:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch timezones",
        severity: "error",
      });
    }
    setFetching(false);
  }, [token]);

  useEffect(() => {
    fetchTimezones();
  }, [fetchTimezones]);

  const handleAddTimezone = async () => {
    if (!formData.timezone_name.trim() || !formData.timezone_code.trim() || !formData.utc_offset.trim()) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        severity: "warning",
      });
      return;
    }

    setAddingTimezone(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const json = await res.json();
        setFormData({
          timezone_name: "",
          timezone_code: "",
          utc_offset: "",
          description: "",
        });
        clearTimezoneCache();
        await fetchTimezones();
        setSnackbar({
          open: true,
          message: "Timezone added successfully",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to add timezone",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error adding timezone:", error);
      setSnackbar({
        open: true,
        message: "Error adding timezone",
        severity: "error",
      });
    }
    setAddingTimezone(false);
  };

  const handleEditOpen = (timezone) => {
    setEditing(timezone);
    setFormData({
      timezone_name: timezone.timezone_name,
      timezone_code: timezone.timezone_code,
      utc_offset: timezone.utc_offset,
      description: timezone.description,
    });
  };

  const handleEditSave = async () => {
    if (!formData.timezone_name.trim() || !formData.timezone_code.trim() || !formData.utc_offset.trim()) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        severity: "warning",
      });
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`${API_URL}/${editing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setEditing(null);
        setFormData({
          timezone_name: "",
          timezone_code: "",
          utc_offset: "",
          description: "",
        });
        clearTimezoneCache();
        await fetchTimezones();
        setSnackbar({
          open: true,
          message: "Timezone updated successfully",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to update timezone",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error updating timezone:", error);
      setSnackbar({
        open: true,
        message: "Error updating timezone",
        severity: "error",
      });
    }
    setSavingEdit(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;

    try {
      const res = await fetch(`${API_URL}/${deleting.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        clearTimezoneCache();
        await fetchTimezones();
        setSnackbar({
          open: true,
          message: "Timezone deleted successfully",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to delete timezone",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting timezone:", error);
      setSnackbar({
        open: true,
        message: "Error deleting timezone",
        severity: "error",
      });
    }
    setDeleting(null);
  };

  const handleToggleActive = async (timezone) => {
    try {
      const res = await fetch(`${API_URL}/${timezone.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: !timezone.is_active,
        }),
      });

      if (res.ok) {
        clearTimezoneCache();
        await fetchTimezones();
        setSnackbar({
          open: true,
          message: timezone.is_active ? "Timezone deactivated" : "Timezone activated",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to update timezone",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error toggling timezone:", error);
      setSnackbar({
        open: true,
        message: "Error updating timezone",
        severity: "error",
      });
    }
  };

  const filteredTimezones = timezones.filter((tz) =>
    tz.timezone_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    tz.timezone_code.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (fetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        Timezone Management
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "500" }}>
          {editing ? "Edit Timezone" : "Add New Timezone"}
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <TextField
            label="Timezone Name"
            value={formData.timezone_name}
            onChange={(e) => setFormData({ ...formData, timezone_name: e.target.value })}
            size="small"
            placeholder="e.g., Indian Standard Time"
          />
          <TextField
            label="Timezone Code"
            value={formData.timezone_code}
            onChange={(e) => setFormData({ ...formData, timezone_code: e.target.value })}
            size="small"
            placeholder="e.g., IST"
          />
          <TextField
            label="UTC Offset"
            value={formData.utc_offset}
            onChange={(e) => setFormData({ ...formData, utc_offset: e.target.value })}
            size="small"
            placeholder="e.g., UTC+5:30"
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            size="small"
            placeholder="Optional description"
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={editing ? handleEditSave : handleAddTimezone}
            disabled={addingTimezone || savingEdit}
            startIcon={addingTimezone || savingEdit ? <CircularProgress size={20} /> : undefined}
          >
            {editing ? "Update" : "Add"} Timezone
          </Button>
          {editing && (
            <Button
              variant="outlined"
              onClick={() => {
                setEditing(null);
                setFormData({
                  timezone_name: "",
                  timezone_code: "",
                  utc_offset: "",
                  description: "",
                });
              }}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            label="Search Timezones"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            size="small"
            fullWidth
            placeholder="Search by name or code..."
          />
        </Box>

        <TableContainer sx={{ maxHeight: "400px", overflow: "auto" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Timezone Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Code</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>UTC Offset</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Active
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTimezones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">No timezones found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTimezones.map((timezone) => (
                  <TableRow key={timezone.id} sx={{ backgroundColor: timezone.is_active ? "#f0f7ff" : "transparent" }}>
                    <TableCell>{timezone.timezone_name}</TableCell>
                    <TableCell>{timezone.timezone_code}</TableCell>
                    <TableCell>{timezone.utc_offset}</TableCell>
                    <TableCell>{timezone.description || "-"}</TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={timezone.is_active || false}
                        onChange={() => handleToggleActive(timezone)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditOpen(timezone)}
                          sx={{ color: "primary.main" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleting(timezone)}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete Timezone</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleting?.timezone_name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
