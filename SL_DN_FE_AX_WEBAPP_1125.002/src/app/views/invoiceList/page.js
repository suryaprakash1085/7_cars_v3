"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import DynamicListTable from "@/components/DynamicListTable.js";
import {
  fetchEntries,
  handleSearch,
  handleScrollToTop,
  scrollToTopButtonDisplay,companydetails
} from "../../../../controllers/invoiceListControllers";

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
  const [showFab, setShowFab] = useState(false);

const totalRef = useRef(0);
const [limit, setLimit] = useState(null);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const searchTextRef = useRef("");
  const startDateRef = useRef("");
  const endDateRef = useRef("");
  const tokenRef = useRef("");

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




  useEffect(() => {
     if (limit === null) return; //
    const storedToken = Cookies.get("token");
    setToken(storedToken);
    tokenRef.current = storedToken;           //   store in ref
    startDateRef.current = startDate;         //   sync immediately
    endDateRef.current = endDate;             //   sync immediately
    setPageType(Cookies.get("page_type"));

    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    setEntries([]);

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
      limit,
      0,
      false
    ).then((result) => {
  console.log("first load result:", result?.length);
  //   only stop when empty, not when less than limit
  if (!result || result.length === 0) {
    hasMoreRef.current = false;
  } else {
   totalRef.current = result.total;        
    offsetRef.current = limit;
    hasMoreRef.current = result.total > limit;
  }
  loadingRef.current = false;
});

  }, [startDate, endDate, limit]);

  useEffect(() => {
    setOriginalEntries(entries);
  }, [entries]);

  const noOp = () => {};

 const handleScroll = (event) => {
  scrollToTopButtonDisplay(event, setShowFab);

  const { scrollTop, scrollHeight, clientHeight } = event.target;

  if (searchTextRef.current) return;
  if (!hasMoreRef.current) return;
  if (loadingRef.current) return;

  if (scrollHeight - scrollTop <= clientHeight + 200) {
    console.log("  API calling offset:", offsetRef.current);

    loadingRef.current = true; //   block immediately — same line, but now BEFORE fetch

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
      limit,
      offsetRef.current,
      true
    )
   .then((result) => {
     console.log("data.length:", result.data.length);
  console.log("newOffset:", offsetRef.current + result.data.length);
  console.log("total:", totalRef.current);
    totalRef.current = result.total;
  if (!result || result.data.length === 0) {
    
    hasMoreRef.current = false;
  } else {
    const newOffset = offsetRef.current + result.data.length;
    offsetRef.current = newOffset;
    hasMoreRef.current = newOffset < totalRef.current; //   stops exactly at total
  }
  loadingRef.current = false;
});
  }
};

  const columns = [
    { key: "customer_name", label: "Customer Name", minWidth: "150px" },
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
    { key: "status", label: "Status", minWidth: "80px" },
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
      onScroll={handleScroll}
      scrollableTableId="scrollable-table"
      scrollToTopDisplay={(e) => scrollToTopButtonDisplay(e, setShowFab)}
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
    />
  );
}