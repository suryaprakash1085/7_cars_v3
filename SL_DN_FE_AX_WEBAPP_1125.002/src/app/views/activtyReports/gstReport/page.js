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
  Select,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DownloadIcon from "@mui/icons-material/Download";
import DynamicListTable from "@/components/DynamicListTable";
import Navbar from "@/components/navbar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Cookies from "js-cookie";
import { fetchEntries, handleSearch } from "../../../../../controllers/gstinvoiceControllers.js";
import { companydetails } from "../../../../../controllers/invoiceListControllers";

export default function GSTReport() {
  const [entries, setEntries] = useState([]);
  const [originalEntries, setOriginalEntries] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);
  const [gstFilter, setGstFilter] = useState("converted");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [limit, setLimit] = useState(null);
  const [token, setToken] = useState(null);

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

  // Fetch fetch_limit from company details
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const details = await companydetails();
        if (details?.company_details?.length > 0) {
          const fetchLimit = Number(details.company_details[0].fetch_limit) || 20;
          setLimit(fetchLimit);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchCompanyDetails();
  }, []);

  // Initial load (re-runs on date/filter/limit change)
  useEffect(() => {
    if (limit === null) return;

    const storedToken = Cookies.get("token");
    setToken(storedToken);

    setEntries([]);
    setIsSearchMode(false);

    fetchEntries(
      storedToken,
      setEntries,
      setLoading,
      (val) => setSnackbar((prev) => ({ ...prev, open: val })),
      (msg) => setSnackbar((prev) => ({ ...prev, message: msg })),
      (severity) => setSnackbar((prev) => ({ ...prev, severity })),
      startDate,
      endDate,
      "invoiced",
      gstFilter,
      limit,
      0,
      false
    ).catch((error) => {
      console.error("Error fetching GST reports:", error);
      setSnackbar({
        open: true,
        message: "Error loading GST reports",
        severity: "error",
      });
    });
  }, [startDate, endDate, gstFilter, limit]);

  useEffect(() => {
    setOriginalEntries(entries);
  }, [entries]);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredData(
        isSearchMode
          ? entries
          : entries.filter((entry) => {
              const baseFilter = entry.status !== "deleted" && entry.status === "invoiced";
              if (gstFilter === "all") return baseFilter;
              if (gstFilter === "converted") return baseFilter && entry.gst_invoice_id;
              return baseFilter;
            })
      );
    } else {
      const lowerSearch = searchText.toLowerCase();
      const filtered = entries.filter(
        (row) =>
          (row.gst_invoice_id || "").toLowerCase().includes(lowerSearch) ||
          (row.customer_name || "").toLowerCase().includes(lowerSearch) ||
          (row.appointment_id || "").toLowerCase().includes(lowerSearch) ||
          (row.contact?.phone || row.phone || "").toLowerCase().includes(lowerSearch)
      );
      setFilteredData(filtered);
    }
  }, [searchText, entries, gstFilter, isSearchMode]);

  const handleRowToggle = (row) => {
    const newExpanded = new Set(expandedRows);
    const rowKey = row.appointment_id;

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
          "Plate Number",
          "Customer Name",
          "Phone",
          "Appointment No",
          "Date",
          "Invoice Amount",
          "Status",
        ],
      ];

      filteredData.forEach((row) => {
        summaryData.push([
          row.gst_invoice_id || row.invoice_id || "",
          row.plateNumber || row.vehicle_id || "",
          row.customer_name || row.contact?.name || "",
          row.contact?.phone || row.phone || "",
          row.appointment_id || "",
          dayjs(row.appointment_date).format("DD/MM/YYYY"),
          row.invoice_amount || 0,
          row.status || "",
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
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
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
          "Invoice ID",
          "Plate Number",
          "Appointment No",
          "Customer Name",
          "Phone",
          "Date",
          "Item Name",
          "Qty",
          "Rate",
          "Amount",
          "Total",
        ],
      ];

      filteredData.forEach((row) => {
        const services = row.services_actual || [];

        if (services.length > 0) {
          services.forEach((service) => {
            const items = service.items_required || [];

            if (items.length > 0) {
              items.forEach((item) => {
                const qty = Number(item.qty || 1);
                const price = Number(item.price || 0);
                const amount = qty * price;

                detailedData.push([
                  row.gst_invoice_id || row.invoice_id || "",
                  row.plateNumber || row.vehicle_id || "",
                  row.appointment_id || "",
                  row.customer_name || row.contact?.name || "",
                  row.contact?.phone || row.phone || "",
                  dayjs(row.appointment_date).format("DD/MM/YYYY"),
                  item.item_name || "",
                  qty,
                  parseFloat(price.toFixed(2)),
                  parseFloat(amount.toFixed(2)),
                  parseFloat(row.invoice_amount || 0).toFixed(2),
                ]);
              });
            } else {
              detailedData.push([
                row.gst_invoice_id || row.invoice_id || "",
                row.plateNumber || row.vehicle_id || "",
                row.appointment_id || "",
                row.customer_name || row.contact?.name || "",
                row.contact?.phone || row.phone || "",
                dayjs(row.appointment_date).format("DD/MM/YYYY"),
                "",
                "",
                "",
                "",
                parseFloat(row.invoice_amount || 0).toFixed(2),
              ]);
            }
          });
        } else {
          detailedData.push([
            row.gst_invoice_id || row.invoice_id || "",
            row.plateNumber || row.vehicle_id || "",
            row.appointment_id || "",
            row.customer_name || row.contact?.name || "",
            row.contact?.phone || row.phone || "",
            dayjs(row.appointment_date).format("DD/MM/YYYY"),
            "",
            "",
            "",
            "",
            parseFloat(row.invoice_amount || 0).toFixed(2),
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
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 },
        { wch: 8 },
        { wch: 10 },
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

  const handleSearchSubmit = async () => {
    if (!searchText || searchText.trim() === "") {
      setIsSearchMode(false);
      await handleSearch("", originalEntries, setEntries, token);
    } else {
      setIsSearchMode(true);
      await handleSearch(searchText, originalEntries, setEntries, token);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (!value || value.trim() === "") {
      setIsSearchMode(false);
      handleSearch("", originalEntries, setEntries, token);
    }
  };

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
          {expandedRows.has(row.appointment_id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      ),
    },
    {
      key: "gst_invoice_id",
      label: "Invoice ID",
      minWidth: "100px",
      format: (value, row) => value || row.invoice_id || "N/A",
    },
    {
      key: "plateNumber",
      label: "Plate Number",
      minWidth: "100px",
      format: (value, row) => value || row.vehicle_id || "N/A",
    },
    {
      key: "customer_name",
      label: "Customer Name",
      minWidth: "150px",
      format: (value, row) => value || row.contact?.name || "N/A",
    },
    {
      key: "phone",
      label: "Phone",
      minWidth: "120px",
      format: (value, row) => row.contact?.phone || row.phone || "N/A",
    },
    {
      key: "appointment_id",
      label: "Appointment No",
      minWidth: "120px",
    },
    {
      key: "appointment_date",
      label: "Date",
      minWidth: "100px",
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      key: "invoice_amount",
      label: "Invoice Amount",
      minWidth: "120px",
      format: (value) => `₹${parseFloat(value || 0).toFixed(2)}`,
    },
    {
      key: "status",
      label: "Status",
      minWidth: "100px",
    },
  ];

  return (
    <Box>
      <DynamicListTable
        title="GST Reports"
        columns={columns}
        data={entries}
        filteredData={filteredData}
        loading={loading}
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        dateFilters={[
          {
            label: "Start Date",
            value: startDate,
            onChange: (e) => setStartDate(e.target.value),
          },
          {
            label: "End Date",
            value: endDate,
            onChange: (e) => setEndDate(e.target.value),
          },
        ]}
        extraControls={[
          <div key="controls" style={{ display: "flex", gap: 16 }}>
            <div style={{ position: "relative" }}>
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
            </div>
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
          <React.Fragment key={row.appointment_id || rowIdx}>
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

            {expandedRows.has(row.appointment_id) && (
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
                        Appointment Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Customer Name:</strong> {row.customer_name || row.contact?.name || "N/A"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Phone:</strong> {row.contact?.phone || row.phone || "N/A"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Plate Number:</strong> {row.plateNumber || row.vehicle_id || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Invoice ID:</strong> {row.gst_invoice_id || row.invoice_id || "N/A"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Appointment ID:</strong> {row.appointment_id || "N/A"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Date:</strong> {dayjs(row.appointment_date).format("DD/MM/YYYY")}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ marginBottom: 3, backgroundColor: "white", padding: 2, borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                        Invoice Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2">
                            <strong>Invoice Amount:</strong> ₹{parseFloat(row.invoice_amount || 0).toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2">
                            <strong>Status:</strong> {row.status || "N/A"}
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
                              width: "100%",
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
                                <TableCell sx={{ width: "30%" }}>Item Name</TableCell>
                                <TableCell sx={{ width: "10%", textAlign: "center" }}>Qty</TableCell>
                                <TableCell sx={{ width: "15%", textAlign: "right" }}>Rate</TableCell>
                                <TableCell sx={{ width: "15%", textAlign: "right" }}>Amount</TableCell>
                                <TableCell sx={{ width: "15%", textAlign: "right" }}>Tax %</TableCell>
                              </TableRow>
                            </TableHead>

                            <TableBody>
                              {row.services_actual.map((service, idx) =>
                                service.items_required && service.items_required.length > 0 ? (
                                  service.items_required.map((item, itemIdx) => {
                                    const rate = parseFloat(item.price) || 0;
                                    const qty = parseFloat(item.qty) || 1;
                                    const amount = rate * qty;
                                    const taxPercent = Number(item.tax || item.item_gst_percent || 0);
                                    return (
                                      <TableRow key={`${idx}-${itemIdx}`}>
                                        <TableCell>{item.item_name || "N/A"}</TableCell>
                                        <TableCell align="center">{qty}</TableCell>
                                        <TableCell align="right">₹{rate.toFixed(2)}</TableCell>
                                        <TableCell align="right">₹{amount.toFixed(2)}</TableCell>
                                        <TableCell align="right">{taxPercent}%</TableCell>
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
    </Box>
  );
}
