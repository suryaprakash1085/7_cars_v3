"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Select,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DynamicListTable from "@/components/DynamicListTable";
import Navbar from "@/components/navbar";
import * as XLSX from "xlsx";

export default function GSTReport() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);
  const [pageType, setPageType] = useState(null);
  const [gstFilter, setGstFilter] = useState("all");

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

  useEffect(() => {
    setPageType(Cookies.get("page_type"));
  }, []);

  // Fetch GST invoices with tax breakdown
  const fetchGSTReports = async (start, end) => {
    setLoading(true);
    try {
      const token = Cookies.get("token");

      // Fetch appointments data
      const response = await fetch(
     `${process.env.NEXT_PUBLIC_API_URL}/appointment/gst_allappointments?startDate=${start}&endDate=${end}&status=invoiced&include_gst=true`,
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

      // Handle API response structure - could be wrapped in data property or direct array
      const appointmentsArray = Array.isArray(result) ? result : Array.isArray(result.data) ? result.data : [];

      // Map all invoiced appointments, not just those with gst_invoice_id
      // (to match gstInvoice behavior which shows all "invoiced" status)
      const gstData = appointmentsArray
        .filter(apt => apt.status === "invoiced")
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
    let filtered = allData;

    // Apply GST filter
    if (gstFilter === "converted") {
      filtered = filtered.filter((row) => row.gst_invoice_id);
    }

    // Apply search filter
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.gst_no.toLowerCase().includes(lowerSearch) ||
          row.name.toLowerCase().includes(lowerSearch) ||
          row.appointment_no.toLowerCase().includes(lowerSearch) ||
          row.address.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredData(filtered);
  }, [searchText, allData, gstFilter]);

  const columns = [
    { key: "gst_no", label: "GST Invoice No", minWidth: "120px" },
    { key: "name", label: "Customer Name", minWidth: "150px" },
    { key: "appointment_no", label: "Appointment No", minWidth: "120px" },
    { key: "phone", label: "Phone", minWidth: "120px" },
    { key: "address", label: "City", minWidth: "150px" },
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
      key: "cgst",
      label: "CGST",
      minWidth: "80px",
      format: (value) => `₹${parseFloat(value || 0).toFixed(2)}`,
    },
    {
      key: "sgst",
      label: "SGST",
      minWidth: "80px",
      format: (value) => `₹${parseFloat(value || 0).toFixed(2)}`,
    },
    {
      key: "total",
      label: "Total with GST",
      minWidth: "120px",
      format: (value) => `₹${parseFloat(value || 0).toFixed(2)}`,
    },
  ];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (!value || value.trim() === "") {
      setFilteredData(allData);
    } else {
      const lowerSearch = value.toLowerCase();
      const filtered = allData.filter(
        (row) =>
          row.gst_no.toLowerCase().includes(lowerSearch) ||
          row.name.toLowerCase().includes(lowerSearch) ||
          row.appointment_no.toLowerCase().includes(lowerSearch) ||
          row.address.toLowerCase().includes(lowerSearch)
      );
      setFilteredData(filtered);
    }
  };

  return (
    <Box>
      {pageType !== "tab" && <Navbar pageName="GST Reports" />}

      <DynamicListTable
        title="GST Reports"
        columns={columns}
        data={allData}
        filteredData={filteredData}
        loading={loading}
        showNavbar={false}
        searchText={searchText}
        onSearchChange={handleSearchChange}
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
          <div key="gst-filter-div" style={{ display: "flex", gap: 16, justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16 }}>
              <Select
                key="gst-filter"
                value={gstFilter}
                onChange={(e) => setGstFilter(e.target.value)}
                size="small"
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  minWidth: 140,
                }}
              >
                <MenuItem value="all">All Invoices</MenuItem>
                <MenuItem value="converted">GST Converted</MenuItem>
              </Select>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <Button
                onClick={handleDownloadMenuOpen}
                variant="contained"
                color="success"
                size="small"
                startIcon={<DownloadIcon />}
              >
                Download
              </Button>
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
      />
    </Box>
  );
}
