"use client";

import React, { useState, useEffect, useMemo,useRef  } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, IconButton, Collapse, Box, Paper,
  Grid, Typography, Tooltip, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DownloadIcon from "@mui/icons-material/Download";
import Cookies from "js-cookie";
import * as XLSX from "xlsx";
import DynamicListTable from "@/components/DynamicListTable";

export default function MaterialReport() {
  // Initialize dates: end date = today, start date = 7 days ago
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 7);

    const formatDate = (date) => date.toISOString().split('T')[0];
    return { start: formatDate(start), end: formatDate(end) };
  };

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [searchText, setSearchText] = useState("");
  const [dateSelected, setDateSelected] = useState(false);
  const [productReports, setProductReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [appointmentLoading, setAppointmentLoading] = useState({});
  const [appointmentDetails, setAppointmentDetails] = useState({});
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);
  const [previewDialog, setPreviewDialog] = useState({ open: false, type: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // 🔹 Fetch material report data from backend (calculations done server-side)
  const fetchMaterialReport = async (start, end) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/reports/material-report/${start}/${end}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json();
      return result || [];
    } catch (error) {
      console.error("Error fetching material report:", error);
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: "error" });
      return [];
    }
  };

  // 🔹 Generate product reports (no longer needed since backend handles it)
  const generateProductReports = useMemo(() => {
    return productReports;
  }, [productReports]);

  // 🔹 Handle search
  const handleSearch = () => {
    const searchLower = searchText.toLowerCase();
    const filtered = productReports.filter((item) =>
      item.part_name?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.product_id?.toLowerCase().includes(searchLower)
    );
    setFilteredReports(filtered);
  };

  // 🔹 Handle date filter
  const handleFilterApply = async () => {
    if (!startDate || !endDate) {
      setSnackbar({ open: true, message: "Please select both dates", severity: "warning" });
      return;
    }

    setLoading(true);
    try {
      const reports = await fetchMaterialReport(startDate, endDate);
      setProductReports(reports);
      setFilteredReports(reports);
      setSnackbar({ open: true, message: "Data loaded successfully", severity: "success" });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle row expansion toggle
  const handleRowToggle = async (product) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(product.product_id)) {
      newExpanded.delete(product.product_id);
      setExpandedRows(newExpanded);
    } else {
      // Fetch appointments if not already loaded
      if (!appointmentDetails[product.product_id]) {
        setAppointmentLoading((prev) => ({ ...prev, [product.product_id]: true }));
        try {
          const token = Cookies.get("token");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/appointment/reports/product-details/${product.product_id}/${startDate}/${endDate}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          );

          if (!response.ok) {
            let errorDetails = `API Error: ${response.statusText}`;
            try {
              const errorData = await response.json();
              if (errorData.error) {
                errorDetails = errorData.error;
                if (errorData.details) {
                  errorDetails += ` - ${errorData.details}`;
                }
              }
            } catch (e) {
              // If response body is not JSON, use status text
            }
            throw new Error(errorDetails);
          }

          const appointments = await response.json();
          setAppointmentDetails((prev) => ({
            ...prev,
            [product.product_id]: appointments || [],
          }));
        } catch (error) {
          console.error("Error fetching product details:", error);
          setSnackbar({ open: true, message: `Error: ${error.message}`, severity: "error" });
        } finally {
          setAppointmentLoading((prev) => ({ ...prev, [product.product_id]: false }));
        }
      }

      newExpanded.add(product.product_id);
      setExpandedRows(newExpanded);
    }
  };

  // 🔹 Initial data load
  // useEffect(() => {
  //   const initData = async () => {
  //     setLoading(true);
  //     try {
  //       const reports = await fetchMaterialReport(startDate, endDate);
  //       setProductReports(reports);
  //       setFilteredReports(reports);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   initData();
  // }, []);
 // 🔥 auto trigger


