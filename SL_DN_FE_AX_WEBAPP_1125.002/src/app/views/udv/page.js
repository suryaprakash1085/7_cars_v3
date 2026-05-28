"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import * as XLSX from "xlsx";

import Navbar from "../../../components/navbar.js";
import AppAlert from "../../../components/snackBar.js";
import LoadingScreen from "@/components/loadingScreen.js";

import { styled } from "@mui/material/styles";
import {
  Box,
  Button,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from "@mui/material";

import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
});

const ENTITY_TYPES = {
  leads: {
    label: "Leads",
    templateFile: "/Auto_Doc_Cockpit_CUST-Template.xlsx",
    uploadEndpoint: "/customer/leads/bulkUpload",
    downloadEndpoint: null,
  },
  inventory: {
    label: "Inventory",
    templateFile: "/Auto_Doc_Cockpit_INV-Template.xlsx",
    uploadEndpoint: "/inventory/bulkUpload",
    downloadEndpoint: "/inventory/excelDownload",
  },
};

export default function UDVMaster() {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState("leads");
  const [uploadHistory, setUploadHistory] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    records: [],
    type: "added",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [alertData, setAlertData] = useState({
    openAlert: false,
    message: "",
    severity: "info",
    duration: 3000,
  });

  const showAlert = (message, severity = "info", duration = 7000) => {
    setAlertData({
      openAlert: true,
      message,
      severity,
      duration,
    });
  };

  const handleOpenModal = (type, records, count) => {
    // console.log(`🔔 Opening modal for ${type} - Count: ${count}, Records:`, records);
    if (count === 0) return;

    setModalData({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Records (${count})`,
      records: records || [],
      type: type,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Fetch upload history from API
  const fetchUploadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      // console.log(`📋 Fetching upload history for entity: ${selectedEntity}`);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/udv/history?entity=${selectedEntity}&limit=50&offset=0`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch upload history";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || response.statusText;
        } catch {
          errorMessage = response.statusText || "Failed to fetch upload history";
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // console.log(`✅ Received ${data.uploads?.length || 0} uploads from server`);
      setUploadHistory(data.uploads || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching upload history:", error);
      showAlert("Error loading upload history", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = Cookies.get("token");
      setToken(storedToken);
      setIsLoading(false);
    }
  }, []);

  // Fetch history when component loads or entity changes
  useEffect(() => {
    if (token) {
      fetchUploadHistory();
    }
  }, [selectedEntity, token]);

  const handleDownloadTemplate = () => {
    const template = ENTITY_TYPES[selectedEntity].templateFile;
    window.location.href = template;
  };

  const handleDownloadData = async () => {
    if (selectedEntity !== "inventory") {
      showAlert("Download data is only available for Inventory", "info");
      return;
    }

    try {
      setIsDownloading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${ENTITY_TYPES[selectedEntity].downloadEndpoint}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to download data";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || response.statusText;
        } catch {
          errorMessage = response.statusText || "Failed to download data";
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const worksheetData = data.map((row) => ({
        "Material ID": row.inventory_id,
        Category: row.category,
        Name: row.part_name,
        Description: row.description,
        UOM: row.uom || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
      XLSX.writeFile(workbook, "Inventory.xlsx");

      showAlert("Inventory data downloaded successfully", "success");
      setIsDownloading(false);
    } catch (error) {
      console.error("Error downloading data:", error);
      showAlert("Error downloading data", "error");
      setIsDownloading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Read and log Excel file data
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        // console.log("📄 Excel File Data:", jsonData);
        // console.log("📊 Total Records:", jsonData.length);
        // console.log("📋 All Excel Data:", jsonData);
      } catch (error) {
        console.error("Error reading Excel file:", error);
      }
    };
    reader.readAsArrayBuffer(file);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entity", selectedEntity);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/udv/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || response.statusText;
        } catch {
          errorMessage = response.statusText || "Upload failed";
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // console.log("✔ Upload Response:", responseData);

      const uploadRecord = {
        fileName: responseData.fileName || file.name,
        entity: ENTITY_TYPES[selectedEntity].label,
        timestamp: new Date().toLocaleString(),
        added: responseData.addedCount || 0,
        duplicates: responseData.duplicateCount || 0,
        failed: responseData.failedCount || 0,
        addedRecords: responseData.addedRecords || [],
        duplicateRecords: responseData.duplicateRecords || [],
        failedRecords: responseData.failedRecords || [],
      };

      // console.log("📊 Preparing to fetch upload history...");
      // Refresh history from API
      await fetchUploadHistory();
      // console.log("✅ History fetched successfully");

      const hasIssues = responseData.failedCount > 0;
      const statusSummary = selectedEntity === "inventory"
        ? `${uploadRecord.added} added, ${uploadRecord.duplicates} updated, ${uploadRecord.failed} failed`
        : `${uploadRecord.added} added, ${uploadRecord.duplicates} duplicates, ${uploadRecord.failed} failed`;

      let message = `${ENTITY_TYPES[selectedEntity].label} Upload Complete: ${statusSummary}`;

      if (hasIssues && responseData.failedRecords && responseData.failedRecords.length > 0) {
        message += `\n\n⚠️ ${responseData.failedRecords.length} record(s) failed validation`;
      }

      showAlert(message, hasIssues ? "warning" : "success", 5000);
    } catch (error) {
      console.error("Error uploading file:", error);
      showAlert(`Upload failed: ${error.message}`, "error", 4000);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const paginatedHistory = uploadHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pageCount = Math.ceil(uploadHistory.length / itemsPerPage);

  if (isLoading) {
    return <LoadingScreen Dialogue="Please Wait..." />;
  }
const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <>
      {/* <Navbar pageName="Upload & Download Manager" /> */}
      {pageType !== "tab" && <Navbar pageName="Upload & Download Manager" />}
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {/* Entity Selection Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select Entity Type
              </Typography>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  sx={{ minWidth: 200, backgroundColor: "white" }}
                >
                  {Object.entries(ENTITY_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </Select>

                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Current selection: <strong>{ENTITY_TYPES[selectedEntity].label}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Upload/Download Actions Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upload & Download
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {/* Download Template Button */}
                <Tooltip title={`Download template for ${ENTITY_TYPES[selectedEntity].label}`}>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleDownloadTemplate}
                    disabled={isUploading || isDownloading}
                  >
                    Download Template
                  </Button>
                </Tooltip>

                {/* Download Data Button (Inventory only) */}
                {selectedEntity === "inventory" && (
                  <Tooltip title="Download all inventory data as Excel">
                    <Button
                      variant="outlined"
                      startIcon={isDownloading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
                      onClick={handleDownloadData}
                      disabled={isUploading || isDownloading}
                    >
                      Download Data
                    </Button>
                  </Tooltip>
                )}

                {/* Upload File Button */}
                <Button
                  component="label"
                  variant="contained"
                  startIcon={isUploading ? <CircularProgress size={20} sx={{ color: "white" }} /> : <FileUploadIcon />}
                  disabled={isUploading || isDownloading}
                  sx={{
                    backgroundColor: isUploading ? "#ccc" : "primary.main",
                  }}
                >
                  {isUploading ? "Uploading..." : "Upload File"}
                  <VisuallyHiddenInput
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Upload Status Card */}
          {uploadHistory.length > 0 && (
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6">
                    Upload Status History
                  </Typography>
                  
                  {/* this line delete in Upload Status History data*/}
                  {/* <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to clear the upload history? This cannot be undone.")) {
                        try {
                          setIsLoadingHistory(true);
                          const response = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/udv/history?entity=${selectedEntity}`,
                            {
                              method: "DELETE",
                              headers: {
                                "Content-Type": "application/json",
                              },
                            }
                          );

                          if (!response.ok) {
                            throw new Error("Failed to clear history");
                          }

                          await response.json();
                          setUploadHistory([]);
                          setCurrentPage(1);
                          showAlert("Upload history cleared successfully", "success");
                        } catch (error) {
                          console.error("Error clearing history:", error);
                          showAlert("Error clearing history", "error");
                        } finally {
                          setIsLoadingHistory(false);
                        }
                      }
                    }}
                  >
                    Clear History
                  </Button> */}
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableRow>
                        <TableCell>Entity</TableCell>
                        <TableCell>File Name</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Added</TableCell>
                        <TableCell>Duplicates</TableCell>
                        <TableCell>Failed</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoadingHistory ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            <CircularProgress size={24} />
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedHistory.map((record, index) => {
                          const status =
                            record.failed > 0
                              ? "warning"
                              : record.duplicates > 0
                              ? "partial"
                              : "success";

                          return (
                            <TableRow key={index}>
                              <TableCell>{record.entity}</TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>{record.fileName}</TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {new Date(record.timestamp).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {status === "success" ? (
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Success"
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                  />
                                ) : status === "warning" ? (
                                  <Chip
                                    icon={<ErrorIcon />}
                                    label="Partial"
                                    color="warning"
                                    size="small"
                                    variant="outlined"
                                  />
                                ) : (
                                  <Chip
                                    icon={<ErrorIcon />}
                                    label="Partial"
                                    color="warning"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {record.added > 0 ? (
                                  <Button
                                    size="small"
                                    onClick={() =>
                                      handleOpenModal(
                                        "added",
                                        record.addedRecords || [],
                                        record.added
                                      )
                                    }
                                    sx={{
                                      color: "primary.main",
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                      p: 0,
                                      minWidth: "auto",
                                      "&:hover": { opacity: 0.8 },
                                    }}
                                  >
                                    {record.added}
                                  </Button>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {record.duplicates > 0 ? (
                                  <Button
                                    size="small"
                                    onClick={() =>
                                      handleOpenModal(
                                        "duplicates",
                                        record.duplicateRecords || [],
                                        record.duplicates
                                      )
                                    }
                                    sx={{
                                      color: "primary.main",
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                      p: 0,
                                      minWidth: "auto",
                                      "&:hover": { opacity: 0.8 },
                                    }}
                                  >
                                    {record.duplicates}
                                  </Button>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {record.failed > 0 && record.failedRecords && record.failedRecords.length > 0 ? (
                                  <Button
                                    size="small"
                                    onClick={() =>
                                      handleOpenModal(
                                        "failed",
                                        record.failedRecords,
                                        record.failed
                                      )
                                    }
                                    sx={{
                                      color: "error.main",
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                      p: 0,
                                      minWidth: "auto",
                                      "&:hover": { opacity: 0.8 },
                                    }}
                                  >
                                    {record.failed}
                                  </Button>
                                ) : (
                                  <span style={{ color: record.failed > 0 ? "red" : "green" }}>
                                    {record.failed || "-"}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {pageCount > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Pagination
                      count={pageCount}
                      page={currentPage}
                      onChange={(event, value) => setCurrentPage(value)}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {uploadHistory.length === 0 && !isLoadingHistory && (
            <Alert severity="info">
              No uploads yet. Select an entity type and upload a file to see the status here.
            </Alert>
          )}
        </Box>
      </Box>

      <AppAlert alertData={alertData} />

      {/* Records Detail Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "80vh",
          },
        }}
      >
        <DialogTitle>{modalData.title}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1, overflowX: "auto" }}>
            {modalData.records && modalData.records.length > 0 ? (
              <TableContainer>
                <Table size="small" sx={{ border: "1px solid #ddd" }}>
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      {modalData.records[0] &&
                        Object.keys(modalData.records[0])
                          .filter(
                            (key) =>
                              key !== "error" &&
                              key !== "reason" &&
                              key !== "action" &&
                              key !== "newQuantity" &&
                              key !== "_status"
                          )
                          .map((key) => (
                            <TableCell key={key} sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                              {String(key)
                                .replace(/_/g, " ")
                                .charAt(0)
                                .toUpperCase() +
                                String(key)
                                  .replace(/_/g, " ")
                                  .slice(1)}
                            </TableCell>
                          ))}
                      {(modalData.type === "failed" || modalData.type === "duplicates") && (
                        <TableCell sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                          {modalData.type === "failed" ? "Error Reason" : "Status/Reason"}
                        </TableCell>
                      )}
                      {modalData.type === "duplicates" && modalData.records.some((r) => r.newQuantity !== undefined) && (
                        <TableCell sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                          New Quantity
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modalData.records.map((record, index) => (
                      <TableRow key={index} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}>
                        {Object.entries(record)
                          .filter(
                            ([key]) =>
                              key !== "error" &&
                              key !== "reason" &&
                              key !== "action" &&
                              key !== "newQuantity" &&
                              key !== "_status"
                          )
                          .map(([key, value]) => (
                            <TableCell key={key} sx={{ fontSize: "0.875rem" }}>
                              <Typography variant="caption">
                                {value !== null && value !== undefined ? String(value) : "-"}
                              </Typography>
                            </TableCell>
                          ))}
                        {(modalData.type === "failed" || modalData.type === "duplicates") && (
                          <TableCell sx={{ fontSize: "0.875rem" }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: modalData.type === "failed" ? "error.main" : "warning.main",
                                fontWeight: "500",
                              }}
                            >
                              {record.error ||
                                record.reason ||
                                (record.action === "updated"
                                  ? "Quantity Updated"
                                  : "Already Exists")}
                            </Typography>
                          </TableCell>
                        )}
                        {modalData.type === "duplicates" &&
                          record.newQuantity !== undefined && (
                            <TableCell sx={{ fontSize: "0.875rem", fontWeight: "bold" }}>
                              <Typography variant="caption" sx={{ color: "success.main" }}>
                                {record.newQuantity}
                              </Typography>
                            </TableCell>
                          )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                {modalData.type === "added" && "No added records available."}
                {modalData.type === "duplicates" && "No duplicate/updated records available."}
                {modalData.type === "failed" && "No failed records to display."}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
