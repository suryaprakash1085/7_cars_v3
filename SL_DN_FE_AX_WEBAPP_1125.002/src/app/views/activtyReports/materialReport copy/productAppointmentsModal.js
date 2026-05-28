"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Grid,
  Collapse,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";

export default function ProductAppointmentsModal({ product, appointments, onClose, loading }) {
  const [expandedRows, setExpandedRows] = useState({});
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);

  if (!product) return null;

  if (loading) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
          Loading Product Details...
        </DialogTitle>
        <DialogContent sx={{ paddingY: 3, textAlign: "center" }}>
          <Typography>Loading appointment data, please wait...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  const handleExpandClick = (appointmentId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [appointmentId]: !prev[appointmentId],
    }));
  };

  const handleDownloadMenuOpen = (event) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const downloadHierarchyTable = () => {
    try {
      // Create hierarchy table data
      const hierarchyData = [
        ["Product: " + product.part_name],
        [],
        ["Category:", product.category || "N/A"],
        ["Stock Quantity:", product.quantity || 0],
        ["Unit Price:", "₹" + (product.price || 0)],
        ["Total Appointments:", appointments.length],
        ["Description:", product.description || ""],
        [],
        ["Appointment Details:"],
        ["Appointment ID", "Customer", "Date", "Status", "Amount"],
      ];

      appointments.forEach((apt) => {
        hierarchyData.push([
          apt.appointment_id,
          apt.customer_name || "N/A",
          apt.appointment_date || "N/A",
          apt.status || "N/A",
          apt.invoice_amount || 0,
        ]);

        if (apt.services_actual && apt.services_actual.length > 0) {
          hierarchyData.push(["", "Services Used:", "", "", ""]);
          apt.services_actual.forEach((service) => {
            hierarchyData.push([
              "",
              "  - " + (service.service_description || ""),
              "₹" + (service.price || 0),
              service.status || "N/A",
              "",
            ]);

            if (service.items_required && service.items_required.length > 0) {
              hierarchyData.push(["", "    Items:", "", "", ""]);
              service.items_required.forEach((item) => {
                hierarchyData.push([
                  "",
                  "      - " + (item.item_name || ""),
                  "Qty: " + (item.qty || 1),
                  "₹" + (item.price || 0),
                  "",
                ]);
              });
            }
          });
        }
        hierarchyData.push([]);
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(hierarchyData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Hierarchy");

      // Download file
      XLSX.writeFile(wb, `${product.part_name}_hierarchy_report.xlsx`);
      handleDownloadMenuClose();
    } catch (error) {
      console.error("Error downloading hierarchy table:", error);
      alert("Error downloading file");
    }
  };

  const downloadExcelFile = () => {
    try {
      // Create summary sheet
      const summaryData = [
        ["Product Summary"],
        [],
        ["Product Name:", product.part_name],
        ["Category:", product.category || "N/A"],
        ["Stock Quantity:", product.quantity || 0],
        ["Unit Price:", product.price || 0],
        ["Total Appointments:", appointments.length],
        ["Description:", product.description || ""],
      ];

      // Create appointments sheet
      const appointmentsData = [
        ["Appointment ID", "Customer", "Date", "Status", "Amount", "Phone", "City", "Vehicle"],
      ];

      appointments.forEach((apt) => {
        appointmentsData.push([
          apt.appointment_id,
          apt.customer_name || "N/A",
          apt.appointment_date || "N/A",
          apt.status || "N/A",
          apt.invoice_amount || 0,
          apt.phone || "N/A",
          apt.city || "N/A",
          (apt.make || "N/A") + " " + (apt.model || ""),
        ]);
      });

      // Create services sheet
      const servicesData = [
        ["Appointment ID", "Service Description", "Price", "Status", "UOM"],
      ];

      appointments.forEach((apt) => {
        if (apt.services_actual && apt.services_actual.length > 0) {
          apt.services_actual.forEach((service) => {
            servicesData.push([
              apt.appointment_id,
              service.service_description || "",
              service.price || 0,
              service.status || "N/A",
              service.uom || "",
            ]);
          });
        }
      });

      // Create items sheet
      const itemsData = [
        ["Appointment ID", "Service", "Item Name", "Quantity", "Price"],
      ];

      appointments.forEach((apt) => {
        if (apt.services_actual && apt.services_actual.length > 0) {
          apt.services_actual.forEach((service) => {
            if (service.items_required && service.items_required.length > 0) {
              service.items_required.forEach((item) => {
                itemsData.push([
                  apt.appointment_id,
                  service.service_description || "",
                  item.item_name || "",
                  item.qty || 1,
                  item.price || 0,
                ]);
              });
            }
          });
        }
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(appointmentsData), "Appointments");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(servicesData), "Services");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemsData), "Items");

      // Download file
      XLSX.writeFile(wb, `${product.part_name}_report.xlsx`);
      handleDownloadMenuClose();
    } catch (error) {
      console.error("Error downloading excel file:", error);
      alert("Error downloading file");
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
        Product: {product.part_name} - Appointments ({appointments.length})
      </DialogTitle>

      <DialogContent sx={{ paddingY: 3 }}>
        {/* Product Summary */}
        <Box sx={{ marginBottom: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Category
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                {product.category || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Stock Quantity
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                {product.quantity || 0}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Unit Price
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                ₹{product.price || 0}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Total Appointments
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                {appointments.length}
              </Typography>
            </Grid>
            {product.description && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Description
                </Typography>
                <Typography variant="body2">{product.description}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: "bold" }}>
          Appointments Details
        </Typography>

        {/* Appointments Table */}
        {appointments.length > 0 ? (
          <TableContainer component={Paper} sx={{ maxHeight: "400px", overflowY: "auto" }}>
            <Table stickyHeader>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", width: "40px" }}>Expand</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Appointment ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment, idx) => (
                  <React.Fragment key={appointment._id || idx}>
                    <TableRow
                      sx={{
                        "&:hover": {
                          backgroundColor: "#f9f9f9",
                        },
                      }}
                    >
                      <TableCell sx={{ width: "40px" }}>
                        <Tooltip title={expandedRows[appointment._id] ? "Collapse" : "Expand"}>
                          <IconButton
                            size="small"
                            onClick={() => handleExpandClick(appointment._id)}
                          >
                            {expandedRows[appointment._id] ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {appointment.appointment_id}
                      </TableCell>
                      <TableCell>{appointment.customer_name || "N/A"}</TableCell>
                      <TableCell>{appointment.appointment_date || "N/A"}</TableCell>
                      <TableCell>
                        <span
                          style={{
                            padding: "4px 8px",
                            backgroundColor:
                              appointment.status === "Completed"
                                ? "#c8e6c9"
                                : appointment.status === "Pending"
                                  ? "#fff9c4"
                                  : "#ffccbc",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {appointment.status || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell sx={{ textAlign: "right", fontWeight: "bold" }}>
                        ₹{appointment.invoice_amount || 0}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details */}
                    <TableRow>
                      <TableCell colSpan={6} sx={{ paddingBottom: 0, paddingTop: 0 }}>
                        <Collapse in={expandedRows[appointment._id]} timeout="auto" unmountOnExit>
                          <Box sx={{ padding: 2, backgroundColor: "#fafafa" }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Phone
                                </Typography>
                                <Typography variant="body2">
                                  {appointment.phone || "N/A"}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  City
                                </Typography>
                                <Typography variant="body2">
                                  {appointment.city || "N/A"}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Vehicle
                                </Typography>
                                <Typography variant="body2">
                                  {appointment.make || "N/A"} {appointment.model || ""}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Paid Amount
                                </Typography>
                                <Typography variant="body2">
                                  ₹{appointment.paid_amount || 0}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Balance
                                </Typography>
                                <Typography variant="body2">
                                  ₹{appointment.advance_balance || 0}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Fuel Type
                                </Typography>
                                <Typography variant="body2">
                                  {appointment.fuel_type || "N/A"}
                                </Typography>
                              </Grid>

                              {/* Services Used */}
                              {appointment.services_actual &&
                                appointment.services_actual.length > 0 && (
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                      Services
                                    </Typography>
                                    <Box sx={{ marginTop: 1 }}>
                                      {appointment.services_actual.map((service, idx) => (
                                        <Box
                                          key={idx}
                                          sx={{
                                            padding: 1,
                                            marginBottom: 1,
                                            backgroundColor: "white",
                                            borderLeft: "3px solid #1976d2",
                                          }}
                                        >
                                          <Typography variant="body2">
                                            <strong>{service.service_description}</strong>
                                          </Typography>
                                          <Typography variant="caption" color="textSecondary">
                                            Price: ₹{service.price || 0} | Status:{" "}
                                            {service.status || "N/A"}
                                          </Typography>

                                          {/* Items in Service */}
                                          {service.items_required &&
                                            service.items_required.length > 0 && (
                                              <Box sx={{ marginTop: 1, paddingLeft: 1 }}>
                                                <Typography variant="caption" color="textSecondary">
                                                  Items Used:
                                                </Typography>
                                                {service.items_required.map((item, itemIdx) => (
                                                  <Typography
                                                    key={itemIdx}
                                                    variant="caption"
                                                    display="block"
                                                    sx={{ paddingLeft: 1 }}
                                                  >
                                                    • {item.item_name} (Qty: {item.qty || 1}) - ₹
                                                    {item.price || 0}
                                                  </Typography>
                                                ))}
                                              </Box>
                                            )}
                                        </Box>
                                      ))}
                                    </Box>
                                  </Grid>
                                )}
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="textSecondary" align="center" sx={{ padding: 2 }}>
            No appointments found for this product
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleDownloadMenuOpen}
          variant="outlined"
          color="primary"
          startIcon={<DownloadIcon />}
        >
          Download
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>

      {/* Download Menu */}
      <Menu
        anchorEl={downloadMenuAnchor}
        open={Boolean(downloadMenuAnchor)}
        onClose={handleDownloadMenuClose}
      >
        <MenuItem onClick={downloadHierarchyTable}>
          Download Hierarchy Table
        </MenuItem>
        <MenuItem onClick={downloadExcelFile}>
          Download Excel File
        </MenuItem>
      </Menu>
    </Dialog>
  );
}