useEffect(() => {
  const fetchMaterialData = async () => {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) return;

    setLoading(true);

    try {
      const reports = await fetchMaterialReport(startDate, endDate);
      const result = Array.isArray(reports) ? reports : [];

      setProductReports(result);
      setFilteredReports(result);

      setSnackbar({
        open: true,
        message:
          result.length === 0
            ? "No data found for selected date"
            : "Data loaded successfully",
        severity: result.length === 0 ? "info" : "success",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchMaterialData();
}, [startDate, endDate]);


  // 🔹 Table columns configuration
  const columns = [
    {
      key: "expand",
      label: "Expand",
      minWidth: 60,
      format: (value, row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleRowToggle(row);
          }}
          disabled={row.appointmentCount === 0}
          sx={{
            color: "#1976d2",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.08)",
            },
          }}
        >
          {expandedRows.has(row.product_id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      ),
    },
    { key: "part_name", label: "Product Name", minWidth: 150 },
    { key: "category", label: "Category", minWidth: 120 },
    { key: "quantity", label: "Stock Qty", minWidth: 100 },
    {
      key: "price",
      label: "Price",
      minWidth: 100,
      format: (value) => `₹${value || 0}`,
    },
    {
      key: "appointmentCount",
      label: "Appointments",
      minWidth: 120,
      format: (value) => (
        <span style={{ fontWeight: "bold", color: "#1976d2" }}>{value || 0}</span>
      ),
    },
  ];

  // 🔹 Handle download menu
  const handleDownloadMenuOpen = (event) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  // 🔹 Fetch appointment details for all products
  const fetchAllAppointmentDetails = async (productsToFetch) => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      const updatedDetails = { ...appointmentDetails };

      for (const product of productsToFetch) {
        // Skip if already loaded
        if (updatedDetails[product.product_id]) {
          continue;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/reports/product-details/${product.product_id}/${startDate}/${endDate}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (!response.ok) {
          let errorDetails = `API Error: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorDetails = errorData.error;
              if (errorData.details) {
                errorDetails += ` - ${errorData.details}`;
              }
            }
          } catch (e) {}
          throw new Error(errorDetails);
        }

        const appointments = await response.json();
        updatedDetails[product.product_id] = appointments || [];
      }

      setAppointmentDetails(updatedDetails);
      return { success: true, data: updatedDetails };
    } catch (error) {
      console.error("Error fetching appointment details:", error);
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: "error" });
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle Summary Download
  const handleDownloadSummary = async () => {
    handleDownloadMenuClose();
    const result = await fetchAllAppointmentDetails(filteredReports);
    if (result.success) {
      downloadSummary(result.data);
    }
  };

  // 🔹 Download Summary Excel
  const downloadSummary = (fetchedDetails = null) => {
    try {
      const details = fetchedDetails || appointmentDetails;
      const summaryData = [
        ["Product", "Category", "Stock Qty", "Used Stock Qty", "Total Appts", "Description"],
      ];

      // Add each product
      filteredReports.forEach((product) => {
        // Calculate total used quantity from all appointments
        let usedQuantity = 0;
        if (details[product.product_id] && Array.isArray(details[product.product_id]) && details[product.product_id].length > 0) {
          details[product.product_id].forEach((apt) => {
            if (apt && apt.services_actual && Array.isArray(apt.services_actual)) {
              apt.services_actual.forEach((service) => {
                if (service && service.items_required && Array.isArray(service.items_required)) {
                  service.items_required.forEach((item) => {
                    if (item && item.qty) {
                      const qty = parseInt(item.qty, 10);
                      if (!isNaN(qty)) {
                        usedQuantity += qty;
                      }
                    }
                  });
                }
              });
            }
          });
        }

        summaryData.push([
          product.part_name || "",
          product.category || "",
          product.quantity || 0,
          usedQuantity || 0,
          product.appointmentCount || 0,
          product.description || "",
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(summaryData);

      // Apply horizontal alignment to all cells and set column widths
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;

          ws[cellAddress].alignment = {
            horizontal: "left",
            vertical: "center",
            wrapText: true
          };
        }
      }

      // Set column widths
      ws["!cols"] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 30 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Summary");
      XLSX.writeFile(wb, `material_report_summary_${startDate}_${endDate}.xlsx`);
      setSnackbar({ open: true, message: "Summary downloaded successfully!", severity: "success" });
    } catch (error) {
      console.error("Error downloading summary:", error);
      setSnackbar({ open: true, message: "Error downloading summary", severity: "error" });
    }
  };

  // 🔹 Handle Detailed Download
  const handleDownloadDetailed = async () => {
    handleDownloadMenuClose();
    const result = await fetchAllAppointmentDetails(filteredReports);
    if (result.success) {
      downloadDetailed(result.data);
    }
  };

  // 🔹 Download Detailed Excel
  const downloadDetailed = (fetchedDetails = null) => {
    try {
      // Use fetched details if provided, otherwise use state
      const details = fetchedDetails || appointmentDetails;

      // Single header row with all columns
      const detailedData = [
        [
          "Product Name",
          "Category",
          "Stock Quantity",
          "Unit Price",
          "Total Appointments",
          "Description",
          "Appointment ID",
          "Customer",
          "Date",
          "Status",
          "Amount",
          "Phone",
          "City",
          "Vehicle",
          "Paid Amount",
          "Balance",
          "Fuel Type",
          "Service Description",
          "Service Price",
          "Service Status",
          "Item Name",
          "Item Quantity",
          "Item Price"
        ],
      ];

      // Add each product with its complete details
      filteredReports.forEach((product) => {
        // Full appointments details for this product
        if (details[product.product_id] && details[product.product_id].length > 0) {
          details[product.product_id].forEach((apt) => {
            const services = apt.services_actual || [];
            if (services.length === 0) {
              // No services - add single row with product and appointment info
              detailedData.push([
                product.part_name || "",
                product.category || "",
                product.quantity || 0,
                product.price || 0,
                product.appointmentCount || 0,
                product.description || "",
                apt.appointment_id || "",
                apt.customer_name || "",
                apt.appointment_date || "",
                apt.status || "",
                apt.invoice_amount || 0,
                apt.phone || "",
                apt.city || "",
                (apt.make || "") + " " + (apt.model || ""),
                apt.paid_amount || 0,
                apt.advance_balance || 0,
                apt.fuel_type || "",
                "",
                "",
                "",
                "",
                "",
                ""
              ]);
            } else {
              services.forEach((service, sidx) => {
                const items = service.items_required || [];
                if (items.length === 0) {
                  // Service but no items - show all product and appointment data on every row
                  detailedData.push([
                    product.part_name || "",
                    product.category || "",
                    product.quantity || 0,
                    product.price || 0,
                    product.appointmentCount || 0,
                    product.description || "",
                    apt.appointment_id || "",
                    apt.customer_name || "",
                    apt.appointment_date || "",
                    apt.status || "",
                    apt.invoice_amount || 0,
                    apt.phone || "",
                    apt.city || "",
                    (apt.make || "") + " " + (apt.model || ""),
                    apt.paid_amount || 0,
                    apt.advance_balance || 0,
                    apt.fuel_type || "",
                    service.service_description || "",
                    service.price || 0,
                    service.status || "",
                    "",
                    "",
                    ""
                  ]);
                } else {
                  items.forEach((item, iidx) => {
                    detailedData.push([
                      product.part_name || "",
                      product.category || "",
                      product.quantity || 0,
                      product.price || 0,
                      product.appointmentCount || 0,
                      product.description || "",
                      apt.appointment_id || "",
                      apt.customer_name || "",
                      apt.appointment_date || "",
                      apt.status || "",
                      apt.invoice_amount || 0,
                      apt.phone || "",
                      apt.city || "",
                      (apt.make || "") + " " + (apt.model || ""),
                      apt.paid_amount || 0,
                      apt.advance_balance || 0,
                      apt.fuel_type || "",
                      service.service_description || "",
                      service.price || 0,
                      service.status || "",
                      item.item_name || "",
                      item.qty || 1,
                      item.price || 0
                    ]);
                  });
                }
              });
            }
          });
        } else {
          // No appointments for this product
          detailedData.push([
            product.part_name || "",
            product.category || "",
            product.quantity || 0,
            product.price || 0,
            product.appointmentCount || 0,
            product.description || "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
          ]);
        }
      });

      const ws = XLSX.utils.aoa_to_sheet(detailedData);

      // Apply horizontal alignment to all cells and set column widths
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;

          ws[cellAddress].alignment = {
            horizontal: "left",
            vertical: "center",
            wrapText: true
          };
        }
      }

      // Set column widths
      ws["!cols"] = [
        { wch: 15 }, // Product Name
        { wch: 12 }, // Category
        { wch: 15 }, // Stock Quantity
        { wch: 12 }, // Unit Price
        { wch: 16 }, // Total Appointments
        { wch: 18 }, // Description
        { wch: 14 }, // Appointment ID
        { wch: 15 }, // Customer
        { wch: 12 }, // Date
        { wch: 12 }, // Status
        { wch: 12 }, // Amount
        { wch: 12 }, // Phone
        { wch: 10 }, // City
        { wch: 16 }, // Vehicle
        { wch: 12 }, // Paid Amount
        { wch: 12 }, // Balance
        { wch: 12 }, // Fuel Type
        { wch: 20 }, // Service Description
        { wch: 12 }, // Service Price
        { wch: 12 }, // Service Status
        { wch: 15 }, // Item Name
        { wch: 12 }, // Item Quantity
        { wch: 12 }  // Item Price
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Detailed");
      XLSX.writeFile(wb, `material_report_detailed_${startDate}_${endDate}.xlsx`);
      setSnackbar({ open: true, message: "Detailed report downloaded successfully!", severity: "success" });
    } catch (error) {
      console.error("Error downloading detailed report:", error);
      setSnackbar({ open: true, message: "Error downloading detailed report", severity: "error" });
    }
  };

  // 🔹 Date filters
 const dateFilters = [
  {
    label: "Start Date",
    value: startDate,
    onChange: (e) => {
      
      setStartDate(e.target.value);
    },
  },
  {
    label: "End Date",
    value: endDate,
    onChange: (e) => {
      
      setEndDate(e.target.value);
    },
  },
];

  // 🔹 Extra controls (Filter and Download buttons)
  const extraControls = [
    // <button
    //   key="filter-btn"
    //   onClick={handleFilterApply}
    //   style={{
    //     padding: "8px 16px",
    //     backgroundColor: "#1976d2",
    //     color: "white",
    //     border: "none",
    //     borderRadius: "4px",
    //     cursor: "pointer",
    //     fontWeight: "bold",
    //   }}
    // >
    //   Apply Filter
    // </button>,
    <div key="download-btn" style={{ position: "relative" }}>
      <button
        onClick={handleDownloadMenuOpen}
        style={{
          padding: "8px 16px",
          backgroundColor: "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <DownloadIcon style={{ fontSize: "18px" }} />
        Download
      </button>
    </div>,
  ];

  return (
    <div>
      <DynamicListTable
        title="Material Reports"
        columns={columns}
        data={productReports}
        filteredData={filteredReports}
        loading={loading}
        showNavbar={true}
        searchText={searchText}
        onSearchChange={(e) => setSearchText(e.target.value)}
        onSearchSubmit={handleSearch}
        dateFilters={dateFilters}
        extraControls={extraControls}
        snackbar={{
          ...snackbar,
          onClose: () => setSnackbar({ ...snackbar, open: false }),
        }}
        filterBadge={{ count: filteredReports.length, label: "Products" }}
        customRowRenderer={(row, rowIdx) => (
          <React.Fragment key={row._id || row.id || rowIdx}>
            {/* Main row */}
            <TableRow
              sx={{
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              {columns.map((column) => {
                let cellValue = row[column.key];
                if (column.format) {
                  cellValue = column.format(cellValue, row);
                }
                const isReactElement = React.isValidElement(cellValue);
                return (
                  <TableCell
                    key={column.key}
                    sx={{
                      fontSize: { xs: "11px", sm: "13px" },
                      padding: { xs: "8px", sm: "16px" },
                      maxWidth: column.minWidth || "100px",
                      wordBreak: "break-word",
                    }}
                  >
                    {isReactElement ? cellValue : cellValue || "N/A"}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Expanded row with appointment details */}
            {expandedRows.has(row.product_id) && (
              <TableRow
                sx={{
                  backgroundColor: "#fafafa",
                  borderTop: "1px solid #ddd",
                }}
              >
                <TableCell colSpan={columns.length} sx={{ padding: "20px" }}>
                  {appointmentLoading[row.product_id] ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
                      <CircularProgress size={30} />
                    </Box>
                  ) : (
                    <Box>
                      {/* Product Summary */}
                      <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: "bold", color: "#1976d2" }}>
                        Product: {row.part_name} - Appointments ({appointmentDetails[row.product_id]?.length || 0})
                      </Typography>

                      <Grid container spacing={2} sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>{row.category || "N/A"}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">Stock Quantity</Typography>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>{row.quantity || 0}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">Unit Price</Typography>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>₹{row.price || 0}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">Total Appointments</Typography>
                          <Typography variant="body2" sx={{ fontWeight: "bold", color: "#1976d2" }}>{appointmentDetails[row.product_id]?.length || 0}</Typography>
                        </Grid>
                      </Grid>

                      {appointmentDetails[row.product_id]?.length === 0 ? (
                        <Typography color="textSecondary" align="center" sx={{ padding: 2, fontStyle: "italic" }}>
                          No appointment details found.
                        </Typography>
                      ) : (
                        <Box sx={{ overflowX: "auto" }}>
                          <Table size="small" sx={{ backgroundColor: "white", border: "1px solid #ddd" }}>
                            <TableHead>
                              <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Appointment ID</TableCell>
                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "right" }}>Amount</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {appointmentDetails[row.product_id]?.map((appointment, idx) => (
                                <TableRow key={appointment._id || idx} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                                  <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>
                                    {appointment.appointment_id || "N/A"}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: "12px" }}>
                                    {appointment.customer_name || "N/A"}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: "12px" }}>
                                    {appointment.appointment_date
                                      ? new Date(appointment.appointment_date).toLocaleDateString()
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: "12px" }}>
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
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {appointment.status || "N/A"}
                                    </span>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: "12px", textAlign: "right", fontWeight: "bold" }}>
                                    ₹{appointment.invoice_amount || 0}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      )}
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        )}
      />

      {/* Download Menu */}
      <Menu
        anchorEl={downloadMenuAnchor}
        open={Boolean(downloadMenuAnchor)}
        onClose={handleDownloadMenuClose}
      >
        <MenuItem onClick={handleDownloadSummary}>Download Summary</MenuItem>
        <MenuItem onClick={handleDownloadDetailed}>Download Detailed</MenuItem>
      </Menu>



      {/* Preview Dialog - Detailed */}
      {previewDialog.type === "detailed" && (
        <Dialog open={previewDialog.open} onClose={() => setPreviewDialog({ open: false, type: null })} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
            Detailed Report Preview - All Details
          </DialogTitle>
          <DialogContent sx={{ paddingY: 3 }}>
            <Typography variant="body2" sx={{ marginBottom: 2, color: "#666" }}>
              Below is a preview of all data that will be exported to Excel:
            </Typography>
            <Box sx={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
              <Table sx={{ backgroundColor: "white", border: "1px solid #ddd" }} size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Stock Qty</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Unit Price</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Total Appts</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Apt ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>City</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Vehicle</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>UOM</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "11px" }}>Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports.map((product) => {
                    const apts = appointmentDetails[product.product_id] || [];
                    if (apts.length === 0) {
                      return (
                        <TableRow key={product.product_id}>
                          <TableCell sx={{ fontSize: "10px" }}>{product.part_name}</TableCell>
                          <TableCell sx={{ fontSize: "10px" }}>{product.category}</TableCell>
                          <TableCell sx={{ fontSize: "10px" }}>{product.quantity}</TableCell>
                          <TableCell sx={{ fontSize: "10px" }}>₹{product.price}</TableCell>
                          <TableCell sx={{ fontSize: "10px" }}>{product.appointmentCount}</TableCell>
                          <TableCell sx={{ fontSize: "10px" }}>{product.description || "-"}</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                        </TableRow>
                      );
                    }
                    return apts.map((apt, idx) => {
                      const services = apt.services_actual || [];
                      if (services.length === 0) {
                        return (
                          <TableRow key={`${product.product_id}-${idx}`}>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 ? product.part_name : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 ? product.category : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 ? product.quantity : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 ? `₹${product.price}` : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 ? product.appointmentCount : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 ? product.description || "-" : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.appointment_id}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.customer_name}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{new Date(apt.appointment_date).toLocaleDateString()}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.status}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>₹{apt.invoice_amount}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.phone}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.city}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.make} {apt.model}</TableCell>
                            <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                            <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                            <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                            <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                            <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                          </TableRow>
                        );
                      }
                      return services.map((svc, sidx) => {
                        const items = svc.items_required || [];
                        if (items.length === 0) {
                          return (
                            <TableRow key={`${product.product_id}-${idx}-${sidx}`}>
                              <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 ? product.part_name : ""}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 ? product.category : ""}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 ? product.quantity : ""}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 ? `₹${product.price}` : ""}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 ? product.appointmentCount : ""}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 ? product.description || "-" : ""}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{apt.appointment_id}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{apt.customer_name}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{new Date(apt.appointment_date).toLocaleDateString()}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{apt.status}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>₹{apt.invoice_amount}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{apt.phone}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{apt.city}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{apt.make} {apt.model}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{svc.service_description}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>₹{svc.price}</TableCell>
                              <TableCell sx={{ fontSize: "10px" }}>{svc.uom}</TableCell>
                              <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                              <TableCell sx={{ fontSize: "10px", color: "#999" }}>-</TableCell>
                            </TableRow>
                          );
                        }
                        return items.map((item, iidx) => (
                          <TableRow key={`${product.product_id}-${idx}-${sidx}-${iidx}`}>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 && iidx === 0 ? product.part_name : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 && iidx === 0 ? product.category : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 && iidx === 0 ? product.quantity : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 && iidx === 0 ? `₹${product.price}` : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 && iidx === 0 ? product.appointmentCount : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{idx === 0 && sidx === 0 && iidx === 0 ? product.description || "-" : ""}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.appointment_id}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.customer_name}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{new Date(apt.appointment_date).toLocaleDateString()}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.status}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>₹{apt.invoice_amount}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.phone}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.city}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{apt.make} {apt.model}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{svc.service_description}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>₹{svc.price}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{svc.uom}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{item.item_name}</TableCell>
                            <TableCell sx={{ fontSize: "10px" }}>{item.qty}</TableCell>
                          </TableRow>
                        ));
                      });
                    });
                  })}
                </TableBody>
              </Table>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog({ open: false, type: null })}>Cancel</Button>
            <Button onClick={downloadDetailed} variant="contained" color="primary">
              Download Now
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
