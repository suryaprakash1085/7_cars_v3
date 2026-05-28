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
  Box,
  CircularProgress,
  Paper,
  TextField,
  IconButton,
  Grid,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DownloadIcon from "@mui/icons-material/Download";
import DynamicListTable from "@/components/DynamicListTable";
import Navbar from "@/components/navbar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function GSTReport() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

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

  // Fetch GST invoices with tax breakdown
  const fetchGSTReports = async (start, end) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch appointments data
      const response = await fetch(
     `${process.env.NEXT_PUBLIC_API_URL}/appointment?startDate=${start}&endDate=${end}&status=invoiced`,
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

      // Filter only invoiced appointments with GST
      const gstData = result
        .filter(
          (apt) =>
            apt.status === "invoiced" && apt.gst_invoice_id
        )
        .map((apt) => {
          // Calculate total tax for all items and split equally into CGST and SGST
          let totalTax = 0;

          if (apt.services_actual && Array.isArray(apt.services_actual)) {
            apt.services_actual.forEach((service) => {
              if (service.items_required && Array.isArray(service.items_required)) {
                service.items_required.forEach((item) => {
                  const qty = Number(item.qty || 1);
                  const price = Number(item.price || 0);
                  const taxPercent = Number(item.tax || item.item_gst_percent || 0);
                  let taxAmount = 0;

                  // Calculate tax amount using tax-inclusive formula: (price * qty * taxRate) / (1 + taxRate)
                  if (taxPercent > 0) {
                    const taxRate = taxPercent / 100;
                    taxAmount = (price * qty * taxRate) / (1 + taxRate);
                  }
                  totalTax += taxAmount;
                });
              }
            });
          }

          // Calculate CGST and SGST as half of totalTax, ensuring they sum exactly to totalTax
          const cgst = parseFloat((totalTax / 2).toFixed(2));
          const sgst = parseFloat((totalTax - cgst).toFixed(2));

          // invoice_amount includes tax, so base amount = invoice_amount - totalTax
          const amount = parseFloat((Number(apt.invoice_amount || 0) - totalTax).toFixed(2));
          const total = parseFloat((Number(apt.invoice_amount || 0)).toFixed(2));

          return {
            ...apt,
            gst_no: apt.gst_invoice_id || apt.invoice_id || "N/A",
            address: apt.city || apt.customer_city || "N/A",
            phone: apt.phone || apt.customer_phone || "N/A",
            name: apt.customer_name || "N/A",
            appointment_no: apt.appointment_id || "N/A",
            date: apt.appointment_date || apt.invoice_date || "",
            amount,
            cgst,
            sgst,
            igst: 0,
            others: 0,
            total,
            totalTax: parseFloat(totalTax.toFixed(2)),
          };
        });

      setAllData(gstData);
      setFilteredData(gstData);
      setSnackbar({
        open: true,
        message: `Loaded ${gstData.length} GST records`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error fetching GST reports:", error);
      setSnackbar({
        open: true,
        message: "Error loading GST reports",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowToggle = (row) => {
    const newExpanded = new Set(expandedRows);
    const rowKey = row.gst_no + row.appointment_no;

    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }

    setExpandedRows(newExpanded);
  };

  const handleDownloadMenuOpen = (event) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const handleDownloadSummary = () => {
    handleDownloadMenuClose();
    downloadSummary();
  };

  const downloadSummary = () => {
    try {
      const summaryData = [
        [
          "GST Invoice No",
          "Customer Name",
          "City",
          "Phone",
          "Appointment No",
          "Date",
          "Amount",
          "CGST",
          "SGST",
          "IGST",
          "Others",
          "Total with GST",
        ],
      ];

      filteredData.forEach((row) => {
        summaryData.push([
          row.gst_no || "",
          row.name || "",
          row.address || "",
          row.phone || "",
          row.appointment_no || "",
          dayjs(row.date).format("DD/MM/YYYY"),
          row.amount || 0,
          row.cgst || 0,
          row.sgst || 0,
          row.igst || 0,
          row.others || 0,
          row.total || 0,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(summaryData);

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
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "GST Summary");

      XLSX.writeFile(wb, `gst_report_summary_${startDate}_${endDate}.xlsx`);
    } catch (error) {
      console.error("Error downloading summary:", error);
    }
  };

  const handleDownloadDetailed = () => {
    handleDownloadMenuClose();
    downloadDetailed();
  };

  const downloadDetailed = () => {
    try {
      const detailedData = [
        [
          "GstNo",
          "Name",
          "AppoinmentNo",
          "Phone",
          "Address",
          "Date",
          "Item Name",
          "Qty",
          "Tax",
          "Rate",
          "Amount",
          "CGST",
          "SGST",
          "IGST",
          "Total",
        ],
      ];

      filteredData.forEach((row) => {
        const services = row.services_actual || [];

        const uniqueRows = new Map();

        services.forEach((service) => {
          const items = service.items_required || [];

          items.forEach((item) => {
            const qty = Number(item.qty || 1);
            const price = Number(item.price || 0);
            const lineTotal = parseFloat((qty * price).toFixed(2));
            const taxPercent = Number(item.tax || item.item_gst_percent || 0);

            let itemGst = 0;
            if (taxPercent > 0) {
              const taxRate = taxPercent / 100;
              itemGst = (price * qty * taxRate) / (1 + taxRate);
            }

            const cgst = parseFloat((itemGst / 2).toFixed(2));
            const sgst = parseFloat((itemGst - cgst).toFixed(2));
            const totalTax = parseFloat((cgst + sgst).toFixed(2));
            const amount = parseFloat((lineTotal - totalTax).toFixed(2));
            const itemTotal = lineTotal;

            const key = `${row.gst_no}_${item.item_name}_${qty}_${price}`;

            if (!uniqueRows.has(key)) {
              uniqueRows.set(key, [
                row.gst_no || "",
                row.name || "",
                row.appointment_no || "",
                row.phone || "",
                row.address || "",
                dayjs(row.date).format("DD/MM/YYYY"),
                item.item_name || "",
                qty,
                taxPercent || 0,
                parseFloat(price.toFixed(2)),
                amount,
                cgst,
                sgst,
                0,
                itemTotal,
              ]);
            }
          });
        });

        if (uniqueRows.size > 0) {
          uniqueRows.forEach((rowData) => detailedData.push(rowData));
        } else {
          detailedData.push([
            row.gst_no || "",
            row.name || "",
            row.appointment_no || "",
            row.phone || "",
            row.address || "",
            dayjs(row.date).format("DD/MM/YYYY"),
            "",
            "",
            "",
            "",
            row.amount || 0,
            row.cgst || 0,
            row.sgst || 0,
            row.igst || 0,
            row.total || 0,
          ]);
        }
      });

      const ws = XLSX.utils.aoa_to_sheet(detailedData);

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
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 },
        { wch: 8 },
        { wch: 8 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "GST Detailed");

      XLSX.writeFile(wb, `gst_report_detailed_${startDate}_${endDate}.xlsx`);
    } catch (error) {
      console.error("Error downloading detailed report:", error);
    }
  };

  useEffect(() => {
    fetchGSTReports(startDate, endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredData(allData);
    } else {
      const lowerSearch = searchText.toLowerCase();
      const filtered = allData.filter(
        (row) =>
          row.gst_no.toLowerCase().includes(lowerSearch) ||
          row.name.toLowerCase().includes(lowerSearch) ||
          row.appointment_no.toLowerCase().includes(lowerSearch) ||
          row.address.toLowerCase().includes(lowerSearch)
      );
      setFilteredData(filtered);
    }
  }, [searchText, allData]);

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
          {expandedRows.has(row.gst_no + row.appointment_no) ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )}
        </IconButton>
      ),
    },
    { key: "gst_no", label: "GstNo", minWidth: "100px" },
    { key: "name", label: "Name", minWidth: "150px" },
    { key: "appointment_no", label: "AppoinmentNo", minWidth: "120px" },
    { key: "phone", label: "Phone", minWidth: "120px" },
    { key: "address", label: "Address", minWidth: "150px" },
    {
      key: "date",
      label: "Date",
      minWidth: "100px",
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      key: "amount",
      label: "Amount",
      minWidth: "100px",
      format: (value) => `₹${parseFloat(value || 0).toFixed(2)}`,
    },
    {
      key: "total",
      label: "Total",
      minWidth: "100px",
      format: (value) => `₹${parseFloat(value || 0).toFixed(2)}`,
    },
  ];

  return (
    <div>
      <DynamicListTable
        title="GST Reports"
        columns={columns}
        data={allData}
        filteredData={filteredData}
        loading={loading}
        searchText={searchText}
        onSearchChange={(e) => setSearchText(e.target.value)}
        onSearchSubmit={() => {}}
        dateFilters={[
          {
            label: "Start Date",
            value: startDate,
            onChange: (e) => {
              const newStart = e.target.value;
              if (newStart === startDate) return;
              setStartDate(newStart);
              if (newStart && endDate) {
                fetchGSTReports(newStart, endDate);
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
                fetchGSTReports(startDate, newEnd);
              }
            },
          },
        ]}
        extraControls={[
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
            <Menu
              anchorEl={downloadMenuAnchor}
              open={Boolean(downloadMenuAnchor)}
              onClose={handleDownloadMenuClose}
            >
              <MenuItem onClick={handleDownloadSummary}>Download Summary</MenuItem>
              <MenuItem onClick={handleDownloadDetailed}>Download Detailed</MenuItem>
            </Menu>
          </div>,
        ]}
        snackbar={{
          ...snackbar,
          onClose: () => setSnackbar({ ...snackbar, open: false }),
        }}
        filterBadge={{
          count: filteredData.length,
          label: "GST Records",
        }}
        customRowRenderer={(row, rowIdx) => (
              <React.Fragment key={row.gst_no + row.appointment_no || rowIdx}>
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

                {expandedRows.has(row.gst_no + row.appointment_no) && (
                  <TableRow
                    sx={{
                      backgroundColor: "#fafafa",
                      borderTop: "1px solid #ddd",
                    }}
                  >
                    <TableCell colSpan={columns.length} sx={{ padding: "20px" }}>
                      <Box>
                        <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                            GST Summary
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <strong>Customer Name:</strong> {row.name}
                              </Typography>
                              <Typography variant="body2">
                                <strong>City:</strong> {row.address}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Phone:</strong> {row.phone}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <strong>GST Invoice No:</strong> {row.gst_no}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Date:</strong> {dayjs(row.date).format("DD/MM/YYYY")}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                            Tax Details
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2">
                                <strong>Amount:</strong> ₹{parseFloat(row.amount || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2">
                                <strong>Total Tax:</strong> ₹{parseFloat(row.totalTax || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2">
                                <strong>CGST:</strong> ₹{parseFloat(row.cgst || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2">
                                <strong>SGST:</strong> ₹{parseFloat(row.sgst || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2">
                                <strong>IGST:</strong> ₹{parseFloat(row.igst || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2">
                                <strong>Others:</strong> ₹{parseFloat(row.others || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                                <strong>Total:</strong> ₹{parseFloat(row.total || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        {row.services_actual && row.services_actual.length > 0 && (
                          <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                              Services & Items
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
                                    <TableCell sx={{ width: "15%", textAlign: "right" }}>GST</TableCell>
                                  </TableRow>
                                </TableHead>

                                <TableBody>
                                  {row.services_actual.map((service, idx) =>
                                    service.items_required && service.items_required.length > 0 ? (
                                      service.items_required.map((item, itemIdx) => {
                                        const rate = parseFloat(item.price) || 0;
                                        const qty = parseFloat(item.qty) || 0;
                                        const amount = rate * qty;
                                        const gst = parseFloat(item.item_gst_amount) || 0;
                                        return (
                                          <TableRow key={`${idx}-${itemIdx}`}>
                                            <TableCell>{item.item_name || "N/A"}</TableCell>
                                            <TableCell align="center">{qty}</TableCell>
                                            <TableCell align="right">₹{rate.toFixed(2)}</TableCell>
                                            <TableCell align="right">₹{amount.toFixed(2)}</TableCell>
                                            <TableCell align="right">₹{gst.toFixed(2)}</TableCell>
                                          </TableRow>
                                        );
                                      })
                                    ) : (
                                      <TableRow key={idx}>
                                        <TableCell>{service.service_description || "N/A"}</TableCell>
                                        <TableCell align="center">—</TableCell>
                                        <TableCell align="right">—</TableCell>
                                        <TableCell align="right">—</TableCell>
                                        <TableCell align="right">—</TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
        )}
      />
    </div>
  );
}
