"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

export default function AppointmentModal({ appointment, onClose, onDownloadPDF }) {
  if (!appointment) return null;

  // Extract vehicle info
  const vehicleInfo = {
    make: appointment.make || "N/A",
    model: appointment.model || "N/A",
    year: appointment.year || "N/A",
    fuelType: appointment.fuel_type || "N/A",
    plateNumber: appointment.plateNumber || "N/A",
  };

  // Calculate totals from services
  const totalServiceAmount = appointment.services_actual?.reduce((sum, service) => {
    return sum + (parseFloat(service.price) || 0);
  }, 0) || 0;

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
        Appointment Details - {appointment.appointment_id}
      </DialogTitle>

      <DialogContent sx={{ paddingY: 3 }}>
        <Grid container spacing={2}>
          {/* Customer Information */}
          <Grid item xs={12}>
            <Paper sx={{ padding: 2, backgroundColor: "#fafafa" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                Customer Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {appointment.customer_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {appointment.phone}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>City:</strong> {appointment.city}
                  </Typography>
                  <Typography variant="body2">
                    <strong>State:</strong> {appointment.state}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Vehicle Information */}
          <Grid item xs={12}>
            <Paper sx={{ padding: 2, backgroundColor: "#fafafa" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                Vehicle Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Make:</strong> {vehicleInfo.make}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Model:</strong> {vehicleInfo.model}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Year:</strong> {vehicleInfo.year}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Fuel Type:</strong> {vehicleInfo.fuelType}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Appointment Information */}
          <Grid item xs={12}>
            <Paper sx={{ padding: 2, backgroundColor: "#fafafa" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                Appointment Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Date:</strong> {appointment.appointment_date}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Time:</strong> {appointment.appointment_time || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor:
                          appointment.status === "completed"
                            ? "#4caf50"
                            : appointment.status === "scheduled"
                            ? "#2196f3"
                            : appointment.status === "invoiced"
                            ? "#ff9800"
                            : "#f44336",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      {appointment.status}
                    </span>
                  </Typography>
                  <Typography variant="body2">
                    <strong>KM:</strong> {appointment.km || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12}>
            <Paper sx={{ padding: 2, backgroundColor: "#fafafa" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                Financial Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>Total Amount:</strong> ₹{appointment.invoice_amount || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>Paid Amount:</strong> ₹{appointment.paid_amount || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>Balance:</strong> ₹{appointment.advance_balance || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Services */}
          {appointment.services_actual && appointment.services_actual.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ padding: 2, backgroundColor: "#fafafa" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                  Services
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#e0e0e0" }}>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appointment.services_actual.map((service, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{service.service_description || "N/A"}</TableCell>
                          <TableCell>{service.status || "N/A"}</TableCell>
                          <TableCell align="right">
                            ₹{service.price || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell colSpan={2} sx={{ fontWeight: "bold" }}>
                          Total Services
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          ₹{totalServiceAmount}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}

          {/* Payment Information */}
          <Grid item xs={12}>
            <Paper sx={{ padding: 2, backgroundColor: "#fafafa" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                Payment Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Paid Status:</strong> {appointment.paid_status || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Payment Method:</strong> {appointment.payment_method || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Advance Payment:</strong> ₹{appointment.advance_payment || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Invoice Date:</strong> {appointment.invoice_date || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ padding: 2, backgroundColor: "#f5f5f5" }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          onClick={onDownloadPDF}
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
