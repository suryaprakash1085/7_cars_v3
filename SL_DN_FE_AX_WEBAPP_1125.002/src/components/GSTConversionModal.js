"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Cookies from "js-cookie";

//   Outside parent — won't remount on re-render
//   All values normalized to Number to avoid string vs number mismatch
const GstDropdown = ({ value, onChange, gstOptions, gstLoading }) => {
  // Normalize to number or empty string so MUI Select can match correctly
  const normalizedValue = value === "" || value === null || value === undefined
    ? ""
    : Number(value);

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select
        value={normalizedValue}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        disabled={gstLoading}
        sx={{ fontSize: "0.875rem" }}
      >
        <MenuItem value="">
          <em>{gstLoading ? "Loading..." : "Select GST"}</em>
        </MenuItem>
        {gstOptions.map((opt) => (
          //   value is always Number so it matches normalizedValue
          <MenuItem key={opt.id} value={Number(opt.gst_percentage)}>
            {opt.gst_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default function GSTConversionModal({
  open,
  appointments,
  onClose,
  onSubmit,
  submitting,
}) {
  const [editedAppointments, setEditedAppointments] = useState([]);
  const [gstOptions, setGstOptions] = useState([]);
  const [gstLoading, setGstLoading] = useState(false);

  // Fetch GST options
  useEffect(() => {
    const fetchGstOptions = async () => {
      setGstLoading(true);
      try {
        const token = Cookies.get("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gst`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setGstOptions(data);
      } catch (err) {
        console.error("Failed to fetch GST options:", err);
        setGstOptions([]);
      } finally {
        setGstLoading(false);
      }
    };
    fetchGstOptions();
  }, []);

  //   Normalize gst_percent to Number (or "") when loading appointments
  // This ensures pre-selected values match MenuItem values from the API
  useEffect(() => {
    if (open && appointments.length > 0) {
      setEditedAppointments(
        appointments.map((apt) => ({
          ...apt,
          spares: apt.spares?.map((s) => ({
            ...s,
            gst_percent: s.gst_percent !== null && s.gst_percent !== undefined && s.gst_percent !== ""
              ? Number(s.gst_percent)
              : "",
            gst_amount: s.gst_amount !== null && s.gst_amount !== undefined
              ? Number(s.gst_amount)
              : 0,
          })) || [],
          labour: apt.labour?.map((l) => ({
            ...l,
            gst_percent: l.gst_percent !== null && l.gst_percent !== undefined && l.gst_percent !== ""
              ? Number(l.gst_percent)
              : "",
            gst_amount: l.gst_amount !== null && l.gst_amount !== undefined
              ? Number(l.gst_amount)
              : 0,
          })) || [],
        }))
      );
    }
  }, [open, appointments]);

  // SPARES handler
  const handleSpareChange = (aptIndex, spareIndex, field, value) => {
    setEditedAppointments((prev) =>
      prev.map((apt, i) => {
        if (i !== aptIndex) return apt;
        return {
          ...apt,
          spares: apt.spares.map((spare, j) => {
            if (j !== spareIndex) return spare;
            if (field === "gst_percent") {
              const parsedValue = value === "" ? "" : Number(value);
              const baseAmount = parseFloat(spare.total_price) || 0;
              const gst_amount =
                parsedValue !== "" && !isNaN(parsedValue)
                  ? Math.round((baseAmount * parsedValue) / 100 * 100) / 100
                  : spare.gst_amount;
              return { ...spare, gst_percent: parsedValue, gst_amount };
            } else if (field === "gst_amount") {
              return { ...spare, gst_amount: value === "" ? 0 : parseFloat(value) || 0 };
            }
            return { ...spare, [field]: value === "" ? 0 : parseFloat(value) || 0 };
          }),
        };
      })
    );
  };

  // LABOUR handler
  const handleLabourChange = (aptIndex, labourIndex, field, value) => {
    setEditedAppointments((prev) =>
      prev.map((apt, i) => {
        if (i !== aptIndex) return apt;
        return {
          ...apt,
          labour: apt.labour.map((labour, j) => {
            if (j !== labourIndex) return labour;
            if (field === "gst_percent") {
              const parsedValue = value === "" ? "" : Number(value);
              const serviceCost = parseFloat(labour.service_cost) || 0;
              // service_cost is GST-inclusive: base = cost / (1 + gst/100)
              const gst_amount =
                parsedValue !== "" && !isNaN(parsedValue)
                  ? Math.round((serviceCost - serviceCost / (1 + parsedValue / 100)) * 100) / 100
                  : labour.gst_amount;
              return { ...labour, gst_percent: parsedValue, gst_amount };
            } else if (field === "gst_amount") {
              return { ...labour, gst_amount: value === "" ? 0 : parseFloat(value) || 0 };
            }
            return { ...labour, [field]: value === "" ? 0 : parseFloat(value) || 0 };
          }),
        };
      })
    );
  };

  const calculateTotals = (apt) => {
    const sparesTotal = apt.spares?.reduce((sum, s) => sum + (parseFloat(s.total_price) || 0), 0) || 0;
    const laboursTotal = apt.labour?.reduce((sum, l) => sum + (parseFloat(l.service_cost) || 0), 0) || 0;
    const sparesGST = apt.spares?.reduce((sum, s) => sum + (parseFloat(s.gst_amount) || 0), 0) || 0;
    const labourGST = apt.labour?.reduce((sum, l) => sum + (parseFloat(l.gst_amount) || 0), 0) || 0;
    const subtotal = sparesTotal + laboursTotal;
    const totalGST = sparesGST + labourGST;
    const grandTotal = subtotal + totalGST;
    return { sparesTotal, laboursTotal, sparesGST, labourGST, subtotal, totalGST, grandTotal };
  };

  const renderSummary = (totals, apt) => (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="textSecondary">Subtotal</Typography>
            <Typography variant="body1">₹{Number(totals.subtotal || 0).toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="textSecondary">Total GST</Typography>
            <Typography variant="body1" color="warning.main">
              ₹{Number(totals.totalGST || 0).toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="textSecondary">Invoice Amt</Typography>
            <Typography variant="body1">₹{Number(apt.invoice_amount || 0).toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="textSecondary">Grand Total</Typography>
            <Typography variant="h6" color="success.main">
              ₹{Number(totals.grandTotal || 0).toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSpares = (apt, aptIndex) => (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
        Spares ({apt.spares.length})
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><strong>Item Name</strong></TableCell>
              <TableCell align="right"><strong>Qty</strong></TableCell>
              <TableCell align="right"><strong>Unit Price</strong></TableCell>
              <TableCell align="right"><strong>Total</strong></TableCell>
              <TableCell align="center"><strong>GST %</strong></TableCell>
              <TableCell align="right"><strong>GST Amount</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apt.spares.map((spare, spareIndex) => (
              <TableRow key={`${apt.appointment_id}-spare-${spareIndex}`}>
                <TableCell>{spare.item_name}</TableCell>
                <TableCell align="right">{spare.item_quantity}</TableCell>
                <TableCell align="right">₹{Number(spare.item_price || 0).toFixed(2)}</TableCell>
                <TableCell align="right">₹{Number(spare.total_price || 0).toFixed(2)}</TableCell>
                <TableCell align="center">
                  <GstDropdown
                    value={spare.gst_percent}
                    onChange={(val) => handleSpareChange(aptIndex, spareIndex, "gst_percent", val)}
                    gstOptions={gstOptions}
                    gstLoading={gstLoading}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={spare.gst_amount ?? 0}
                    onChange={(e) => handleSpareChange(aptIndex, spareIndex, "gst_amount", e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{ width: "100px" }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderLabour = (apt, aptIndex) => (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
        Labour ({apt.labour.length})
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><strong>Service Type</strong></TableCell>
              <TableCell align="right"><strong>Service Cost</strong></TableCell>
              <TableCell align="center"><strong>GST %</strong></TableCell>
              <TableCell align="right"><strong>GST Amount</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apt.labour.map((labour, labourIndex) => (
              <TableRow key={`${apt.appointment_id}-labour-${labourIndex}`}>
                <TableCell>{labour.service_type}</TableCell>
                <TableCell align="right">₹{Number(labour.service_cost || 0).toFixed(2)}</TableCell>
                <TableCell align="center">
                  <GstDropdown
                    value={labour.gst_percent}
                    onChange={(val) => handleLabourChange(aptIndex, labourIndex, "gst_percent", val)}
                    gstOptions={gstOptions}
                    gstLoading={gstLoading}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={labour.gst_amount ?? 0}
                    onChange={(e) => handleLabourChange(aptIndex, labourIndex, "gst_amount", e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{ width: "100px" }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderAppointmentRow = (apt, aptIndex) => {
    const totals = calculateTotals(apt);
    return (
      <Accordion key={apt.appointment_id} defaultExpanded={aptIndex === 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", pr: 2 }}>
            <Typography>
              <strong>Apt #{apt.appointment_id}</strong> — {apt.customer_name}
            </Typography>
            <Typography color="textSecondary">
              Grand Total: ₹{Number(totals.grandTotal || 0).toFixed(2)}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {renderSummary(totals, apt)}
            {apt.spares?.length > 0 && renderSpares(apt, aptIndex)}
            {apt.labour?.length > 0 && renderLabour(apt, aptIndex)}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { maxHeight: "90vh" } }}
    >
      <DialogTitle>GST Conversion Confirmation</DialogTitle>
      <DialogContent dividers sx={{ overflowY: "auto" }}>
        {editedAppointments.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          editedAppointments.map((apt, aptIndex) => renderAppointmentRow(apt, aptIndex))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit(editedAppointments)}
          variant="contained"
          color="success"
          disabled={submitting || editedAppointments.length === 0}
        >
          {submitting ? <CircularProgress size={20} /> : "Confirm Bulk GST Conversion"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}