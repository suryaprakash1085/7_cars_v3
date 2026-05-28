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

  // pagination states
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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

  const [endDate, setEndDate] = useState(() => {
    return formatDate(new Date());
  });

  // FIRST LOAD
  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    setPageType(Cookies.get("page_type"));

    loadData(0, false);
  }, [startDate, endDate]);

  useEffect(() => {
    setOriginalEntries(entries);
  }, [entries]);

  // FETCH FUNCTION WRAPPER
  const loadData = async (newOffset, append) => {
    if (!token && !Cookies.get("token")) return;

    const data = await fetchEntries(
      Cookies.get("token"),
      setEntries,
      setLoading,
      setOpenSnackbar,
      setSnackbarMessage,
      setSnackBarSeverity,
      startDate,
      endDate,
      "invoiced",
      limit,
      newOffset,
      append
    );

    if (!data || data.length < limit) {
      setHasMore(false);
    }
  };

  // SCROLL HANDLER
  const handleScroll = async () => {
    if (loadingMore || !hasMore) return;

    const bottom =
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100;

    if (bottom) {
      setLoadingMore(true);

      const newOffset = offset + limit;

      await loadData(newOffset, true);

      setOffset(newOffset);

      setLoadingMore(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [offset, loadingMore, hasMore]);

  // COLUMNS
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
      format: (value, row) => row.phone || "N/A",
    },
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
      filteredData={entries}
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
    />
  );
}