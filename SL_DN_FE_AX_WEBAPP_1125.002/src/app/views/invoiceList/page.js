"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import DynamicListTable from "@/components/DynamicListTable.js";
import { fetchEntries, handleSearch } from "../../../../controllers/invoiceListControllers";

export default function InvoiceList() {
  const router = useRouter();
  const [token, setToken] = useState();
  const [entries, setEntries] = useState([]);
  const [originalEntries, setOriginalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  const [snackBarSeverity, setSnackBarSeverity] = useState();
  const [searchText, setSearchText] = useState("");
  const [pageType, setPageType] = useState(null);



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
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    setPageType(Cookies.get("page_type"));

    fetchEntries(
      storedToken,
      setEntries,
      setLoading,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackBarSeverity,
      startDate,
      endDate
    );
  }, [startDate, endDate]);
  // console.log("Entries in page component:", entries);
  useEffect(() => {
    setOriginalEntries(entries);
  }, [entries]);

  const columns = [
    {
      key: "customer_name",
      label: "Customer Name",
      minWidth: "150px",
    },
    {
      key: "plateNumber",
      label: "Plate Number",
      minWidth: "100px",
      format: (value, row) => value || row.vehicle_id || "N/A",
    },
    {
      key: "Name",
      label: "Name",
      minWidth: "120px",
      format: (value, row) => value || row.customer_name || "N/A",
    },
    {
      key: "phone",
      label: "Phone",
      minWidth: "120px",
      format: (value, row) => row.contact?.phone || row.phone || "N/A",
    },
    // {
    //   key: "appointment_time",
    //   label: "Time",
    //   minWidth: "80px",
    // },
    {
      key: "appointment_date",
      label: "Date",
      minWidth: "100px",
      format: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      key: "status",
      label: "Status",
      minWidth: "80px",
    },
  ];

  const invoicedEntries = entries.filter(
    (entry) => entry.status === "invoice" || entry.status === "invoiced"
  );

  const dateFilters = [
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
  ];

  const handleSearchSubmit = () => {
    handleSearch(searchText, originalEntries, setEntries, token);
  };

  const handleRowClick = (row) => {
    router.push(`/views/invoiceList/${row.appointment_id}`);
  };

  return (
    <DynamicListTable
      title="Invoice List"
      columns={columns}
      data={entries}
      filteredData={invoicedEntries}
      loading={loading}
      showNavbar={pageType !== "tab"}
      searchText={searchText}
      onSearchChange={(e) => setSearchText(e.target.value)}
      onSearchSubmit={handleSearchSubmit}
      onRowClick={handleRowClick}
      snackbar={{
        open: openSnackbar,
        message: snackbarMessage,
        severity: snackBarSeverity,
        onClose: () => setOpenSnackbar(false),
      }}
      dateFilters={dateFilters}
    />
  );
}
