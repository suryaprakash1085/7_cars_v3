"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { searchSupplier, handleBulkUpload } from "../../../../controllers/supplierControllers";
import DynamicListTable from "@/components/DynamicListTable";
import AddSupplier from "@/components/addSupplier";
import BackButton from "@/components/backButton";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";

import {
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

export default function SupplierPage() {
  const router = useRouter();
  const [token, setToken] = useState();
  const [searchText, setSearchText] = useState("");
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddSupplierModal, setOpenAddSupplierModal] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [typedname, setTypedname] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/supplier/download-template`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Auto_Doc_Cockpit_Supplier-Template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setSnackbarMessage("Failed to download template");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      console.error(error);
    }
  };

  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);

    async function fetchSuppliers() {
      try {
        if (!storedToken) {
          throw new Error("No token found. Please log in.");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/supplier`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch entries");

        const data = await response.json();
        setEntries(data);
        setFilteredEntries(data);
        setLoading(false);
      } catch (err) {
        setSnackbarMessage(err.message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setLoading(false);
      }
    }
    fetchSuppliers();
  }, []);

  const columns = [
    {
      key: "name",
      label: "Supplier Name",
      minWidth: "150px",
      truncate: 25,
    },
    {
      key: "gst_number",
      label: "GST Number",
      minWidth: "120px",
    },
    {
      key: "contact",
      label: "Phone",
      minWidth: "120px",
      format: (value, row) => row.contact?.phone || "N/A",
    },
    {
      key: "address",
      label: "Address",
      minWidth: "200px",
      format: (value, row) => {
        const address = row.contact?.address;
        if (address) {
          return `${address.street}, ${address.city}, ${address.state} - ${address.zip}`;
        }
        return "N/A";
      },
      truncate: 40,
    },
  ];

  const handleSearchSubmit = () => {
    searchSupplier(
      token,
      searchText,
      entries,
      setFilteredEntries,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackbarSeverity
    );
  };

  const handleRowClick = (row) => {
    router.push(`/views/suppliers/${row.supplier_id}`);
  };

  const handleOpenModal = () => {
    setOpenAddSupplierModal(true);
  };

  const handleCloseModal = () => setOpenAddSupplierModal(false);

  const handleSupplierSuccess = () => {
    setLoading(true);
    setSnackbarMessage("Supplier Added Successfully!");
    setOpenAddSupplierModal(false);
    setSnackbarSeverity("success");
    setOpenSnackbar(true);
    window.location.reload();
  };

  const extraControls = [
    <Tooltip key="add-supplier" title="Add Supplier">
      <IconButton
        aria-label="addSupplier"
        onClick={handleOpenModal}
        sx={{
          borderRadius: 1,
          padding: "9px 10px",
          backgroundColor: "white",
          "&:hover": {
            backgroundColor: "white",
          },
        }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Tooltip>,
    <Tooltip key="download-template" title="Download Template">
      <IconButton
        aria-label="downloadTemplate"
        onClick={handleDownloadTemplate}
        sx={{
          borderRadius: 1,
          padding: "9px 10px",
          backgroundColor: "white",
          "&:hover": {
            backgroundColor: "white",
          },
        }}
      >
        <FileDownloadIcon fontSize="small" />
      </IconButton>
    </Tooltip>,
    <Tooltip key="upload-excel" title="Upload Excel">
      <IconButton
        aria-label="uploadExcel"
        sx={{
          borderRadius: 1,
          padding: "9px 10px",
          backgroundColor: "white",
          "&:hover": {
            backgroundColor: "white",
          },
        }}
        onClick={() => fileInputRef.current.click()}
      >
        <FileUploadIcon fontSize="small" />
      </IconButton>
    </Tooltip>,
  ];

  return (
    <div>
      {/* <BackButton /> */}
      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={(event) =>
          handleBulkUpload(
            event,
            token,
            setSnackbarMessage,
            setSnackbarSeverity,
            setOpenSnackbar,
            setIsLoading
          )
        }
      />

      <DynamicListTable
        title="Supplier"
        columns={columns}
        data={entries}
        filteredData={filteredEntries}
        loading={loading}
        searchText={searchText}
        onSearchChange={(e) => setSearchText(e.target.value)}
        onSearchSubmit={handleSearchSubmit}
        onRowClick={handleRowClick}
        snackbar={{
          open: openSnackbar,
          message: snackbarMessage,
          severity: snackbarSeverity,
          onClose: () => setOpenSnackbar(false),
        }}
        extraControls={extraControls}
        scrollableTableId="scrollable-table"
      />

      <Dialog
        open={openAddSupplierModal}
        maxWidth="md"
        fullWidth
      >
        <IconButton
          aria-label="close"
          onClick={handleCloseModal}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <AddSupplier
            onSuccess={handleSupplierSuccess}
            onClose={handleCloseModal}
            typedname={typedname}
            setTypedname={setTypedname}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
