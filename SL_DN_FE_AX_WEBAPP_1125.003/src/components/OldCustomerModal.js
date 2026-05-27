"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function OldCustomerModal({ open, onClose, onSelectCustomer, onCreateNew }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    // if (!searchQuery.trim()) {
    //   setError("Please enter a search query");
    //   return;
    // }

    setLoading(true);
    setError(null);
    setCustomers([]);

    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/search?search=${encodeURIComponent(
          searchQuery
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("No customers found");
          setCustomers([]);
        } else {
          console.error(`HTTP error! status: ${response.status}`);
          setError(`Error: ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error || "No customers found");
        setCustomers([]);
      } else if (Array.isArray(data) && data.length > 0) {
        setCustomers(data);
      } else if (Array.isArray(data) && data.length === 0) {
        setCustomers([]);
        setError("No customers found");
      } else {
        setCustomers([]);
        setError("No customers found");
      }
    } catch (err) {
      console.error("Error searching customers:", err);
      setError("Error searching customers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customer) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/${customer.customer_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const fullCustomerData = await response.json();
      onSelectCustomer(fullCustomerData);
      onClose();
    } catch (err) {
      console.error("Error fetching customer details:", err);
      setError("Error fetching customer details");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
useEffect(() => {
  if (!open) {
    setSearchQuery("");
    setCustomers([]);
    setLoading(false);
    setError(null);
  }
}, [open]);

  const handleCloseModal = () => {
  setSearchQuery("");
  setCustomers([]);
  setLoading(false);
  setError(null);
  onClose();
};


  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          Search Old Customers
          <IconButton
            onClick={handleCloseModal}
            size="small"
            sx={{ color: "inherit" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Box display="flex" gap={2} mb={3} alignItems="center">
            <TextField
              label="Search by Customer Name or Phone"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter customer name or phone number"
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
            {onCreateNew && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  onCreateNew();
                  onClose();
                }}
                sx={{ whiteSpace: "nowrap" }}
              >
                Create New
              </Button>
            )}
          </Box>

          {error && (
            <Box sx={{ color: "error.main", mb: 2 }}>
              {error}
            </Box>
          )}

          {loading && (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          )}

          {!loading && customers.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>City</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>State</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Vehicles</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.customer_id} hover>
                      <TableCell>{customer.customer_name}</TableCell>
                      <TableCell>{customer.contact?.phone || "N/A"}</TableCell>
                      <TableCell>{customer.contact?.email || "N/A"}</TableCell>
                      <TableCell>
                        {customer.contact?.address?.city || "N/A"}
                      </TableCell>
                      <TableCell>
                        {customer.contact?.address?.state || "N/A"}
                      </TableCell>
                      <TableCell>
                        {customer.vehicles?.length || 0}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && customers.length === 0 && (searchQuery || error) && (
            <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
              {error || "No customers found matching your search"}
            </Box>
          )}

          {!loading && customers.length === 0 && !searchQuery && !error && (
            <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
              Enter a search query to find customers
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
