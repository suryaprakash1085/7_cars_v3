"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import {
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GSTConversionModal from "./GSTConversionModal";
import { toast } from "react-toastify";

export default function BulkGSTConversion({ pageType }) {
  const [fromDate, setFromDate] = useState(dayjs().subtract(7, "days").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dateField, setDateField] = useState("appointment_date");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConverted, setShowConverted] = useState(true);

  useEffect(() => {
    if (fromDate && toDate) {
      handleFetchAppointments();
    }
  }, [fromDate, toDate, dateField, showConverted]);

  const handleFetchAppointments = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates");
      return;
    }

    if (dayjs(toDate).isBefore(dayjs(fromDate))) {
      toast.error("To date must be after From date");
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/gst/bulk/appointments`,
        {
          params: {
            fromDate,
            toDate,
            dateField,
            includeConverted: showConverted ? "true" : "false",
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const appointmentsList = response.data.appointments || [];
      const uniqueAppointments = Array.from(
        new Map(appointmentsList.map((apt) => [apt.appointment_id, apt])).values()
      );
      setAppointments(uniqueAppointments);
      setSelectedAppointments(new Set());
      setSelectAll(false);

      if (uniqueAppointments.length === 0) {
        toast.info("No eligible appointments found for the selected date range");
      } else {
        toast.success(`Found ${uniqueAppointments.length} eligible appointments`);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error(error.response?.data?.error || "Error fetching appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAppointment = (appointmentId) => {
    const newSelected = new Set(selectedAppointments);
    if (newSelected.has(appointmentId)) {
      newSelected.delete(appointmentId);
    } else {
      newSelected.add(appointmentId);
    }
    setSelectedAppointments(newSelected);
    setSelectAll(newSelected.size === appointments.length && appointments.length > 0);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedAppointments(new Set(appointments.map((a) => a.appointment_id)));
      setSelectAll(true);
    } else {
      setSelectedAppointments(new Set());
      setSelectAll(false);
    }
  };

  const handleConvertClick = () => {
    const selected = appointments.filter((a) => selectedAppointments.has(a.appointment_id));
    if (selected.length === 0) {
      toast.error("Please select at least one appointment");
      return;
    }
    setModalData(selected);
    setOpenModal(true);
  };

  const handleConversionComplete = async (updatedAppointments) => {
    setSubmitting(true);
    try {
      const token = Cookies.get("token");

      const payload = updatedAppointments.map((apt) => ({
        appointment_id: apt.appointment_id,
        spares: apt.spares?.map((s) => {
          const gstPercent = parseFloat(s.gst_percent);
          const gstAmount = parseFloat(s.gst_amount);
          return {
            spare_id: s.spare_id,
            gst_percent: isNaN(gstPercent) ? 0 : gstPercent,
            gst_amount: isNaN(gstAmount) ? 0 : gstAmount,
          };
        }) || [],
        labour: apt.labour?.map((l) => {
          const gstPercent = parseFloat(l.gst_percent);
          const gstAmount = parseFloat(l.gst_amount);
          return {
            service_id: l.service_id,
            gst_percent: isNaN(gstPercent) ? 0 : gstPercent,
            gst_amount: isNaN(gstAmount) ? 0 : gstAmount,
          };
        }) || [],
      }));

      console.log("Sending GST conversion payload:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/gst/bulk/convert`,
        { appointments: payload },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("GST conversion response:", response.data);

      if (response.data.successful > 0) {
        toast.success(`${response.data.successful} appointments converted successfully`);
      }
      if (response.data.failed > 0) {
        toast.warning(`${response.data.failed} appointments failed to convert`);
        if (response.data.errors?.length > 0) {
          console.error("Conversion errors:", response.data.errors);
          response.data.errors.forEach(err => {
            console.error(`Apt ${err.appointment_id}: ${err.error}`);
          });
        }
      }

      setOpenModal(false);
      setSelectedAppointments(new Set());
      setSelectAll(false);
      await handleFetchAppointments();
    } catch (error) {
      console.error("Error converting appointments:", error);
      toast.error(error.response?.data?.error || "Error converting appointments");
    } finally {
      setSubmitting(false);
    }
  };

  const getGSTStatus = (apt) => {
    return apt.is_gst_converted ? (
      <Chip label="Converted" color="success" size="small" />
    ) : (
      <Chip label="Pending" color="warning" size="small" />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
        <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Bulk GST Conversion
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth>
                <InputLabel>Filter By</InputLabel>
                <Select
                  value={dateField}
                  label="Filter By"
                  onChange={(e) => setDateField(e.target.value)}
                >
                  <MenuItem value="appointment_date">Appointment Date</MenuItem>
                  <MenuItem value="completed_date">Completed Date</MenuItem>
                  <MenuItem value="invoice_date">Invoice Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4} sx={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleConvertClick}
                fullWidth
                disabled={selectedAppointments.size === 0 || submitting}
              >
                Convert Selected
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={1.8} sx={{ display: "flex", alignItems: "center" }}>
              <FormControl fullWidth>
                <Select
                  value={showConverted ? "all" : "pending"}
                  onChange={(e) => setShowConverted(e.target.value === "all")}
                  size="small"
                >
                  <MenuItem value="pending">Pending Only</MenuItem>
                  <MenuItem value="all">Show All</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {appointments.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {selectedAppointments.size} of {appointments.length} appointments selected
            </Alert>
          )}
        </CardContent>
      </Card>

      {appointments.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectAll}
                    onChange={handleSelectAll}
                    indeterminate={
                      selectedAppointments.size > 0 &&
                      selectedAppointments.size < appointments.length
                    }
                  />
                </TableCell>
                <TableCell><strong>Appointment ID</strong></TableCell>
                <TableCell><strong>Customer Name</strong></TableCell>
                <TableCell><strong>Vehicle #</strong></TableCell>
                <TableCell align="right"><strong>Invoice Amount</strong></TableCell>
                <TableCell align="right"><strong>Spares Amount</strong></TableCell>
                <TableCell align="right"><strong>Labour Amount</strong></TableCell>
                <TableCell><strong>GST Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((apt, idx) => (
                <TableRow key={`${apt.appointment_id}-${idx}`} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedAppointments.has(apt.appointment_id)}
                      onChange={() => handleSelectAppointment(apt.appointment_id)}
                    />
                  </TableCell>
                  <TableCell>{apt.appointment_id}</TableCell>
                  <TableCell>{apt.customer_name}</TableCell>
                  <TableCell>{apt.plate_number || "N/A"}</TableCell>
                  <TableCell align="right">₹{apt.invoice_amount?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell align="right">₹{apt.total_spare_amount?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell align="right">₹{apt.total_labour_amount?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell>{getGSTStatus(apt)}</TableCell>
                  <TableCell>{dayjs(apt.appointment_date).format("DD/MM/YYYY")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && appointments.length === 0 && fromDate && toDate && (
        <Alert severity="info">
          No eligible appointments found for the selected date range.
        </Alert>
      )}

      <GSTConversionModal
        open={openModal}
        appointments={modalData}
        onClose={() => setOpenModal(false)}
        onSubmit={handleConversionComplete}
        submitting={submitting}
      />
    </Box>
  );
}
