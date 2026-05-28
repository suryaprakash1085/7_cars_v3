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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import LinkIcon from "@mui/icons-material/Link";

export default function CompanyNumberRanges() {
  const [token, setToken] = useState("");
  const [companyCodes, setCompanyCodes] = useState([]);
  const [numberRanges, setNumberRanges] = useState([]);
  const [rangesByCompany, setRangesByCompany] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [newRangeData, setNewRangeData] = useState({
    company_code: "",
    id_type: "",
    range_start: "",
    range_end: "",
    running_number: "",
    prefix: "",
  });
  const [selectedCompany, setSelectedCompany] = useState("");
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    company_code: "",
    company_name: "",
    company_gst: "",
    company_phone_number: "",
  });

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all company codes
      const companyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss/codes/all`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("token")}` },
        }
      );
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompanyCodes(Array.isArray(companyData) ? companyData : []);
      } else {
        console.warn("Failed to fetch company codes:", companyRes.statusText);
        setCompanyCodes([]);
      }

      // Fetch number ranges
      const rangeRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss/number_range`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("token")}` },
        }
      );
      if (rangeRes.ok) {
        const rangeData = await rangeRes.json();
        const ranges = rangeData.number_range || rangeData || [];
        setNumberRanges(ranges);

        // Group ranges by company code
        const grouped = {};
        ranges.forEach((range) => {
          const code = range.company_code || "Global";
          if (!grouped[code]) {
            grouped[code] = [];
          }
          grouped[code].push(range);
        });
        setRangesByCompany(grouped);
      } else {
        console.warn("Failed to fetch ranges:", rangeRes.statusText);
      }
    } catch (error) {
      showSnackbar("Error fetching data", "error");
      console.error(error);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddClick = () => {
    setNewRangeData({
      company_code: "",
      id_type: "",
      range_start: "",
      range_end: "",
      running_number: "",
      prefix: "",
    });
    setOpenDialog(true);
  };

  const handleCreateCompany = async () => {
    // Validate required fields
    if (!newCompanyData.company_code || newCompanyData.company_code.trim() === "") {
      showSnackbar("Company Code is required", "error");
      return;
    }
    if (!newCompanyData.company_name || newCompanyData.company_name.trim() === "") {
      showSnackbar("Company Name is required", "error");
      return;
    }

    try {
      const payload = {
        company_code: newCompanyData.company_code.trim().toUpperCase(),
        company_name: newCompanyData.company_name.trim(),
        company_gst: newCompanyData.company_gst?.trim() || "",
        company_phone_number: newCompanyData.company_phone_number?.trim() || "",
      };

      console.log("Creating company with payload:", payload);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      console.log("Response:", responseData);

      if (response.ok) {
        showSnackbar("Company created successfully");
        setOpenCompanyDialog(false);
        setNewCompanyData({
          company_code: "",
          company_name: "",
          company_gst: "",
          company_phone_number: "",
        });
        fetchData();
      } else {
        showSnackbar(
          `Failed to create company: ${responseData.details || responseData.error || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      showSnackbar("Error creating company: " + error.message, "error");
      console.error(error);
    }
  };

  const handleEditClick = (range) => {
    setEditingId(range.id);
    setEditData({
      id: range.id,
      company_code: range.company_code || "",
      id_type: range.id_type,
      range_start: range.range_start.toString(),
      range_end: range.range_end.toString(),
      running_number: range.running_number.toString(),
      prefix: range.prefix,
    });
  };

  const handleSaveEdit = async () => {
    try {
      const rangeStart = parseInt(editData.range_start);
      const rangeEnd = parseInt(editData.range_end);
      const runningNumber = parseInt(editData.running_number);

      // Validate
      if (rangeStart >= rangeEnd) {
        showSnackbar("Range Start must be less than Range End", "error");
        return;
      }

      const payload = {
        company_code: editData.company_code || null,
        id_type: editData.id_type,
        range_start: rangeStart,
        range_end: rangeEnd,
        running_number: runningNumber,
        prefix: editData.prefix.toUpperCase(),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss/number_range/${editData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        showSnackbar("Range updated successfully");
        setEditingId(null);
        fetchData();
      } else {
        const errorData = await response.json();
        showSnackbar(
          `Failed to update range: ${errorData.details || errorData.error}`,
          "error"
        );
      }
    } catch (error) {
      showSnackbar("Error updating range: " + error.message, "error");
      console.error(error);
    }
  };

  const handleCreateRange = async () => {
    // Validate required fields
    if (!newRangeData.id_type || newRangeData.id_type.trim() === "") {
      showSnackbar("ID Type is required", "error");
      return;
    }
    if (!newRangeData.prefix || newRangeData.prefix.trim() === "") {
      showSnackbar("Prefix is required", "error");
      return;
    }
    if (!newRangeData.range_start || newRangeData.range_start === "") {
      showSnackbar("Range Start is required", "error");
      return;
    }
    if (!newRangeData.range_end || newRangeData.range_end === "") {
      showSnackbar("Range End is required", "error");
      return;
    }

    const rangeStart = parseInt(newRangeData.range_start);
    const rangeEnd = parseInt(newRangeData.range_end);

    if (rangeStart >= rangeEnd) {
      showSnackbar("Range Start must be less than Range End", "error");
      return;
    }

    try {
      const payload = {
        company_code: newRangeData.company_code || null,
        id_type: newRangeData.id_type.trim(),
        range_start: rangeStart,
        range_end: rangeEnd,
        running_number: newRangeData.running_number ? parseInt(newRangeData.running_number) : rangeStart,
        prefix: newRangeData.prefix.trim().toUpperCase(),
      };

      console.log("Creating range with payload:", payload);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss/number_range`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      console.log("Response:", responseData);

      if (response.ok) {
        showSnackbar("Range created successfully");
        setOpenDialog(false);
        fetchData();
      } else {
        showSnackbar(
          `Failed to create range: ${responseData.details || responseData.error || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      showSnackbar("Error creating range: " + error.message, "error");
      console.error(error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteItemId(id);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ss/number_range/${deleteItemId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        showSnackbar("Range deleted successfully");
        setOpenDeleteDialog(false);
        fetchData();
      } else {
        showSnackbar("Failed to delete range", "error");
      }
    } catch (error) {
      showSnackbar("Error deleting range", "error");
      console.error(error);
    }
  };

  // Build a list of all companies to display: companyCodes + Global
  const allCompanyKeys = () => {
    const keys = new Set();

    // Add all actual company codes
    companyCodes.forEach(comp => {
      keys.add(comp.company_code);
    });

    // Add Global if there are any global ranges (ranges with no company_code)
    if (numberRanges.some(r => !r.company_code)) {
      keys.add("Global");
    }

    // Sort: Global first, then companies A-Z
    return Array.from(keys).sort((a, b) => {
      if (a === "Global") return -1;
      if (b === "Global") return 1;
      return a.localeCompare(b);
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinkIcon /> Company Code Number Range Mapping
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenCompanyDialog(true)}
          >
            Add New Company
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
          >
            Link Company Code
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Companies
              </Typography>
              <Typography variant="h5">{companyCodes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Ranges
              </Typography>
              <Typography variant="h5">{numberRanges.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Company-wise View */}
      {allCompanyKeys().map((companyCode) => (
        <Paper key={companyCode} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            {companyCode === "Global" ? "Global Ranges (No Company)" : `Company: ${companyCode}`}
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>Company Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="center">Prefix</TableCell>
                  <TableCell align="center">Range Start</TableCell>
                  <TableCell align="center">Range End</TableCell>
                  <TableCell align="center">Current</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rangesByCompany[companyCode]?.map((range) => (
                  <TableRow key={range.id}>
                    {editingId === range.id ? (
                      <>
                        <TableCell>
                          <Select
                            size="small"
                            value={editData.company_code}
                            onChange={(e) =>
                              setEditData({ ...editData, company_code: e.target.value })
                            }
                          >
                            <MenuItem value="">Global/None</MenuItem>
                            {companyCodes.map((comp) => (
                              <MenuItem key={comp.company_code} value={comp.company_code}>
                                {comp.company_code}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={editData.id_type}
                            onChange={(e) =>
                              setEditData({ ...editData, id_type: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            value={editData.prefix}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                prefix: e.target.value.toUpperCase(),
                              })
                            }
                            inputProps={{ maxLength: 10 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={editData.range_start}
                            onChange={(e) =>
                              setEditData({ ...editData, range_start: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={editData.range_end}
                            onChange={(e) =>
                              setEditData({ ...editData, range_end: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={editData.running_number}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                running_number: e.target.value,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Save">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={handleSaveEdit}
                            >
                              <SaveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton
                              size="small"
                              onClick={() => setEditingId(null)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          {range.company_code ? (
                            <Box
                              sx={{
                                px: 1,
                                py: 0.5,
                                backgroundColor: "#c8e6c9",
                                borderRadius: 1,
                                fontWeight: "bold",
                              }}
                            >
                              {range.company_code}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Global
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{range.id_type}</TableCell>
                        <TableCell align="center">{range.prefix}</TableCell>
                        <TableCell align="center">{range.range_start}</TableCell>
                        <TableCell align="center">{range.range_end}</TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "inline-block",
                              px: 1.5,
                              py: 0.5,
                              backgroundColor: "#e3f2fd",
                              borderRadius: 1,
                              fontWeight: "bold",
                            }}
                          >
                            {range.running_number}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleEditClick(range)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteClick(range.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {(!rangesByCompany[companyCode] || rangesByCompany[companyCode].length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">
                        No number ranges configured for this company
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Link Company Code with Number Range</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Company Code (Optional - Leave empty for Global)</InputLabel>
            <Select
              value={newRangeData.company_code}
              label="Company Code"
              onChange={(e) =>
                setNewRangeData({ ...newRangeData, company_code: e.target.value })
              }
            >
              <MenuItem value="">Global/None</MenuItem>
              {companyCodes.map((company) => (
                <MenuItem key={company.company_code} value={company.company_code}>
                  {company.company_code} - {company.company_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="ID Type"
            placeholder="e.g., Appointment, Customer, Invoice"
            value={newRangeData.id_type}
            onChange={(e) =>
              setNewRangeData({ ...newRangeData, id_type: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Prefix"
            placeholder="e.g., APT, CUST, INV"
            value={newRangeData.prefix}
            onChange={(e) =>
              setNewRangeData({
                ...newRangeData,
                prefix: e.target.value.toUpperCase(),
              })
            }
            inputProps={{ maxLength: 10 }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Range Start"
            value={newRangeData.range_start}
            onChange={(e) =>
              setNewRangeData({ ...newRangeData, range_start: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Range End"
            value={newRangeData.range_end}
            onChange={(e) =>
              setNewRangeData({ ...newRangeData, range_end: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Starting Number (Current Running Number)"
            value={newRangeData.running_number}
            onChange={(e) =>
              setNewRangeData({ ...newRangeData, running_number: e.target.value })
            }
            helperText="Leave empty to use Range Start value"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRange} color="primary">
            Create Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this range?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Company Dialog */}
      <Dialog open={openCompanyDialog} onClose={() => setOpenCompanyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Company</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Company Code"
            placeholder="e.g., ABC, XYZ"
            value={newCompanyData.company_code}
            onChange={(e) =>
              setNewCompanyData({
                ...newCompanyData,
                company_code: e.target.value.toUpperCase()
              })
            }
            sx={{ mb: 2 }}
            helperText="Unique identifier for the company"
          />

          <TextField
            fullWidth
            label="Company Name"
            placeholder="e.g., ABC Company Pvt Ltd"
            value={newCompanyData.company_name}
            onChange={(e) =>
              setNewCompanyData({ ...newCompanyData, company_name: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="GST Number (Optional)"
            placeholder="e.g., 27AABCT1234H1Z0"
            value={newCompanyData.company_gst}
            onChange={(e) =>
              setNewCompanyData({ ...newCompanyData, company_gst: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Phone Number (Optional)"
            placeholder="e.g., 9876543210"
            value={newCompanyData.company_phone_number}
            onChange={(e) =>
              setNewCompanyData({ ...newCompanyData, company_phone_number: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompanyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCompany} color="primary">
            Create Company
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
