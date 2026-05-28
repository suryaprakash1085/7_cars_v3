"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import axios from "axios";
import { Tabs, Tab, Box, Select, MenuItem, FormControl, InputLabel, Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import DynamicListTable from "@/components/DynamicListTable.js";
import Navbar from "@/components/navbar.js";
import BulkGSTConversion from "@/components/BulkGSTConversion.js";
import generatePDFInvoice from "@/components/PDFGenerator_invoice.js";
import { fetchEntries, handleSearch } from "../../../../controllers/invoiceListControllers";

export default function GSTInvoice() {
  const router = useRouter();
  const [token, setToken] = useState();
  const [entries, setEntries] = useState([]);
  const [invoiceEntries, setInvoiceEntries] = useState([]);
  const [originalEntries, setOriginalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackBarSeverity, setSnackBarSeverity] = useState();
  const [searchText, setSearchText] = useState("");
  const [pageType, setPageType] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [gstFilter, setGstFilter] = useState("converted");
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkDownloadModal, setBulkDownloadModal] = useState(false);
  const [bulkDownloadResults, setBulkDownloadResults] = useState(null);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatDate(firstDay);
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return formatDate(today);
  });

  useEffect(() => {
    const savedTab = localStorage.getItem("gstInvoiceActiveTab");
    if (savedTab !== null) {
      setActiveTab(parseInt(savedTab, 10));
    }

    const storedToken = Cookies.get("token");
    setToken(storedToken);
    setPageType(Cookies.get("page_type"));

    fetchEntries(
      storedToken,
      (data) => {
        setEntries(data);
        setOriginalEntries(data);
      },
      setLoading,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackBarSeverity,
      startDate,
      endDate
    );
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchInvoiceEntries = async () => {
      try {
        const storedToken = Cookies.get("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/get/get_all_appointments_to_invoice`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );
        console.log("Fetched invoice entries:", response.data);
        if (response.data) {
          setInvoiceEntries(response.data);
          // setEntries(response.data);
          // setOriginalEntries(response.data);
        }
      } catch (error) {
        console.error("Error fetching invoice entries:", error);
      }
    };

    if (entries.length > 0 && !isSearchMode) {
      fetchInvoiceEntries();
    }
  }, [entries, isSearchMode]);

  const columns = [
    {
      key: "plateNumber",
      label: "Plate Number",
      minWidth: "100px",
      format: (value, row) => value || row.vehicle_id || "N/A",
    },
    {
      key: "appointment_id",
      label: "Appointment ID",
      minWidth: "80px",
      format: (value, row) => value || row.appointment_id || "N/A",
    },
    // {
    //   key: "invoice_id",
    //   label: "Invoice ID",
    //   minWidth: "80px",
    //   format: (value, row) => value || row.invoice_id || "N/A",
    // },
    {
      key: "gst_invoice_id",
      label: "Invoice ID",
      minWidth: "80px",
      format: (value, row) => value || row.invoice_id || "N/A",
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
      key: "appointment_date",
      label: "Date",
      minWidth: "100px",
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      key: "invoice_amount",
      label: "Invoice Amount",
      minWidth: "120px",
      format: (value, row) => value ?? row.invoice_amount ?? "N/A",
    },
    {
      key: "status",
      label: "Status",
      minWidth: "80px",
    },
  ];

  const filteredEntries = isSearchMode
    ? entries
    : entries.filter((entry) => {
        const baseFilter =
          // entry.plateNumber !== "CounterSales" &&
          entry.status !== "deleted" &&
          entry.status === "invoiced";

        if (gstFilter === "all") return baseFilter;
        if (gstFilter === "converted") return baseFilter && entry.gst_invoice_id;
        return baseFilter;
      });

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

  const handleRowClick = (row) => {
    router.push(`/views/gstInvoice/${row.appointment_id}`);
  };

  const handleBulkDownload = async () => {
    if (filteredEntries.length === 0) {
      setOpenSnackbar(true);
      setSnackbarMessage("No GST invoices to download");
      setSnackBarSeverity("warning");
      return;
    }

    setBulkDownloading(true);
    let successCount = 0;
    let taxMissingCount = 0;
    const taxMissingAppointments = [];

    try {
      // Fetch company details once for all invoices
      let companyDetailsData = [];
      try {
        const ssResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/ss`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        companyDetailsData = ssResponse.data?.company_details || [];
      } catch (error) {
        console.warn("Could not fetch company details from /ss endpoint:", error);
      }

      for (const entry of filteredEntries) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/appointment/${entry.appointment_id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const appointmentData = response.data;
          console.log("Appointment Data:", appointmentData);

          // Transform services_actual to match PDF generator expectations
          const transformedItems = (appointmentData.services_actual || []).map(service => ({
            service_id: service.service_id || "",
            spareList: service.items_required?.[0]?.item_name || "",
            reportedIssue: service.service_description || "",
            qty: Number(service.items_required?.[0]?.qty || service.qty || 0),
            price: Number(service.price || 0),
            discountType: "percentage",
            estimatedAmount: Number(service.price || 0) * Number(service.items_required?.[0]?.qty || service.qty || 0),
            tax: Number(service.items_required?.[0]?.tax || service.tax || 0),
          }));

          // Check for items with missing or 0% tax
          const invalidItems = transformedItems.filter((item) => {
            if (item?.exclude) return false;
            const tax = item?.tax !== undefined && item?.tax !== null && item?.tax !== ""
              ? Number(item.tax)
              : Number(item?.gst ?? NaN);
            return isNaN(tax) || tax === 0;
          });

          if (invalidItems.length > 0) {
            taxMissingCount++;
            taxMissingAppointments.push(entry.appointment_id);
            console.warn(`Skipping ${entry.appointment_id}: Tax missing or 0%`);
            continue;
          }

          // Calculate totalTax from transformed items
          const calculatedTotalTax = transformedItems.reduce((acc, item) => {
            const itemTotal = item.qty * item.price;
            const itemTax = (itemTotal * item.tax) / 100;
            return acc + itemTax;
          }, 0);

          // Use the exact same calculation as [id] page
          const formattedDate = appointmentData.invoice_date
            ? appointmentData.invoice_date.split("-").reverse().join("/")
            : new Date().toLocaleDateString("en-GB");

          // Structure customer data - use appointment-level fields as fallback
          let customerData = {
            prefix: appointmentData.prefix || "",
            customer_name: appointmentData.customer_name || "",
            gst_number: appointmentData.gst_number || "",
            vehicle_make: appointmentData.vehicle_make || "",
            vehicle_model: appointmentData.vehicle_model || "",
            vehicle_variant: appointmentData.vehicle_variant || "",
            vehicles: [],
            contact: {
              name: appointmentData.customer_name || "",
              phone: appointmentData.phone || "",
              address: {
                street: appointmentData.customer_street || "",
                city: appointmentData.customer_city || "",
                state: appointmentData.customer_state || "",
                pincode: appointmentData.pin_code || "",
              },
            },
          };

          // Try to fetch full customer data for complete contact info
          if (appointmentData.customer_id) {
            try {
              const customerResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/customer/${appointmentData.customer_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              const fullCustomer = customerResponse.data;
              customerData = {
                prefix: fullCustomer.prefix || appointmentData.prefix || "",
                customer_name: fullCustomer.customer_name || appointmentData.customer_name || "",
                gst_number: fullCustomer.gst_number || appointmentData.gst_number || "",
                vehicle_make: appointmentData.vehicle_make || "",
                vehicle_model: appointmentData.vehicle_model || "",
                vehicle_variant: appointmentData.vehicle_variant || "",
                vehicles: fullCustomer.vehicles || [],
                contact: {
                  name: fullCustomer.customer_name || appointmentData.customer_name || "",
                  phone: fullCustomer.contact?.phone || appointmentData.phone || "",
                  address: {
                    street: fullCustomer.contact?.address?.street || appointmentData.customer_street || "",
                    city: fullCustomer.contact?.address?.city || appointmentData.customer_city || "",
                    state: fullCustomer.contact?.address?.state || appointmentData.customer_state || "",
                    pincode: fullCustomer.contact?.address?.pinCode || appointmentData.pin_code || "",
                  },
                },
              };
            } catch (customerError) {
              console.warn(`Could not fetch full customer data:`, customerError);
            }
          }

          console.log("Customer Data for PDF:", customerData);

          // Pass the data exactly as the [id] page does
          const pdfBlob = await generatePDFInvoice({
            customer: customerData,
            estimateItems: transformedItems,
            appointmentId: entry.appointment_id,
            vehicleId: appointmentData.vehicle_id || "",
            km: appointmentData.km || 0,
            nextServiceKm: appointmentData.next_service_km || 0,
            grandTotal: entry.invoice_amount || 0,
            totalTax: calculatedTotalTax,
            PdfHeaderImage:
              appointmentData.pdf_header_image ||
              companyDetailsData?.[0]?.pdf_header ||
              "",
            pdfFooterImage:
              appointmentData.pdf_footer_image ||
              companyDetailsData?.[0]?.pdf_footer ||
              "",
            pdfLogo:
              appointmentData.company_logo ||
              companyDetailsData?.[0]?.logo ||
              "",
         PdfHeaderImage: appointmentData.pdf_header_image || companyDetailsData?.[0]?.pdf_header || "",

            invoiceId: entry.invoice_id || "",
            companyDetails:
              companyDetailsData && companyDetailsData.length > 0
                ? companyDetailsData
                : [
                    {
                      company_name: "",
                      bank_name: "",
                      account_no: "",
                      ifsc_code: "",
                      gpay_number: "",
                      services: "",
                      upi: "",
                    },
                  ],
            upi:
              companyDetailsData?.[0]?.upi ||
              appointmentData.company_details?.upi ||
              "",
            invoiceDate: formattedDate,
            openInNewTab: false,
            paymentMethod: appointmentData.payment_method || "cash",
          });

          if (pdfBlob) {
            successCount++;
            console.log(`PDF generated successfully for ${entry.appointment_id}`);
          }
        } catch (error) {
          console.error(`Error downloading PDF for ${entry.appointment_id}:`, error);
          console.error("Error details:", error.message, error.stack);
        }
      }

      setOpenSnackbar(true);
      let message = `Downloaded ${successCount} of ${filteredEntries.length} invoice(s)`;
      if (taxMissingCount > 0) {
        message += ` | Tax missing or 0% for: ${taxMissingAppointments.join(", ")}`;
      }
      setSnackbarMessage(message);
      setSnackBarSeverity(successCount > 0 ? "success" : "warning");

      // Set modal data
      setBulkDownloadResults({
        totalEntries: filteredEntries.length,
        successCount,
        taxMissingCount,
        taxMissingAppointments,
        entries: filteredEntries.map(entry => ({
          appointment_id: entry.appointment_id,
          customer_name: entry.customer_name || entry.contact?.name || "N/A",
          invoice_amount: entry.invoice_amount || 0,
          status: taxMissingAppointments.includes(entry.appointment_id) ? "Tax Missing" : "Downloaded",
        })),
      });
      setBulkDownloadModal(true);
    } catch (error) {
      console.error("Error in bulk download:", error);
      setOpenSnackbar(true);
      setSnackbarMessage("Error downloading invoices");
      setSnackBarSeverity("error");
    } finally {
      setBulkDownloading(false);
    }
  };

  return (
    <Box>
      {pageType !== "tab" && <Navbar pageName="GST Invoice" />}
      {/* <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => {
            setActiveTab(newValue);
            localStorage.setItem("gstInvoiceActiveTab", newValue.toString());
          }}
          sx={{
            px: 3,
            "& .MuiTab-root": {
              color: "#999",
              textTransform: "uppercase",
              fontWeight: 700,
            },
            "& .Mui-selected": {
              color: "#1976d2 !important",
            },
          }}
        >
          <Tab label="Individual Conversion" />
          <Tab label="Bulk Conversion" />
        </Tabs>
      </Box> */}

      {activeTab === 0 ? (
        <DynamicListTable
          title="GST Invoice"
          columns={columns}
          data={entries}
          filteredData={isSearchMode ? entries : filteredEntries}
          loading={loading}
          showNavbar={false}
          searchText={searchText}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          onRowClick={handleRowClick}
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
              <MenuItem value="converted">GST Converted</MenuItem>
              <MenuItem value="all">All</MenuItem>
            </Select>,
            <Tooltip
              title={filteredEntries.length > 0 ? `Appointments: ${filteredEntries.map(e => e.appointment_id).join(", ")}` : "No invoices available"}
            >
              <span>
                <Button
                  key="bulk-download"
                  variant="contained"
                  color="primary"
                  onClick={handleBulkDownload}
                  disabled={bulkDownloading || filteredEntries.length === 0}
                  size="small"
                >
                  {bulkDownloading ? "Downloading..." : `Bulk Download (${filteredEntries.length})`}
                </Button>
              </span>
            </Tooltip>,
          ]}
          snackbar={{
            open: openSnackbar,
            message: snackbarMessage,
            severity: snackBarSeverity,
            onClose: () => setOpenSnackbar(false),
          }}
        />
      ) : (
        <BulkGSTConversion />
      )}

      {/* Bulk Download Results Modal */}
      <Dialog
        open={bulkDownloadModal}
        onClose={() => setBulkDownloadModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Bulk Download Summary
        </DialogTitle>
        <DialogContent>
          {bulkDownloadResults && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 3, display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Total Invoices
                  </Typography>
                  <Typography variant="h6">
                    {bulkDownloadResults.totalEntries}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Downloaded
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'success.main' }}>
                    {bulkDownloadResults.successCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Tax Issues
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'warning.main' }}>
                    {bulkDownloadResults.taxMissingCount}
                  </Typography>
                </Box>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Appointment ID</TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell align="right">Invoice Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkDownloadResults.entries.map((entry) => (
                    <TableRow
                      key={entry.appointment_id}
                      onClick={() => window.open(`/views/gstInvoice/${entry.appointment_id}`, '_blank')}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                    >
                      <TableCell>{entry.appointment_id}</TableCell>
                      <TableCell>{entry.customer_name}</TableCell>
                      <TableCell align="right">₹{entry.invoice_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: entry.status === 'Downloaded' ? 'success.main' : 'warning.main',
                            fontWeight: 500
                          }}
                        >
                          {entry.status}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDownloadModal(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
