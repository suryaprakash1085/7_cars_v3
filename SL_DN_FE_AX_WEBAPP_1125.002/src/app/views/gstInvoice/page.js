"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import axios from "axios";
import {
  Box,
  Select,
  MenuItem,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import DynamicListTable from "@/components/DynamicListTable.js";
import Navbar from "@/components/navbar.js";
import BulkGSTConversion from "@/components/BulkGSTConversion.js";
import generatePDFInvoice from "@/components/PDFGenerator_invoice.js";
import { fetchEntries, handleSearch } from "../../../../controllers/gstinvoiceControllers.js";
import { companydetails } from "../../../../controllers/invoiceListControllers";

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
  const [showFab, setShowFab] = useState(false);

  const [gstFilter, setGstFilter] = useState("converted");
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkDownloadModal, setBulkDownloadModal] = useState(false);
  const [bulkDownloadResults, setBulkDownloadResults] = useState(null);
  const [bulkConvertModal, setBulkConvertModal] = useState(false);

  const [limit, setLimit] = useState(null);

  const totalRef = useRef(0);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const searchTextRef = useRef("");
  const startDateRef = useRef("");
  const endDateRef = useRef("");
  const tokenRef = useRef("");
  const gstFilterRef = useRef("converted");

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  });

  const [endDate, setEndDate] = useState(() => formatDate(new Date()));

  useEffect(() => { searchTextRef.current = searchText; }, [searchText]);
  useEffect(() => { startDateRef.current = startDate; }, [startDate]);
  useEffect(() => { endDateRef.current = endDate; }, [endDate]);
  useEffect(() => { gstFilterRef.current = gstFilter; }, [gstFilter]);

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
    tokenRef.current = storedToken;
    startDateRef.current = startDate;
    endDateRef.current = endDate;
    gstFilterRef.current = gstFilter;
    setPageType(Cookies.get("page_type"));

    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setEntries([]);
    setIsSearchMode(false);

    fetchEntries(
      storedToken,
      setEntries,
      setLoading,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackBarSeverity,
      startDate,
      endDate,
      "invoiced",
      gstFilter,
      limit,
      0,
      false
    ).then((result) => {
      console.log("first load result:", result?.data?.length);
      if (!result || result.data?.length === 0) {
        hasMoreRef.current = false;
      } else {
        totalRef.current = result.total;
        offsetRef.current = limit;
        hasMoreRef.current = result.total > limit;
      }
      loadingRef.current = false;
    });
  }, [startDate, endDate, gstFilter, limit]);

  useEffect(() => {
    setOriginalEntries(entries);
  }, [entries]);

  // Fetch invoiceEntries for bulk operations
  useEffect(() => {
    const fetchInvoiceEntries = async () => {
      try {
        const storedToken = Cookies.get("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/get/get_all_appointments_to_invoice`,
          { headers: { Authorization: `Bearer ${storedToken}` } }
        );
        if (response.data) {
          setInvoiceEntries(response.data);
        }
      } catch (error) {
        console.error("Error fetching invoice entries:", error);
      }
    };

    if (entries.length > 0 && !isSearchMode) {
      fetchInvoiceEntries();
    }
  }, [entries, isSearchMode]);

  const noOp = () => {};

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    setShowFab(scrollTop > 10);

    if (searchTextRef.current) return;
    if (!hasMoreRef.current) return;
    if (loadingRef.current) return;

    if (scrollHeight - scrollTop <= clientHeight + 200) {
      console.log("Scroll load — offset:", offsetRef.current);
      loadingRef.current = true;

      fetchEntries(
        tokenRef.current,
        setEntries,
        noOp,
        setOpenSnackbar,
        setSnackbarMessage,
        setSnackBarSeverity,
        startDateRef.current,
        endDateRef.current,
        "invoiced",
        gstFilterRef.current,
        limit,
        offsetRef.current,
        true
      ).then((result) => {
        console.log("scroll load data.length:", result?.data?.length);
        console.log("newOffset:", offsetRef.current + (result?.data?.length ?? 0));
        console.log("total:", totalRef.current);

        if (!result || result.data?.length === 0) {
          hasMoreRef.current = false;
        } else {
          totalRef.current = result.total;
          const newOffset = offsetRef.current + result.data.length;
          offsetRef.current = newOffset;
          hasMoreRef.current = newOffset < totalRef.current;
        }
        loadingRef.current = false;
      });
    }
  };

  const handleScrollToTop = () => {
    const container = document.getElementById("scrollable-table");
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          entry.status !== "deleted" && entry.status === "invoiced";
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
      let companyDetailsData = [];
      try {
        const ssResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/ss`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        companyDetailsData = ssResponse.data?.company_details || [];
      } catch (error) {
        console.warn("Could not fetch company details from /ss endpoint:", error);
      }

      for (const entry of filteredEntries) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/appointment/${entry.appointment_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const appointmentData = response.data;

          const transformedItems = (appointmentData.services_actual || []).map(
            (service) => ({
              service_id: service.service_id || "",
              spareList: service.items_required?.[0]?.item_name || "",
              reportedIssue: service.service_description || "",
              qty: Number(service.items_required?.[0]?.qty || service.qty || 0),
              price: Number(service.price || 0),
              discountType: "percentage",
              estimatedAmount:
                Number(service.price || 0) *
                Number(service.items_required?.[0]?.qty || service.qty || 0),
              tax: Number(service.items_required?.[0]?.tax || service.tax || 0),
            })
          );

          const invalidItems = transformedItems.filter((item) => {
            if (item?.exclude) return false;
            const tax =
              item?.tax !== undefined && item?.tax !== null && item?.tax !== ""
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

          const calculatedTotalTax = transformedItems.reduce((acc, item) => {
            const itemTotal = item.qty * item.price;
            return acc + (itemTotal * item.tax) / 100;
          }, 0);

          const formattedDate = appointmentData.invoice_date
            ? appointmentData.invoice_date.split("-").reverse().join("/")
            : new Date().toLocaleDateString("en-GB");

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

          if (appointmentData.customer_id) {
            try {
              const customerResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/customer/${appointmentData.customer_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
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
        }
      }

      setOpenSnackbar(true);
      let message = `Downloaded ${successCount} of ${filteredEntries.length} invoice(s)`;
      if (taxMissingCount > 0) {
        message += ` | Tax missing or 0% for: ${taxMissingAppointments.join(", ")}`;
      }
      setSnackbarMessage(message);
      setSnackBarSeverity(successCount > 0 ? "success" : "warning");

      setBulkDownloadResults({
        totalEntries: filteredEntries.length,
        successCount,
        taxMissingCount,
        taxMissingAppointments,
        entries: filteredEntries.map((entry) => ({
          appointment_id: entry.appointment_id,
          customer_name: entry.customer_name || entry.contact?.name || "N/A",
          invoice_amount: entry.invoice_amount || 0,
          status: taxMissingAppointments.includes(entry.appointment_id)
            ? "Tax Missing"
            : "Downloaded",
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
        onScroll={handleScroll}
        scrollableTableId="scrollable-table"
        scrollToTopDisplay={(e) => setShowFab(e.target.scrollTop > 10)}
        onScrollToTop={() => {
          handleScrollToTop();
          setShowFab(false);
        }}
        showScrollFab={showFab}
        snackbar={{
          open: openSnackbar,
          message: snackbarMessage,
          severity: snackBarSeverity,
          onClose: () => setOpenSnackbar(false),
        }}
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
          <div style={{ display: "flex", gap: 16, justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16 }}>
              <Button
                key="bulk-convert"
                variant="contained"
                color="primary"
                onClick={() => setBulkConvertModal(true)}
                size="small"
              >
                Bulk Convert
              </Button>
            </div>
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
                <MenuItem value="converted">GST Converted</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
              <Tooltip
                title={
                  filteredEntries.length > 0
                    ? `Appointments: ${filteredEntries.map((e) => e.appointment_id).join(", ")}`
                    : "No invoices available"
                }
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
                    {bulkDownloading
                      ? "Downloading..."
                      : `Bulk Download (${filteredEntries.length})`}
                  </Button>
                </span>
              </Tooltip>
            </div>
          </div>,
        ]}
      />

      {/* Bulk Convert Modal */}
      <Dialog
        open={bulkConvertModal}
        onClose={() => setBulkConvertModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Bulk GST Conversion</DialogTitle>
        <DialogContent>
          <BulkGSTConversion />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkConvertModal(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Download Results Modal */}
      <Dialog
        open={bulkDownloadModal}
        onClose={() => setBulkDownloadModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bulk Download Summary</DialogTitle>
        <DialogContent>
          {bulkDownloadResults && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 3, display: "flex", gap: 3 }}>
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
                  <Typography variant="h6" sx={{ color: "success.main" }}>
                    {bulkDownloadResults.successCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Tax Issues
                  </Typography>
                  <Typography variant="h6" sx={{ color: "warning.main" }}>
                    {bulkDownloadResults.taxMissingCount}
                  </Typography>
                </Box>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
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
                      onClick={() =>
                        window.open(
                          `/views/gstInvoice/${entry.appointment_id}`,
                          "_blank"
                        )
                      }
                      sx={{
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "#f5f5f5" },
                      }}
                    >
                      <TableCell>{entry.appointment_id}</TableCell>
                      <TableCell>{entry.customer_name}</TableCell>
                      <TableCell align="right">
                        ₹{entry.invoice_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              entry.status === "Downloaded"
                                ? "success.main"
                                : "warning.main",
                            fontWeight: 500,
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
