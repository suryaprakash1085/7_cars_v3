"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Snackbar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Cookies from "js-cookie";
import { Close } from "@mui/icons-material";

export default function EditCustomerSimpleModal({
  open,
  onClose,
  customer,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  // Customer form states
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (customer) {
      setCustomerName(customer.customer_name || "");
      setPhone(customer.contact?.phone || "");
      setEmail(customer.contact?.email || "");
    }
  }, [customer, open]);

  const validateForm = () => {
    if (!customerName.trim()) {
      setSnackbarMessage("Customer Name is required");
      setSnackbarOpen(true);
      return false;
    }
    if (phone && phone.length !== 10) {
      setSnackbarMessage("Phone number must be 10 digits");
      setSnackbarOpen(true);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const token = Cookies.get("token");

    try {
      const customerUpdateData = {
        customer_name: customerName,
        phone: phone,
        email: email,
      };

      const customerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/${customer.customer_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerUpdateData),
        }
      );

      if (!customerResponse.ok) {
        throw new Error("Failed to update customer");
      }

      setSnackbarMessage("Customer updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setTimeout(() => {
        onClose();
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Error updating customer:", error);
      setSnackbarMessage(error.message || "Failed to update customer");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Edit Customer Details
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ minWidth: "auto", padding: 0 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            fullWidth
            required
            error={!customerName.trim() && false}
          />
          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            placeholder="10-digit phone number"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="success"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <MuiAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Dialog>
  );
}
