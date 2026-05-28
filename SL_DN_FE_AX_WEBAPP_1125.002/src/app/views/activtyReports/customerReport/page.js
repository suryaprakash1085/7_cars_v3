"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Grid,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DownloadIcon from "@mui/icons-material/Download";
import DynamicListTable from "@/components/DynamicListTable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function CustomerReport() {

  const [searchText, setSearchText] = useState("");

  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);


const today = new Date();

// First day of current month
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

// Format (local safe)
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const [startDate, setStartDate] = useState(formatDateLocal(firstDay));
const [endDate, setEndDate] = useState(formatDateLocal(today));

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // 🔹 FETCH API
  const fetchAppointments = async (start, end) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch appointments data
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment?startDate=${start}&endDate=${end}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      const result = await response.json();

      // Fetch invoice entries to get invoice IDs
      let invoiceEntries = [];
      try {
        const invoiceResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/get/get_all_appointments_to_invoice`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        invoiceEntries = invoiceResponse.data || [];
      } catch (error) {
        console.warn("Could not fetch invoice entries:", error);
      }

      // Merge invoice data with appointment data
      const mergedData = result.map(appointment => {
        const invoiceData = invoiceEntries.find(inv => inv.appointment_id === appointment.appointment_id);
        return {
          ...appointment,
          gst_invoice_id: invoiceData?.gst_invoice_id || appointment.gst_invoice_id,
          invoice_id: invoiceData?.invoice_id || appointment.invoice_id,
        };
      });

      const transformedData = transformAppointmentData(mergedData);

      setAllData(transformedData);
      setFilteredData(transformedData);

      setSnackbar({
        open: true,
        message: "Data loaded successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });

      setAllData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  //  TRANSFORM
  const transformAppointmentData = (data) => {
    const today = new Date();

    return data.map((item) => {
      const invoiceDate = new Date(item.invoice_date || item.appointment_date);

      const diffTime = invoiceDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let dayText = diffDays > 0 ? `+${diffDays} days` : `${diffDays} days`;

      const amount = Number(item.invoice_amount || 0);
      const paid = Number(item.paid_amount || 0);

      return {
        ...item,
        age_status: `${item.status || "N/A"} | ${dayText}`,
        balance: amount - paid,
      };
    });
  };

  // 🔹 SEARCH
  const handleSearch = () => {
    const searchLower = searchText.toLowerCase();

    const filtered = allData.filter(
      (item) =>
        item.customer_name?.toLowerCase().includes(searchLower) ||
        item.appointment_id?.toLowerCase().includes(searchLower) ||
        item.phone?.includes(searchText) ||
        item.city?.toLowerCase().includes(searchLower)
    );

    setFilteredData(filtered);
  };

  // 🔹 FILTER
  const handleFilterApply = () => {
    if (!startDate || !endDate) return;

    fetchAppointments(startDate, endDate);
  };

  // 🔹 HANDLE ROW TOGGLE
  const handleRowToggle = (row) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(row.appointment_id)) {
      newExpanded.delete(row.appointment_id);
    } else {
      newExpanded.add(row.appointment_id);
    }

    setExpandedRows(newExpanded);
  };

  // 🔹 DOWNLOAD MENU HANDLERS
  const handleDownloadMenuOpen = (event) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  // 🔹 DOWNLOAD SUMMARY REPORT
  const handleDownloadSummary = () => {
    handleDownloadMenuClose();
    downloadSummary();
  };

  // 🔹 DOWNLOAD SUMMARY EXCEL
  const downloadSummary = () => {
    try {
      const summaryData = [
        [
          "Appointment ID",
          "Invoice ID",
          "Customer Name",
          "Phone",
          "City",
          "Status",
          "Appointment Date",
          "Invoice Amount",
          "Paid Amount",
          "Balance",
          "Consumed Qty",
        ],
      ];

      filteredData.forEach((appointment) => {
        // 🔥 calculate consumed qty
        let consumedQty = 0;

        const services = appointment.services_actual || [];

        services.forEach((service) => {
          const items = service.items_required || [];

          items.forEach((item) => {
            consumedQty += Number(item.qty || 0);
          });
        });

        summaryData.push([
          appointment.appointment_id || "",
          appointment.gst_invoice_id || appointment.invoice_id || "",
          appointment.customer_name || "",
          appointment.phone || "",
          appointment.city || "",
          appointment.status || "",
          dayjs(appointment.appointment_date).format("DD/MM/YYYY"),
          appointment.invoice_amount || 0,
          appointment.paid_amount || 0,
          appointment.balance || 0,
          consumedQty,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(summaryData);

      // formatting
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = XLSX.utils.encode_cell({ r, c });
          if (!ws[cell]) continue;

          ws[cell].alignment = {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          };

          if (r === 0) {
            ws[cell].font = { bold: true };
          }
        }
      }

      ws["!cols"] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Summary");

      XLSX.writeFile(wb, `customer_report_summary_${startDate}_${endDate}.xlsx`);
    } catch (error) {
      console.error("Error downloading summary:", error);
    }
  };



  // 🔹 DOWNLOAD DETAILED REPORT
  const handleDownloadDetailed = () => {
    handleDownloadMenuClose();
    downloadDetailed();
  };

  // 🔹 DOWNLOAD DETAILED EXCEL
  const downloadDetailed = () => {
    try {
      const detailedData = [
        [
          "Appointment ID",
          "Invoice ID",
          "Customer Name",
          "Phone",
          "City",
          "State",
          "Status",
          "Appointment Date",
          "Appointment Time",
          "KM",
          "Make",
          "Model",
          "Year",
          "Fuel Type",
          "Invoice Amount",
          "Paid Amount",
          "Balance",
          "Advance Payment",
          "Paid Status",
          "Payment Method",
          "Invoice Date",
          "Spare Name",
          "Qty",
          "Line Total",
        ],
      ];

      filteredData.forEach((appointment) => {
        const services = appointment.services_actual || [];

        const uniqueRows = new Map(); // 🔥 dedupe map

        services.forEach((service) => {
          const items = service.items_required || [];

          items.forEach((item) => {
            const qty = Number(item.qty || 1);
            const price = Number(item.price || 0);
            const lineTotal = qty * price;

            // 🔑 UNIQUE KEY (prevents duplicates)
            const key = `${appointment.appointment_id}_${item.item_name}_${qty}_${price}`;

            if (!uniqueRows.has(key)) {
              uniqueRows.set(key, [
                appointment.appointment_id || "",
                appointment.gst_invoice_id || appointment.invoice_id || "",
                appointment.customer_name || "",
                appointment.phone || "",
                appointment.city || "",
                appointment.state || "",
                appointment.status || "",
                dayjs(appointment.appointment_date).format("DD/MM/YYYY"),
                appointment.appointment_time || "",
                appointment.km || "",
                appointment.make || "",
                appointment.model || "",
                appointment.year || "",
                appointment.fuel_type || "",
                appointment.invoice_amount || 0,
                appointment.paid_amount || 0,
                appointment.balance || 0,
                appointment.advance_payment || 0,
                appointment.paid_status || "",
                appointment.payment_method || "",
                dayjs(appointment.invoice_date).format("DD/MM/YYYY"),

                item.item_name || "",
                qty,
                lineTotal,
              ]);
            }
          });
        });

        // ✅ push unique rows
        if (uniqueRows.size > 0) {
          uniqueRows.forEach((row) => detailedData.push(row));
        } else {
          // 👉 if no items
          detailedData.push([
            appointment.appointment_id || "",
            appointment.gst_invoice_id || appointment.invoice_id || "",
            appointment.customer_name || "",
            appointment.phone || "",
            appointment.city || "",
            appointment.state || "",
            appointment.status || "",
            dayjs(appointment.appointment_date).format("DD/MM/YYYY"),
            appointment.appointment_time || "",
            appointment.km || "",
            appointment.make || "",
            appointment.model || "",
            appointment.year || "",
            appointment.fuel_type || "",
            appointment.invoice_amount || 0,
            appointment.paid_amount || 0,
            appointment.balance || 0,
            appointment.advance_payment || 0,
            appointment.paid_status || "",
            appointment.payment_method || "",
            dayjs(appointment.invoice_date).format("DD/MM/YYYY"),
            "",
            "",
            "",
          ]);
        }
      });

      const ws = XLSX.utils.aoa_to_sheet(detailedData);

      // ✅ Formatting
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = XLSX.utils.encode_cell({ r, c });
          if (!ws[cell]) continue;

          ws[cell].alignment = {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          };

          if (r === 0) {
            ws[cell].font = { bold: true };
          }
        }
      }

      // ✅ Column widths
      ws["!cols"] = [
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 25 }, { wch: 10 }, { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Detailed");

      XLSX.writeFile(wb, `customer_report_detailed_${startDate}_${endDate}.xlsx`);
    } catch (error) {
      console.error("Error downloading detailed report:", error);
    }
  };





  // 🔹 EXCEL DOWNLOAD (for individual appointment from expanded row)
  const handleDownloadExcel = (appointment) => {
    if (!appointment) return;

    // Convert to array of objects (Excel format)
    const excelData = [
      {
        "Appointment ID": appointment.appointment_id,
        "Customer Name": appointment.customer_name,
        "Phone": appointment.phone,
        "City": appointment.city,
        "Status": appointment.status,
        "Appointment Date": appointment.appointment_date,
        "Invoice Amount": appointment.invoice_amount,
        "Paid Amount": appointment.paid_amount,
        "Balance": appointment.balance,
      },
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Appointment");

    // Convert to blob
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, `appointment-${appointment.appointment_id}.xlsx`);
  };

  useEffect(() => {
    fetchAppointments(startDate, endDate);
  }, []);

  // 🔹 COLUMNS
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
          sx={{
            color: "#1976d2",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.08)",
            },
          }}
        >
          {expandedRows.has(row.appointment_id) ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )}
        </IconButton>
      ),
    },
    { key: "appointment_id", label: "Appointment ID", minWidth: 120 },
    {
      key: "gst_invoice_id",
      label: "Invoice ID",
      minWidth: 80,
      format: (value, row) => value || row.invoice_id || "N/A",
    },
    { key: "customer_name", label: "Customer Name", minWidth: 150 },
    { key: "phone", label: "Phone", minWidth: 120 },
      
       {key: "invoice_amount", label: "Invoice Amount", minWidth: 120, format: (v) => `₹${v || 0}` },
  

    {  key: "paid_amount", label: "Paid Amount", minWidth: 120, format: (v) => `₹${v || 0}` },
    
    {
      key: "balance",
      label: "Balance",
      minWidth: 120,
      format: (v) => (
        <span style={{ color: v > 0 ? "red" : "green", fontWeight: "bold" }}>
          ₹{v || 0}
        </span>
      ),
    },
    { key: "city", label: "City", minWidth: 100 },
    { key: "status", label: "Status", minWidth: 100 },
    { key: "age_status", label: "Age", minWidth: 180 },
    {
      key: "appointment_date",
      label: "Date",
      minWidth: 120,
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
 
    
     
  ];

  return (
    <div>
      <DynamicListTable
        title="Customer Appointments"
        columns={columns}
        data={allData}
        filteredData={filteredData}
        loading={loading}
        searchText={searchText}
        onSearchChange={(e) => setSearchText(e.target.value)}
        onSearchSubmit={handleSearch}
        // dateFilters={[
        //   {
        //     label: "Start Date",
        //     value: startDate,
        //     onChange: (e) => setStartDate(e.target.value),
        //   },
        //   {
        //     label: "End Date",
        //     value: endDate,
        //     onChange: (e) => setEndDate(e.target.value),
        //   },
        // ]}
        dateFilters={[
  {
    label: "Start Date",
    value: startDate,
    onChange: (e) => {
      const newStart = e.target.value;

      if (newStart === startDate) return; // prevent unwanted trigger

      setStartDate(newStart);

      if (newStart && endDate) {
        fetchAppointments(newStart, endDate);
      }
    },
  },
  {
    label: "End Date",
    value: endDate,
    onChange: (e) => {
      const newEnd = e.target.value;

      if (newEnd === endDate) return;

      setEndDate(newEnd);

      if (startDate && newEnd) {
        fetchAppointments(startDate, newEnd);
      }
    },
  },
]}
        extraControls={[
          // <button
          //   key="filter"
          //   onClick={handleFilterApply}
          //   style={{
          //     padding: "8px 16px",
          //     backgroundColor: "#1976d2",
          //     color: "white",
          //     border: "none",
          //     borderRadius: 4,
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
                borderRadius: 4,
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
        ]}
        snackbar={{
          ...snackbar,
          onClose: () => setSnackbar({ ...snackbar, open: false }),
        }}
        filterBadge={{
          count: filteredData.length,
          label: "Appointments",
        }}
        customRowRenderer={(row, rowIdx) => (
          <React.Fragment key={row.appointment_id || rowIdx}>
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
            {expandedRows.has(row.appointment_id) && (
              <TableRow
                sx={{
                  backgroundColor: "#fafafa",
                  borderTop: "1px solid #ddd",
                }}
              >
                <TableCell colSpan={columns.length} sx={{ padding: "20px" }}>
                  <Box>
                    {/* Customer Information */}
                    {/* <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                        Customer Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Name:</strong> {row.customer_name}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Phone:</strong> {row.phone}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>City:</strong> {row.city}
                          </Typography>
                          <Typography variant="body2">
                            <strong>State:</strong> {row.state || "N/A"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box> */}

                    {/* Vehicle Information */}
                    {/* <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                        Vehicle Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Make:</strong> {row.make || "N/A"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Model:</strong> {row.model || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Year:</strong> {row.year || "N/A"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Fuel Type:</strong> {row.fuel_type || "N/A"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box> */}

                    {/* Appointment Information */}
                    {/* <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                        Appointment Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Appointment ID:</strong> {row.appointment_id}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Date:</strong> {row.appointment_date}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Time:</strong> {row.appointment_time || "N/A"}
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
                                  row.status === "completed"
                                    ? "#4caf50"
                                    : row.status === "scheduled"
                                      ? "#2196f3"
                                      : row.status === "invoiced"
                                        ? "#ff9800"
                                        : "#f44336",
                                color: "white",
                                fontWeight: "bold",
                              }}
                            >
                              {row.status}
                            </span>
                          </Typography>
                          <Typography variant="body2">
                            <strong>KM:</strong> {row.km || "N/A"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box> */}

                    {/* Financial Information */}
                    <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                        Financial Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2">
                            <strong>Total Amount:</strong> ₹{row.invoice_amount || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2">
                            <strong>Paid Amount:</strong> ₹{row.paid_amount || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2">
                            <strong>Balance:</strong> ₹{row.advance_balance || 0}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Services */}
                {/* Services */}
{row.services_actual && row.services_actual.length > 0 && (
  <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
    <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
      Services
    </Typography>
    <Box sx={{ overflowX: "auto" }}>
     <Table
  size="small"
  sx={{
    tableLayout: "fixed",
    width: "80%",
    "& .MuiTableCell-root": {
      border: "1px solid #ddd",
      padding: "8px",
      fontSize: "13px",
      verticalAlign: "middle",
    },
  }}
>
  <TableHead sx={{ backgroundColor: "#e0e0e0" }}>
    <TableRow>
      <TableCell sx={{ width: "25%" }}>Item Name</TableCell>
      <TableCell sx={{ width: "10%", textAlign: "center" }}>Qty</TableCell>
      <TableCell sx={{ width: "10%", textAlign: "right" }}>Rate</TableCell>
      <TableCell sx={{ width: "10%", textAlign: "right" }}>Amount</TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
    {row.services_actual.map((service, idx) =>
      service.items_required && service.items_required.length > 0 ? (
        service.items_required.map((item, itemIdx) => {
          const rate = parseFloat(item.price) || 0;
          const qty = parseFloat(item.qty) || 0;
          const amount = rate * qty;
          return (
            <TableRow key={`${idx}-${itemIdx}`}>
              <TableCell>
                {item.item_name || "N/A"}
              </TableCell>

              <TableCell align="center">
                {qty}
              </TableCell>

              <TableCell align="right">
                ₹{rate.toFixed(2)}
              </TableCell>

              <TableCell align="right">
                ₹{amount.toFixed(2)}
              </TableCell>
            </TableRow>
          );
        })
      ) : (
        <TableRow key={idx}>
          <TableCell>
            {service.service_description || "N/A"}
          </TableCell>

          <TableCell align="center">—</TableCell>

          <TableCell align="right">—</TableCell>

          <TableCell align="right">—</TableCell>
        </TableRow>
      )
    )}

    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
      <TableCell
        colSpan={3}
        sx={{
          fontWeight: "bold",
          textAlign: "right",
        }}
      >
        Total Services
      </TableCell>

      <TableCell
        align="right"
        sx={{ fontWeight: "bold" }}
      >
        ₹
        {row.services_actual.reduce((sum, service) => {
          if (service.items_required && service.items_required.length > 0) {
            return sum + service.items_required.reduce((serviceSum, item) => {
              const rate = parseFloat(item.price) || 0;
              const qty = parseFloat(item.qty) || 0;
              return serviceSum + (rate * qty);
            }, 0);
          }
          return sum;
        }, 0).toFixed(2)}
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
    </Box>
  </Box>
)}

                    {/* Payment Information */}
                    <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                        Payment Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Paid Status:</strong> {row.paid_status || "N/A"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Payment Method:</strong> {row.payment_method || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Advance Payment:</strong> ₹{row.advance_payment || 0}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Invoice Date:</strong> {row.invoice_date || "N/A"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <button
                      onClick={() => handleDownloadDetailed()}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#1976d2",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Download Excel
                    </button>
                  </Box>
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
    </div>
  );
}
